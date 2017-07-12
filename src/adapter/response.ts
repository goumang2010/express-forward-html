import { ResponseAdapter } from '../interface';

const responseAdapter: ResponseAdapter = (res, nodeRes) => {
    nodeRes.statusCode = res.status;
    const headers = res.headers['raw']();
    Object.keys(headers).forEach(key => {
        nodeRes.setHeader(key, headers[key]);
    });
};

export default responseAdapter;
