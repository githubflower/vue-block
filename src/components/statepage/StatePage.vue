<template>
  <div id="statePage" class="main" @mousemove="onMouseMove">
    <div class="toolbox">
      <!-- <el-button type="primary" plain @click="addThread">线程</el-button> -->
      <div
        :class="['template-thread', 'el-icon-circle-plus']"
        :style="{ width: getCurrentLang() === 'zh' ? '100px' : '150px' }"
        @click="addThread"
      >
        {{ $t("QBLOCK_ADD_THREAD") }}
      </div>
      <!-- dragStart事件只能绑定在html5元素上，绑定el组件无效，所以这里用span包裹一层  -->
      <span
        draggable="true"
        @drag="drag"
        @dragstart="dragStart"
        @dragend="dragEnd"
      >
        <!-- <el-button type="primary" plain stateType="stateDiv">状态</el-button> -->
        <div class="template-state" stateType="stateDiv">
          {{ $t("QBLOCK_STATE") }}
        </div>
      </span>
      <span
        draggable="true"
        @drag="drag"
        @dragstart="dragStart"
        @dragend="dragEnd"
      >
        <!-- <el-button type="primary" plain stateType="loopDiv">循环</el-button> -->
        <div class="template-loop" stateType="loopDiv">
          {{ $t("QBLOCK_LOOP") }}
        </div>
      </span>
      <!-- <SwitchBtn /> -->
      <!-- <el-button type="primary" plain @click="save">保存</el-button> -->
      <!-- <el-button
        type="primary"
        plain
        @click="loadFromLocal"
        title="加载localstorage中的数据"
        >加载</el-button
      >
      <el-button
        type="primary"
        plain
        @click="exportFile"
        title="将当前图面数据以文件形式导出"
        >导出</el-button
      > -->

      <!-- <el-button
        type="primary"
        plain
        @click="genFromBlockly2QBlock"
        title="根据Blockly生成QBlock"
        >根据Blockly生成QBlock</el-button
      >
      <el-button
        type="primary"
        plain
        @click="importFile"
        title="从文件导入图面数据"
        >导入</el-button
      > -->
      <!-- <input type="file" name="importFile" id="importFile" /> -->
      <!-- <el-button-group style="position: absolute; top: 10px; left: 700px;"> -->
      <!-- <span>输入变量名称：</span>
      <input type="text" name="search" id="demovar" v-model="varName" />
      <el-button type="primary" plain @click="searchVar" title="查询变量的值"
        >查询</el-button
      >
      <el-button type="primary" plain @click="run" title="运行程序"
        >运行</el-button
      >
      <el-button type="primary" plain @click="step" title="单步执行"
        >单步</el-button
      >
      <el-button
        type="primary"
        plain
        @click="stopDebugger"
        title="终止被调试端运行的虚拟机"
        >停止调试</el-button
      >
      <el-button type="primary" plain @click="stop" title="停止程序"
        >停止程序</el-button
      >
      <el-button type="primary" plain @click="releaseAuth" title="释放权限"
        >释放权限</el-button
      >
      <el-button-group>
        <el-button type="primary" size="medium" @click="activeStatePage"
          >State Diagram</el-button
        >
        <el-button type="primary" size="medium" @click="activeBlockly"
          >Blockly</el-button
        >
      </el-button-group> -->
    </div>
    <div v-show="activeName === 'statePage'" class="content" @click="hideMenus">
      <line-context-menu
        ref="lineContextMenu"
        v-show="lineContextMenuData.show"
        :mustShowMenu="lineContextMenuData.show"
        :lineId="lineContextMenuData.lineId"
        :lineData="lineContextMenuData.lineData"
        :threadIndex="lineContextMenuData.threadIndex"
        :style="{
          left: lineContextMenuData.position.x + 'px',
          top: lineContextMenuData.position.y - 60 + 'px',
        }"
        @toggleLineContextMenu="toggleLineContextMenu"
      ></line-context-menu>
      <state-context-menu
        v-show="showDeleteStateMenu"
        @deleteStateFn="deleteStateFn"
        :xy="contextmenuXY"
      ></state-context-menu>
      <thread-svg
        v-for="(thread, i) in threadAry"
        :key="i"
        :thread="thread"
        :threadIndex="i"
        :runningLineId="runningLineId"
        :runningStateData="runningStateData"
        :activeThreadIndex="activeThreadIndex"
        :showDeleteStateMenu="showDeleteStateMenu"
        :showLineContextMenu="lineContextMenuData.show"
        @updateActiveThread="updateActiveThread"
      ></thread-svg>
    </div>
    <!--  <iframe
      v-show="activeName === 'blocklyPage'"
      src="./static/blockly/demos/code/index.html"
      frameborder="0"
      width="100%"
      :height="iframeHeight"
      style="position: absolute; top: 60px; left: 0px"
    ></iframe> -->
  </div>
