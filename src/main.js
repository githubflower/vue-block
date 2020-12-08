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
        name: "Main_thread",
        width: 1200,
        height: 500,
        stateAry: [],
        lineAry: [],
      },
    ],
      //用于DEMO
  demoStateData: {}
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
      parent: null,
      mode:'normal',
      x: data.x,
      y: data.y,
      children:[],
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
   * TODO: 需要考虑嵌套时的情况
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
    //修改为深度搜索与选中连线相关的状态
    function traverseLine(stateAry, lineState) {
      for (var i in stateAry){
          if (stateAry[i].stateId === lineState.stateId){
          result.push(stateAry[i]);
          return
          }
        traverseLine(stateAry[i].children, lineState);
      } 
    };
    let result = [];
    //更新这条线的始末状态的outputAry inputAry信息
    let stateAry = this.stateData.threadAry[data.threadIndex].stateAry;
    traverseLine(stateAry, line.startState)
    let startState = result.pop()
    let outputAry = startState.outputAry;
    outputAry.forEach((item, index) => {
      if (item.lineId === line.lineId) {
        outputAry.splice(index, 1);
        return false;
      }
    });

    traverseLine(stateAry, line.endState)
    let endState = result.pop()
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
    let result = []
    // 用于深度搜索stateId的方法，寻找到的state存储在result内
    function traverse(stateAry) {
      for (var i in stateAry){
        if (stateAry[i].stateId === data.lineData.startState.stateId){
          result.push(stateAry[i]);
          return
        }
        traverse(stateAry[i].children);
      }
    };

    if (data.lineData.startState) {
      traverse(this.stateData.threadAry[data.threadIndex].stateAry)
      let outputAry = result[0].outputAry;
      if (!outputAry) {
        outputAry = [];
        result[0].outputAry = outputAry;
      }
      outputAry.push({
        lineId: data.lineData.lineId, //这里只存放连线的lineId，对连线的具体数据只保存一份，放在thread.lineAry里面，避免维护多份数据
      });
    }
  },
  /**
   * 
   * 
   * 
   */
  relateLine2endState(data) {
    if (
      data.lineData.endState &&
      data.lineData.endState.stateIndex !== null
    ) {
      // 根据id来拿
      let result = []
      // 用于深度搜索stateId的方法，寻找到的state存储在result内
      function traverse(stateAry) {
        for (var i in stateAry){
          if (stateAry[i].stateId === data.lineData.endState.stateId){
            result.push(stateAry[i]);
            return
          }
          traverse(stateAry[i].children);
        }
      };
      traverse(this.stateData.threadAry[data.threadIndex].stateAry)
      let inputAry = result[0].inputAry;
      
      if (!inputAry) {
        inputAry = [];
        result[0].inputAry = inputAry;
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
