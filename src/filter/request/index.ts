const fetch = require('node-fetch-custom');
import { Options } from '../../interface';
import { nodeOptions, idFunc, falseFunc, UAType, UA } from '../../constants';
import { Request, Response } from 'node-fetch-custom';

export const combineRequestFilter = ({ isMobileUA = falseFunc, needRedirect = falseFunc, filterCookie, requestFilter = idFunc }: Partial<Options> = {}) => async (req: Request) => {
    let res = await requestFilter(req);
    if (res instanceof Response) {
        return res;
    } else if (res instanceof Request) {
        req = res;
    }
    const { url } = req;
    let mobile = isMobileUA(url, req);
    const ua = (() => {
        if (typeof mobile === 'string') {
            let _ua = mobile;
            mobile = /Mobile|iphone|Android/i.test(mobile);
            return _ua;
        } else if (mobile) {
            return UA[UAType.MOBILE];
        } else {
            return UA[UAType.PC];
        }
    })();
    req.headers.set('User-Agent', ua);
    req['mobile'] = mobile;

    if (needRedirect(url, req)) {
        req.redirect = 'manual';
        // 先请求一次，探查真实地址
        let result = await fetch(req, req['extendOption'], nodeOptions, true);
        let relocation = result.headers.get('location');
        if (relocation && (relocation !== url)) {
            req.url = relocation;
            req.redirect = 'follow';
        } else {
            return result;
        }
    }
    if (typeof filterCookie === 'function') {
        const cookie = req.headers.get('cookie').toString();
        req.headers.set('cookie', filterCookie(cookie, req));
    }
    return req;
};
