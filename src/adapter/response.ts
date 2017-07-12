import { ResponseAdapter } from '../interface';

const responseAdapter: ResponseAdapter = (res, nodeRes) => {
    nodeRes.statusCode = res.status;
    res.headers.forEach((val, name) => {
        val.split(/,\s?/).map(v => nodeRes.setHeader(name, v));
    });
};

export default responseAdapter;
