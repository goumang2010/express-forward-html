"use strict";

module.exports = {
    getHost: function getHost(origin) {
        return origin.replace(/([^\/:\s])\/.*$/, '$1');
    },

    getCookie: function getCookie(str, ckName) {
        if (undefined === ckName || "" === ckName) {
            return "";
        }
        if (str == null) {
            return '';
        } else {
            return stringSplice(str, ckName, ";", "");
        }
    }
};

function stringSplice(src, k, e, sp) {
    if (src === "") {
        return "";
    }
    sp = sp === "" ? "=" : sp;
    k += sp;
    var ps = src.indexOf(k);
    if (ps < 0) {
        return "";
    }
    ps += k.length;
    var pe = src.indexOf(e, ps);
    if (pe < ps) {
        pe = src.length;
    }
    return src.substring(ps, pe);
};