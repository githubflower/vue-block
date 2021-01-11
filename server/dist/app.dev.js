"use strict";

var devCfg = {
  debugMode: false,
  testPath: './',
  publicPath: '/media/flash/PallasSolutions/qblock_demo/project/',
  targetPath: debugMode ? testPath : publicPath
};
var options = {
  target: 'http://127.0.0.1:80',
  changeOrigin: true
};

var express = require('express');

var path = require('path');

var app = express();

var fs = require('fs');

var readline = require('readline'); // const proxy = require('http-proxy-middleware');


if (devCfg.debugMode) {
  createServer();
}

var bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
})); // app.use(proxy('/service/*', options))

app.use(express["static"](path.join(__dirname, 'www'))); //======================中间件=======================================================
//使用中间件处理权限 TODO   业务逻辑写到各自的中间件里面

var qrlDebugger = require('./Debugger.js');

var robot = require('./robot.js');

var permission = require('./robot.js');

app.use('/service/setting', permission.checkPermission);
app.use('/service/move', [permission.checkPermission, robot.test]); //所有获取数据尽量使用get请求

app.listen(80, function () {
  console.log("App listening at port 80");
});
//# sourceMappingURL=app.dev.js.map
