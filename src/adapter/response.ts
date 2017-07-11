import { ServerResponse } from 'https';
import { Response } from 'node-fetch-custom';

export default (res: Response, nodeRes: ServerResponse) => {
    nodeRes.statusCode = res.status;
    res.headers.forEach((val, name) => {
        nodeRes.setHeader(name, val);
    });
};
