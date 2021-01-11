"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var targetPath = ''; //机器人控制相关的中间件

var Robot = {
  test: function test(req, res, next) {//TODO
  },
  Project: {
    saveProject: function saveProject(req, res) {
      var stateData = path.join(__dirname, '/stateData.json');
      var blocklyData = path.join(__dirname, '/blocklyData.xml'); // let code = path.join(__dirname, '/main.ql');

      var code = targetPath + 'main.ql';
      var msg = [];
      /* fs.writeFile(stateData, JSON.stringify(req.body.stateData), (err) => {
          if (err) {
              return console.log(err)
          }
          msg.push("create stateData stateData.json Success");
      }) */

      /*  fs.writeFile(blocklyData, JSON.stringify(req.body.blocklyData), (err) => {
           if (err) {
               return console.log(err)
           }
           msg.push("create blocklyData blocklyData.xml Success");
       }) */

      fs.writeFile(code, req.body.code, function (err) {
        if (err) {
          return console.log(err);
        }

        msg.push("create code code.qrl Success");
      });
      readFileToArr(targetPath + 'main.ql', function (bpData) {
        fs.writeFile(targetPath + 'bp.json', JSON.stringify(bpData), function (err) {
          if (err) {
            return console.log(err);
          }
        });
        msg.push("create bp.json Success");
        console.log('create bp.json success!');
      });
      res.send({
        code: 200,
        msg: msg
      });
    },
    startProject: function startProject(req, res, projectName) {
      projectName = projectName || 'zjie';
      console.log("is startProject - ".concat(projectName, " ing..."));
      var client = getConnection();
      var sendId = ++incrementId;
      updateCurHttpConn(req, res, sendId, function (dataStr) {
        res.send({
          code: 200,
          msg: dataStr
        });
      });
      client.write("[".concat(sendId, "#System.Login 0]"));
      client.write("[".concat(sendId, "#System.Load ").concat(projectName, "]"));
      client.write("[".concat(sendId, "#System.ModeSwitch 0]"));
      client.write("[".concat(sendId, "#System.Start]"));
      client.write("[".concat(sendId, "#System.Logout]"));
    },
    stopProject: function stopProject(req, res) {
      console.log('is stopProject ing...');
      var client = getConnection();
      var sendId = ++incrementId;
      updateCurHttpConn(req, res, sendId, function (dataStr) {
        res.send({
          code: 200,
          msg: dataStr
        });
      });
      client.write("[".concat(sendId, "#System.Login 0]"));
      client.write("[".concat(sendId, "#System.Abort]"));
      client.write("[".concat(sendId, "#System.Logout]"));
    }
  },
  Net: {
    connect2PrintSocket: function connect2PrintSocket() {
      var client = net.connect({
        port: 2091,
        host: '127.0.0.1'
      }, function () {
        console.log(' Connected');
        console.log(' local= %s:%s', this.localAddress, this.localPort);
        console.log(' remote= %s:%s', this._remoteAddress, this._remoteAddress);
        this.setEncoding('utf8');
        this.on('data', function (data) {
          console.log(" From Server:" + data.toString());

          if (res) {
            //判断返回的状态值
            res.send({
              code: 200,
              data: parseInt(data.substr(5, 1), 10),
              msg: 'getStatus Success'
            }); // this.end();
          }

          if (callback) {
            callback();
          }
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
      });
      return client;
    }
  }
};
var _default = Robot;
exports["default"] = _default;
//# sourceMappingURL=robot.dev.js.map
