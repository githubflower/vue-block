import Util from './util.js'
var QBlock = {
    store: window.store,
    Thread: {

    },
    State: {
        /**
         * 获取状态相对于线程框的坐标信息
         * @param {*} state
         */
        getXY2Canvas(state, threadIndex){
            let threadPos = document.getElementsByClassName("thread")[threadIndex].getBoundingClientRect();
            let statePos = Util.getDomByStateId(state.stateId).getBoundingClientRect();
            return {
                x: statePos.left - threadPos.left,
                y: statePos.top - threadPos.top
            }
        },
        getStateHeight(state){
            return Util.translatePX2Num(state.height);
        },
        getStateWidth(state){
            return Util.translatePX2Num(state.width);
        }
    },
    Line: {
        getStartPoint(line, threadIndex){
            if (
                !line.startPoint ||
                line.startPoint.x === null ||
                typeof line.startPoint.x === "undefined" ||
                isNaN(line.startPoint.x)
            ) {
                let startState = store.getState(threadIndex, line.startState.stateId, false/**isThreadId: false */);
                line.startPoint = {
                    //TODO 需改用getXY2Canvas更准确
                    x: startState.x + Util.translatePX2Num(startState.width),
                    y: startState.y + Util.translatePX2Num(startState.height) / 2,
                };
            }
            return line.startPoint;
        },
        getEndPoint(line, threadIndex) {
            //如果结束点不存在
            if (
                !line.endPoint ||
                line.endPoint.x === null ||
                typeof line.endPoint.x === "undefined" ||
                isNaN(line.endPoint.x)
            ) {
                let endState = store.getState(threadIndex, line.endState.stateId, false/**isThreadId: false */);
                let xy = QBlock.State.getXY2Canvas(endState, threadIndex);
                /* line.endPoint = {
                    //TODO 需改用getXY2Canvas更准确
                    x: endState.x,
                    y: endState.y + Util.translatePX2Num(endState.height) / 2,
                }; */
                line.endPoint = {
                    x: xy.x,
                    y: xy.y + Util.translatePX2Num(endState.height) / 2,
                };
            }
            let endState = store.getState(threadIndex, line.endState.stateId, false/**isThreadId: false */);
            let xy = QBlock.State.getXY2Canvas(endState, threadIndex);
            /* line.endPoint = {
                //TODO 需改用getXY2Canvas更准确
                x: endState.x,
                y: endState.y + Util.translatePX2Num(endState.height) / 2,
            }; */
            line.endPoint = {
                x: xy.x,
                y: xy.y + Util.translatePX2Num(endState.height) / 2,
            };
            return line.endPoint;
        },
    }
}
export default QBlock;