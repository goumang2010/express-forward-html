export default {
    filterHtml(html) {
        return html.replace(/<script[\S]+?uba-sdk[\S]+?<\/script>/, '').replace(/top\.location/g, '{}');
    },
    filterCookie(cookie) {
        return cookie.replace(/DataPlatform.*?=.+?;/gi, '')
    },
    filterStatic(content) {
        return content && content.replace(/\.assign\(([^,]+?)\)/g, '.$assign($1)').replace(/top\.location/g, '{}');
    },
    prefix: '/databp',
    script: function _external(urlObj) {
        window.$pageUrl = urlObj.href;
        window.$platform = urlObj.mobile ? 'H5': 'PC';
        window.location.$assign = function(url) {
            let newurl;
            if (/https?:\/\//.test(url)) {
                // do noting
                newurl = url;
            } else {
                newurl = '/databp/html?m=' + platform + '&url=' + encodeURIComponent(pageUrl.replace(/\/$/, '') + '/' + url.replace(/^\//, ''));
            }
            window.location.assign(newurl);
        }
    }
}