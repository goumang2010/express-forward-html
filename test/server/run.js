const express = require('express');
const TestServer = require('./index').default;
const forward = require('../../src');
const server = new TestServer();
let router = express.Router()
forward({
    prefix: 'prefixtest'
})(router);
server.app.use('/localtest', router);
server.start();