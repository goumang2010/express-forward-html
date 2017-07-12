"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyFilterMap = function (maps) {
    if (maps == null) {
        return;
    }
    if (typeof maps === 'function') {
        maps = {
            '.': maps
        };
    }
    var regexMaps = Object.keys(maps).map(function (x) { return [new RegExp(x, 'i'), maps[x]]; });
    if (regexMaps.length === 0) {
        return;
    }
    return function (url) { return function (html, req) {
        return regexMaps.reduce(function (pre, _a) {
            var rx = _a[0], func = _a[1];
            if (rx.test(url)) {
                return func(pre, req);
            }
            return pre;
        }, html);
    }; };
};
