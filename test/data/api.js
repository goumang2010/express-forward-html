var path = require('path');

function entryPath(_p) {
	return path.join(__dirname,'../../src/', _p);
}

function scriptPath(_p) {
	return path.join(__dirname,'../../build/', _p);
}

module.exports = {
	'project': {
		'uba-sdk': {
			entry: entryPath('app.js'),
			script: scriptPath('ubasdk/build.js')
		}, 
		'sm-gomeplus-pc': {
			entry: 'gomeplusPc',
			script: scriptPath('sitemoniter/build.js')
		}, 
		'sm-gomecom-pc': {
			entry: 'gomecomPc',
			script: scriptPath('sitemoniter/build.js')
		},
		'sm-new-pc': {
			entry: 'newPc',
			script: scriptPath('sitemoniter/build.js')
		},
		'wap': {
			entry: 'gomeWap',
			script: scriptPath('sitemoniter/build.js')
		}
	},
	'fetch': 'https://point-pre.gomeplus.com/bomber-api/sdk/point',
	'report': 'beacon.gomeplus.com/',
	'real-fetch': {
		'pre': 'https://point-pre.gomeplus.com/bomber-api/sdk/point',
		'pro': 'https://point.gomeplus.com/bomber-api/sdk/point'
	},
	'mock-fetch': [
		'http://localhost:8788/api/task/forward',
		'http://localhost:8788/api/task/mock'
	],
	'mock-report': [
		'localhost:8788/api/task/',
		'beacon.gomeplus.com/'
	]
}
