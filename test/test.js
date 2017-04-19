
// test tools
import chai from 'chai';

import forward from '../src/index.js';

// import chaiPromised from 'chai-as-promised';
// import chaiIterator from 'chai-iterator';
// import chaiString from 'chai-string';
// chai.use(chaiPromised);
// chai.use(chaiIterator);
// chai.use(chaiString);
const expect = chai.expect;

import TestServer from './server';
import request from 'supertest';

const local = new TestServer();
const base = `http://${local.hostname}:${local.port}/`;
let url, opts;


describe('null option should start normally', () => {
	// empty option
	let app = local.server;
	forward()(app);
	it('request /html should be bad request', function(done) {
		request(app)
		.get('/html')
		.expect(400, done);
	});

	it('request /ajax should be bad request', function(done) {
		request(app)
		.get('/ajax')
		.expect(400, done);
	});
	
	it('request /static should be bad request', function(done) {
		request(app)
		.get('/static')
		.expect(400, done);
	});
});
