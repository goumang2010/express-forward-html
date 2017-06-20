'use strict';
const R = require('ramda');
const fetch = require('node-fetch-custom');
const fs = require('fs');
const urlLib = require('url');
const path = require('path');
const xhrProxy = fs.readFileSync(path.resolve(__dirname, './script/xhr-proxy.js'), { encoding: 'utf8' }).replace(`'use strict';`, '');
const utils = require('./utils');
const http = require('http');
const https = require('https');
// const COOKIE_KEY = 'forward_html';
const MOBILE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1';
const PC_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.71 Safari/537.36';
const idFunc = x => x;
const emptyFunc = idFunc
const falseFunc = () => false;
const nodeOptions = {
    rejectUnauthorized: false
}
// copy from node-fetch
class ForwardError extends Error {
    constructor(message, statusCode, systemError) {
        super(message);
        this.message = message;
        this.statusCode = statusCode;
        // when err.type is `system`, err.code contains system error code
        if (systemError) {
            this.code = this.errno = systemError.code;
        }
        // hide custom error implementation details from end-users
        Error.captureStackTrace(this, this.constructor);
    }
}
const handleError = (e, req, res, next) => {
    if (process.env.NODE_ENV !== 'production') {
        throw e;
    }
    console.error(e);
    res.status(e.statusCode || 500).end(`Error happend: ${e.toString()}`);
}
const _filterResCookie = str => str.split(/;\s?/).filter(x => !/^\s*domain/i.test(x)).join(';');
const trimResponseCookie = (headers, cookie = headers.get('set-cookie')) =>
    (cookie && cookie.split(/,\s?/).map(x => _filterResCookie(x)));
