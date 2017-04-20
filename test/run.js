require('babel-register');
const TestServer = require('./server').default;
const forward = require('../src');
const server = new TestServer();
forward()(server.app)
server.start();