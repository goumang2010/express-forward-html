'use strict';
const fetch = require('node-fetch-custom');
const fs = require('fs');
const urlLib = require('url');
const path = require('path');
const xhrProxy = fs.readFileSync(path.resolve(__dirname, './script/xhr-proxy.js'), { encoding: 'utf8' }).replace(`'use strict';`, '');
const utils = require('./utils');
const COOKIE_KEY = 'forward_html';
const MOBILE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1';
const PC_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.71 Safari/537.36';
const emptyFunc = x => x;
const nodeOptions = {
    rejectUnauthorized: false
}
module.exports = function forward({
    prefix = '',
    isMobileUA = () => false,
    needRedirect = () => false,
    filterHtml = emptyFunc,
    filterCookie = emptyFunc,
    filterStatic = emptyFunc,
    script = () => {}
} = {}) {
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
    const opts = { prefix, isMobileUA, needRedirect, filterHtml, filterCookie, filterStatic, script };
    return function(router) {
        if (router && router.all) {
            router.get(`${prefix}/html`, forwardHtml(opts));
            router.all(`${prefix}/ajax`, forwardAjax(opts));
            router.get(`${prefix}/static`, forwardStatic(opts));
        } else {
            throw new TypeError('The param is not express instance or router!');
        }
    }
}

function forwardHtml({ prefix, script, isMobileUA, needRedirect, filterHtml }) {
    return function(req, res, next) {
        let url = req.query.url;
        
        if (!url) {
            res.status(400).end(`You must specify an url to forward html!`);
            return;
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
            let rawcookie = result.headers.get('set-cookie');
            if (rawcookie) {
                res.append('Set-Cookie', rawcookie);
            }
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
            res.append('Set-Cookie', `${COOKIE_KEY}=${url};expires=${time.toUTCString()}`);
            // 添加自定义脚本
            Object.assign(urlObj, { mobile, UA, prefix, serverUrlObj});
            let proxytext = `<script>(${xhrProxy}(${JSON.stringify(urlObj)}, ${script}))</script>`;
            res.append('Content-Type', 'text/html; charset=utf-8');
            res.end(filterHtml(html, req)
                .replace('<head>', '<head>' + proxytext)
                .replace(/(href|src)\s*=\s*"\s*((?!http|\/\/|javascript)[^"'\s]+?)\s*"/g, function(m, p1, p2) {
                    return `${p1}="${urlLib.resolve(url, p2)}"`;
                })
            );
        }
    }
}

function forwardAjax({ prefix, filterCookie }) {
    return function(req, res, next) {
        let {
            method,
            query,
            body,
            headers
        } = req;
        let {url, referer} = query;
        if (url && referer) {
            url = urlLib.resolve(referer, url);
        } else {
            res.status(400).end(`Can not forward null ajax request, HTML url: ${referer||'null'}, XHR url: ${url}`);
            return;
        }
        let referObj =  urlLib.parse(referer);
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
        fetch(url, option, nodeOptions)
            .then(function(result) {
                res.status(result.status);
                return result.text();
            }).then(function(json) {
                res.send(json);
            }).catch(err => handleError(err, res));
    }
}

function forwardStatic({ prefix, filterCookie, filterStatic }) {
    return function(req, res, next) {
        let {
            query,
            headers
        } = req;
        let method = 'get';
        let url = query.url;
        if (!url) {
            res.status(400).end(`You must specify an url param for ajax static request!`);
            return;
        }
        let host = url.match(/https?:\/\/(.+?)\//)[1];
        let newheaders = {
            host
        }
        fetch(url, {
                method,
                headers: newheaders,
                cookie: filterCookie(headers.cookie || '', req),
                credentials: 'include'
            }, nodeOptions)
            .then(function(result) {
                res.status(result.status);
                return result.text();
            }).then(function(js) {
                res.send(filterStatic(js, req));
            }).catch(err => handleError(err, res));
    }
}

function handleError(e, res) {
    console.log(e);
    res.status(500).end(`Error happend: ${e.toString()}`);
}
