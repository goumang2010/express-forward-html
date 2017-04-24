const express = require('express');
const TestServer = require('./index').default;
const forward = require('../../src');
const local = new TestServer();
let router = express.Router()
// forward({
//     prefix: 'prefixtest'
// })(router);
// local.app.use('/localtest', router);
// local.start();

let app = local.app;
forward()(app);
local.start();