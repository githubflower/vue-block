"use strict";

var _vue = _interopRequireDefault(require("vue"));

var _App = _interopRequireDefault(require("./App"));

var _router = _interopRequireDefault(require("./router"));

var _elementUi = _interopRequireDefault(require("element-ui"));

require("element-ui/lib/theme-chalk/index.css");

var _axios = _interopRequireDefault(require("axios"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
_vue["default"].use(_elementUi["default"], {
  size: 'small',
  zIndex: 3000
});

_vue["default"].prototype.axios = _axios["default"];
_vue["default"].config.productionTip = false;
window.stateManage = {}; //状态管理  后续采用vuex实现 TODO

window.genId = function () {
  var _id = 0;
  return function (type) {
    return type + '-' + +new Date(); //+ ++_id
  };
}();

window.store = {
  debug: true,
  statenameIndex: 0,
  stateData: {
    threadAry: [{
      name: "线程1",
      width: 1200,
      height: 500,
      stateAry: [],
      lineAry: []
    }],
    //用于DEMO
    demoStateData: {}
  },
  addThread: function addThread(obj) {
    this.stateData.threadAry.push(obj);
  },

  /**
  * 获取状态组件的默认配置
  * @param {index: this.threadIndex, x: e.x - threadPosInfo.x, y: e.y - threadPosInfo.y, stateType: e.dataTransfer.getData("stateType")} data
  */
  getDefaultStateCfg: function getDefaultStateCfg(data) {
    return {
      width: data.stateType === "loopDiv" ? "300px" : "76px",
      height: data.stateType === "loopDiv" ? "120px" : "40px",
      name: "状态描述" + this.statenameIndex++,
      stateType: data.stateType,
      stateId: window.genId("state"),
      inputAry: [],
      outputAry: [],
      parent: null,
      mode: 'normal',
      x: data.x,
      y: data.y,
      children: []
    };
  },
  addState: function addState(data) {
    var state = this.getDefaultStateCfg(data);
    this.stateData.threadAry[data.index].stateAry.push(state);
  },

  /**
   * 在线程框内增加连线
   * @param { threadIndex, lineData }data
   */
  addLine: function addLine(data) {
    this.stateData.threadAry[data.threadIndex].lineAry.push(data.lineData); //将连线数据添加到首尾2个状态块

    this.relateLine2startState(data);
    this.relateLine2endState(data);
  },

  /**
   * 删除连线 
   * 参数：连线id， 线程索引（TODO:后续考虑修改为线程id）
   * @param {lineId, threadIndex} data
   */
  deleteLine: function deleteLine(data) {
    var lineAry = this.stateData.threadAry[data.threadIndex].lineAry,
        lineItem,
        line,
        i;

    for (i = 0; i < lineAry.length; i++) {
      lineItem = lineAry[i];

      if (lineItem.lineId === data.lineId) {
        line = lineAry.splice(i, 1)[0];
        break;
      }
    } //更新这条线的始末状态的outputAry inputAry信息


    var stateAry = this.stateData.threadAry[data.threadIndex].stateAry;
    var startState = stateAry.find(function (item) {
      return item.stateId === line.startState.stateId;
    });
    var outputAry = startState.outputAry;
    outputAry.forEach(function (item, index) {
      if (item.lineId === line.lineId) {
        outputAry.splice(index, 1);
        return false;
      }
    });
    var endState = stateAry.find(function (item) {
      return item.stateId === line.endState.stateId;
    });
    var inputAry = endState.inputAry;
    inputAry.forEach(function (item, index) {
      if (item.lineId === line.lineId) {
        inputAry.splice(index, 1);
        return false;
      }
    });
  },

  /**
   * 将连线数据和连线的首尾2个状态关联
   * @param  { threadIndex, lineData }data
   */
  relateLine2startState: function relateLine2startState(data) {
    var result = []; // 用于深度搜索stateId的方法，寻找到的state存储在result内

    function traverse(stateAry) {
      for (var i in stateAry) {
        if (stateAry[i].stateId === data.lineData.startState.stateId) {
          result.push(stateAry[i]);
          return;
        }

        traverse(stateAry[i].children);
      }
    }

    ;

    if (data.lineData.startState) {
      traverse(this.stateData.threadAry[data.threadIndex].stateAry);
      var outputAry = result[0].outputAry;

      if (!outputAry) {
        outputAry = [];
        result[0].outputAry = outputAry;
      }

      outputAry.push({
        lineId: data.lineData.lineId //这里只存放连线的lineId，对连线的具体数据只保存一份，放在thread.lineAry里面，避免维护多份数据

      });
    }
  },

  /**
   * 
   * 
   * 
   */
  relateLine2endState: function relateLine2endState(data) {
    if (data.lineData.endState && data.lineData.endState.stateIndex !== null) {
      // 用于深度搜索stateId的方法，寻找到的state存储在result内
      var traverse = function traverse(stateAry) {
        for (var i in stateAry) {
          if (stateAry[i].stateId === data.lineData.endState.stateId) {
            result.push(stateAry[i]);
            return;
          }

          traverse(stateAry[i].children);
        }
      };

      // 根据id来拿
      var result = [];
      ;
      traverse(this.stateData.threadAry[data.threadIndex].stateAry);
      var inputAry = result[0].inputAry;

      if (!inputAry) {
        inputAry = [];
        result[0].inputAry = inputAry;
      }

      inputAry.push({
        lineId: data.lineData.lineId
      });
    }
  },

  /**
   * 调整线程框的宽高
   * @param {dw, dh} data 
   */
  resizeThread: function resizeThread(data) {
    if (data.dh) {
      this.stateData.threadAry[data.threadIndex].height += data.dh;
    }

    if (data.dw) {
      this.stateData.threadAry[data.threadIndex].width += data.dw;
    }
  }
};

_router["default"].beforeEach(function (to, from, next) {
  console.log(to);

  if (from.name === 'blockly' && to.name === 'state' || to.name === 'blockly' && from.name === 'state') {
    console.log('同步数据... '); //TODO
  }

  next();
});
/* eslint-disable no-new */


window.EventObj = new _vue["default"]();
new _vue["default"]({
  el: '#app',
  router: _router["default"],
  components: {
    App: _App["default"]
  },
  template: '<App/>'
});
//# sourceMappingURL=main.dev.js.map