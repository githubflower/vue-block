// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import Element from 'element-ui';
import Tools from "@/Tools.js";
import 'element-ui/lib/theme-chalk/index.css';
import axios from 'axios';
const UNDO_REDO_LIMIT = 10//撤销与恢复的最大限制步数
Vue.use(Element, { size: 'small', zIndex: 3000 });
Vue.prototype.axios = axios;

Vue.config.productionTip = false

window.stateManage = {};//状态管理  后续采用vuex实现 TODO
window.genId = (function () {
  var _id = 0;
  return function (type) {
    return type + '-' + +new Date();//+ ++_id
  }
})();
const STATE_NAME_POOL = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
window.store = {
  debug: true,
  statenameIndex: 0,
  stateData: {
    threadAry: [
      {
        name: "主线程",
        width: 1200,
        height: 500,
        stateAry: [
          {
            width: "76px",
            height: "40px",
            // name: "状态描述" + this.statenameIndex++,
            name: "开始",
            stateType: "stateDiv",
            stateId: "state-start",
            inputAry: [],
            outputAry: [],
            parent: null,
            mode: 'default',
            x: 50,
            y: 50,
            children: [],
          },
          {
            width: "76px",
            height: "40px",
            // name: "状态描述" + this.statenameIndex++,
            name: "结束",
            stateType: "stateDiv",
            stateId: "state-end",
            inputAry: [],
            outputAry: [],
            parent: null,
            mode: 'default',
            x: 500,
            y: 50,
            children: [],
          }
        ],
        lineAry: [],
        undoStatesList:[],
        redoStatesList:[],
        presentState:{},
        hasUndone: false,
        //传入的status必须为operating, pausing, stopping这三者中的一个
        runningStatus: ''
      },
    ],
    lineMap: {},
  },
  addThread(obj) {
    this.stateData.threadAry.push(obj);
  },
  /**
  * 获取状态组件的默认配置
  * @param {index: this.threadIndex, x: e.x - threadPosInfo.x, y: e.y - threadPosInfo.y, stateType: e.dataTransfer.getData("stateType")} data
  */
  getDefaultStateCfg(data) {
    return {
      width: data.stateType === "loopDiv" ? "300px" : "76px",
      height: data.stateType === "loopDiv" ? "120px" : "40px",
      name: "状态描述" + this.statenameIndex++,
      // name: STATE_NAME_POOL[this.statenameIndex++],
      stateType: data.stateType,
      stateId: window.genId("state"),
      inputAry: [],
      outputAry: [],
      parent: null,
      mode: 'default',
      x: data.x,
      y: data.y,
      children: [],
    }
  },
  addState(data) {
    let state = this.getDefaultStateCfg(data);
    this.stateData.threadAry[data.index].stateAry.push(state);
  },
  /**
   * 在线程框内增加连线
   * @param { threadIndex, lineData }data
   */
  addLine(data) {
    this.stateData.threadAry[data.threadIndex].lineAry.push(data.lineData);
    //将连线数据添加到首尾2个状态块
    this.relateLine2startState(data);
    this.relateLine2endState(data);
  },
  /**
   * 删除存储在lineMap内的对应连线
   * @param {*} lineId 
   */
  deleteLineInLineMap(lineId) {
    this.stateData.lineMap[lineId] = null
    delete this.stateData.lineMap[lineId]
  },
  /**
   * 删除连线 
   * 参数：连线id， 线程索引（TODO:后续考虑修改为线程id）
   * @param {lineId, threadIndex} data
   */
  deleteLine(data) {
    let lineAry = this.stateData.threadAry[data.threadIndex].lineAry,
      lineItem,
      line,
      i;

    for (i = 0; i < lineAry.length; i++) {
      lineItem = lineAry[i];
      if (lineItem.lineId === data.lineId) {
        line = lineAry.splice(i, 1)[0];
        break;
      }
    }

    let startState = store.getState(data.threadIndex, line.startState.stateId)
    let outputAry = startState.outputAry;
    outputAry.forEach((item, index) => {
      if (item.lineId === line.lineId) {
        outputAry.splice(index, 1);
        return false;
      }
    });

    let endState = store.getState(data.threadIndex, line.endState.stateId)
    let inputAry = endState.inputAry;
    inputAry.forEach((item, index) => {
      if (item.lineId === line.lineId) {
        inputAry.splice(index, 1);
        return false;
      }
    });
    this.deleteLineInLineMap(line.lineId)
  },
  /**
   * 将连线数据和连线的首尾2个状态关联
   * @param  { threadIndex, lineData }data
   */

  relateLine2startState(data) {
    let startStateId = data.lineData.startState.stateId
    if (data.lineData.startState) {
      let outputAry = store.getState(data.threadIndex, startStateId).outputAry
      if (!outputAry) {
        outputAry = [];
      }
      outputAry.push({
        lineId: data.lineData.lineId, //这里只存放连线的lineId，对连线的具体数据只保存一份，放在thread.lineAry里面，避免维护多份数据
      });
    }
  },

  relateLine2endState(data) {
    if (
      data.lineData.endState &&
      data.lineData.endState.stateIndex !== null
    ) {
      let endStateId = data.lineData.endState.stateId
      let inputAry = store.getState(data.threadIndex, endStateId).inputAry
      if (!inputAry) {
        inputAry = [];
      }
      inputAry.push({
        lineId: data.lineData.lineId,
      });
    }
  },
  /**
   * 调整线程框的宽高
   * @param {dw, dh} data 
   */
  resizeThread(data) {
    if (data.dh) {
      this.stateData.threadAry[data.threadIndex].height += data.dh;
    }
    if (data.dw) {
      this.stateData.threadAry[data.threadIndex].width += data.dw;
    }
  },
  /**
   * 根据传入的线程id/index + 状态id获取状态
   * @param {*} threadIdOrIndex
   * @param {*} stateId 
   * @param {*} isThreadId 是否是线程id
   */
  getState(threadIdOrIndex, stateId, isThreadId) {
    let state;
    let thread;
    if (isThreadId) {
      thread = this.stateData.threadAry.find(item => {
        return item.id === threadIdOrIndex;
      });
    } else {
      thread = this.stateData.threadAry[threadIdOrIndex];
    }
    if (thread) {
      state = this.getStateImplement(stateId, thread.stateAry);
    }
    if (!state) {
      console.error('根据threadIdOrIndex和stateId获取状态失败---> threadId: ' + threadIdOrIndex + ' stateId: ' + stateId + ' isThreadId: ' + isThreadId);
    }
    return state;
  },
  getStateImplement(stateId, stateAry) {
    let state;
    stateAry.every(item => {
      let flag = true;
      if (item.stateId === stateId) {
        state = item;
        flag = false
      } else if (item.children && item.children.length) {
        state = this.getStateImplement(stateId, item.children);
        if (state) {
          flag = false
        }
      }
      return flag
    });
    return state
  },
  //更新用于状态图撤销的数据
  updateUndoData(threadIndex) {
    let undoData = {
      stateAry: this.handleNullParent(
        Tools.deepCopy(this.stateData.threadAry[threadIndex].stateAry)
      ),
      lineAry: Tools.deepCopy(
        this.stateData.threadAry[threadIndex].lineAry
      ),
    };
    //若用户在撤销后进行了新的操作，则清空先前的redoStatesList
    if(this.stateData.threadAry[threadIndex].hasUndone === true){
      this.stateData.threadAry[threadIndex].redoStatesList = []
    }
    this.stateData.threadAry[threadIndex].undoStatesList.push(undoData);
    if (this.stateData.threadAry[threadIndex].undoStatesList.length > UNDO_REDO_LIMIT) {
      this.stateData.threadAry[threadIndex].undoStatesList.splice(0, 1);
    }
    return;
  },
  //更新用于撤销恢复的当前状态图的数据
  updatePresentData(threadIndex){
    let presentData = {
      stateAry: this.handleNullParent(
        Tools.deepCopy(this.stateData.threadAry[threadIndex].stateAry)
      ),
      lineAry: Tools.deepCopy(this.stateData.threadAry[threadIndex].lineAry)
    }
    this.stateData.threadAry[threadIndex].presentState = presentData
  },
  //处理deepCopy后状态的parent不正确的问题
  handleNullParent(stateAry) {
    stateAry.forEach((state) => {
      if (typeof state.parent !== "string") {
        state.parent = null;
      }
    });
    return stateAry;
  },
  //在对当前线程框内的状态进行拖拽连线，以及从工具栏内拖拽状态到当前线程框时，自动focus该线程框，以供使用快捷键
  focusCurrentThread(threadIndex) {
    let currentThreadDom = document.getElementsByClassName("thread")[
      threadIndex
    ];
    currentThreadDom.focus();
  },
}

router.beforeEach((to, from, next) => {
  console.log(to);
  if ((from.name === 'blockly' && to.name === 'state') || (to.name === 'blockly' && from.name === 'state')) {
    console.log('同步数据... '); //TODO
  }
  next();
})
/* eslint-disable no-new */
window.EventObj = new Vue();
new Vue({
  el: '#app',
  router,
  components: { App },
  template: '<App/>'
})
