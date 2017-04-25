'use strict';

function inject(urlObj, extraScript) {
    var protocol = urlObj.protocol,
        host = urlObj.host,
        prefix = urlObj.prefix,
        UA = urlObj.UA,
        serverUrlObj = urlObj.serverUrlObj;

    var origin = protocol + '//' + host;
    var serverBase = serverUrlObj.protocol + '//' + serverUrlObj.host + serverUrlObj.pathname.slice(0, -4);
    if (window.XMLHttpRequest) {
        Object.defineProperty(window.navigator, 'userAgent', { writable: true, configurable: true, enumerable: true });
        window.navigator.userAgent = UA;
        var open = window.XMLHttpRequest.prototype.open;
        window.XMLHttpRequest.prototype.open = function (method, url, async, user, password) {
            var args = [].slice.call(arguments);
            //  remove same origin
            url = url.replace(origin, '');
            var res = void 0;
            if ((res = /^(https?:)?\/\//.exec(url)) && method.toLowerCase() === 'get') {
                if (!res[1]) {
                    url = protocol + url;
                }
                args[1] = serverBase + 'static?url=' + encodeURIComponent(url);
            } else {
                args[1] = serverBase + 'ajax?url=' + encodeURIComponent(url) + '&referer=' + encodeURIComponent(urlObj.href);
            }
            // call original open method
            return open.apply(this, args);
        };
    }
    extraScript(urlObj);
}