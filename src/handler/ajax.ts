import { Handler } from '../interface';
const ajaxHandler: Handler = ({ requestAdapter, responseAdapter, applyCommonFilter, filterAjax }) => async (req, res, next) => {
    const { method = 'get', headers } = req;
    let body = req['body'];
    // if there is a body-parser
    if (body) {
        let bodykeys = Object.keys(body || {});
        if (body && bodykeys.length) {
            for (let key of bodykeys) {
                let oldval = body[key];
                body[key] = encodeURI(oldval);
            }
            const contentType = headers['content-type'];
            if (contentType && contentType.indexOf('x-www-form-urlencoded') > -1) {
                body = Object.keys(body).reduce(
                    (pre, key) => {
                        return (pre + `${key}=${body[key]}&`);
                    },
                    '').slice(0, -1);
            } else {
                body = JSON.stringify(body);
            }
            req['body'] = body;
        }
    } else if (!/get|head/i.test(method)) {
        // use req stream
        req['body'] = req;
    }
    const finalReq = requestAdapter(req);
    const result = await applyCommonFilter(finalReq, !!filterAjax);
    if (filterAjax) {
        const text = await result.text();
        result.headers.delete('content-encoding');
        responseAdapter(result, res);
        res.end(filterAjax(text, finalReq));
    } else {
        responseAdapter(result, res);
        result.body.pipe(res);
    }
};

export default ajaxHandler;
