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
         * 获取状态相对于线程框的坐标信息  此方法依赖状态组件的dom，不推荐使用
         * @param {*} state
         */
        getXY2CanvasWithStateRendered(state, threadIndex) {
            let threadPos = document.getElementsByClassName("thread")[threadIndex].getBoundingClientRect();
            let statePos = Util.getDomByStateId(state.stateId).getBoundingClientRect();
            return {
                x: statePos.left - threadPos.left,
                y: statePos.top - threadPos.top
            }
        },
        /**
         * 根据状态及其父状态信息计算出相对于线程框的绝对位置  不依赖dom
         * @param {*} state 
         * @param {*} threadIndex 
         */
        getXY2Canvas(state, threadIndex){
            let xy = {
                x: state.x,
                y: state.y
            };
            if(state.parent){
                let parent = store.getState(threadIndex, state.parent, false/**isThreadId: false */);
                let parentXY = this.getXY2Canvas(parent, threadIndex);
                xy.x += parentXY.x;
                xy.y += parentXY.y;
            }
            return xy;
        },
        getStateHeight(state) {
            return Util.translatePX2Num(state.height);
        },
        getStateHeightByStateId(threadIndex, stateId) {
            let state = store.getState(threadIndex, stateId, false);
            return Util.translatePX2Num(state.height);
        },
        getStateWidth(state) {
            return Util.translatePX2Num(state.width);
        }
    },
    Line: {
        getStartPoint(line, threadIndex) {
            /* if (
                !line.startPoint ||
                line.startPoint.x === null ||
                typeof line.startPoint.x === "undefined" ||
                isNaN(line.startPoint.x)
            ) {
                
            } */
            let startState = store.getState(threadIndex, line.startState.stateId, false/**isThreadId: false */);
            let xy = QBlock.State.getXY2Canvas(startState, threadIndex);
            return {
                x: xy.x + Util.translatePX2Num(startState.width) + 3,
                y: xy.y + Util.translatePX2Num(startState.height) / 2 + lineCfg.threadTitleHeight,
            };
            // return line.startPoint;
        },
        getEndPoint(line, threadIndex) {
            let endState = store.getState(threadIndex, line.endState.stateId, false/**isThreadId: false */);
            let xy = QBlock.State.getXY2Canvas(endState, threadIndex);
            return {
                x: xy.x,
                y: xy.y + Util.translatePX2Num(endState.height) / 2 + lineCfg.threadTitleHeight,
            };
            // return line.endPoint;
        },
        redrawLine(line, threadIndex) {
            this.drawLine(line, line.startState, line.endState, threadIndex);
        },
        drawLine(line, startState, endState, threadIndex) {
            let startPoint, endPoint, stateHeight, linepath;
            startPoint = QBlock.Line.getStartPoint(line, threadIndex);
            endPoint = QBlock.Line.getEndPoint(line, threadIndex);


            let isDynamicRadiusFlag =
                Math.abs(startPoint.y - endPoint.y) < 2 * LINE_RADIUS;
            let path;
            if (endPoint.y === startPoint.y && endPoint.x > startPoint.x) {
                path = this.drawStraightConnectLine(startPoint, endPoint, LINE_RADIUS);
            } else if (startPoint.x > endPoint.x - LINE_H - LINE_RADIUS) {
                path = this.drawLine5ByStateAndPoint(
                    startState,
                    startPoint,
                    endState,
                    endPoint
                );
            } else {
                //若两个状态块之间的y轴距离小于2个预设拐角半径，则需要动态计算连线拐角的半径，并绘制连线
                var radius = LINE_RADIUS;
                if (isDynamicRadiusFlag) {
                    radius = Math.abs(startPoint.y - endPoint.y) / 2;
                }
                path = this.drawLine3ByPoint(startPoint, endPoint, radius);
            }
            console.log('>>> ' + path);
            return path;
        },
    }
}
export default QBlock;