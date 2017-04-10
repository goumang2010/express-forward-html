var ejs = require('ejs');
var path = require('path');
var bodyParser = require('body-parser');
var lactate = require('lactate');
var routers = require('./router/routersIndex');
var connect = require('connect');
var getIPlist = require('./lib').getIPlist;
var forward = require('../src');
let env = process.env.NODE_ENV || 'dev';
//bind to global var
global.$g = global.$g || {};
global.$g.port = require('./package.json').config.port;
global.$g.ips = getIPlist();
global.$g.hosts = global.$g.ips.map(x => `${x}:${global.$g.port}`);
module.exports = function(app) {
    app.engine('html', ejs.renderFile);
    app.set('view engine', 'html');
    // app.use(lactate.static(path.join(__dirname, '../')));
    console.log(path.join(__dirname, 'views/dist'));
    app.use('/static', lactate.static(path.join(__dirname, 'views/dist')));
    app.use(function() {
        var args = arguments;
        var isErr = args[0] instanceof Error;
        if (isErr) {
            args[2].status(500).send(args[0]);
        } else {
            args[2]();
        }
    });
    app.use(bodyParser.json({ limit: '50mb' }));
    //parse application/x-www-form-urlencoded
    app.use(bodyParser.urlencoded({
        limit: '50mb',
        extended: false
    }));
    //parse application/json
    app.use(bodyParser.json());
    forward({
        filterFunc(html) {
            // 移除统计脚本
            return html.replace(/<script[\S]+?uba-sdk[\S]+?<\/script>/, '');
        },
        filterCookie(cookie) {
            return cookie.replace(/DataPlatform.*?=.+?;/gi, '')
        },
        filterJs(js) {
            // 改变关于location的脚本
            return js && js.replace(/\.assign\(([^,]+?)\)/g, '.$assign($1)');
        },
        prefix: '/databp'
    })(app);
    routers.forEach(function(router) {
        app.use(router);
    });
    //return error
    app.use(function(err, req, res, next) {
        console.log(err);
        res.end(JSON.stringify(err));
    });
};
