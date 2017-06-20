'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var R = require('ramda');
var fetch = require('node-fetch-custom');
var fs = require('fs');
var urlLib = require('url');
var path = require('path');
var xhrProxy = fs.readFileSync(path.resolve(__dirname, './script/xhr-proxy.js'), { encoding: 'utf8' }).replace(`'use strict';`, '');
var utils = require('./utils');
var http = require('http');
var https = require('https');
// const COOKIE_KEY = 'forward_html';
var MOBILE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1';
var PC_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.71 Safari/537.36';
var idFunc = function idFunc(x) {
    return x;
};
var emptyFunc = idFunc;
var falseFunc = function falseFunc() {
    return false;
};
var nodeOptions = {
    rejectUnauthorized: false
    // copy from node-fetch
};
var ForwardError = function (_Error) {
    (0, _inherits3.default)(ForwardError, _Error);

    function ForwardError(message, statusCode, systemError) {
        (0, _classCallCheck3.default)(this, ForwardError);

        var _this = (0, _possibleConstructorReturn3.default)(this, (ForwardError.__proto__ || (0, _getPrototypeOf2.default)(ForwardError)).call(this, message));

        _this.message = message;
        _this.statusCode = statusCode;
        // when err.type is `system`, err.code contains system error code
        if (systemError) {
            _this.code = _this.errno = systemError.code;
        }
        // hide custom error implementation details from end-users
        Error.captureStackTrace(_this, _this.constructor);
        return _this;
    }

    return ForwardError;
}(Error);

