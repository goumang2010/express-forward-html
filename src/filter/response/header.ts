import { Response } from 'node-fetch-sp';
export const trimHeader = (res: Response) => {
    res.headers.delete('content-length');
};