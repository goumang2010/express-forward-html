
import { FwdRequest, RequestAdapter } from '../interface';
import { Request, Headers } from 'node-fetch-sp';
import { ForwardError } from '../error';
import * as urlLib from 'url';

const requestAdapter: RequestAdapter = (req) => {
    const headers = new Headers(req.headers);
    let queryObj = req.query || (() => {
        if (!req.url) {
            throw (new ForwardError(`req.url is null, please check the request`, 400));
        }
        return urlLib.parse(req.url, true).query;
    })();
    let url = queryObj.url;
    const serverHost = (() => {
        if (req.headers.host) {
            let _serverHost = `${req['protocol'] || (req.connection['encrypted'] ? 'https' : 'http')}://${req.get('host') || req.headers.host}`;
            return _serverHost;
        }
        return '';
    })();
    let referer = queryObj.referer;
    if (url && referer) {
        url = urlLib.resolve(referer, url);
        let referObj = urlLib.parse(referer);
        referObj.host && headers.set('host', referObj.host);
        referObj.href && headers.set('referer', encodeURI(referObj.href));
    } else {
        headers.delete('host');
        headers.delete('referer');
        if (serverHost) {
            // support local url
            url = urlLib.resolve(`${serverHost}`, url);
        }
    }
    headers.set('credentials', 'include');
    const method = req.method || 'get';
    const opts = { method, headers };
    /get|head/i.test(method) || (req['body'] && (opts['body'] = req['body']));
    const fetchReq = new Request(encodeURI(url), opts) as FwdRequest;
    fetchReq.originalUrlObj = urlLib.parse(urlLib.resolve(serverHost, req.originalUrl || req.url), true);
    return fetchReq;
};
export default requestAdapter;