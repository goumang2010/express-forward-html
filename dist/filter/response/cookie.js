"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var filterResCookie = function (str) { return str.split(/;\s?/).filter(function (x) { return !/^\s*domain/i.test(x); }).join(';'); };
var trimResponseCookie = function (cookie) { return (cookie && cookie.split(/,\s?/).map(function (x) { return filterResCookie(x); })); };
exports.transformCookie = function (res) {
    var newck = trimResponseCookie(res.headers.get('set-cookie'));
    newck && res.headers.set('set-cookie', newck);
};
