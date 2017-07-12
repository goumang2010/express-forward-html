import { Handler } from '../interface';
const staticHandler: Handler = ({ applyCommonFilter, requestAdapter, responseAdapter, filterStatic }) => async (req, res, next) => {
    const finalReq = requestAdapter(req);
    const result = await applyCommonFilter(finalReq);
    responseAdapter(result, res);
    if (filterStatic) {
        let text = await result.text();
        res.end(filterStatic ? filterStatic(finalReq.url)(text, finalReq) : text);
    } else {
        result.body.pipe(res);
    }
};

export default staticHandler;
