import { FwdRequest, Options } from '../../interface';
import { idFunc, falseFunc, UAType, UA } from '../../constants';
import { Request, Response } from 'node-fetch-custom';

export const combineRequestFilter = ({ isMobileUA = falseFunc, requestFilter = idFunc }: Partial<Options> = {}) => async (req: FwdRequest) => {
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
    req.mobile = mobile;
    return req;
};
