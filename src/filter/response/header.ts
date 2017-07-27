import { Response } from 'node-fetch-sp';
export const trimHeader = (res: Response) => {
    res.headers.delete('content-length');
    res.headers.delete('x-frame-options');
};