</template>

<script>
import SwitchBtn from "@/components/SwitchBtn";
import ThreadSvg from "./ThreadSvg";
import StateDiv from "./StateDiv";
import LineContextMenu from "./LineContextMenu";
import StateContextMenu from "./StateContextMenu";
import Tools from "@/Tools.js";
import Util from "./util.js";
import { animationCfg } from "./graphCfg.js";
import QBlock from "./qblock.js";
export default {
  name: "StatePage",
  props: ["ctrlPanelMenuData"],
  components: {
    ThreadSvg,
    StateDiv,
    LineContextMenu,
    StateContextMenu,
    SwitchBtn,
  },
  data() {
    return {
      varName: null,
      statenameIndex: 0,
      _statenameIndex: 0, //todo  为什么这里不能用_开头命名？
      iframeHeight: 0,
      activeName: "statePage", //'statePage'    'blocklyPage'
      // activeName: "statePage", //'statePage'
      runningLineId: "",
      //传入的runningStatus必须为active, warning, error中的任意一个
      runningStateData: {
        stateId: "",
        runningStatus: "",
      },
      showTempLine: false,
      showDeleteStateMenu: false,
      contextmenuXY: {
        x: 0,
        y: 0,
      },
      tempLineData: null,
      operate: "default",
      threadAry: store.stateData.threadAry,
      activeThreadIndex: 0,
      lineContextMenuData: {
        show: false,
        lineId: null,
        lineData: null,
        threadIndex: null,
        position: {
          x: 0,
          y: 0,
        },
      },
      fileList: [],
      prevRunningState: "thread-1617094666583-state-start",
    };
  },
  methods: {
    getCurrentLang() {
      let QBlockCfg = JSON.parse(window.localStorage.getItem("QBlockCfg"));
      let curLang = QBlockCfg.lang;
      return curLang;
    },
    updateActiveThread(threadIndex) {
      this.activeThreadIndex = threadIndex;
    },
    generateStartState() {
      let startStateData = {
        stateType: "stateDiv",
        x: 20,
        y: 40,
      };
      let startState = store.getDefaultStateCfg(startStateData);
      startState.name = this.$t("QBLOCK_START_STATE");
      return startState;
    },
    generateEndState() {
      let endStateData = {
        stateType: "stateDiv",
        x: 500,
        y: 40,
      };
      let endState = store.getDefaultStateCfg(endStateData);
      endState.name = this.$t("QBLOCK_END_STATE");
      return endState;
    },
    addThread() {
      let startState = this.generateStartState();
      let endState = this.generateEndState();
      let threadId = window.genId("thread");
      startState.stateId = threadId + "-state-start";
      endState.stateId = threadId + "-state-end";
      store.addThread({
        name:
          this.$t("QBLOCK_THREAD_DESCRIPTION") + (this.threadAry.length + 1),
        width: 1200,
        height: 500,
        threadId: threadId,
        stateAry: [startState, endState],
        lineAry: [],
        runningStatus: "",
        undoStatesList: [],
        redoStatesList: [],
        presentState: {},
        hasUndone: false,
      });
    },
    //右键状态时展示删除按钮，不允许删除开始与结束状态
    deleteState(data) {
      //判断是否在没有关闭删除按钮的情况下右键别的状态打开删除按钮
      if (this._currentmenuXY) {
        if (
          this._currentmenuXY.x !== data.mousedownPoint.x ||
          this._currentmenuXY.y !== data.mousedownPoint.y
        ) {
          this._deleteStateData = null;
        }
      }
      if (data.stateId === "state-start" || data.stateId === "state-end") {
        return false;
      }
      this.contextmenuXY.x = data.mousedownPoint.x;
      this.contextmenuXY.y = data.mousedownPoint.y;
      this._currentmenuXY = this.contextmenuXY;
      this.showDeleteStateMenu = true;
      //由于事件是从stateDiv一层层发送到statePage的，会产生无法正确获取最底层的状态的indexAry的问题，需要进行以下的处理
      if (
        typeof this._deleteStateData === "undefined" ||
        this._deleteStateData === null
      ) {
        this._deleteStateData = data;
      } else if (this._deleteStateData.indexAry.length < data.indexAry.length) {
        this._deleteStateData = data;
      }
    },
    //用于删除状态时同时删除与状态相连的连线
    deleteStateLine(state, threadIndex) {
      let stateInputLineAry = state.inputAry;
      let stateOutputLineAry = state.outputAry;
      let currentLine;
      while (stateInputLineAry.length > 0) {
        currentLine = stateInputLineAry.pop();
        store.deleteLine({
          lineId: currentLine.lineId,
          threadIndex: threadIndex,
        });
      }
      while (stateOutputLineAry.length > 0) {
        currentLine = stateOutputLineAry.pop();
        store.deleteLine({
          lineId: currentLine.lineId,
          threadIndex: threadIndex,
        });
      }
    },
    //处理删除嵌套状态时，同时删除父状态内部的状态与连线
    deleteStateChildren(stateChildren, threadIndex) {
      for (let index = 0; index < stateChildren.length; index++) {
        this.deleteStateLine(stateChildren[index], threadIndex);
        if (stateChildren[index].children) {
          this.deleteStateChildren(stateChildren[index].children, threadIndex);
        }
      }
    },
    //删除状态以及与状态相连的连线
    deleteStateFn() {
      let data = this._deleteStateData;
      let threadIndex = data.indexAry.pop(); //线程索引
      //删除状态时，需要在状态被删除前更新用于撤销的当前状态图的状态
      store.updateUndoData(threadIndex);
      store.focusCurrentThread(threadIndex);
      let currentStateAry = this.threadAry[threadIndex].stateAry;
      while (data.indexAry.length > 1) {
        let i = data.indexAry.pop();
        currentStateAry = currentStateAry[i].children;
      }

      let deleteStateIndex = data.indexAry.pop();
      let targetState = currentStateAry[deleteStateIndex];
      this.deleteStateLine(targetState, threadIndex);

      let targetChildren = targetState.children;
      this.deleteStateChildren(targetChildren, threadIndex);
      currentStateAry.splice(deleteStateIndex, 1);
      //若删除的是嵌套状态内部的最后一个状态，将嵌套状态恢复为普通状态
      if (targetState.parent) {
        let targetParent = store.getState(threadIndex, targetState.parent);
        if (
          targetParent.children.length === 0 &&
          targetParent.stateType !== "loopDiv"
        ) {
          targetParent.mode = "default";
          targetParent.width = store.default_state_width;
          targetParent.height = store.default_state_height;
        }
      }
      store.updatePresentData(threadIndex);
      this.showDeleteStateMenu = false;
    },
    /* generateDefaultPos(index){
            const gap = 35;
            return `translate(50, ${(300 + gap) * (index - 1)})`;
        },
        generateStatePos(index){
            const gapX = 60;
            return `translate(${(90 + gapX) * (index - 1)}, 40)`;
        }, */
    drag(e) {},
    dragStart(e) {
      // e.dataTransfer.items.push('aaa');
      // e.dataTransfer.items.add('aaa');
      let stateType = e.target.firstElementChild.getAttribute("stateType");
      let leftGap;
      let topGap;
      if (e.target.getElementsByClassName("template-state")[0]) {
        leftGap =
          e.pageX -
          Math.round(
            e.target
              .getElementsByClassName("template-state")[0]
              .getBoundingClientRect().left
          );
        topGap =
          e.pageY -
          Math.round(
            e.target
              .getElementsByClassName("template-state")[0]
              .getBoundingClientRect().top
          );
      } else if (e.target.getElementsByClassName("template-loop")[0]) {
        leftGap =
          e.pageX -
          Math.round(
            e.target
              .getElementsByClassName("template-loop")[0]
              .getBoundingClientRect().left
          );
        topGap =
          e.pageY -
          Math.round(
            e.target
              .getElementsByClassName("template-loop")[0]
              .getBoundingClientRect().top
          );
      }

      e.dataTransfer.setData("operate", "addState");
      e.dataTransfer.setData("stateType", stateType);
      e.dataTransfer.setData("mousedowntoleft", leftGap);
      e.dataTransfer.setData("mousedowntotop", topGap);
    },
    dragEnd() {
      // console.log("dragend");
    },
    onMouseMove(e) {
      if (this.operate === "resize-thread") {
        // default, resize-thread,
        let dx = e.pageX - this.operateData.startPosition.x,
          dy = e.pageY - this.operateData.startPosition.y,
          minH = this.getMinHeightOfThread(this.operateData.index);
        let newW = this.operateData.originW + dx;
        if (newW > window.innerWidth - 60) {
          newW = window.innerWidth - 60;
        }
        this.threadAry[this.operateData.index].width = newW;
        this.threadAry[this.operateData.index].height = Math.max(
          minH,
          this.operateData.originH + dy
        );
      }
    },
    operateChange(data) {
      this.operateData = data;
      this.operate = data.operate;
    },
    getMinHeightOfThread(index) {
      let maxY = 0,
        threadDivBorderWidth = 1,
        stateDivBorderWidth = 1,
        stateDivHeight = 50; // 50是状态的高度
      this.threadAry[index].stateAry.forEach((state) => {
        // TODO  这里还需要根据状态是子状态还是父状态作判断，后续实现状态块时修改
        // maxY = Math.max(state.y + this.titleHeight + stateDivHeight + 2 * threadDivBorderWidth + 2 * stateDivBorderWidth, maxY);
        maxY = Math.max(
          state.y +
            35 +
            stateDivHeight +
            2 * threadDivBorderWidth +
            2 * stateDivBorderWidth,
          maxY
        );
      });
      return maxY;
    },
    /**
     * 将图面数据保存到localstorage
     */
    save() {
      window.localStorage.setItem("stateData", JSON.stringify(this.threadAry));
    },
    loadFromLocal() {
      let data = window.localStorage.getItem("stateData");
      this.threadAry = JSON.parse(data);
      if (data) {
        // console.log("load success!");
      }
    },
    genFromBlockly2QBlock() {
      //todo
      let blocklyPage = document.getElementsByTagName("iframe")[0];
      let data = [blocklyPage.contentWindow.aa];
      this.threadAry = data;
    },

    // 用于绘制连线的临时数据
    updateTempLineData(data) {
      /* {
                threadIndex: this.threadIndex,
                stateIndex: this.index,
                startState: {
                    stateId: this.stateId
                },
                startPoint: {
                    x: boundingRect.left - curSvgRect.left + boundingRect.width / 2,
                    y: boundingRect.top - curSvgRect.top + boundingRect.height / 2
                }
            }; */
      this.tempLineData = data;
    },
    updateContextMenu(data) {
      this.lineContextMenuData.show = true;
      this.lineContextMenuData.position.x = data.position.x;
      this.lineContextMenuData.position.y = data.position.y;
      this.lineContextMenuData.lineId = data.lineId;
      this.lineContextMenuData.lineData = data.lineData;
      this.lineContextMenuData.threadIndex = data.threadIndex;
    },
    hideMenus(e) {
      this.lineContextMenuData.show = false;
      this.$refs.lineContextMenu.showForm = false;
      this.$refs.lineContextMenu.showEvent = false;
      this.showDeleteStateMenu = false;
    },
    hideLineContextMenu() {
      this.lineContextMenuData.show = false;
      if (this.$refs.lineContextMenu) {
        this.$refs.lineContextMenu.showForm = false;
        this.$refs.lineContextMenu.showEvent = false;
      }
    },
    hideStateContextMenu() {
      this.showDeleteStateMenu = false;
    },
    updateLineDesc(data) {
      let line = this.threadAry[data.threadIndex].lineAry.find((lineItem) => {
        return lineItem.lineId === data.lineId;
      });
      line.desc = data.desc;
      this.lineContextMenuData.show = false;
      if (this.$refs.lineContextMenu) {
        this.$refs.lineContextMenu.showForm = false;
        this.$refs.lineContextMenu.showEvent = false;
      }
    },
    updateLineEvent(data) {
      let line = this.threadAry[data.threadIndex].lineAry.find((lineItem) => {
        return lineItem.lineId === data.lineId;
      });
      line.event = data.event;
      this.lineContextMenuData.show = false;
    },
    toggleLineContextMenu(bool) {
      this.lineContextMenuData.show = bool;
    },
    exportFile() {
      Tools.downloadFlie();
    },
    importFile() {},

    handleExceed() {},
    onUpload(rs, file, fileList) {},
    state2blockly() {
      var blocklyXml = Util.state2blockly(this.threadAry);
      Util.copyBlocklyXml2Clipboard(blocklyXml);
    },

    activeStatePage() {
      if (this.activeName === "statePage") {
        return;
      }
      this.activeName = "statePage";
    },

    activeBlockly() {
      if (this.activeName === "blocklyPage") {
        return;
      }
      this.activeName = "blocklyPage";
      let iframeNode = document.querySelector("iframe");
      // iframeNode.contentWindow.postMessage('updateFromLocalStorage', '*');
      iframeNode.contentWindow.postMessage(window.stateDataXml, "*");
    },
    saveDragData(data) {
      this._dragData = data;
    },
    setBp(blockId) {
      this.axios({
        url: "/service/setBreakpoint",
        method: "post",
        data: {
          blockId: blockId,
        },
      }).then((res) => {
        alert(res.data.msg);
      });
    },
    searchVar() {
      this.axios({
        url: "/service/searchVar",
        method: "post",
        data: {
          varName: this.varName,
        },
      }).then((res) => {
        console.log(res);
        let msg = res.data.msg;
        let successFlag = msg.indexOf("[Debug]:ok;eval;") > -1;
        let reg = /\{(.*)\}/;
        let valAry = reg.exec(msg);
        let val = null;
        if (successFlag && valAry) {
          val = this.varName + "的值是：" + valAry[1];
        } else {
          val = "查询失败：" + msg;
        }
        alert(val);
      });
    },
    run() {
      this.axios({
        url: "/service/run",
        method: "post",
        data: {
          path: "",
        },
      });
    },
    stop() {
      this.debugService("stop", {});
    },
    stopDebugger() {
      this.debugService("stopDebugger", {});
    },
    debugService(appName, data) {
      this.axios({
        url: "/service/" + appName,
        method: "post",
        data: data,
      }).then((res) => {
        console.log(res);
      });
    },
    releaseAuth() {
      this.axios({
        url: "/service/releaseAuth",
        method: "post",
        data: {},
      }).then((res) => {
        console.log(res);
      });
    },
    step() {
      this.axios({
        url: "/service/step",
        method: "post",
        data: {},
      }).then((res) => {
        alert(res.data.msg);
        let blocklyPage = document.getElementsByTagName("iframe")[0];
        let grps = blocklyPage.contentDocument.getElementsByTagName("g");
        let ary = Array.prototype.slice.call(grps);
        let block;
        if (ary) {
          block = ary.find((item) => {
            return item.getAttribute("data-id") === res.data.blockId;
          });
          if (block) {
            block.firstElementChild.setAttribute(
              "style",
              "fill: yellow; fill-opacity: 1;"
            );
          }
        }
      });
    },
    /**
     * 将后台获取到的lineId传入runningLineId，提供给PathAnimation以运行动画
     *
     */
    runLineAnimation(lineId) {
      this.runningLineId = lineId;
      const interval = animationCfg.interval; // @PathAnimation.vue > interval
      const during = animationCfg.dur; // @PathAnimation.vue > dur
      const rectCount = animationCfg.rectCount; // @PathAnimation.vue > rectCount
      setTimeout(function () {
        let triggerAnimationDom = document.getElementById("animationComp");
        triggerAnimationDom.focus();
        setTimeout(() => {
          window.triggerAnimationDom = triggerAnimationDom;
          triggerAnimationDom.blur();
        }, during + interval * (rectCount - 1));
      }, 0);
    },

    //将后台获取到的stateId传入，提供给stateDiv运行动画
    runStateAnimation(stateData) {
      this.runningStateData = stateData;
    },

    //封装过后的高亮连线与状态的方法
    runAnimation(lineId, stateData) {
      const interval = animationCfg.interval; // @PathAnimation.vue > interval
      const during = animationCfg.dur; // @PathAnimation.vue > dur
      const rectCount = animationCfg.rectCount; // @PathAnimation.vue > rectCount
      if (lineId) {
        this.runLineAnimation(lineId);
      }
      setTimeout(() => {
        this.runStateAnimation(stateData);
      }, during + interval * (rectCount - 1));
    },
    loadData(data, index) {
      if (typeof index !== "number") {
        index = this.activeThreadIndex;
      }
      let refreshedLineAry = this.handleNullPath(data.lineAry);
      if (!this.threadAry[index]) {
        this.threadAry[index] = {};
      }

      let threadAry = store.stateData.threadAry;
      Object.keys(data.basicData).forEach((k) => {
        this.$set(threadAry[index], k, Util.deepCopy(data.basicData[k]));
      });
      this.$set(threadAry[index], "stateAry", data.stateAry);
      this.$set(threadAry[index], "lineAry", refreshedLineAry);
    },
    /**
     * 加载所有线程的数据，与loadData的差别在于：loadData是加载某一个线程的数据
     */
    loadAllData(threadsData) {
      if (!threadsData) {
        threadsData = window.localStorage.getItem("threadsData");
        if (threadsData) {
          threadsData = JSON.parse(threadsData);
        } else {
          threadsData = [];
        }
      }

      if (threadsData.length) {
        let sl = store.stateData.threadAry.length,
          tl = threadsData.length;
        if (tl > sl) {
          while (tl > sl) {
            store.stateData.threadAry.push({});
            tl--;
          }
        }
        let i = 0;
        while (i < store.stateData.threadAry.length) {
          let threadObj = Util.blockly2state(threadsData[i].graphicData);
          this.loadData(
            {
              basicData: threadsData[i].basicData,
              stateAry: threadObj.stateAry,
              lineAry: threadObj.lineAry,
            },
            i
          );
          i++;
        }
      }
    },
    handleNullPath(lineAry) {
      for (let i = 0; i < lineAry.length; i++) {
        if (lineAry[i].d === null) {
          lineAry[i].d = "";
        }
      }
      return lineAry;
    },
    clearBlocklyXmlOfLocalStorage() {
      window.localStorage.setItem("threadsData", "");
      window.location.reload();
    },
    reloadBlocklyXmlOfLocalStorage() {
      var blocklyXml = window.localStorage.getItem("blocklyXml");
      var qblockJson = Util.blockly2state(blocklyXml);
      this.loadData(qblockJson);
    },
    saveQBlock2BlocklyXml() {
      var blocklyXml = Util.state2blockly(this.threadAry);
      window.localStorage.setItem("blocklyXml", blocklyXml);
    },
    testLayout() {
      if (this.activeThreadIndex === null) {
        return false;
      }
      store.updateUndoData(this.activeThreadIndex);
      store.focusCurrentThread(this.activeThreadIndex);
      var stateDoms = document.querySelectorAll(".state-wrap");
      var lineDoms = document.querySelectorAll(".connect-line");

      stateDoms = Array.prototype.slice.call(stateDoms);
      lineDoms = Array.prototype.slice.call(lineDoms);
      let reg = /is\-auto\-layouting/;

      stateDoms.forEach((element) => {
        var clazz = element.getAttribute("class");
        if (!reg.test(clazz)) {
          element.setAttribute("class", clazz + " is-auto-layouting");
        }
      });

      lineDoms.forEach((element) => {
        var clazz = element.getAttribute("class");
        if (!reg.test(clazz)) {
          element.setAttribute("class", clazz + " is-auto-layouting");
        }
      });

      //对与线程框最外层同级的状态进行自动布局
      let lineAry = this.threadAry[this.activeThreadIndex].lineAry;
      Util.testLayout(
        this.activeThreadIndex,
        this.threadAry[this.activeThreadIndex],
        lineAry
      );
      this.executeAutoLayout(stateDoms, lineDoms, reg);

      let stateAry = this.threadAry[this.activeThreadIndex].stateAry;
      let autoLayoutData = {
        stateDoms: stateDoms,
        lineDoms: lineDoms,
        reg: reg,
        lineAry: lineAry,
      };
      //对嵌套状态进行自动布局
      this.traverseExecuteAutoLayout(
        autoLayoutData,
        stateAry,
        this.activeThreadIndex
      );
      store.updatePresentData(this.activeThreadIndex);
    },

    traverseExecuteAutoLayout(autoLayoutData, stateAry) {
      for (let i = 0; i < stateAry.length; i++) {
        if (stateAry[i].children) {
          Util.testLayout(
            this.activeThreadIndex,
            stateAry[i],
            autoLayoutData.lineAry
          );
          this.executeAutoLayout(
            autoLayoutData.stateDoms,
            autoLayoutData.lineDoms,
            autoLayoutData.reg
          );
        }
        this.traverseExecuteAutoLayout(autoLayoutData, stateAry[i].children);
      }
    },
    executeAutoLayout(stateDoms, lineDoms, reg) {
      setTimeout(() => {
        stateDoms.forEach((element) => {
          var clazz = element.getAttribute("class");
          if (reg.test(clazz)) {
            element.setAttribute(
              "class",
              clazz.replace(/\s*is\-auto\-layouting\s*/g, "")
            );
          }
        });
      }, 300);
      setTimeout(() => {
        lineDoms.forEach((element) => {
          var clazz = element.getAttribute("class");
          if (reg.test(clazz)) {
            element.setAttribute(
              "class",
              clazz.replace(/\s*is\-auto\-layouting\s*/g, "")
            );
          }
        });
      }, 3000);
    },
    findConnectionLine(prevRunningState, currentRunningState, threadId) {
      if (prevRunningState === "" || !currentRunningState || !threadId) {
        return;
      } else {
        let currentThread, lineId;
        store.stateData.threadAry.forEach((thread) => {
          if (thread.threadId === threadId) {
            currentThread = thread;
          }
        });
        //console.log(currentThread)
        currentThread.lineAry.forEach((line) => {
          if (
            line.startState.stateId === prevRunningState &&
            line.endState.stateId === currentRunningState &&
            line.type === "default"
          ) {
            lineId = line.lineId;
          }
        });
        return lineId;
      }
    },
    openWebSocket() {
      const url = "ws://localhost:3000";
      const connection = new WebSocket(url);

      connection.onopen = function (e) {
        console.log("Connected to WebSocket");
      };
      connection.onclose = function () {
        console.log("Disconnected to WebSocket");
      };
      connection.onerror = function () {
        console.log("Connection Error");
      };
      connection.onmessage = (e) => {
        if (e.data) {
          let pallasData = JSON.parse(e.data);
          let runningData = {
            stateId: pallasData.stateId,
            runningStatus: pallasData.runningStatus,
          };
          if (runningData.stateId === "" || runningData.runningStatus === "") {
            this.runningStateData = runningData;
          } else {
            let prevLineId = this.findConnectionLine(
              this.prevRunningState,
              runningData.stateId,
              pallasData.threadId
            );
            this.runStateAnimation(runningData);
            //this.runAnimation(prevLineId, runningData);
            this.prevRunningState = runningData.stateId;
          }
        }
      };
      window.onbeforeunload = function () {
        websocket.close();
      };
    },
  },

  computed: {
    sumHeight: function (i) {
      return 0;
    },
  },
  watch: {
    ctrlPanelMenuData: {
      handler(newVal, oldVal) {
        console.log(newVal.stateId);
      },
      deep: true,
    },
  },
  created() {
    // this.loadFromLocal();
    EventObj.$on("deleteState", this.deleteState, this);
    EventObj.$on("operateChange", this.operateChange, this);
    EventObj.$on("updateTempLineData", this.updateTempLineData, this);
    EventObj.$on("updateLineDesc", this.updateLineDesc, this);
    EventObj.$on("updateLineEvent", this.updateLineEvent, this);
    EventObj.$on("updateContextMenu", this.updateContextMenu, this);
    EventObj.$on("saveDragData", this.saveDragData, this);
    EventObj.$on("hideLineContextMenu", this.hideLineContextMenu, this);
    EventObj.$on("hideStateContextMenu", this.hideStateContextMenu, this);
    EventObj.$on("hideMenus", this.hideMenus, this);

    EventObj.$on("state2blockly", this.state2blockly, this);
    EventObj.$on(
      "clearBlocklyXmlOfLocalStorage",
      this.clearBlocklyXmlOfLocalStorage,
      this
    );
    EventObj.$on(
      "reloadBlocklyXmlOfLocalStorage",
      this.reloadBlocklyXmlOfLocalStorage,
      this
    );
    EventObj.$on("saveQBlock2BlocklyXml", this.saveQBlock2BlocklyXml, this);
    EventObj.$on("openWebSocket", this.openWebSocket, this);
    EventObj.$on("testLayout", this.testLayout, this);

    window.addEventListener("message", function (e) {
      let data = e.data;
      if (data.eventType === "setBreakpoint") {
        statePageVue.setBp(data.blockId);
      }
    });
    this.loadAllData();
    this.prevRunningState = "";
  },
  mounted() {
    window.statePageVue = this;
    //let threadDom = document.getElementsByClassName("en")[0]
    //let threadDomClass = threadDom.getAttribute("class").replace("en", "zh")
    //threadDom.setAttribute("class", threadDomClass)
    /* var importFileBtn = document.getElementById("importFile");
    if (importFileBtn) {
      importFileBtn.addEventListener("change", function (e) {
        var file = e.target.files[0];
        var reader = new FileReader();
        reader.onload = (fe) => {
          window.statePageVue.threadAry = JSON.parse(fe.target.result);
        };
        reader.readAsText(file);
      });
    }
    this.iframeHeight = window.innerHeight - 65; //header与toolbox的高度 */
  },
  beforeDestroy() {
    //将Blockly图面数据更新到localstorage的blockly.xml
    // var blocklyXml = Util.state2blockly(this.threadAry);
    // window.localStorage.setItem("blocklyXml", blocklyXml);
  },
};
</script>

