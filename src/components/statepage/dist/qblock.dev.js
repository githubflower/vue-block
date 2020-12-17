"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _util = _interopRequireDefault(require("./util.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

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
    getStateWidth: function getStateWidth(state) {
      return _util["default"].translatePX2Num(state.width);
    }
  },
  Line: {
    getStartPoint: function getStartPoint(line, threadIndex) {
      if (!line.startPoint || line.startPoint.x === null || typeof line.startPoint.x === "undefined" || isNaN(line.startPoint.x)) {
        var startState = store.getState(threadIndex, line.startState.stateId, false
        /**isThreadId: false */
        );
        line.startPoint = {
          //TODO 需改用getXY2Canvas更准确
          x: startState.x + _util["default"].translatePX2Num(startState.width),
          y: startState.y + _util["default"].translatePX2Num(startState.height) / 2
        };
      }

      return line.startPoint;
    },
    getEndPoint: function getEndPoint(line, threadIndex) {
      //如果结束点不存在
      if (!line.endPoint || line.endPoint.x === null || typeof line.endPoint.x === "undefined" || isNaN(line.endPoint.x)) {
        var _endState = store.getState(threadIndex, line.endState.stateId, false
        /**isThreadId: false */
        );

        var _xy = QBlock.State.getXY2Canvas(_endState, threadIndex);
        /* line.endPoint = {
            //TODO 需改用getXY2Canvas更准确
            x: endState.x,
            y: endState.y + Util.translatePX2Num(endState.height) / 2,
        }; */


        line.endPoint = {
          x: _xy.x,
          y: _xy.y + _util["default"].translatePX2Num(_endState.height) / 2
        };
      }

      var endState = store.getState(threadIndex, line.endState.stateId, false
      /**isThreadId: false */
      );
      var xy = QBlock.State.getXY2Canvas(endState, threadIndex);
      /* line.endPoint = {
          //TODO 需改用getXY2Canvas更准确
          x: endState.x,
          y: endState.y + Util.translatePX2Num(endState.height) / 2,
      }; */

      line.endPoint = {
        x: xy.x,
        y: xy.y + _util["default"].translatePX2Num(endState.height) / 2
      };
      return line.endPoint;
    }
  }
};
var _default = QBlock;
exports["default"] = _default;
//# sourceMappingURL=qblock.dev.js.map
