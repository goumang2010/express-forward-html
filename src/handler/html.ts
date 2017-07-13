import * as urlLib from 'url';
import * as querystring from 'querystring';
import * as fs from 'fs';
import * as path from 'path';
import { Handler } from '../interface';
const xhrProxy = fs.readFileSync(path.resolve(__dirname, '../script/xhr-proxy.js'), { encoding: 'utf8' }).replace(`'use strict';`, '');

const htmlHandler: Handler = ({ prefix, script, requestAdapter, responseAdapter, applyCommonFilter, filterHtml }) => async (req, res, next) => {
    let finalReq = requestAdapter(req);
    let url = finalReq.url;

    finalReq.redirect = 'manual';
    // 先请求一次，探查真实地址
    const result = await applyCommonFilter(finalReq);
    let relocation = result.headers.get('location');
    if (relocation && (relocation !== url)) {
        if (finalReq.originalUrlObj) {
            let query = Object.assign({}, finalReq.originalUrlObj.query, { url: relocation });
            finalReq.originalUrlObj.search = '?' + querystring.stringify(query);
            res.writeHead(302, { Location: urlLib.format(finalReq.originalUrlObj) });
            res.end();
            return;
        }
    }
    const serverUrlObj = finalReq.originalUrlObj;
    const urlObj = { ...urlLib.parse(url), mobile: finalReq['mobile'], UA: finalReq.headers.get('User-Agent'), prefix, serverUrlObj };
    let proxytext = `<script>(${xhrProxy}(${JSON.stringify(urlObj)}, ${script}))</script>`;
    const rawHtml = await result.text();
    const html = filterHtml ? filterHtml(url)(rawHtml, finalReq) : rawHtml;
    const parsedHtml = html.replace('<head>', '<head>' + proxytext)
        .replace(/(href|src)\s*=\s*"\s*((?!http|\/\/|javascript)[^"'\s]+?)\s*"/g, function (m, p1, p2) {
            return `${p1}="${urlLib.resolve(url, p2)}"`;
        });
    result.headers.has('content-encoding') && result.headers.set('content-encoding', 'plain/text');
    responseAdapter(result, res);
    res.end(parsedHtml);
};

export default htmlHandler;