var handleError = function handleError(e, req, res, next) {
    if (process.env.NODE_ENV !== 'production') {
        throw e;
    }
    console.error(e);
    res.status(e.statusCode || 500).end(`Error happend: ${e.toString()}`);
};
var _filterResCookie = function _filterResCookie(str) {
    return str.split(/;\s?/).filter(function (x) {
        return !/^\s*domain/i.test(x);
    }).join(';');
};
var trimResponseCookie = function trimResponseCookie(headers) {
    var cookie = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : headers.get('set-cookie');
    return cookie && cookie.split(/,\s?/).map(function (x) {
        return _filterResCookie(x);
    });
};
var appendResponseCookie = function appendResponseCookie(headers, res) {
    var cookie = trimResponseCookie(headers);
    cookie && res.append('Set-Cookie', cookie);
};
var forwardHtml = function forwardHtml(_ref) {
    var prefix = _ref.prefix,
        script = _ref.script,
        isMobileUA = _ref.isMobileUA,
        needRedirect = _ref.needRedirect,
        filterHtml = _ref.filterHtml;
    return function (req, res, next) {
        var url = req.query.url;
        if (!url) {
            throw new ForwardError(`You must specify an url to forward html!`, 400);
        }
        // support local url
        var serverHost = void 0;
        if (req.headers.host) {
            serverHost = `${req.protocol}://${req.headers.host}`;
            url = urlLib.resolve(`${serverHost}`, url);
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
            appendResponseCookie(result.headers, res);
            return _promise2.default.resolve(result.text()).then(function (html) {
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
            // res.append('Set-Cookie', `${COOKIE_KEY}=${encodeURIComponent(url)};expires=${time.toUTCString()}`);
            // 添加自定义脚本
            (0, _assign2.default)(urlObj, { mobile, UA, prefix, serverUrlObj });
            var proxytext = `<script>(${xhrProxy}(${(0, _stringify2.default)(urlObj)}, ${script}))</script>`;
            res.append('Content-Type', 'text/html; charset=utf-8');
            res.end(filterHtml(html, urlObj, req).replace('<head>', '<head>' + proxytext).replace(/(href|src)\s*=\s*"\s*((?!http|\/\/|javascript)[^"'\s]+?)\s*"/g, function (m, p1, p2) {
                return `${p1}="${urlLib.resolve(url, p2)}"`;
            }));
        }
    };
};
var forwardAjax = function forwardAjax(_ref2) {
    var prefix = _ref2.prefix,
        filterCookie = _ref2.filterCookie;
    return function () {
        var _ref3 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(req, res, next) {
            var method, query, body, headers, url, referer, referObj, newheaders, option, bodykeys, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, key, oldval, qstr, _key, resObj, resheaders, rawheaders;

            return _regenerator2.default.wrap(function _callee$(_context) {
                while (1) {
                    switch (_context.prev = _context.next) {
                        case 0:
                            method = req.method, query = req.query, body = req.body, headers = req.headers;
                            url = query.url, referer = query.referer;

                            if (!(url && referer)) {
                                _context.next = 6;
                                break;
                            }

                            url = urlLib.resolve(referer, url);
                            _context.next = 7;
                            break;

                        case 6:
                            throw new ForwardError(`Can not forward null ajax request, HTML url: ${referer || 'null'}, XHR url: ${url}`, 400);

                        case 7:
                            referObj = urlLib.parse(referer);
                            // remove

                            headers.origin && delete headers.origin;
                            newheaders = (0, _assign2.default)(headers, {
                                'cookie': filterCookie(headers.cookie || '', req),
                                'host': referObj.host,
                                'referer': encodeURI(referObj.href)
                            });
                            option = {
                                method,
                                headers: newheaders,
                                credentials: 'include'
                            };
                            // if there is a body-parser

                            if (!body) {
                                _context.next = 37;
                                break;
                            }

                            bodykeys = (0, _keys2.default)(body || {});

                            if (!(body && bodykeys.length)) {
                                _context.next = 35;
                                break;
                            }

                            _iteratorNormalCompletion = true;
                            _didIteratorError = false;
                            _iteratorError = undefined;
                            _context.prev = 17;

                            for (_iterator = (0, _getIterator3.default)(bodykeys); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                                key = _step.value;
                                oldval = body[key];

                                body[key] = encodeURI(oldval);
                            }
                            _context.next = 25;
                            break;

                        case 21:
                            _context.prev = 21;
                            _context.t0 = _context['catch'](17);
                            _didIteratorError = true;
                            _iteratorError = _context.t0;

                        case 25:
                            _context.prev = 25;
                            _context.prev = 26;

                            if (!_iteratorNormalCompletion && _iterator.return) {
                                _iterator.return();
                            }

                        case 28:
                            _context.prev = 28;

                            if (!_didIteratorError) {
                                _context.next = 31;
                                break;
                            }

                            throw _iteratorError;

                        case 31:
                            return _context.finish(28);

                        case 32:
                            return _context.finish(25);

                        case 33:
                            if (newheaders['content-type'] && newheaders['content-type'].indexOf('x-www-form-urlencoded') > -1) {
                                qstr = '';

                                for (_key in body) {
                                    qstr += `${_key}=${body[_key]}&`;
                                }
                                body = qstr.slice(0, -1);
                            } else {
                                body = (0, _stringify2.default)(body);
                            }
                            option.body = body;

                        case 35:
                            _context.next = 38;
                            break;

                        case 37:
                            if (!/get|head/i.test(method)) {
                                // use req stream
                                option.body = req;
                            }

                        case 38:
                            _context.next = 40;
                            return fetch(url, option, nodeOptions, true);

                        case 40:
                            resObj = _context.sent;
                            resheaders = resObj.headers;

                            appendResponseCookie(resheaders, res);
                            resheaders.delete('Set-Cookie');
                            rawheaders = resheaders.raw();

                            (0, _keys2.default)(rawheaders).forEach(function (x) {
                                if (rawheaders[x]) {
                                    rawheaders[x] = rawheaders[x].toString();
                                }
                            });
                            res.set(rawheaders);
                            resObj.body.pipe(res);

                        case 48:
                        case 'end':
                            return _context.stop();
                    }
                }
            }, _callee, undefined, [[17, 21, 25, 33], [26,, 28, 32]]);
        }));

        return function (_x2, _x3, _x4) {
            return _ref3.apply(this, arguments);
        };
    }();
};
var forwardStatic = function forwardStatic(_ref4) {
    var prefix = _ref4.prefix,
        filterCookie = _ref4.filterCookie,
        filterStatic = _ref4.filterStatic;
    return function () {
        var _ref5 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(req, res, next) {
            var query, headers, method, url, host, option, result, text, resObj;
            return _regenerator2.default.wrap(function _callee2$(_context2) {
                while (1) {
                    switch (_context2.prev = _context2.next) {
                        case 0:
                            query = req.query, headers = req.headers;
                            method = 'get';
                            url = query.url;

                            if (url) {
                                _context2.next = 5;
                                break;
                            }

                            throw new ForwardError(`You must specify an url param for ajax static request!`, 400);

                        case 5:
                            host = url.match(/https?:\/\/(.+?)\//)[1];
                            option = {
                                method,
                                headers: { host },
                                cookie: filterCookie(headers.cookie || '', req),
                                credentials: 'include'
                            };

                            if (!filterStatic) {
                                _context2.next = 18;
                                break;
                            }

                            _context2.next = 10;
                            return fetch(url, option, nodeOptions);

                        case 10:
                            result = _context2.sent;

                            res.status(result.status);
                            _context2.next = 14;
                            return result.text();

                        case 14:
                            text = _context2.sent;

                            res.send(filterStatic(text));
                            _context2.next = 22;
                            break;

                        case 18:
                            _context2.next = 20;
                            return fetch(url, option, nodeOptions, true);

                        case 20:
                            resObj = _context2.sent;

                            resObj.body.pipe(res);

                        case 22:
                        case 'end':
                            return _context2.stop();
                    }
                }
            }, _callee2, undefined);
        }));

        return function (_x5, _x6, _x7) {
            return _ref5.apply(this, arguments);
        };
    }();
};
var buildOptions = function buildOptions() {
    var _ref6 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref6$prefix = _ref6.prefix,
        prefix = _ref6$prefix === undefined ? '' : _ref6$prefix,
        _ref6$isMobileUA = _ref6.isMobileUA,
        isMobileUA = _ref6$isMobileUA === undefined ? falseFunc : _ref6$isMobileUA,
        _ref6$needRedirect = _ref6.needRedirect,
        needRedirect = _ref6$needRedirect === undefined ? falseFunc : _ref6$needRedirect,
        _ref6$filterHtml = _ref6.filterHtml,
        filterHtml = _ref6$filterHtml === undefined ? idFunc : _ref6$filterHtml,
        _ref6$filterCookie = _ref6.filterCookie,
        filterCookie = _ref6$filterCookie === undefined ? idFunc : _ref6$filterCookie,
        filterStatic = _ref6.filterStatic,
        _ref6$script = _ref6.script,
        script = _ref6$script === undefined ? function () {} : _ref6$script;

    if (script) {
        var scriptType = typeof script;
        if (scriptType === 'function') {
            script = Function.prototype.toString.call(script);
        } else if (scriptType !== 'string') {
            throw new TypeError('The param script must be function or string!');
        }
    } else {
        script = '';
    }
    prefix !== '' && (prefix.startsWith('/') || (prefix = '/' + prefix));
    return { prefix, isMobileUA, needRedirect, filterHtml, filterCookie, filterStatic, script };
};
var wrapAsyncError = function wrapAsyncError(fn) {
    return function (req, res, next) {
        var routePromise = fn(req, res, next);
        if (routePromise && routePromise.catch) {
            routePromise.catch(function (err) {
                return next(err);
            });
        }
    };
};
var registerRouter = R.curry(function (opts, router) {
    var prefix = opts.prefix;
    if (router && router.all) {
        router.get(`${prefix}/html`, wrapAsyncError(forwardHtml(opts)));
        router.all(`${prefix}/ajax`, wrapAsyncError(forwardAjax(opts)));
        router.get(`${prefix}/static`, wrapAsyncError(forwardStatic(opts)));
        router.use(handleError);
    } else {
        throw new TypeError('The param is not express instance or router!');
    }
    return router;
});
module.exports = R.compose(registerRouter, buildOptions);