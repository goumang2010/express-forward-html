var path = require('path');

module.exports = function(Router) {
	Router.all('/', function(req, res) {
		res.redirect('/index');
	});
	Router.get('/index', function (req, res) {
		res.render(path.resolve(__dirname,'../views/index.html'), {
			title: '配置页面'
		});
	});

	Router.get('/start', function (req, res) {
		res.send({
			msg: '启动成功'
		});
	});

	Router.get('/close', function (req, res) {
		res.send({
			msg: '关闭成功'
		});
	});

	return Router;
}