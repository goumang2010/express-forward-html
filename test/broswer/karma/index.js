require('babel-register');
require('babel-polyfill');
module.exports = function(config) {
    const TestServer = require('../../server').default;
    const testServer = new TestServer();
    const forward = require('../../../src/index.js');
    const prodOption = require('../../data/prod.config').default;
    forward(prodOption)(testServer.app);
    testServer.start();
    require('./karma.conf')(config);
}
