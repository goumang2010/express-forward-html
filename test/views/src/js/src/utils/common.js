
export const jsonToQuery = function (a) {
    const add = function (s, k, v) {
        v = typeof v === 'function' ? v() : v === null ? '' : v === undefined ? '' : v;
        s[s.length] = encodeURIComponent(k) + '=' + encodeURIComponent(v);
    };
    const buildParams = function (prefix, obj, s) {
        let i;
        let len;
        let key;

        if (Object.prototype.toString.call(obj) === '[object Array]') {
            for (i = 0, len = obj.length; i < len; i++) {
                buildParams(prefix + '[' + (typeof obj[i] === 'object' ? i : '') + ']', obj[i], s);
            }
        } else if (obj && obj.toString() === '[object Object]') {
            for (key in obj) {
                if (obj.hasOwnProperty(key)) {
                    if (prefix) {
                        buildParams(prefix + '[' + key + ']', obj[key], s, add);
                    } else {
                        buildParams(key, obj[key], s, add);
                    }
                }
            }
        } else if (prefix) {
            add(s, prefix, obj);
        } else {
            for (key in obj) {
                add(s, key, obj[key]);
            }
        }
        return s;
    };
    return buildParams('', a, []).join('&').replace(/%20/g, '+');
};

export const JSONParse = function () {
    if (window.JSON) {
        return JSON.parse;
    } else {
        return function (jsonstr) {
            return (new Function("return" + jsonstr))();
        };
    }
}();