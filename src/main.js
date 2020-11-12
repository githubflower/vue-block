// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import Element from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import axios from 'axios';


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

window.store = {
  debug: true,
  statenameIndex: 0,
  stateData: {
    threadAry: [
      {
        name: "线程1",
        width: 1200,
        height: 500,
        stateAry: [
          {
            stateId: "custom-state-id",
            stateType: "stateDiv",
            name: "默认状态名称1",
            inputAry: [],
            outputAry: [],
            children: [],
            x: 5,
            y: 0,
          },
          {
            width: "302px",
            height: "122px",
            name: "状态描述99",
            stateType: "loopDiv",
            stateId: window.genId("state"),
            inputAry: [],
            outputAry: [],
            x: 200,
            y: 100,
            children: [
              {
                name: "child1",
                stateId: "state-child1",
                stateType: "stateDiv",
                inputAry: [],
                outputAry: [],
                x: 50,
                y: 50,
              },
            ],
          },
        ],
        lineAry: [],
      },

    ],
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
      stateType: data.stateType,
      stateId: window.genId("state"),
      inputAry: [],
      outputAry: [],
      x: data.x,
      y: data.y,
      children:
        data.stateType === "loopDiv"
          ? [
            {
              name: "child1",
              stateId: "state-child1",
              // stateType: "loopBlock",
              inputAry: [],
              outputAry: [],
              x: 50,
              y: 50,
            },
          ]
          : [],
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
    //更新这条线的始末状态的outputAry inputAry信息
    let stateAry = this.stateData.threadAry[data.threadIndex].stateAry;
    let startState = stateAry.find((item) => {
      return item.stateId === line.startState.stateId;
    });
    let outputAry = startState.outputAry;
    outputAry.forEach((item, index) => {
      if (item.lineId === line.lineId) {
        outputAry.splice(index, 1);
        return false;
      }
    });

    let endState = stateAry.find((item) => {
      return item.stateId === line.endState.stateId;
    });
    let inputAry = endState.inputAry;
    inputAry.forEach((item, index) => {
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
  relateLine2startState(data) {
    if (data.lineData.startState) {
      let outputAry = this.stateData.threadAry[data.threadIndex].stateAry[
        data.lineData.startState.stateIndex
      ].outputAry;
      if (!outputAry) {
        outputAry = [];
        this.stateData.threadAry[data.threadIndex].stateAry[
          data.lineData.startState.stateIndex
        ].outputAry = outputAry;
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
      let inputAry = this.stateData.threadAry[data.threadIndex].stateAry[
        data.lineData.endState.stateIndex
      ].inputAry;
      if (!inputAry) {
        inputAry = [];
        this.stateData.threadAry[data.threadIndex].stateAry[
          data.lineData.endState.stateIndex
        ].inputAry = inputAry;
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
}

router.beforeEach((to, from, next)=>{
  console.log(to);
  if ((from.name === 'blockly' && to.name === 'state') || (to.name === 'blockly' && from.name === 'state')){
    alert('同步数据... '); //TODO
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
