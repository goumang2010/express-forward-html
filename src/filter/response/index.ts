import { Options } from '../../interface';
import { Response } from 'node-fetch-custom';
import { idFunc } from '../../constants';
import { transformCookie } from './cookie';
export const combineResponseFilter = ({ requestFilter = idFunc }: Partial<Options> = {}) => async (res: Response) => {
    res = await requestFilter(res);
    transformCookie(res);
    return res;
};
