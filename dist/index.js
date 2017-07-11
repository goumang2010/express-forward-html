'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var error_1 = require("./error");
var html_1 = require("./handler/html");
var ajax_1 = require("./handler/ajax");
var static_1 = require("./handler/static");
var other_1 = require("./handler/other");
var request_1 = require("./adapter/request");
var response_1 = require("./adapter/response");
var filter_1 = require("./filter");
var R = require("ramda");
var buildOptions = function (opts) {
    if (opts === void 0) { opts = {}; }
    var _a = opts.prefix, prefix = _a === void 0 ? '' : _a, filterHtml = opts.filterHtml, filterStatic = opts.filterStatic, filterAjax = opts.filterAjax, _b = opts.script, script = _b === void 0 ? function () { } : _b;
    if (script) {
        var scriptType = typeof script;
        if (scriptType === 'function') {
            script = Function.prototype.toString.call(script);
        }
        else if (scriptType !== 'string') {
            throw new TypeError('The param script must be function or string!');
        }
        else {
            script = script.toString();
        }
    }
    else {
        script = '';
    }
    prefix !== '' && (prefix.startsWith('/') || (prefix = '/' + prefix));
    var requestFilter = filter_1.combineRequestFilter(opts);
    var responseFilter = filter_1.combineResponseFilter(opts);
    var applyCommonFilter = filter_1.buildFilterImplementer(requestFilter, responseFilter);
    return { prefix: prefix, applyCommonFilter: applyCommonFilter, requestAdapter: request_1.default, responseAdapter: response_1.default, filterAjax: filterAjax, filterHtml: filterHtml, filterStatic: filterStatic, script: script };
};
var wrapAsyncError = function (fn) { return function (req, res, next) {
    var routePromise = fn(req, res, next);
    if (routePromise && routePromise.catch) {
        routePromise.catch(function (err) { return next(err); });
    }
}; };
var registerRouter = R.curry(function (opts, router) {
    var prefix = opts.prefix;
    if (router && router.all) {
        router.get(prefix + "/html", wrapAsyncError(html_1.default(opts)));
        router.all(prefix + "/ajax", wrapAsyncError(ajax_1.default(opts)));
        router.get(prefix + "/static", wrapAsyncError(static_1.default(opts)));
        router.all("/*", wrapAsyncError(other_1.default(opts)));
        router.use(error_1.handleError);
    }
    else {
        throw new TypeError('The param is not express instance or router!');
    }
    return router;
});
module.exports = R.compose(registerRouter, buildOptions);
