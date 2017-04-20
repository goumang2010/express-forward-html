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
commonTest({description:'null option should start normally', urls})
function commonTest({description, option, urls}) {
    describe(description, () => {
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
        for(let url of urls) {
            it(`request ${url}`, function(done) {
                request(app)
                    .get(`/html?url=${encodeURIComponent(url)}`)
                    .expect(200, done);
            });
        }
    });
}
