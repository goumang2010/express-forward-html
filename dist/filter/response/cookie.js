"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var filterResCookie = function (str) { return str.split(/;\s?/).filter(function (x) { return !/^\s*domain/i.test(x); }).join(';'); };
var trimResponseCookie = function (cookie) { return (cookie && cookie.map(function (x) { return filterResCookie(x); })); };
exports.transformCookie = function (res) {
    var headers = res.headers['raw']();
    var newck = trimResponseCookie(headers['set-cookie']);
    newck && (headers['set-cookie'] = newck);
};
