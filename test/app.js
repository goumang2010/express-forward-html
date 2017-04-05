
var express = require('express');
// require('babel-register');
// require('babel-polyfill');
// var socketio = require('socket.io');


var middlewareCommon = require('./mid-common');
var app = express();

middlewareCommon(app);
//载入view helps
require('./helpers')(app);


var server = app.listen(global.$g.port, () =>{
	console.log(`the mock server is listen on ${global.$g.port}`);
});
