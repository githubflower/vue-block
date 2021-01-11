const devCfg = {
	debugMode: false,
	testPath: './',
	publicPath: '/media/flash/PallasSolutions/qblock_demo/project/',
	targetPath: debugMode ? testPath : publicPath,
};

const options = {
	target: 'http://127.0.0.1:80',
	changeOrigin: true
}

const express = require('express')
const path = require('path')
const app = express()
const fs = require('fs');
const readline = require('readline');
// const proxy = require('http-proxy-middleware');

if (devCfg.debugMode) {
	createServer();
}


var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));
// app.use(proxy('/service/*', options))

app.use(express.static(path.join(__dirname, 'www')))

//======================中间件=======================================================
//使用中间件处理权限 TODO   业务逻辑写到各自的中间件里面
const qrlDebugger = require('./Debugger.js');
const robot = require('./robot.js');
const permission = require('./robot.js');
app.use('/service/setting', permission.checkPermission);
app.use('/service/move', [permission.checkPermission, robot.test]);







//所有获取数据尽量使用get请求

app.listen(80, () => {
	console.log(`App listening at port 80`)
})