"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var responseAdapter = function (res, nodeRes) {
    nodeRes.statusCode = res.status;
    var headers = res.headers['raw']();
    Object.keys(headers).forEach(function (key) {
        nodeRes.setHeader(key, headers[key]);
    });
};
exports.default = responseAdapter;
