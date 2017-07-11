"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var node_fetch_custom_1 = require("node-fetch-custom");
var error_1 = require("./error");
var urlLib = require("url");
exports.default = function (req) {
    var headers = new node_fetch_custom_1.Headers(req.headers);
    var queryObj = req['query'] || (function () {
        if (!req.url) {
            throw (new error_1.ForwardError("req.url is null, please check the request", 400));
        }
        return urlLib.parse(req.url, true).query;
    })();
    var url = queryObj.url;
    var referer = queryObj.referer || headers.get('referer');
    if (url && referer) {
        url = urlLib.resolve(referer, url);
        var referObj = urlLib.parse(referer);
        headers.set('credentials', 'include');
        referObj.host && headers.set('host', referObj.host);
        referObj.href && headers.set('referer', encodeURI(referObj.href));
    }
    else {
        throw (new error_1.ForwardError("Can not forward null ajax request, HTML url: " + (referer || 'null') + ", XHR url: " + url, 400));
    }
    return new node_fetch_custom_1.Request(encodeURI(url), { method: req.method, body: req['body'], headers: headers });
};
