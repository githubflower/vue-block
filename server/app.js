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

var projectManage = require('./project_manage.js');

app.use('/service/saveProject', projectManage.saveProject);
app.use('/service/newProject', projectManage.newProject);


const wss = new WebSocket.Server({ port: 3000 });
let globalWs;


wss.on('connection', ws => {
	globalWs = ws;
	ws.on('message', message => {
		console.log(`${message}`)
	})
})

const connectPallas2092 = function () {
	let dataReg = />#QBLOCK#([\s\S]*?)</
	net.connect({ port: 2092, host: '192.168.12.249' }, function () {
		console.log(' Connected');
		this.setEncoding('utf8');
		let sendingData = {
			stateId: "",
			runningStatus: "",
			threadId: ""
		}
		this.on('data', function (data) {
			console.log(" From Server:" + data);
			if (data.match(dataReg)) {
				let filteredData = data.match(dataReg)[1].replace("\t", " ").split(" ")
				let filteredThreadId = filteredData[0]
				let filteredId = filteredData[1]
				let filterRunningStatus = filteredData[2]
				if (filteredId[0] !== "/" && filterRunningStatus) {
					console.log(filteredId, filterRunningStatus)
					sendingData.stateId = filteredId
					sendingData.runningStatus = filterRunningStatus
					sendingData.threadId = filteredThreadId
					globalWs.send(JSON.stringify(sendingData))
				}
			} else {
				sendingData.stateId = ""
				sendingData.runningStatus = ""
				sendingData.threadId = ""
				globalWs.send(JSON.stringify(sendingData))
			}
			//console.log(" filtered data:", filteredData)
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
app.use('/service/connectPallas2092', connectPallas2092);
//所有获取数据尽量使用get请求

app.listen(80, () => {
	console.log(`App listening at port 80`)
})