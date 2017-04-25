'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var fetch = require('node-fetch-custom');
var fs = require('fs');
var urlLib = require('url');
var path = require('path');
var xhrProxy = fs.readFileSync(path.resolve(__dirname, './script/xhr-proxy.js'), { encoding: 'utf8' }).replace('\'use strict\';', '');
var utils = require('./utils');
var COOKIE_KEY = 'forward_html';
var MOBILE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1';
var PC_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.71 Safari/537.36';
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
        _ref$isMobileUA = _ref.isMobileUA,
        isMobileUA = _ref$isMobileUA === undefined ? function () {
        return false;
    } : _ref$isMobileUA,
        _ref$needRedirect = _ref.needRedirect,
        needRedirect = _ref$needRedirect === undefined ? function () {
        return false;
    } : _ref$needRedirect,
        _ref$filterHtml = _ref.filterHtml,
        filterHtml = _ref$filterHtml === undefined ? emptyFunc : _ref$filterHtml,
        _ref$filterCookie = _ref.filterCookie,
        filterCookie = _ref$filterCookie === undefined ? emptyFunc : _ref$filterCookie,
        _ref$filterStatic = _ref.filterStatic,
        filterStatic = _ref$filterStatic === undefined ? emptyFunc : _ref$filterStatic,
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
    prefix !== '' && (prefix.startsWith('/') || (prefix = '/' + prefix));
    var opts = { prefix: prefix, isMobileUA: isMobileUA, needRedirect: needRedirect, filterHtml: filterHtml, filterCookie: filterCookie, filterStatic: filterStatic, script: script };
    return function (router) {
        if (router && router.all) {
            router.get(prefix + '/html', forwardHtml(opts));
            router.all(prefix + '/ajax', forwardAjax(opts));
            router.get(prefix + '/static', forwardStatic(opts));
        } else {
            throw new TypeError('The param is not express instance or router!');
        }
    };
};

function forwardHtml(_ref2) {
    var prefix = _ref2.prefix,
        script = _ref2.script,
        isMobileUA = _ref2.isMobileUA,
        needRedirect = _ref2.needRedirect,
        filterHtml = _ref2.filterHtml;

    return function (req, res, next) {
        var url = req.query.url;

        if (!url) {
            res.status(400).end('You must specify an url to forward html!');
            return;
        }
        // support local url
        var serverHost = void 0;
        if (req.headers.host) {
            serverHost = req.protocol + '://' + req.headers.host;
            url = urlLib.resolve('' + serverHost, url);
        }
        var options = {
            credentials: 'include',
            headers: {
                'Connection': 'keep-alive',
                'Pragma': 'no-cache'
            }
        };

        var mobile = isMobileUA(url, req);
        var UA = void 0;
        if (typeof mobile === 'string') {
            UA = mobile;
            mobile = /Mobile|iphone|Android/i.test(mobile);
        } else if (mobile) {
            UA = MOBILE_UA;
        } else {
            UA = PC_UA;
        }
        options.headers['User-Agent'] = UA;
        if (needRedirect(url, req)) {
            options.redirect = 'manual';
            // 先请求一次，探查真实地址
            fetchProcess().then(function (result) {
                var relocation = result.headers.get('location');
                if (relocation && relocation !== url) {
                    url = relocation;
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
            var serverUrlObj = urlLib.parse(serverHost + req.originalUrl);
            var origin = url.replace(/\/[^\/]*?$/, '');
            var time = new Date();
            time.setTime(Date.now() + 86400000);
            res.append('Set-Cookie', COOKIE_KEY + '=' + url + ';expires=' + time.toUTCString());
            // 添加自定义脚本
            Object.assign(urlObj, { mobile: mobile, UA: UA, prefix: prefix, serverUrlObj: serverUrlObj });
            var proxytext = '<script>(' + xhrProxy + '(' + JSON.stringify(urlObj) + ', ' + script + '))</script>';
            res.append('Content-Type', 'text/html; charset=utf-8');
            res.end(filterHtml(html, req).replace('<head>', '<head>' + proxytext).replace(/(href|src)\s*=\s*"\s*((?!http|\/\/|javascript)[^"'\s]+?)\s*"/g, function (m, p1, p2) {
                return p1 + '="' + urlLib.resolve(url, p2) + '"';
            }));
        }
    };
}

function forwardAjax(_ref3) {
    var prefix = _ref3.prefix,
        filterCookie = _ref3.filterCookie;

    return function (req, res, next) {
        var method = req.method,
            query = req.query,
            body = req.body,
            headers = req.headers;
        var url = query.url,
            referer = query.referer;

        if (url && referer) {
            url = urlLib.resolve(referer, url);
        } else {
            res.status(400).end('Can not forward null ajax request, HTML url: ' + (referer || 'null') + ', XHR url: ' + url);
            return;
        }
        var referObj = urlLib.parse(referer);
        // remove
        headers.origin && delete headers.origin;
        var newheaders = Object.assign(headers, {
            'cookie': filterCookie(headers.cookie || '', req),
            'host': referObj.host,
            'referer': encodeURI(referObj.href)
        });
        var option = {
            method: method,
            headers: newheaders,
            credentials: 'include'
        };
        var bodykeys = Object.keys(body || {});
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

function forwardStatic(_ref4) {
    var prefix = _ref4.prefix,
        filterCookie = _ref4.filterCookie,
        filterStatic = _ref4.filterStatic;

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
            cookie: filterCookie(headers.cookie || '', req),
            credentials: 'include'
        }, nodeOptions).then(function (result) {
            res.status(result.status);
            return result.text();
        }).then(function (js) {
            res.send(filterStatic(js, req));
        }).catch(function (err) {
            return handleError(err, res);
        });
    };
}

function handleError(e, res) {
    console.log(e);
    res.status(500).end('Error happend: ' + e.toString());
}