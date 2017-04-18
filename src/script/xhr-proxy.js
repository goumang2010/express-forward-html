function inject(urlObj, platform, prefix, extraScript) {
    let pageUrl = urlObj.href;
    let protocol = urlObj.protocol;
    let origin = protocol + urlObj.host;
    if (window.XMLHttpRequest) {
        if (platform === 'H5') {
            Object.defineProperty(window.navigator, 'userAgent', { writable: true, configurable: true, enumerable: true });
            window.navigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1';
        }
        var open = window.XMLHttpRequest.prototype.open;
        window.XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
            var args = [].slice.call(arguments);
            //  remove same origin
            url = url.replace(origin, '');
            let res;
            if (res = /^(https?:)?\/\//.test(url)) {
                if(!res[1]) {
                    url = protocol + url;
                }
                args[1] = `${prefix}/static?url=${encodeURIComponent(url)}`;
            } else {
                args[1] = `${prefix}/ajax` + (url.indexOf('/') === 0 ? url : '/' + url);
            }
            // call original open method
            return open.apply(this, args);
        }
    }
    extraScript(pageUrl, platform, origin, prefix);
}
