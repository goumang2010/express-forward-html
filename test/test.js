import chai from 'chai';
import forward from '../src/index.js';
const expect = chai.expect;
import TestServer from './server';
import request from 'supertest';
const local = new TestServer();
// const base = `http://${local.hostname}:${local.port}/`;
const urls = [
    'https://www.gome.com.cn/',
    'https://www.gomeplus.com/'
]
commonTest({ description: 'null option should start normally', urls });
const productionOption = {
    filterHtml(html) {
        return html.replace(/<script[\S]+?uba-sdk[\S]+?<\/script>/, '').replace(/top\.location/g, '{}');
    },
    filterCookie(cookie) {
        return cookie.replace(/DataPlatform.*?=.+?;/gi, '')
    },
    filterStatic(content) {
        return content && content.replace(/\.assign\(([^,]+?)\)/g, '.$assign($1)').replace(/top\.location/g, '{}');
    },
    prefix: '/databp',
    script: function _external(pageUrl, platform, origin, prefix) {
        window.$pageUrl = pageUrl;
        window.$platform = platform;
        window.location.$assign = function(url) {
            let newurl;
            if (/https?:\/\//.test(url)) {
                // do noting
                newurl = url;
            } else {
                newurl = '/databp/html?m=' + platform + '&url=' + encodeURIComponent(pageUrl.replace(/\/$/, '') + '/' + url.replace(/^\//, ''));
            }
            window.location.assign(newurl);
        }
    }
}
commonTest({ description: 'production option should work', urls, option: productionOption});

function commonTest({ description, option, urls }) {
    describe(description, function() {
        this.timeout(15000);
        // empty option
        let app = local.app;
        forward(option)(app);
        it('request /html should be bad request', function(done) {
            request(app)
                .get('/html')
                .expect(function(res) {
                    res.text.includes('html');
                })
                .expect(400, done);
        });
        it('request /ajax should be bad request', function(done) {
            request(app)
                .get('/ajax')
                .expect(function(res) {
                    res.text.includes('ajax');
                })
                .expect(400, done);
        });
        it('request /static should be bad request', function(done) {
            request(app)
                .get('/static')
                .expect(function(res) {
                    res.text.includes('static');
                })
                .expect(400, done);
        });
        it('request local server html', function(done) {
            let url = `/html?url=/statics/index.html`;
            request(app)
                .get(url)
                .expect(200, done);
        });
        for (let url of urls) {
            it(`request ${url}`, function(done) {
                request(app)
                    .get(`/html?url=${encodeURIComponent(url)}`)
                    .expect(200, done);
            });
        }
    });
}
