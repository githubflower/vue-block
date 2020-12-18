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
     * 获取状态相对于线程框的坐标信息
     * @param {*} state
     */
    getXY2Canvas: function getXY2Canvas(state, threadIndex) {
      var threadPos = document.getElementsByClassName("thread")[threadIndex].getBoundingClientRect();

      var statePos = _util["default"].getDomByStateId(state.stateId).getBoundingClientRect();

      return {
        x: statePos.left - threadPos.left,
        y: statePos.top - threadPos.top
      };
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
      line.startPoint = {
        x: xy.x + _util["default"].translatePX2Num(startState.width),
        y: xy.y + _util["default"].translatePX2Num(startState.height) / 2
      };
      return line.startPoint;
    },
    getEndPoint: function getEndPoint(line, threadIndex) {
      var endState = store.getState(threadIndex, line.endState.stateId, false
      /**isThreadId: false */
      );
      var xy = QBlock.State.getXY2Canvas(endState, threadIndex);
      line.endPoint = {
        x: xy.x,
        y: xy.y + _util["default"].translatePX2Num(endState.height) / 2
      };
      return line.endPoint;
    },
    redrawLine: function redrawLine(line, threadIndex) {
      this.drawLine(line, line.startState, line.endState, threadIndex);
    },
    drawLine: function drawLine(line, startState, endState, threadIndex) {
      var tempRadius = LINE_RADIUS;
      var startPoint, endPoint, stateHeight, linepath;
      startPoint = QBlock.Line.getStartPoint(line, threadIndex);
      endPoint = QBlock.Line.getEndPoint(line, threadIndex);
      stateHeight = Math.max(QBlock.State.getStateHeightByStateId(threadIndex, startState.stateId) / 2, QBlock.State.getStateHeightByStateId(threadIndex, endState.stateId) / 2); // y坐标相同，绘制直线

      if (endPoint.x > startPoint.x + LINE_H + LINE_RADIUS && endPoint.y == startPoint.y) {
        linepath = this.drawStraightConnectLine(startPoint, endPoint, LINE_RADIUS);
        line.endPoint = endPoint;
        line.d = linepath;
        return line;
      } // 当结束点的x坐标小于起始点且y坐标相等时或小于起始点时
      else if (endPoint.x - LINE_H - LINE_RADIUS < startPoint.x && endPoint.y < startPoint.y || endPoint.x < startPoint.x && endPoint.y == startPoint.y) {
          linepath = this.drawUpperBackConnectLine(startPoint, endPoint, LINE_RADIUS, stateHeight);
          line.endPoint = endPoint;
          line.d = linepath;
          return line;
        } // 当结束点的x坐标小于起始点时且y坐标大于起始点时
        else if (endPoint.x - LINE_H - LINE_RADIUS < startPoint.x && endPoint.y > startPoint.y) {
            linepath = this.drawLowerBackConnectLine(startPoint, endPoint, LINE_RADIUS, stateHeight);
            line.endPoint = endPoint;
            line.d = linepath;
            return line;
          } // 当结束点的x, y坐标均大于起始点的时候
          else if (endPoint.x > startPoint.x + LINE_H + LINE_RADIUS && endPoint.y > startPoint.y) {
              // 当结束点与起始点的y坐标差距小于两个拐角半径时，根据结束点和起始点的y坐标的差动态决定拐角半径
              if (endPoint.y - startPoint.y < 2 * tempRadius) {
                var doubleRadius = endPoint.y - startPoint.y;
                tempRadius = doubleRadius / 2;
                linepath = this.drawLowerConnectLine(startPoint, endPoint, tempRadius);
                line.endPoint = endPoint;
                line.d = linepath;
                return line;
              } else {
                linepath = this.drawLowerConnectLine(startPoint, endPoint, LINE_RADIUS);
                line.endPoint = endPoint;
                line.d = linepath;
                return line;
              }
            } //当结束点的x坐标大于起始点，y坐标小于起始点时
            else if (endPoint.x > startPoint.x + LINE_H + LINE_RADIUS && endPoint.y < startPoint.y) {
                // 当结束点与起始点的y坐标差距小于两个拐角半径时，根据结束点和起始点的y坐标的差动态决定拐角半径
                if (startPoint.y - endPoint.y < 2 * tempRadius) {
                  var _doubleRadius = startPoint.y - endPoint.y;

                  tempRadius = _doubleRadius / 2;
                  linepath = this.drawUpperConnectLine(startPoint, endPoint, tempRadius), line.endPoint = endPoint;
                  line.d = linepath;
                  return line;
                } else {
                  linepath = this.drawUpperConnectLine(startPoint, endPoint, LINE_RADIUS), line.endPoint = endPoint;
                  line.d = linepath;
                  return line;
                }
              }
    }
  }
};
var _default = QBlock;
exports["default"] = _default;
//# sourceMappingURL=qblock.dev.js.map
