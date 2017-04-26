require('babel-register');
const TestServer = require('../server').default;
const express = require('express');
const socketio = require('socket.io');
const path = require('path');
const fs = require('fs');
const port = 8799
const local = new TestServer(port);
const app = local.app;
app.use('/statics', express.static(path.join(__dirname, './statics')));
app.use('/src', express.static(path.join(__dirname, './src')));
const forward = require('../../src');
const router = express.Router();
let indexPath = path.join(__dirname, './index.html');
router.get('/', function(req, res, next) {
    res.sendFile(indexPath);
});
forward()(router);
app.use('/', router);
const server = local.start(() => {
    var launchers = require('karma-chrome-launcher');
    var ChromeBrowser = launchers['launcher:Chrome'][1];
    var platform = require('os').platform();
    var launcher = new ChromeBrowser(x=>x, {});
    var cmd = launcher.DEFAULT_CMD[platform];
    var execSync = require('child_process').execSync;
    execSync(`"${cmd}" http://${local.host}`);
});
var urlpath = path.join(__dirname, '../data/', 'urls.json');
fs.existsSync(urlpath) || (urlpath = path.join(__dirname, '../data/', 'urls.default.json'));
//WebSocket
let io = socketio.listen(server).on('connection', function(client) {
    let id = client.id;
    if (!app.locals.commonid) {
        app.locals.commonid = id;
    }
    console.log(`websocket client connected: ${id}`);
    client.on('disconnect', function() {
        console.log(`websocket client disconnected: ${id}`);
        if (app.locals.commonid === id) {
            app.locals.commonid = null;
        }
    });
    let urls = JSON.parse(fs.readFileSync(urlpath, 'utf8'));
    io.emit('urls', urls);
    client.on('addurl', function(url) {
        let urls = JSON.parse(fs.readFileSync(urlpath, 'utf8'));
        if (urls.indexOf(url) === -1) {
            urls.push(url);
            fs.writeFile(urlpath, JSON.stringify(urls), function(err) {
                if (err) {
                    console.log(err);
                }
                io.emit('url', url);
            });
        }
    });
});
