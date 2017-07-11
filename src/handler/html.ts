import * as urlLib from 'url';
import * as fs from 'fs';
import * as path from 'path';
import { Handler } from '../interface';
const xhrProxy = fs.readFileSync(path.resolve(__dirname, '../script/xhr-proxy.js'), { encoding: 'utf8' }).replace(`'use strict';`, '');

const htmlHandler: Handler = ({ prefix, script, requestAdapter, responseAdapter, applyCommonFilter, filterHtml }) => async (req, res, next) => {
    const finalReq = requestAdapter(req);
    const result = await applyCommonFilter(finalReq);
    const url = finalReq.url;
    const urlObj = { ...urlLib.parse(url), mobile: finalReq['mobile'], UA: finalReq.headers.get('User-Agent'), prefix };
    let proxytext = `<script>(${xhrProxy}(${JSON.stringify(urlObj)}, ${script}))</script>`;
    const rawHtml = await result.text();
    const html = filterHtml ? filterHtml(rawHtml, finalReq) : rawHtml;
    result.headers.has('content-encoding') && result.headers.set('content-encoding', 'plain/text');
    responseAdapter(result, res);
    res.end(
        html.replace('<head>', '<head>' + proxytext)
            .replace(/(href|src)\s*=\s*"\s*((?!http|\/\/|javascript)[^"'\s]+?)\s*"/g, function (m, p1, p2) {
                return `${p1}="${urlLib.resolve(url, p2)}"`;
            })
    );
};

export default htmlHandler;
