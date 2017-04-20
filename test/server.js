const express = require('express');
const path = require('path');
const fs = require('fs');



export default class TestServer {
	constructor() {
		this.app = express();
		this.app.use('/statics', express.static(path.join(__dirname, './statics')));
		this.port = 30001;
		this.hostname = 'localhost';
		this.app.on('error', function(err) {
			console.log(err.stack);
		});
		this.app.on('connection', function(socket) {
			socket.setTimeout(1500);
		});
	}

	start(cb) {
		this.app.listen(this.port, this.hostname, cb);
	}

	stop(cb) {
		this.app.close(cb);
	}
}