<style lang="less" scoped>
* {
  user-select: none;
}
#statePage {
  h4.title {
    margin: 0;
    width: 100%;
    height: 35px;
    color: #ffffff;
    background-color: rgba(0, 219, 255, 0.42);
  }
  .thread-body {
    /* height: calc(100% -35px); */
    height: 265px;
  }

  .toolbox {
    position: fixed;
    width: 100%;
    // background-color: #ffffff;
    padding: 10px 0;
    // border: 1px solid #ebebeb;
    border-radius: 3px;
    background-color: #0a0b44;
    border-bottom: 1px solid #243992;
    z-index: 1;
  }
  .content {
    padding-top: 54px;
    background-color: #0a0b44;
    // text-align: center;
    > svg {
      /* width: 100%;  */
      /* height: calc(100%); */
      border: 1px solid rgba(0, 219, 255, 0.42);
      background-color: #001f3a;
    }
  }
  text {
    fill: #ffffff;
  }

  .state {
    stroke: #aaaaaa;
    stroke-width: 1;
    fill: #00dbff;
  }
  .templine {
    stroke: rgba(0, 219, 255, 0.42);
    stroke-width: 1px;
  }
  .templine:hover {
    stroke: yellow;
  }

  @keyframes qkm_scale {
    0% {
    }
    /*   50%{
    } */
    100% {
    }
  }

  @templateDivH: 30px;
  @qkmLightGreen: #1cf9ea;
  @qkmOrange: #ffaf3d;
  @qkmBlue: #3897e7;
  @qkmPink: #ed5e67;
  @qkmPurple: #9373ec;
  @qkmGrey: #aaaaaa;
  @qkmWhite: #ffffff;
  .template-thread {
    display: inline-block;
    position: relative;
    margin-left: 20px;
    height: 40px;
    line-height: 40px;
    border: 1px solid #00dbff;
    border-radius: 5px;
    // color: #00dbff;
    color: #aaaaaa;
    text-align: center;
    cursor: grab;
    font-size: 14px;
    &:hover {
      // border-image: -webkit-linear-gradient(-45deg, #50FBFF, #7898F9) 5 5;
      // animation: qkm_scale .3s;
      // box-shadow: 0 0 5px 1px #fff;
      color: #fff;
    }
  }
  .template-state,
  .template-loop {
    display: inline-block;
    position: relative;
    margin-left: 20px;
    width: 100px;
    height: 40px;
    line-height: 40px;
    border: 1px solid #00dbff;
    border-radius: 5px;
    // color: #00dbff;
    color: #aaaaaa;
    text-align: center;
    cursor: grab;
    font-size: 14px;
    &:hover {
      // border-image: -webkit-linear-gradient(-45deg, #50FBFF, #7898F9) 5 5;
      // animation: qkm_scale .3s;
      // box-shadow: 0 0 5px 1px #fff;
      color: #fff;
    }
  }

  .template-thread {
    // background-color: #3897E7;
    border-color: @qkmWhite;
    box-shadow: inset 0 0 5px 1px @qkmWhite;
    box-shadow: 0 0 5px 1px @qkmWhite;
    // background-color: @qkmBlue;
    cursor: pointer;
    &:hover {
      color: #fff;
      box-shadow: 0 0 5px 2px @qkmWhite;
    }
  }
  .template-state {
    // background-color: #9373ec;
    border-color: @qkmGrey;
    box-shadow: inset 0 0 5px 1px @qkmGrey;
  }
  .template-loop {
    // background-color: #ed5e67;
    border-color: @qkmPink;
    box-shadow: inset 0 0 5px 1px @qkmPink;
  }
}
</style>    