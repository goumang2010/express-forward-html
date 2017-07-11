"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = function (res, nodeRes) {
    nodeRes.statusCode = res.status;
    res.headers.forEach(function (val, name) {
        nodeRes.setHeader(name, val);
    });
};