const appendResponseCookie = (headers, res) => {
    let cookie = trimResponseCookie(headers);
    cookie && res.append('Set-Cookie', cookie);
}
const forwardHtml = ({ prefix, script, isMobileUA, needRedirect, filterHtml }) => (req, res, next) => {
    let url = req.query.url;
    if (!url) {
        throw (new ForwardError(`You must specify an url to forward html!`, 400));
    }
    // support local url
    let serverHost;
    if (req.headers.host) {
        serverHost = `${req.protocol}://${req.headers.host}`;
        url = urlLib.resolve(`${serverHost}`, url);
    }
    let options = {
        credentials: 'include',
        headers: {
            'Connection': 'keep-alive',
            'Pragma': 'no-cache'
        }
    };
    let mobile = isMobileUA(url, req);
    let UA;
    if (typeof mobile === 'string') {
        UA = mobile;
        mobile = /Mobile|iphone|Android/i.test(mobile);
    } else if (mobile) {
        UA = MOBILE_UA;
    } else {
        UA = PC_UA;
    }
    options.headers['User-Agent'] = UA;
    if (needRedirect(url, req)) {
        options.redirect = 'manual';
        // 先请求一次，探查真实地址
        fetchProcess().then(function(result) {
            let relocation = result.headers.get('location');
            if (relocation && (relocation !== url)) {
                url = relocation;
                options.redirect = 'follow';
                fetchProcess().then((result) => postProcess(result))
            } else {
                postProcess(result);
            }
        });
    } else {
        fetchProcess().then((result) => postProcess(result))
    }

    function fetchProcess() {
        return fetch(encodeURI(url), options, nodeOptions);
    }

    function postProcess(result) {
        res.status(result.status);
        appendResponseCookie(result.headers, res)
        return Promise.resolve(result.text()).then(function(html) {
            return processHtml(html);
        }).catch(err => handleError(err, res));
    }

    function processHtml(html) {
        // const id = Date.now() + Math.floor(Math.random() * 10000);
        let urlObj = urlLib.parse(url);
        let serverUrlObj = urlLib.parse(serverHost + req.originalUrl);
        let origin = url.replace(/\/[^\/]*?$/, '');
        let time = new Date();
        time.setTime(Date.now() + 86400000);
        // res.append('Set-Cookie', `${COOKIE_KEY}=${encodeURIComponent(url)};expires=${time.toUTCString()}`);
        // 添加自定义脚本
        Object.assign(urlObj, { mobile, UA, prefix, serverUrlObj });
        let proxytext = `<script>(${xhrProxy}(${JSON.stringify(urlObj)}, ${script}))</script>`;
        res.append('Content-Type', 'text/html; charset=utf-8');
        res.end(filterHtml(html, urlObj, req)
            .replace('<head>', '<head>' + proxytext)
            .replace(/(href|src)\s*=\s*"\s*((?!http|\/\/|javascript)[^"'\s]+?)\s*"/g, function(m, p1, p2) {
                return `${p1}="${urlLib.resolve(url, p2)}"`;
            })
        );
    }
}
const forwardAjax = ({ prefix, filterCookie }) => async(req, res, next) => {
    let { method, query, body, headers } = req;
    let { url, referer } = query;
    if (url && referer) {
        url = urlLib.resolve(referer, url);
    } else {
        throw (new ForwardError(`Can not forward null ajax request, HTML url: ${referer||'null'}, XHR url: ${url}`, 400));
    }
    let referObj = urlLib.parse(referer);
    // remove
    headers.origin && (delete headers.origin);
    let newheaders = Object.assign(headers, {
        'cookie': filterCookie(headers.cookie || '', req),
        'host': referObj.host,
        'referer': encodeURI(referObj.href)
    });
    const option = {
        method,
        headers: newheaders,
        credentials: 'include'
    };
    // if there is a body-parser
    if (body) {
        let bodykeys = Object.keys(body || {});
        if (body && bodykeys.length) {
            for (let key of bodykeys) {
                let oldval = body[key]
                body[key] = encodeURI(oldval);
            }
            if (newheaders['content-type'] && newheaders['content-type'].indexOf('x-www-form-urlencoded') > -1) {
                let qstr = '';
                for (let key in body) {
                    qstr += `${key}=${body[key]}&`
                }
                body = qstr.slice(0, -1);
            } else {
                body = JSON.stringify(body);
            }
            option.body = body;
        }
    } else if (!/get|head/i.test(method)) {
        // use req stream
        option.body = req;
    }
    let resObj = await fetch(url, option, nodeOptions, true);
    let resheaders = resObj.headers;
    appendResponseCookie(resheaders, res);
    resheaders.delete('Set-Cookie');
    let rawheaders = resheaders.raw();
    Object.keys(rawheaders).forEach((x) => {
        if (rawheaders[x]) {
            rawheaders[x] = rawheaders[x].toString();
        }
    })
    res.set(rawheaders);
    resObj.body.pipe(res);
}
const forwardStatic = ({ prefix, filterCookie, filterStatic }) => async(req, res, next) => {
    let { query, headers } = req;
    let method = 'get';
    let url = query.url;
    if (!url) {
        throw (new ForwardError(`You must specify an url param for ajax static request!`, 400));
    }
    let host = url.match(/https?:\/\/(.+?)\//)[1];
    const option = {
        method,
        headers: { host },
        cookie: filterCookie(headers.cookie || '', req),
        credentials: 'include'
    }
    if (filterStatic) {
        let result = await fetch(url, option, nodeOptions);
        res.status(result.status);
        let text = await result.text();
        res.send(filterStatic(text));
    } else {
        let resObj = await fetch(url, option, nodeOptions, true);
        resObj.body.pipe(res);
    }
}
const buildOptions = ({
    prefix = '',
    isMobileUA = falseFunc,
    needRedirect = falseFunc,
    filterHtml = idFunc,
    filterCookie = idFunc,
    filterStatic,
    script = () => {}
} = {}) => {
    if (script) {
        let scriptType = typeof script;
        if (scriptType === 'function') {
            script = Function.prototype.toString.call(script);
        } else if (scriptType !== 'string') {
            throw new TypeError('The param script must be function or string!');
        }
    } else {
        script = '';
    }
    prefix !== '' && (prefix.startsWith('/') || (prefix = '/' + prefix));
    return { prefix, isMobileUA, needRedirect, filterHtml, filterCookie, filterStatic, script }
}
const wrapAsyncError = (fn) => (req, res, next) => {
    const routePromise = fn(req, res, next);
    if (routePromise && routePromise.catch) {
        routePromise.catch(err => next(err));
    }
}
const registerRouter = R.curry((opts, router) => {
    let prefix = opts.prefix;
    if (router && router.all) {
        router.get(`${prefix}/html`, wrapAsyncError(forwardHtml(opts)));
        router.all(`${prefix}/ajax`, wrapAsyncError(forwardAjax(opts)));
        router.get(`${prefix}/static`, wrapAsyncError(forwardStatic(opts)));
        router.use(handleError);
    } else {
        throw new TypeError('The param is not express instance or router!');
    }
    return router
});
module.exports = R.compose(registerRouter, buildOptions);
