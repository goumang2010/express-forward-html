import { Options } from '../../interface';
import { Response } from 'node-fetch-custom';
import { idFunc } from '../../constants';
import { transformCookie } from './cookie';
import { trimHeader } from './header';
export const combineResponseFilter = ({ requestFilter = idFunc }: Partial<Options> = {}) => async (res: Response) => {
    res = await requestFilter(res);
    transformCookie(res);
    trimHeader(res);
    return res;
};
