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

	router(req, res) {
		let p = parse(req.url).pathname;

		if (p === '/hello') {
			res.statusCode = 200;
			res.setHeader('Content-Type', 'text/plain');
			res.end('world');
		}

		if (p === '/invalid-content-encoding') {
			res.statusCode = 200;
			res.setHeader('Content-Type', 'text/plain');
			res.setHeader('Content-Encoding', 'gzip');
			res.end('fake gzip string');
		}

		if (p === '/timeout') {
			setTimeout(function() {
				res.statusCode = 200;
				res.setHeader('Content-Type', 'text/plain');
				res.end('text');
			}, 1000);
		}

		if (p === '/slow') {
			res.statusCode = 200;
			res.setHeader('Content-Type', 'text/plain');
			res.write('test');
			setTimeout(function() {
				res.end('test');
			}, 1000);
		}

		if (p === '/cookie') {
			res.statusCode = 200;
			res.setHeader('Set-Cookie', ['a=1', 'b=1']);
			res.end('cookie');
		}


		if (p === '/multipart') {
			res.statusCode = 200;
			res.setHeader('Content-Type', 'application/json');
			const parser = new Multipart(req.headers['content-type']);
			let body = '';
			parser.on('part', function(field, part) {
				body += field + '=' + part;
			});
			parser.on('end', function() {
				res.end(JSON.stringify({
					method: req.method,
					url: req.url,
					headers: req.headers,
					body: body
				}));
			});
			req.pipe(parser);
		}
	}
}

if (require.main === module) {
	const server = new TestServer;
	server.start(() => {
		console.log(`Server started listening at port ${server.port}`);
	});
}
