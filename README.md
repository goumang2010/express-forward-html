[![Build Status][travis-image]][travis-url]
[![NPM version][npm-image]][npm-url]

# express-forward-html
Use express server to forward html, so that you can get the same origin page. Request it in an iframe, and then dom manipulation of the page is allowed in common broswer without proxy or plugin.

## Installation

```
npm install express-forward-html -S
```

## Usage
use it in express app. example:

```js
var express = require('express');
var app = express();
var forward = require('express-forward-html');

// using body-parser or not is either ok.
// var bodyParser = require('body-parser');

forward({
    // options here
    prefix: '/forward'
// express router instance is available, too.
})(app);

var port = 8888;
app.listen(port, () =>{
    console.log('the mock server is listen on: ' + port);
});

```

then, you can visit other url by : `http://127.0.0.1:8888/forward/html?url=https://github.com`, Note that if the target url includes query params, it must be encoded by `encodeURIComponent`, like: `http://127.0.0.1:8888/forward/html?url=https%3A%2F%2Fgithub.com`

## Configuration

### options
```ts
interface Options {
    prefix: string;
    filterHtml: (html: string, req: Request) => string;
    filterCookie: (cookie: string, req: Request) => string;
    filterStatic: (content: string, req: Request) => string;
    filterAjax: (body: any, req: Request) => string;
    script: string | ((urlObj: CustomURL) => void);
    isMobileUA: (url: string) => boolean | string;
    needRedirect: (url: string, req: Request) => boolean;
}
interface CustomURL extends URL {
    mobile: boolean;
    serverUrlObj: URL;
}
```

An example:
```js
{
    prefix: '', // prefix of route path
    filterHtml: function(html, req) {
        // do something for html content
        // example: remove all script tags
        html = html.replace(/<script[\S]+?<\/script>/g, '');
        return html;
    },
    filterCookie: function(cookie, req) {
        // do something for cookie
        // example: stop website set key 'id' in cookie
        cookie =  cookie.replace(/id.*?=.+?;/gi, '');
        return cookie;
    },
    filterStatic: function(content, req) {
        // do something for content dowloaded by xhr, like: js file
        // example: remove window.top.location in async js script
        content =  content.replace(/top\.location/g, '{}');
        return content;
    },
    // custom script ,it will be injected on the top of head tag
    // you can use string or read from other files, eg:
    // script: 'function(url) {window.$pageUrl=url;}'
    // script: fs.readFileSync(path.join(__dirname, './script.js'), 'utf8')
    script: function(urlObj) {
        window.$pageUrl = urlObj.href;
    }
    // Or isMobileUA: (url) => /[/.](m|wap)\./.test(url) ? H5UA : PCUA;
    // the rule to auto decide if requesting an url with mobile UA. 
    // If it is not set, the default UA will be PC
    isMobileUA: (url) => /[/.](m|wap)\./.test(url),
    // a function decide if redirect is necessary for the url
    needRedirect: function(url, req) {
        let mobile = /[/.](m|wap)\./.test(url);
        let isSpecifedH5 = req.query.m === 'H5';
        return (!isSpecifedH5 && mobile) || (!mobile && isSpecifedH5);
    }
}
```

### broswer request formation

```
http://${localServerAddress}:${localServerPort}/${prefixInOptions}/html?url=${encodedTargetUrl}
```

- localServerAddress: express server address, eg: `localhost`
- localServerPort: express server port listened, eg: `8080`
- prefixInOptions: prefix can be set in options, if not, there will add router(/html, /ajax, /static) in root path
- encodedTargetUrl: the target url you want visit.

[travis-image]: https://img.shields.io/travis/goumang2010/express-forward-html.svg?style=flat-square
[travis-url]: https://travis-ci.org/goumang2010/express-forward-html
[npm-image]: https://img.shields.io/npm/v/express-forward-html.svg?style=flat
[npm-url]: https://npmjs.org/package/express-forward-html

## TODO
- [ ] forward request in root router according to referer.