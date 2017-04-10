'use strict';
const fetch = require('node-fetch-custom');
const fs = require('fs');
const path = require('path');
const xhrProxy = fs.readFileSync(path.resolve(__dirname, './script/xhr-proxy.js'), {
    encoding: 'utf8'
}).replace(`'use strict';`, '');
const utils = require('./utils');
const COOKIE_KEY = 'forward_html';
const emptyFunc = x => x;
const nodeOptions = {
    rejectUnauthorized: false
}
module.exports = function forward({
    prefix = '/__forward',
    filterHtml = emptyFunc,
    filterCookie = emptyFunc,
    filterJs = emptyFunc
} = {}) {
    return function(router) {
        if (router && router.all) {
            router.get(`${prefix}/html`, forwardHtml(prefix, filterHtml));
            router.all(`${prefix}/ajax/*`, forwardAjax(prefix, filterCookie));
            router.get(`${prefix}/js`, forwardJs(prefix, filterCookie, filterJs));
        } else {
            throw new TypeError('The param is not express instance or router!');
        }
    }
}

function forwardHtml(prefix, filterHtml) {
    return function(req, res, next) {
        let url = req.query.url;
        let options = {
            credentials: 'include',
            headers: {
                'Connection': 'keep-alive',
                'Pragma': 'no-cache',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.71 Safari/537.36'
            }
        };
        let platform = req.query.m;
        let mobile = (platform === 'H5' ? true : false);
        if (mobile || (/\/\/m\./.test(url) && !mobile)) {
            if (mobile) {
                options.headers['User-Agent'] = 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1';
            }
            options.redirect = 'manual';
            // 先请求一次，探查真实地址
            fetchProcess().then(function(result) {
                let relocation;
                if ((relocation = result.headers._headers) && (relocation = relocation.location) && (relocation = relocation[0]) && (relocation !== url)) {
                    url = relocation;
                    if (!mobile) {
                        platform = 'PC';
                    }
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
            let rawcookie = result.headers;
            if ((rawcookie = rawcookie._headers) && (rawcookie = rawcookie['set-cookie'])) {
                res.append('Set-Cookie', rawcookie);
            }
            return Promise.resolve(result.text()).then(function(html) {
                return processHtml(html);
            }).catch(err => handleError(err, res));
        }

        function processHtml(html) {
            // const id = Date.now() + Math.floor(Math.random() * 10000);
            let origin = url.replace(/\/[^\/]*?$/, '');
            let host = utils.getHost(origin);
            let time = new Date();
            time.setTime(Date.now() + 86400000);
            res.append('Set-Cookie', `${COOKIE_KEY}=${url};expires=${time.toUTCString()}`);
            // 添加自定义脚本
            let proxytext = `<script>(${xhrProxy}('${url}', '${platform}', '${origin}', '${prefix}'))</script>`;
            res.append('Content-Type', 'text/html; charset=utf-8');
            res.end(filterHtml(html)
                .replace('<head>', '<head>' + proxytext)
                .replace(/(href|src)\s*=\s*"\s*((?!http|\/\/|javascript)[^"\s]+?)\s*"/g, function(m, p1, p2) {
                    if (p2.indexOf('.') === 0) {
                        return `${p1}="${origin}/${p2}"`;
                    } else if (p2.indexOf('/') === 0) {
                        return `${p1}="${host}${p2}"`;
                    } else {
                        return `${p1}="${host}/${p2}"`;
                    }
                })
            );
        }
    }
}

function forwardAjax(prefix, filterCookie) {
    return function(req, res, next) {
        let htmlurl = utils.getCookie(req.headers.cookie, COOKIE_KEY);
        let {
            method,
            url,
            query,
            body,
            headers
        } = req;
        let host = utils.getHost(htmlurl) || url;
        let newurl = url.replace(`${prefix}/ajax`, host);
        headers.origin && (delete headers.origin);
        let newheaders = Object.assign(headers, {
            'cookie': filterCookie(headers.cookie),
            'host': host.replace(/https?:\/\//, ''),
            'referer': encodeURI(htmlurl)
        });
        if (body) {
            for (let key in body) {
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
        }
        let option = {
            method,
            headers: newheaders,
            body,
            credentials: 'include'
        };
        fetch(newurl, option, nodeOptions)
            .then(function(result) {
                return result.text();
            }).then(function(json) {
                res.send(json);
            }).catch(err => handleError(err, res));
    }
}

function forwardJs(prefix, filterCookie, filterJs) {
    return function(req, res, next) {
        let {
            query
        } = req;
        let method = 'get';
        let newurl = query.url;
        let host = newurl.match(/https?:\/\/(.+?)\//)[1];
        let newheaders = {
            host
        }
        fetch(newurl, {
                method,
                headers: newheaders,
                cookie: filterCookie(headers.cookie),
                credentials: 'include'
            }, nodeOptions)
            .then(function(result) {
                return result.text();
            }).then(function(js) {
                res.send(filterJs(js));
            }).catch(err => handleError(err, res));
    }
}

function handleError(e, res) {
    console.log(e);
    res.end(e.toString());
    // next(e);
}
