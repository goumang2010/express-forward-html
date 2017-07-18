import { Options } from '../../interface';
import { Response } from 'node-fetch-sp';
import { idFunc } from '../../constants';
import { transformCookie } from './cookie';
import { trimHeader } from './header';
export const combineResponseFilter = ({ responseFilter = idFunc }: Partial<Options> = {}) => async (res: Response) => {
    res = await responseFilter(res);
    transformCookie(res);
    trimHeader(res);
    return res;
};
