"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = function (res, nodeRes) {
    nodeRes.statusCode = res.status;
    res.headers.forEach(function (val, name) {
        val.split(/,\s?/).map(function (v) { return nodeRes.setHeader(name, v); });
    });
};
