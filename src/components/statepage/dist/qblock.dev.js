"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _util = _interopRequireDefault(require("./util.js"));

var _graphCfg = require("./graphCfg.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var LINE_H = _graphCfg.lineCfg.line_h;
var LINE_RADIUS = _graphCfg.lineCfg.line_radius;
var QBlock = {
  store: window.store,
  Thread: {},
  State: {
    /**
     * 获取状态相对于线程框的坐标信息  此方法依赖状态组件的dom，不推荐使用
     * @param {*} state
     */
    getXY2CanvasWithStateRendered: function getXY2CanvasWithStateRendered(state, threadIndex) {
      var threadPos = document.getElementsByClassName("thread")[threadIndex].getBoundingClientRect();

      var statePos = _util["default"].getDomByStateId(state.stateId).getBoundingClientRect();

      return {
        x: statePos.left - threadPos.left,
        y: statePos.top - threadPos.top
      };
    },

    /**
     * 根据状态及其父状态信息计算出相对于线程框的绝对位置  不依赖dom
     * @param {*} state 
     * @param {*} threadIndex 
     */
    getXY2Canvas: function getXY2Canvas(state, threadIndex) {
      var xy = {
        x: state.x,
        y: state.y
      };

      if (state.parent) {
        var parent = store.getState(threadIndex, state.stateId, false
        /**isThreadId: false */
        );
        var parentXY = this.getXY2Canvas(parent, threadIndex);
        xy.x += parentXY.x;
        xy.y += parentXY.y;
      }

      return xy;
    },
    getStateHeight: function getStateHeight(state) {
      return _util["default"].translatePX2Num(state.height);
    },
    getStateHeightByStateId: function getStateHeightByStateId(threadIndex, stateId) {
      var state = store.getState(threadIndex, stateId, false);
      return _util["default"].translatePX2Num(state.height);
    },
    getStateWidth: function getStateWidth(state) {
      return _util["default"].translatePX2Num(state.width);
    }
  },
  Line: {
    getStartPoint: function getStartPoint(line, threadIndex) {
      /* if (
          !line.startPoint ||
          line.startPoint.x === null ||
          typeof line.startPoint.x === "undefined" ||
          isNaN(line.startPoint.x)
      ) {
          
      } */
      var startState = store.getState(threadIndex, line.startState.stateId, false
      /**isThreadId: false */
      );
      var xy = QBlock.State.getXY2Canvas(startState, threadIndex);
      return {
        x: xy.x + _util["default"].translatePX2Num(startState.width),
        y: xy.y + _util["default"].translatePX2Num(startState.height) / 2 + _graphCfg.lineCfg.threadTitleHeight
      }; // return line.startPoint;
    },
    getEndPoint: function getEndPoint(line, threadIndex) {
      var endState = store.getState(threadIndex, line.endState.stateId, false
      /**isThreadId: false */
      );
      var xy = QBlock.State.getXY2Canvas(endState, threadIndex);
      return {
        x: xy.x,
        y: xy.y + _util["default"].translatePX2Num(endState.height) / 2 + _graphCfg.lineCfg.threadTitleHeight
      }; // return line.endPoint;
    },
    redrawLine: function redrawLine(line, threadIndex) {
      this.drawLine(line, line.startState, line.endState, threadIndex);
    },
    drawLine: function drawLine(line, startState, endState, threadIndex) {
      var startPoint, endPoint, stateHeight, linepath;
      startPoint = QBlock.Line.getStartPoint(line, threadIndex);
      endPoint = QBlock.Line.getEndPoint(line, threadIndex);
      var isDynamicRadiusFlag = Math.abs(startPoint.y - endPoint.y) < 2 * LINE_RADIUS;
      var path;

      if (endPoint.y === startPoint.y && endPoint.x > startPoint.x) {
        path = this.drawStraightConnectLine(startPoint, endPoint, LINE_RADIUS);
      } else if (startPoint.x > endPoint.x - LINE_H - LINE_RADIUS) {
        path = this.drawLine5ByStateAndPoint(startState, startPoint, endState, endPoint);
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
    }
  }
};
var _default = QBlock;
exports["default"] = _default;
//# sourceMappingURL=qblock.dev.js.map
