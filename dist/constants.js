"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var UAType;
(function (UAType) {
    UAType[UAType["MOBILE"] = 0] = "MOBILE";
    UAType[UAType["PC"] = 1] = "PC";
})(UAType = exports.UAType || (exports.UAType = {}));
exports.UA = (_a = {},
    _a[UAType.MOBILE] = 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1',
    _a[UAType.PC] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.71 Safari/537.36',
    _a);
exports.idFunc = function (x) { return x; };
exports.falseFunc = function () { return false; };
exports.nodeOptions = {
    rejectUnauthorized: false
};
var _a;
