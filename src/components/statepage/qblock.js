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
    getXY2Canvas(state, threadIndex) {
      let xy = {
        x: state.x,
        y: state.y
      };
      if (state.parent) {
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
    },
    //获取当前状态图内最靠左的状态
    getLeftMostState(threadIndex) {
      let stateAry = store.stateData.threadAry[threadIndex].stateAry;
      let smallestStateX = 1000000;
      let smallestStateXId;
      stateAry.forEach((state) => {
        if (state.x < smallestStateX) {
          smallestStateX = state.x;
          smallestStateXId = state.stateId;
        }
      });
      let leftMostState = store.getState(threadIndex, smallestStateXId);
      return leftMostState;
    },
    //获取当前状态图内最靠上的状态
    getUpMostState(threadIndex) {
      let stateAry = store.stateData.threadAry[threadIndex].stateAry;
      let smallestStateY = 1000000;
      let smallestStateYId;
      stateAry.forEach((state) => {
        if (state.y < smallestStateY) {
          smallestStateY = state.y;
          smallestStateYId = state.stateId;
        }
      });
      let upMostState = store.getState(threadIndex, smallestStateYId);
      return upMostState;
    },
    //获取当前状态图内最靠右的状态
    getRightMostState(threadIndex) {
      let stateAry = store.stateData.threadAry[threadIndex].stateAry;
      let largestStateX = -1000000;
      let largestStateXId;
      stateAry.forEach((state) => {
        if (state.x > largestStateX) {
          largestStateX = state.x;
          largestStateXId = state.stateId;
        }
      });
      let rightMostState = store.getState(threadIndex, largestStateXId);
      return rightMostState;
    },
    //获取当前状态图内最靠下的状态
    getBottomMostState(threadIndex) {
      let stateAry = store.stateData.threadAry[threadIndex].stateAry;
      let largestStateY = -1000000;
      let largestStateYId;
      stateAry.forEach((state) => {
        if (state.y > largestStateY) {
          largestStateY = state.y;
          largestStateYId = state.stateId;
        }
      });
      let bottomMostState = store.getState(threadIndex, largestStateYId);
      return bottomMostState;
    },
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
      if (line.startPointClass === "connect-point in") {
        let data = {
          x: xy.x,
          y: xy.y + Util.translatePX2Num(startState.height) / 2,
        }
        return data
      }
      return {
        x: xy.x + Util.translatePX2Num(startState.width) + 3,
        y: xy.y + Util.translatePX2Num(startState.height) / 2,
      };
      // return line.startPoint;
    },
    getEndPoint(line, threadIndex) {
      let endState = store.getState(threadIndex, line.endState.stateId, false/**isThreadId: false */);
      let startState = store.getState(threadIndex, line.startState.stateId, false)
      let xy = QBlock.State.getXY2Canvas(endState, threadIndex);
      if (line.endPointClass === "connect-point loop") {
        //此时为连线至继续循环的连接点
        return {
          x: xy.x + Util.translatePX2Num(endState.width) - 10,
          y: xy.y + Util.translatePX2Num(endState.height) / 4 + 10
        }
      } else if (line.startPointClass === "connect-point out" && line.endPointClass === "connect-point out") {
        //此时为从循环内状态连线至循环结束的连接点
        return {
          x: xy.x + Util.translatePX2Num(endState.width) + 2,
          y: xy.y + Util.translatePX2Num(endState.height) / 2,
        }
      }
      return {
        x: xy.x,
        y: xy.y + Util.translatePX2Num(endState.height) / 2,
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
    addDefaultLine2State(startState, endState, threadIndex) {
      let startStateXY = QBlock.State.getXY2Canvas(startState, threadIndex)
      let endStateXY = QBlock.State.getXY2Canvas(endState, threadIndex)
      let lineData = {
        d: "",
        startPoint: {
          x: startStateXY.x + Util.translatePX2Num(startState.width),
          y: startStateXY.y + Util.translatePX2Num(startState.height) / 2,
        },
        endPoint: {
          x: endStateXY.x,
          y: endStateXY.y + Util.translatePX2Num(endState.height) / 2,
        },
        startState: {
          stateId: startState.stateId,
        },
        endState: {
          stateId: endState.stateId,
        },
        lineId: window.genId("line"),
        type: "default",
        verticalOffset: 0,
        startPointClass: "connect-point out",
        endPointClass: "connect-point in",
        desc: "",
        event: {
          ioStateNum: null,
          ioStateBool: null,
        }
      };
      store.addLine({
        threadIndex: threadIndex,
        lineData: lineData,
      });
    },

    addStartLoopLine2State(startState, endState, threadIndex) {
      let lineData = {
        d: "",
        startState: {
          stateId: startState.stateId,
        },
        endState: {
          stateId: endState.stateId,
        },
        lineId: window.genId("line"),
        type: "startLoop",
        verticalOffset: 0,
        startPointClass: "connect-point in",
        endPointClass: "connect-point in",
        desc: "",
        event: {
          ioStateNum: null,
          ioStateBool: null,
        }
      };
      store.addStartLoopLine({
        threadIndex: threadIndex,
        lineData: lineData,
      });
    },
    addEndLoopLine2State(startState, endState, threadIndex) {
      let lineData = {
        d: "",
        startState: {
          stateId: startState.stateId,
        },
        endState: {
          stateId: endState.stateId,
        },
        lineId: window.genId("line"),
        type: "endLoop",
        verticalOffset: 0,
        startPointClass: "connect-point out",
        endPointClass: "connect-point out",
        desc: "",
        event: {
          ioStateNum: null,
          ioStateBool: null,
        }
      };
      store.addEndOrContinueLoopLine({
        threadIndex: threadIndex,
        lineData: lineData,
      });
    },
    addContinueLoopLine2State(startState, endState, threadIndex) {
      let lineData = {
        d: "",
        startState: {
          stateId: startState.stateId,
        },
        endState: {
          stateId: endState.stateId,
        },
        lineId: window.genId("line"),
        type: "continueLoop",
        verticalOffset: 0,
        startPointClass: "connect-point out",
        endPointClass: "connect-point loop",
        desc: "",
        event: {
          ioStateNum: null,
          ioStateBool: null,
        }
      };
      store.addEndOrContinueLoopLine({
        threadIndex: threadIndex,
        lineData: lineData,
      });
    },

  }
}
export default QBlock;