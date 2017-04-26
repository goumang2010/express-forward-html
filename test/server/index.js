const express = require('express');
const path = require('path');
const fs = require('fs');
const { port } = require('./config');
export default class TestServer {
    constructor($port = port) {
        this.app = express();
        this.app.use(function(req, res, next) {
            res.header('Access-Control-Allow-Credentials', true);
            res.header('Access-Control-Allow-Origin', req.headers.origin);
            res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
            res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
            next();
        });
        this.app.use('/test/html', express.static(path.join(__dirname, '../data/html')));
        this.app.all('/test/ajax/:filename', function(req, res, next) {
            let filename = req.params.filename;
            res.json(require(`../data/ajax/${filename}`));
            next();
        });
        this.port = $port;
        this.hostname = 'localhost';
        this.host = `${this.hostname}:${this.port}`
        this.app.on('error', function(err) {
            console.log(err.stack);
        });
        this.app.on('connection', function(socket) {
            socket.setTimeout(1500);
        });
    }
    start(cb) {
        return this.app.listen(this.port, this.hostname, () => {
            console.log(`Server: ${this.hostname} listened on ${this.port}.`);
            cb && cb.call(this);
        });
    }
    stop(cb) {
        this.app.close(cb);
    }
}
