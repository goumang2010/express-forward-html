'use strict';

var fetch = require('node-fetch');
var fs = require('fs');
var path = require('path');
var xhrProxy = fs.readFileSync(path.resolve(__dirname, './script/xhr-proxy.js'), {
    encoding: 'utf8'
});
var utils = require('./utils');
var COOKIE_KEY = 'forward_html';
var emptyFunc = function emptyFunc(x) {
    return x;
};
module.exports = function forward() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref$prefix = _ref.prefix,
        prefix = _ref$prefix === undefined ? '/__forward' : _ref$prefix,
        _ref$filterHtml = _ref.filterHtml,
        filterHtml = _ref$filterHtml === undefined ? emptyFunc : _ref$filterHtml,
        _ref$filterCookie = _ref.filterCookie,
        filterCookie = _ref$filterCookie === undefined ? emptyFunc : _ref$filterCookie,
        _ref$filterJs = _ref.filterJs,
        filterJs = _ref$filterJs === undefined ? emptyFunc : _ref$filterJs;

    return function (req, res, next) {
        var app = req.app;
        // const socket = req.socket;
        app.get(prefix + '/html', forwardHtml(prefix, filterHtml));
        app.all(prefix + '/ajax/*', forwardAjax(prefix, filterCookie));
        app.get(prefix + '/js', forwardJs(prefix, filterCookie, filterJs));
        next();
    };
};

function forwardHtml(prefix, filterHtml) {
    return function (req, res, next) {
        var url = req.query.url;
        var options = {
            credentials: 'include',
            headers: {
                'Connection': 'keep-alive',
                'Pragma': 'no-cache',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.71 Safari/537.36'
            }
        };
        var platform = req.query.m;
        var mobile = platform === 'H5' ? true : false;
        if (mobile || /\/\/m\./.test(url) && !mobile) {
            if (mobile) {
                options.headers['User-Agent'] = 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1';
            }
            options.redirect = 'manual';
            // 先请求一次，探查真实地址
            fetchProcess().then(function (result) {
                var relocation = void 0;
                if ((relocation = result.headers._headers) && (relocation = relocation.location) && (relocation = relocation[0]) && relocation !== url) {
                    url = relocation;
                    if (!mobile) {
                        platform = 'PC';
                    }
                    options.redirect = 'follow';
                    fetchProcess().then(function (result) {
                        return postProcess(result);
                    });
                } else {
                    postProcess(result);
                }
            });
        } else {
            fetchProcess().then(function (result) {
                return postProcess(result);
            });
        }

        function fetchProcess() {
            return fetch(encodeURI(url), options);
        }

        function postProcess(result) {
            var rawcookie = result.headers;
            if ((rawcookie = rawcookie._headers) && (rawcookie = rawcookie['set-cookie'])) {
                res.append('Set-Cookie', rawcookie);
            }
            return Promise.resolve(result.text()).then(function (html) {
                return processHtml(html);
            }).catch(function (err) {
                return handleError(err, res);
            });
        }

        function processHtml(html) {
            // const id = Date.now() + Math.floor(Math.random() * 10000);
            var origin = url.replace(/\/[^\/]*?$/, '');
            var host = utils.getHost(origin);
            var time = new Date();
            time.setTime(Date.now() + 86400000);
            res.append('Set-Cookie', COOKIE_KEY + '=' + url + ';expires=' + time.toUTCString());
            // 移动端移除头部script，防止iframe无法正常渲染
            if (mobile) {
                html = html.replace(/^[\s\S]+?(<!DOCTYPE)/mi, function (m, p1) {
                    return p1;
                });
            }
            // 添加自定义脚本
            var proxytext = '<script>' + xhrProxy + '(\'' + url + '\', \'' + platform + '\', \'' + origin + '\', \'' + prefix + '\');</script>';
            res.end(filterHtml(html).replace('<head>', '<head>' + proxytext).replace(/(href|src)\s*=\s*"\s*((?!http|\/\/|javascript)[^"\s]+?)\s*"/g, function (m, p1, p2) {
                if (p2.indexOf('.') === 0) {
                    return p1 + '="' + origin + '/' + p2 + '"';
                } else if (p2.indexOf('/') === 0) {
                    return p1 + '="' + host + p2 + '"';
                } else {
                    return p1 + '="' + host + '/' + p2 + '"';
                }
            }));
        }
    };
}

function forwardAjax(prefix, filterCookie) {
    return function (req, res, next) {
        var htmlurl = utils.getCookie(req.headers.cookie, COOKIE_KEY);
        var method = req.method,
            url = req.url,
            query = req.query,
            body = req.body,
            headers = req.headers;

        var host = utils.getHost(htmlurl) || url;
        var newurl = url.replace(prefix + '/ajax', host);
        headers.origin && delete headers.origin;
        var newheaders = Object.assign(headers, {
            'cookie': filterCookie(headers.cookie),
            'host': host.replace(/https?:\/\//, ''),
            'referer': encodeURI(htmlurl)
        });
        if (body) {
            for (var key in body) {
                var oldval = body[key];
                body[key] = encodeURI(oldval);
            }
            if (newheaders['content-type'] && newheaders['content-type'].indexOf('x-www-form-urlencoded') > -1) {
                var qstr = '';
                for (var _key in body) {
                    qstr += _key + '=' + body[_key] + '&';
                }
                body = qstr.slice(0, -1);
            } else {
                body = JSON.stringify(body);
            }
        }
        var option = {
            method: method,
            headers: newheaders,
            body: body,
            credentials: 'include'
        };
        fetch(newurl, option).then(function (result) {
            return result.text();
        }).then(function (json) {
            res.send(json);
        }).catch(function (err) {
            return handleError(err, res);
        });
    };
}

function forwardJs(prefix, filterCookie, filterJs) {
    return function (req, res, next) {
        var query = req.query;

        var method = 'get';
        var newurl = query.url;
        var host = newurl.match(/https?:\/\/(.+?)\//)[1];
        var newheaders = {
            host: host
        };
        fetch(newurl, {
            method: method,
            headers: newheaders,
            cookie: filterCookie(headers.cookie),
            credentials: 'include'
        }).then(function (result) {
            return result.text();
        }).then(function (js) {
            res.send(filterJs(js));
        }).catch(function (err) {
            return handleError(err, res);
        });
    };
}

function handleError(e, res) {
    console.log(e);
    res.end(e.toString());
    // next(e);
}