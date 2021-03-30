const devCfg = {
	debugMode: false,
	testPath: './',
	publicPath: '/media/flash/PallasSolutions/qblock_demo/project/',
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
const WebSocket = require('ws');
const net = require('net');
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
/*const qrlDebugger = require('./Debugger.js');
const robot = require('./robot.js');
const permission = require('./permission.js');
app.use('/service/setting', permission.checkPermission);
app.use('/service/move', [permission.checkPermission, robot.test]);*/

var projectManage = require('./project_manage.js');
const connectPallas2092 = function(){
	net.connect({ port: 2092, host: '192.168.12.249' }, function () {
		console.log(' Connected');
		//console.log(' local= %s:%s', this.localAddress, this.localPort);
		//console.log(' remote= %s:%s', this._remoteAddress, this._remoteAddress);
		this.setEncoding('utf8');
		this.on('data', function (data) {
			console.log(" From Server:" + data.toString());
		});
		this.on('end', function () {
			console.log(' disconnection');
		});
		this.on('error', function (err) {
			console.log('Socket Error:' + JSON.stringify(err));
		});
		this.on('timeout', function () {
			console.log('Socket Timed Out');
		});
		this.on('close', function () {
			console.log('  Closed');
		});
	})
}


app.use('/service/saveProject', projectManage.saveProject);
app.use('/service/loadProject', projectManage.loadProject);
app.use('/service/connectPallas2092', connectPallas2092);

const wss = new WebSocket.Server({ port: 3000 });
let globalWs;


wss.on('connection', ws => {
	globalWs = ws;
	ws.on('message', message => {
		console.log(`${message}`)
	})
	let data = {
		stateId: "state-end",
		runningStatus: "active"
	}
	ws.send(JSON.stringify(data))
	let interval
	/*
	interval = setInterval(() => {
		ws.send("stateId: start-state")
	}, 1000)
	let data1 = {
		stateId: "state-start",
		runningStatus: "warning"
	}
	setTimeout(() => {
		ws.send(JSON.stringify(data1))
	}, 10000);*/
})


//所有获取数据尽量使用get请求

/*
setTimeout(() => {
	globalWs.send(JSON.stringify({stateId: "1231230", runningStatus:"123123"}));
}, 15000);
*/

/*
*/






app.listen(80, () => {
	console.log(`App listening at port 80`)
})