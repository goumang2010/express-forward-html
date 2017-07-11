import { IncomingMessage } from 'https';
import { Request, Headers } from 'node-fetch-custom';
import { ForwardError } from '../error';
import * as urlLib from 'url';

export default (req: IncomingMessage) => {
    const headers = new Headers(req.headers);
    let queryObj = req['query'] || (() => {
        if (!req.url) {
            throw (new ForwardError(`req.url is null, please check the request`, 400));
        }
        return urlLib.parse(req.url, true).query;
    })();
    let url = queryObj.url;
    let referer = queryObj.referer;
    if (url && referer) {
        url = urlLib.resolve(referer, url);
        let referObj = urlLib.parse(referer);
        referObj.host && headers.set('host', referObj.host);
        referObj.href && headers.set('referer', encodeURI(referObj.href));
    } else {
        headers.delete('host');
    }
    headers.set('credentials', 'include');
    return new Request(encodeURI(url), { method: req.method, body: req['body'], headers });
};
