"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var node_fetch_sp_1 = require("node-fetch-sp");
var error_1 = require("../error");
var urlLib = require("url");
var requestAdapter = function (req) {
    var headers = new node_fetch_sp_1.Headers(req.headers);
    var queryObj = req.query || (function () {
        if (!req.url) {
            throw (new error_1.ForwardError("req.url is null, please check the request", 400));
        }
        return urlLib.parse(req.url, true).query;
    })();
    var url = queryObj.url;
    var serverHost = (function () {
        if (req.headers.host) {
            var _serverHost = (req['protocol'] || (req.connection['encrypted'] ? 'https' : 'http')) + "://" + (req.get('host') || req.headers.host);
            return _serverHost;
        }
        return '';
    })();
    var referer = queryObj.referer;
    if (url && referer) {
        url = urlLib.resolve(referer, url);
        var referObj = urlLib.parse(referer);
        referObj.host && headers.set('host', referObj.host);
        referObj.href && headers.set('referer', encodeURI(referObj.href));
    }
    else {
        headers.delete('host');
        headers.delete('referer');
        if (serverHost) {
            // support local url
            url = urlLib.resolve("" + serverHost, url);
        }
    }
    headers.set('credentials', 'include');
    var method = req.method || 'get';
    var opts = { method: method, headers: headers };
    /get|head/i.test(method) || (req['body'] && (opts['body'] = req['body']));
    var fetchReq = new node_fetch_sp_1.Request(encodeURI(url), opts);
    fetchReq.originalUrlObj = urlLib.parse(urlLib.resolve(serverHost, req.originalUrl || req.url), true);
    return fetchReq;
};
exports.default = requestAdapter;
