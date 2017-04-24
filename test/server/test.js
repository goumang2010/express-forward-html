import chai from 'chai';
import forward from '../../src/index.js';
import TestServer from './index';
import request from 'supertest';
import urls from '../data/urls';
import productionOption from '../data/prod.config';
const expect = chai.expect;
const local = new TestServer();
commonTest({ description: 'null option should start normally', urls });
commonTest({ description: 'production option should work', urls, option: productionOption });

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
