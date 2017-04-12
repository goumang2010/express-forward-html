function inject(pageUrl, platform, origin, prefix, extraScript) {
    if(platform === 'H5') {
        Object.defineProperty(window.navigator,'userAgent' ,{writable:true, configurable: true, enumerable:true});
        window.navigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1';
    }
    extraScript(pageUrl, platform, origin, prefix);
    var open = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
        var args = [].slice.call(arguments);
        //  remove same origin
        url = url.replace(origin, '');
        if (/https?:\/\//.test(url)) {
            if(url.match(/\.js\??/)) {
                args[1] = `${prefix}/js?url=${encodeURIComponent(url)}`;
            } else {
                args[1] = url;
            }
        } else {
            args[1] = `${prefix}/ajax` + (url.indexOf('/') === 0  ? url : '/' + url);
        }
        // call original open method
        return open.apply(this, args);
    }
}
