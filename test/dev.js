var os = require('os');
var path = require('path');
var net = require('net');
var platform = os.platform();
var {
    exec,
    execSync,
    spawn
} = require('child_process');
const stream = require('stream');

let binfolder = path.join(__dirname, '../../node_modules/.bin/');
let localbin = path.join(__dirname, './node_modules/.bin/');
let webapp = __dirname;
let rollupconfig = path.join(__dirname, 'views/src/js/build/config.js');
let csssrc = path.join(__dirname, 'views/src/css/');
let cssdist = path.join(__dirname, 'views/dist/css/');

let rollupwatch = `${binfolder}rollup -w -m -c ${rollupconfig}`;

let cssbuild = `${localbin}node-sass ${csssrc} -o ${cssdist}`;

// 注意sass watch时并不会先编译一遍
let csswatch = `${localbin}node-sass ${csssrc} -o ${cssdist} -w -r ${csssrc}`;



let port = require(path.join(webapp, './package.json')).config.port;
let host = 'localhost';

function buildStream(note) {
    var customStream = new stream.Writable();
    customStream._write = function (data, ...argv) {
        console.log(`----------${note} info start----------`);
        process.stderr._write(data, ...argv);
        console.log(`----------${note} end----------`);
    };
    return customStream;
}


function startServer(servercmd, clientcmd) {
    // wait rollup and css building
    setTimeout(function() {
        // 检查服务器是否启动
        let startServer = true;
        let timer;
        let socket = net.createConnection(port, host, function() {
            clearTimeout(timer);
            // 已经启动
            console.log('server is running already!');
            socket.end();
        });

        timer = setTimeout(function() {
            spawn(servercmd, {
                shell: true,
                stdio: "inherit"
            });
            socket.end();
        }, 10000);

        socket.on('error', function(err) {
            clearTimeout(timer);
            spawn(servercmd, {
                shell: true,
                stdio: "inherit"
            });
        });
    }, 3000);


    console.log('waiting for http server...');
    setTimeout(function() {
        execSync(clientcmd);
        exec('start cmd.exe /K "echo this terminal is for git"')
            // console.log('this terminal is for git');
            // process.exit();
    }, 10000);
}


let servercmd;
let clientcmd;


let sass = spawn(`${localbin}cross-env NODE_ENV=dev ${cssbuild} &&${localbin}cross-env NODE_ENV=dev ${csswatch}`, {
    shell:true, stdio: [process.stdin, process.stdout, 'pipe']
});




let rollupStream = buildStream('rollup');

let rollupChild = spawn(`${localbin}cross-env NODE_ENV=dev ${rollupwatch}`, {
            shell:true, stdio: [process.stdin, process.stdout, 'pipe']
        });
rollupChild.stderr.pipe(rollupStream);



let sassStream = buildStream('sass');
let sassChild = spawn(`${localbin}cross-env NODE_ENV=dev ${cssbuild} &&${localbin}cross-env NODE_ENV=dev ${csswatch}`, {
            shell:true, stdio: [process.stdin, process.stdout, 'pipe']
        });
sassChild.stderr.pipe(sassStream);


servercmd = `${localbin}nodemon --inspect ${path.join(webapp ,'./app.js')}`;
switch (platform) {
    case 'darwin':
        clientcmd = `http://${host}:${port}`
        break;
    case 'linux':
        clientcmd = `http://${host}:${port}`
        break;
    case 'win32':

        clientcmd = `start http://${host}:${port}`
        break;
    default:
        throw new Error('Unsupported platform: ' + os.platform());
}


startServer(servercmd, clientcmd);