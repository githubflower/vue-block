import Util from './util.js'
import { lineCfg } from "./graphCfg.js";
const LINE_H = lineCfg.line_h;
const LINE_RADIUS = lineCfg.line_radius;
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
        getStateHeightByStateId(threadIndex, stateId){
            let state = store.getState(threadIndex, stateId, false);
            return Util.translatePX2Num(state.height);
        },
        getStateWidth(state){
            return Util.translatePX2Num(state.width);
        }
    },
    Line: {
        getStartPoint(line, threadIndex){
            /* if (
                !line.startPoint ||
                line.startPoint.x === null ||
                typeof line.startPoint.x === "undefined" ||
                isNaN(line.startPoint.x)
            ) {
                
            } */
            let startState = store.getState(threadIndex, line.startState.stateId, false/**isThreadId: false */);
            let xy = QBlock.State.getXY2Canvas(startState, threadIndex);
            line.startPoint = {
                x: xy.x + Util.translatePX2Num(startState.width),
                y: xy.y + Util.translatePX2Num(startState.height) / 2,
            };
            return line.startPoint;
        },
        getEndPoint(line, threadIndex) {
            let endState = store.getState(threadIndex, line.endState.stateId, false/**isThreadId: false */);
            let xy = QBlock.State.getXY2Canvas(endState, threadIndex);
            line.endPoint = {
                x: xy.x,
                y: xy.y + Util.translatePX2Num(endState.height) / 2,
            };
            return line.endPoint;
        },
        redrawLine(line, threadIndex){
            this.drawLine(line, line.startState, line.endState, threadIndex);
        },
        drawLine(line, startState, endState, threadIndex) {
            let tempRadius = LINE_RADIUS;
            let startPoint, endPoint, stateHeight, linepath;
            startPoint = QBlock.Line.getStartPoint(line, threadIndex);
            endPoint = QBlock.Line.getEndPoint(line, threadIndex);
            stateHeight = Math.max(
                QBlock.State.getStateHeightByStateId(threadIndex, startState.stateId) / 2,
                QBlock.State.getStateHeightByStateId(threadIndex, endState.stateId) / 2
            );

            // y坐标相同，绘制直线
            if (
                endPoint.x > startPoint.x + LINE_H + LINE_RADIUS &&
                endPoint.y == startPoint.y
            ) {
                linepath = this.drawStraightConnectLine(
                    startPoint,
                    endPoint,
                    LINE_RADIUS
                );
                line.endPoint = endPoint;
                line.d = linepath;
                return line;
            }

            // 当结束点的x坐标小于起始点且y坐标相等时或小于起始点时
            else if (
                (endPoint.x - LINE_H - LINE_RADIUS < startPoint.x &&
                    endPoint.y < startPoint.y) ||
                (endPoint.x < startPoint.x && endPoint.y == startPoint.y)
            ) {
                linepath = this.drawUpperBackConnectLine(
                    startPoint,
                    endPoint,
                    LINE_RADIUS,
                    stateHeight
                );
                line.endPoint = endPoint;
                line.d = linepath;
                return line;
            }
            // 当结束点的x坐标小于起始点时且y坐标大于起始点时
            else if (
                endPoint.x - LINE_H - LINE_RADIUS < startPoint.x &&
                endPoint.y > startPoint.y
            ) {
                linepath = this.drawLowerBackConnectLine(
                    startPoint,
                    endPoint,
                    LINE_RADIUS,
                    stateHeight
                );
                line.endPoint = endPoint;
                line.d = linepath;
                return line;
            }

            // 当结束点的x, y坐标均大于起始点的时候
            else if (
                endPoint.x > startPoint.x + LINE_H + LINE_RADIUS &&
                endPoint.y > startPoint.y
            ) {
                // 当结束点与起始点的y坐标差距小于两个拐角半径时，根据结束点和起始点的y坐标的差动态决定拐角半径
                if (endPoint.y - startPoint.y < 2 * tempRadius) {
                    let doubleRadius = endPoint.y - startPoint.y;
                    tempRadius = doubleRadius / 2;
                    linepath = this.drawLowerConnectLine(
                        startPoint,
                        endPoint,
                        tempRadius
                    );
                    line.endPoint = endPoint;
                    line.d = linepath;
                    return line;
                } else {
                    linepath = this.drawLowerConnectLine(
                        startPoint,
                        endPoint,
                        LINE_RADIUS
                    );
                    line.endPoint = endPoint;
                    line.d = linepath;
                    return line;
                }
            }
            //当结束点的x坐标大于起始点，y坐标小于起始点时
            else if (
                endPoint.x > startPoint.x + LINE_H + LINE_RADIUS &&
                endPoint.y < startPoint.y
            ) {
                // 当结束点与起始点的y坐标差距小于两个拐角半径时，根据结束点和起始点的y坐标的差动态决定拐角半径
                if (startPoint.y - endPoint.y < 2 * tempRadius) {
                    let doubleRadius = startPoint.y - endPoint.y;
                    tempRadius = doubleRadius / 2;
                    (linepath = this.drawUpperConnectLine(
                        startPoint,
                        endPoint,
                        tempRadius
                    )),
                        (line.endPoint = endPoint);
                    line.d = linepath;
                    return line;
                } else {
                    (linepath = this.drawUpperConnectLine(
                        startPoint,
                        endPoint,
                        LINE_RADIUS
                    )),
                        (line.endPoint = endPoint);
                    line.d = linepath;
                    return line;
                }
            }
        },
    }
}
export default QBlock;