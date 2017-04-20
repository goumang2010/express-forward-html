'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var fetch = require('node-fetch-custom');
var fs = require('fs');
var urlLib = require('url');
var path = require('path');
var xhrProxy = fs.readFileSync(path.resolve(__dirname, './script/xhr-proxy.js'), {
    encoding: 'utf8'
}).replace('\'use strict\';', '');
var utils = require('./utils');
var COOKIE_KEY = 'forward_html';
var emptyFunc = function emptyFunc(x) {
    return x;
};
var nodeOptions = {
    rejectUnauthorized: false
};
module.exports = function forward() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref$prefix = _ref.prefix,
        prefix = _ref$prefix === undefined ? '' : _ref$prefix,
        _ref$filterHtml = _ref.filterHtml,
        filterHtml = _ref$filterHtml === undefined ? emptyFunc : _ref$filterHtml,
        _ref$filterCookie = _ref.filterCookie,
        filterCookie = _ref$filterCookie === undefined ? emptyFunc : _ref$filterCookie,
        _ref$filterJs = _ref.filterJs,
        filterJs = _ref$filterJs === undefined ? emptyFunc : _ref$filterJs,
        _ref$script = _ref.script,
        script = _ref$script === undefined ? function () {} : _ref$script;

    if (script) {
        var scriptType = typeof script === 'undefined' ? 'undefined' : _typeof(script);
        if (scriptType === 'function') {
            script = Function.prototype.toString.call(script);
        } else if (scriptType !== 'string') {
            throw new TypeError('The param script must be function or string!');
        }
    } else {
        script = '';
    }

    return function (router) {
        if (router && router.all) {
            router.get(prefix + '/html', forwardHtml(prefix, script, filterHtml));
            router.all(prefix + '/ajax', forwardAjax(prefix, filterCookie));
            router.get(prefix + '/static', forwardStatic(prefix, filterCookie, filterJs));
        } else {
            throw new TypeError('The param is not express instance or router!');
        }
    };
};

function forwardHtml(prefix, script, filterHtml) {
    return function (req, res, next) {
        var url = req.query.url;
        if (!url) {
            res.status(400).end('You must specify an url to forward html!');
            return;
        }
        // support local url
        if (req.headers.host) {
            url = urlLib.resolve(req.protocol + '://' + req.headers.host, url);
        }
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
                var relocation = result.headers.get('location');
                if (relocation && relocation !== url) {
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
            return fetch(encodeURI(url), options, nodeOptions);
        }

        function postProcess(result) {
            res.status(result.status);
            var rawcookie = result.headers.get('set-cookie');
            if (rawcookie) {
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
            var urlObj = urlLib.parse(url);
            var origin = url.replace(/\/[^\/]*?$/, '');
            var time = new Date();
            time.setTime(Date.now() + 86400000);
            res.append('Set-Cookie', COOKIE_KEY + '=' + url + ';expires=' + time.toUTCString());
            // 添加自定义脚本
            var proxytext = '<script>(' + xhrProxy + '(' + JSON.stringify(urlObj) + ', \'' + platform + '\', \'' + prefix + '\', ' + script + '))</script>';
            res.append('Content-Type', 'text/html; charset=utf-8');
            res.end(filterHtml(html).replace('<head>', '<head>' + proxytext).replace(/(href|src)\s*=\s*"\s*((?!http|\/\/|javascript)[^"'\s]+?)\s*"/g, function (m, p1, p2) {
                return p1 + '="' + urlLib.resolve(url, p2) + '"';
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
        var urlObj = urlLib.parse(url);
        if (urlObj.path.match(/^\/ajax\/?$/i)) {
            res.status(400).end('Can not forward null ajax request, HTML url: ' + (htmlurl || 'null') + ', XHR url: ' + url);
            return;
        }
        url = url.replace(prefix + '/ajax', host);
        // remove
        headers.origin && delete headers.origin;
        var newheaders = Object.assign(headers, {
            'cookie': filterCookie(headers.cookie),
            'host': host.replace(/https?:\/\//, ''),
            'referer': encodeURI(htmlurl)
        });
        var option = {
            method: method,
            headers: newheaders,
            credentials: 'include'
        };
        var bodykeys = Object.keys(body);
        if (body && bodykeys.length) {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = bodykeys[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var _key = _step.value;

                    var oldval = body[_key];
                    body[_key] = encodeURI(oldval);
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            if (newheaders['content-type'] && newheaders['content-type'].indexOf('x-www-form-urlencoded') > -1) {
                var qstr = '';
                for (var key in body) {
                    qstr += key + '=' + body[key] + '&';
                }
                body = qstr.slice(0, -1);
            } else {
                body = JSON.stringify(body);
            }
            option.body = body;
        }
        fetch(url, option, nodeOptions).then(function (result) {
            res.status(result.status);
            return result.text();
        }).then(function (json) {
            res.send(json);
        }).catch(function (err) {
            return handleError(err, res);
        });
    };
}

function forwardStatic(prefix, filterCookie, filterJs) {
    return function (req, res, next) {
        var query = req.query,
            headers = req.headers;

        var method = 'get';
        var url = query.url;
        if (!url) {
            res.status(400).end('You must specify an url param for ajax static request!');
            return;
        }
        var host = url.match(/https?:\/\/(.+?)\//)[1];
        var newheaders = {
            host: host
        };
        fetch(url, {
            method: method,
            headers: newheaders,
            cookie: filterCookie(headers.cookie),
            credentials: 'include'
        }, nodeOptions).then(function (result) {
            res.status(result.status);
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
    res.status(500).end('Error happend: ' + e.toString());
}