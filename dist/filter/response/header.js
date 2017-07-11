"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trimHeader = function (res) {
    res.headers.delete('content-length');
};
