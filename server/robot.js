const targetPath = '';
//机器人控制相关的中间件
const Robot = {
    test(req, res, next) {
        //TODO
    },

    Project: {
        saveProject(req, res){
            let stateData = path.join(__dirname, '/stateData.json');
            let blocklyData = path.join(__dirname, '/blocklyData.xml');
            // let code = path.join(__dirname, '/main.ql');
            let code = targetPath + 'main.ql';
            let msg = [];
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

            fs.writeFile(code, req.body.code, (err) => {
                if (err) {
                    return console.log(err)
                }
                msg.push("create code code.qrl Success");
            })
            readFileToArr(targetPath + 'main.ql', (bpData) => {
                fs.writeFile(targetPath + 'bp.json', JSON.stringify(bpData), err => {
                    if (err) {
                        return console.log(err);
                    }
                });
                msg.push("create bp.json Success");
                console.log('create bp.json success!');
            })

            res.send({
                code: 200,
                msg: msg
            });
        },
        startProject(req, res, projectName){
            projectName = projectName || 'qblock_demo';
            console.log(`is startProject - ${projectName} ing...`);
            var client = getConnection();
            let sendId = ++incrementId;
            updateCurHttpConn(req, res, sendId, (dataStr) => {
                res.send({
                    code: 200,
                    msg: dataStr
                });
            });
            client.write(`[${sendId}#System.Login 0]`);
            client.write(`[${sendId}#System.Load ${projectName}]`);
            client.write(`[${sendId}#System.ModeSwitch 0]`);
            client.write(`[${sendId}#System.Start]`);
            client.write(`[${sendId}#System.Logout]`);
        },

        stopProject(req, res) {
            console.log('is stopProject ing...');
            var client = getConnection();
            let sendId = ++incrementId;
            updateCurHttpConn(req, res, sendId, (dataStr) => {
                res.send({
                    code: 200,
                    msg: dataStr
                });
            });
            client.write(`[${sendId}#System.Login 0]`);
            client.write(`[${sendId}#System.Abort]`);
            client.write(`[${sendId}#System.Logout]`);
        }
    },

    Net: {
        connect2PrintSocket(){
            var client = net.connect({ port: 2091, host: '127.0.0.1' }, function () {
                console.log(' Connected');
                console.log(' local= %s:%s', this.localAddress, this.localPort);
                console.log(' remote= %s:%s', this._remoteAddress, this._remoteAddress);
                this.setEncoding('utf8');
                this.on('data', function (data) {
                    console.log(" From Server:" + data.toString());
                    if (res) {//判断返回的状态值
                        res.send({
                            code: 200,
                            data: parseInt(data.substr(5, 1), 10),
                            msg: 'getStatus Success'
                        });
                        // this.end();
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
            })
            return client;
        }
    }
};

module.exports = Robot