import { Response } from 'node-fetch-custom';
export const trimHeader = (res: Response) => {
    res.headers.delete('content-length');
};