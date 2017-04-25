var path = require('path');
var fs = require('fs');
var babel = require('rollup-plugin-babel');
var commonjs = require('rollup-plugin-commonjs');
var nodeResolve = require('rollup-plugin-node-resolve');

var config = {
    entry: path.join(__dirname, '../src/js/index.js'),
    plugins: [
        commonjs({
            include: 'node_modules/**',
            extensions: [
                '.js'
            ]
        }),
        nodeResolve({
            browser: true
        }),
        babel({
            babelrc: false,
            presets: [
                ["latest", {
                    "es2015": {
                        "modules": false
                    }
                }]
            ],
            ignore: [
                "dist/*.js",
                "*.min.js"
            ]
        })
    ]
};
var distDir = path.join(__dirname, '../statics/js');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
}
module.exports = Object.assign({
    format: 'umd',
    moduleName: 'customModule',
    dest: path.join(distDir, 'index.js')
}, config);
