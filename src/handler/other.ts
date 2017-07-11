import { Handler } from '../interface';
import * as urlLib from 'url';
import * as querystring from 'querystring';

const otherHandler: Handler = ({ prefix }) => async (req, res, next) => {
        let { url, headers} = req;
        let {referer} = headers;
        if (!url || !referer || typeof referer !== 'string') {
            next();
            return;
        }
        const refobj = urlLib.parse(referer, true);
        const pathname = refobj.pathname || '';
        if (pathname.indexOf(prefix) === -1) {
            next();
            return;
        }
        let refQuery = refobj.query;
        let referurl = refQuery.url;
        if (!referurl) {
            next();
            return;
        }
        let referurlObj = urlLib.parse(referurl, true);
        if (referurlObj.query.url) {
            url = decodeURIComponent(referurlObj.query.url);
        }
        url = urlLib.resolve(referurl, url.replace(`${prefix}/`, ''));
        url = `${refobj.protocol}//${refobj.host}${refobj.pathname}?${querystring.stringify(Object.assign({}, querystring.parse(urlLib.parse(url).query), refQuery, {url}))}`;
        res.writeHead(302, {Location: url});
        res.end();
};

export default otherHandler;
