//调试模块相关的中间件
const Debugger = {
    checkPermission(req, res, next) {
        //TODO
    },
    /**
    * 设置断点做3件事情：
    * 1.在project目录下创建断点信息文件bp.txt  文件内容是 filePath,lineNum
    * 2.发送宏指令，运行file.ql
    * 3.建立socket连接，等待调试器端返回信息
    * */
    setBreakpoint(req, res){
        let blockId = req.body.blockId;
        let lineNum = getLineInfo(blockId) + 2;
        createBpInfoFile({
            filePath: targetPath + 'bp.txt',
            bpStr: targetPath + 'main.ql,' + lineNum + '\n'
        });
        res.send({
            code: 200,
            msg: targetPath + 'main.ql,' + lineNum + '\n'
        });
    },
    stopDebugger(req, res) {
        let sendId = ++incrementId;
        console.log('is stopDebugger ing...');
        let cmd = `<${sendId}>debug$done$\n`;
        console.log('stopDebugger : ' + cmd);
        var client = getConnWithQRLDebugger();
        updateCurHttpConn(req, res, sendId, (dataStr) => {
            res.send({
                code: 200,
                msg: dataStr
            });
        });
        // client.write(`[${sendId}#System.Login 0]`);
        client.write(cmd);
        // client.write(`[${sendId}#System.Logout]`);
    },
    /**
     * 创建断点文件
     * @param {*} bpInfo 
     */
    createBpInfoFile(bpInfo) {
        fs.writeFile(bpInfo.filePath, bpInfo.bpStr, (err) => {
            if (err) {
                return console.log(err)
            }
            console.log("创建断点信息文件bp.txt Success");
        })
    },
    step(){
        var client = getConnWithQRLDebugger(req, res);
        let sendId = ++incrementId;
        console.log('/service/step - threadId: ' + threadId + ' - sendId: ' + sendId);
        let cmd = `<${sendId}>debug$step$tcp{client}: ${threadId}$\n`;
        updateCurHttpConn(req, res, sendId, (dataStr) => {
            console.log(dataStr);
            if (dataStr.indexOf('[Debug]:ok;step;') > -1) {
                console.log('---listDebugInfo:(' + sendId + ')');
                listDebugInfo(sendId);
                return;
            }
            if (dataStr.indexOf('[Debug]:ok;listdebugee;')) {
                //保存断点处的信息 包括线程id
                let reg = /\[Debug\]:ok;listdebugee;([0-9a-zA-Z]*).*\|(\d*);(\n)?$/;
                let matchData = reg.exec(dataStr);
                let lineNum = 0;
                if (matchData && matchData[1]) {
                    threadId = matchData && matchData[1];
                    // lineNumStr = matchData[2];
                    lineNum = parseInt(matchData[2], 10) - 2;

                    let bp = fs.readFileSync(targetPath + 'bp.json');
                    bp = JSON.parse(bp);
                    let blockId = bp[String(lineNum)];
                    res.send({
                        code: 200,
                        blockId: blockId,
                        msg: '当前程序停留在id是' + blockId + '的块。'
                    })
                    return;
                }
            }
            res.send({
                code: 200,
                msg: dataStr
            });
        });
        console.log('step命令： ' + cmd);
        client.write(cmd);
    }
};

export default Debugger;