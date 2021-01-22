<template>
  <!-- <div class="thread" :style="{width: thread.width + 'px', height: thread.height + 'px' }" @drop.prevent="drop" @dragover.prevent @mouseup="endResize"  -->
  <div
    :class="['thread', showThread ? 'is-expanded' : 'is-collapsed', {selected: isInActiveThread()}]"
    :style="{ width: thread.width + 'px', height: computedH + 'px' }"
    @drop.prevent="drop"
    @dragover.prevent
    @mouseup="endResize"
    @mousemove="resizingStateOrMoveLine"
    @keyup.ctrl="handleShortcutKeys"
    tabindex="0"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      :id="thread.id"
      class="thread-svg"
    >
      <g>
        <foreignObject y="0" width="100%" height="100%" @mouseup="onMouseup" @mousemove="onConnecting">
          <div class="toggle-thread">
            <el-button v-if="showThread" plain icon="el-icon-arrow-up" @click.stop="toggleShowThread"></el-button>
            <el-button v-else plain icon="el-icon-arrow-down" @click.stop="toggleShowThread"></el-button>
          </div>
          <div class="delete-thread">
            <el-button plain icon="el-icon-delete" @click.stop="deleteThread" v-show="isNotMainThread()"></el-button>
          </div>
          <div class="operating" v-show="thread.runningStatus == 'operating'" style="color: rgb(26,250,41);">
            <img src="../../../static/imgs/operating.png">运行中
          </div>
          <div class="pausing" v-show="thread.runningStatus == 'pausing'" style="color: yellow;">
            <img src="../../../static/imgs/pausing.png">暂停
          </div>
          <div class="stopping" v-show="thread.runningStatus == 'stopping'" style="color: red;">
            <img src="../../../static/imgs/stopping.png">停止
          </div>
          <h4 class="title" contenteditable="true" :style="titleStyle">
            {{ thread.name }}
          </h4>
          <div class="tools">
            <el-button plain icon="el-icon-aim" @click.stop="leftTopPosition"></el-button>
          </div>
          <div class="thread-body" @mousedown="startMovingCanvas" @mousemove="onMovingCanvas" @click="updateActiveThread" @mouseup="stopMovingLine">
            <state-wrap
              v-for="(stateItem, index) in thread.stateAry"
              :key="index"
              :stateData="stateItem"
              :index="index"
              :threadIndex="threadIndex"
              :runningStateData="runningStateData"
              :activeStates="activeStates"
              :showDeleteStateMenu="showDeleteStateMenu"
              :showLineContextMenu="showLineContextMenu"
              @updateStateData="updateStateData"
              @updateTempLineData="updateTempLineData"
              @updateMoveData="updateMoveData"
              @updateActiveState="updateActiveState"
              @stopMoving="stopMoving"
              @hideMenus="hideMenus"
            />
          </div>
        </foreignObject>
        <g class="lines">
          <line-comp
          class="temp-line"
          :line="tempLineData"
          :lineType="'tempLine'"
          :threadIndex="threadIndex"
          v-if="showTempLine"
          ></line-comp>
          <line-comp
            v-for="(line, index2) in thread.lineAry"
            :key="index2"
            :line="line"
            :activeLines="activeLines"
            :lineType="line.type"
            :threadIndex="threadIndex"
            @updateActiveLine="updateActiveLine"
            @updateMoveLineData="updateMoveLineData"
            @stopMovingLine="stopMovingLine"
          />
        </g>
        <path-animation
          v-if="isLineInCurrentThread(runningLineId)"
          :runningLineId="runningLineId"
        ></path-animation>
      </g>
      <defs>
        <filter id="f1" x="0" y="0" width="200%" height="200%">
          <feOffset result="offOut" in="SourceGraphic" dx="1.5" dy="1.5" />
          <feGaussianBlur result="blurOut" in="offOut" stdDeviation="3" />
          <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
        </filter>
      </defs>
    </svg>
    <!-- <i class="resize-icon" :style="{ backgroundImage: 'url(' + moveVerticalImg + ')'}"></i> -->
    <i
      v-show="showThread"
      class="resize-icon resizable"
      :style="{
        backgroundImage: 'url(' + resizableImg + ')',
        backgroundRepeat: 'no-repeat',
      }"
      @mousedown="startResize"
      @mouseup="endResize"
    ></i>
    <!-- <div v-if="showVirtualBox" class="virtual-box"></div> -->
  </div>
</template>

<script>
import StateWrap from "./StateWrap";
import LineComp from "./LineComp";
import PathAnimation from "./PathAnimation";
import { lineCfg } from "./graphCfg.js";
import Tools from "@/Tools.js";
import QBlock from "./qblock.js";
import dagre from "dagre";
import Util from "./util.js";
const LINE_H = lineCfg.line_h;
const LINE_V = lineCfg.line_v;
const LINE_RADIUS = lineCfg.line_radius;
const HIGHLIGHT_LIMIT = lineCfg.highlight_limit;
const UNDO_REDO_LIMIT = lineCfg.undo_redo_limit;
export default {
  name: "ThreadSvg",
  props: [
    "thread",
    "threadIndex",
    "runningLineId",
    "runningStateData",
    "threadRunningData",
    "activeThreadIndex",
    "showDeleteStateMenu",
    "showLineContextMenu",
  ],
  components: {
    StateWrap,
    LineComp,
    PathAnimation,
  },
  data() {
    return {
      // bgImg: '../../../../static/imgs/grid3-50x50.png',
      bgImg: "./static/imgs/tmp3.png",
      showVirtualBox: false,
      showTempLine: false,
      showThread: true,
      //tempLineClass: "templine",
      activeStates: [],
      activeLines: [],
      tempLineData: {
        type: "tempLine",
        verticalOffset: 0,
        startState: null,
        endState: null,
        startPoint: {
          x: 0,
          y: 0,
        },
        endPoint: {
          x: 0,
          y: 0,
        },
        d: "",
      },
      //threadCount: 1,
      titleHeight: lineCfg.threadTitleHeight,
      moveVerticalImg: "./static/imgs/move-vertical.png",
      resizableImg: "./static/imgs/resizable.png",
      moveLineData: {
        startPoint: {
          y: 0,
        },
        endPoint: {},
      },
      moveData: {
        startPoint: {
          x: 0,
          y: 0,
        },
        endPoint: {},
      }, //在线程框内鼠标移动相关的数据
    };
  },
  methods: {
    hideMenus() {
      this.$emit("hideMenus");
    },
    isInActiveThread() {
      if (this.activeThreadIndex === this.threadIndex) {
        return true;
      }
      return false;
    },
    //判断在当前线程框内鼠标移动的情况，若当前鼠标正在移动画布，绘制连线，改变状态，配置连线和线程框的尺寸时，不触发高亮线程框的事件
    hasNotMovedInThread() {
      if (stateManage.hasDrawedLine) {
        stateManage.hasDrawedLine = false;
        return false;
      } else if (this.showVirtualBox) {
        this.showVirtualBox = false;
        return false;
      } else if (stateManage.hasResizedState) {
        stateManage.hasResizedState = false;
        return false;
      } else if (stateManage.hasMovedCanvas) {
        stateManage.hasMovedCanvas = false;
        return false;
      } else if (stateManage.hasMovedLine) {
        stateManage.hasMovedLine = false;
        return false;
      }
      return true;
    },
    updateActiveThread() {
      if (this.hasNotMovedInThread()) {
        this.$emit("updateActiveThread", this.threadIndex);
      }
    },
    getLeftMostState() {
      let stateAry = store.stateData.threadAry[this.threadIndex].stateAry;
      let smallestStateX = 1000000;
      let smallestStateXId;
      stateAry.forEach((state) => {
        if (state.x < smallestStateX) {
          smallestStateX = state.x;
          smallestStateXId = state.stateId;
        }
      });
      let leftMostState = store.getState(this.threadIndex, smallestStateXId);
      return leftMostState;
    },
    getUpMostState() {
      let stateAry = store.stateData.threadAry[this.threadIndex].stateAry;
      let smallestStateY = 1000000;
      let smallestStateYId;
      stateAry.forEach((state) => {
        if (state.y < smallestStateY) {
          smallestStateY = state.y;
          smallestStateYId = state.stateId;
        }
      });
      let upMostState = store.getState(this.threadIndex, smallestStateYId);
      return upMostState;
    },
    leftTopPosition() {
      let stateAry = store.stateData.threadAry[this.threadIndex].stateAry;
      let leftMostState = this.getLeftMostState();
      let upMostState = this.getUpMostState();
      let offset = {
        x: leftMostState.x - 20,
        y: upMostState.y - 20,
      };
      stateAry.forEach((state) => {
        state.x = state.x - offset.x;
        state.y = state.y - offset.y;
      });
    },
    isNotMainThread() {
      if (this.threadIndex === 0) {
        return false;
      }
      return true;
    },
    toggleShowThread() {
      this.showThread = !this.showThread;
      let threadDom = document.getElementsByClassName("thread")[
        this.threadIndex
      ];
      let threadheight = this.computedH;
      if (this.showThread === false) {
        threadDom.style.height = this.titleHeight + "px";
      } else {
        threadDom.style.height = threadheight + "px";
      }
    },
    deleteThread() {
      store.stateData.threadAry.splice(this.threadIndex, 1);
    },
    updateActiveLine(selectedLine) {
      //处理连线的高亮
      let lineIndex = this.activeLines.indexOf(selectedLine);
      if (lineIndex !== -1) {
        this.activeLines.splice(lineIndex, 1);
      } else {
        this.activeLines.push(selectedLine);
      }
      this.$nextTick(function () {
        let lineDom = document.getElementsByClassName("lines")[
          this.threadIndex
        ];
        let activeLineDom = lineDom.getElementsByClassName("active");
        for (let i = 0; i < activeLineDom.length; i++) {
          lineDom.appendChild(activeLineDom[0]);
        }
      });
    },
    updateActiveState(selectedState) {
      //取消选择已经存在于activeState内的state时，从activeState内删除被取消选择的状态
      let spliceIndex = this.activeStates.indexOf(selectedState);
      if (spliceIndex !== -1) {
        let disactiveState = this.activeStates.splice(spliceIndex, 1)[0];
        this.disHighlightLines(disactiveState);
      } else {
        //选中的状态个数超出选中状态的上限时，删除存在于activeStates内的状态
        this.activeStates.push(selectedState);
        if (this.activeStates.length > HIGHLIGHT_LIMIT) {
          let newActiveState = this.activeStates.pop();
          while (this.activeStates.length > 0) {
            let disactiveState = this.activeStates.pop();
            this.disHighlightLines(disactiveState);
          }
          this.activeStates.push(newActiveState);
        }
      }
      //处理取消选中状态时同时取消连线高亮
      for (let i = 0; i < this.activeStates.length; i++) {
        this.disHighlightLines(this.activeStates[i]);
        this.highlightLines(this.activeStates[i]);
      }
      this.$nextTick(function () {
        let lineDom = document.getElementsByClassName("lines")[
          this.threadIndex
        ];
        let activeLineDom = lineDom.getElementsByClassName("active");
        for (let i = 0; i < activeLineDom.length; i++) {
          lineDom.appendChild(activeLineDom[0]);
        }
      });
    },

    highlightLines(state) {
      if (state.inputAry) {
        state.inputAry.forEach((inputLine) => {
          if (this.activeLines.indexOf(inputLine.lineId) === -1) {
            this.activeLines.push(inputLine.lineId);
          }
        });
      }
      if (state.outputAry) {
        state.outputAry.forEach((outputLine) => {
          if (this.activeLines.indexOf(outputLine.lineId) === -1) {
            this.activeLines.push(outputLine.lineId);
          }
        });
      }
      return;
    },
    disHighlightLines(state) {
      let spliceIndex;
      if (state.inputAry) {
        state.inputAry.forEach((inputLine) => {
          if (this.activeLines.indexOf(inputLine.lineId) !== -1) {
            spliceIndex = this.activeLines.indexOf(inputLine.lineId);
            this.activeLines.splice(spliceIndex, 1);
          }
        });
      }
      if (state.outputAry) {
        state.outputAry.forEach((outputLine) => {
          if (this.activeLines.indexOf(outputLine.lineId) !== -1) {
            spliceIndex = this.activeLines.indexOf(outputLine.lineId);
            this.activeLines.splice(spliceIndex, 1);
          }
        });
      }
      return;
    },
    isLineInCurrentThread(lineId) {
      let currentThread = store.stateData.threadAry[this.threadIndex];
      let currentLineAry = currentThread.lineAry;
      for (let i = 0; i < currentLineAry.length; i++) {
        if (currentLineAry[i].lineId === lineId) {
          return true;
        }
      }
      return false;
    },
    /**
     * 拖拽缩放部分
     */
    updateMoveData(data) {
      if (!this._isResizingState) {
        this._isResizingState = true;
      }
      Object.keys(data).forEach((key) => {
        this.moveData[key] = data[key];
      });
    },
    //停止对状态框的拖拽
    stopMoving() {
      this._isResizingState = false;
      this._resizingWidth = null;
      this._resizingHeight = null;
      store.updatePresentData(this.threadIndex);
    },
    //开始拖拽画布时，须记录状态原本的x坐标来计算状态在画布拖拽之后的位置
    startMovingCanvas(e) {
      //获取当前鼠标点下位置的path，若在path内index为1的dom的class不为null，则是在状态块以及循环状态上按下，此时不触发画布移动
      if (e.path[1].getAttribute("class") !== null) {
        return false;
      } else {
        stateManage.movingCanvas = true;
        this._canvasStartInfo = {
          x: e.pageX,
          y: e.pageY,
        };
        this._stateOrigin = [];
        let stateAry = store.stateData.threadAry[this.threadIndex].stateAry;
        stateAry.forEach((state) => {
          this._stateOrigin.push({
            x: state.x,
            y: state.y,
          });
        });
      }
    },
    //拖拽画布时须动态更新状态的位置
    updateStatePositionByCanvas(offset) {
      let stateAry = store.stateData.threadAry[this.threadIndex].stateAry;
      for (let i = 0; i < stateAry.length; i++) {
        stateAry[i].x = this._stateOrigin[i].x + offset.x;
        stateAry[i].y = this._stateOrigin[i].y + offset.y;
      }
    },
    updateCanvas(e) {
      this._canvasEndInfo = {
        x: e.pageX,
        y: e.pageY,
      };
      let canvasOffset = {
        x: this._canvasEndInfo.x - this._canvasStartInfo.x,
        y: this._canvasEndInfo.y - this._canvasStartInfo.y,
      };
      this.updateStatePositionByCanvas(canvasOffset);
      return canvasOffset;
    },
    onMovingCanvas(e) {
      if (!stateManage.movingCanvas) {
        return false;
      } else {
        if (e.buttons === 1) {
          let canvasOffset = this.updateCanvas(e);
          if (canvasOffset.x !== 0 && canvasOffset.y !== 0) {
            stateManage.hasMovedCanvas = true;
          }
        } else {
          this._canvasStartInfo = null;
          this._canvasEndInfo = null;
          this._stateOrigin = null;
          stateManage.movingCanvas = false;
        }
      }
    },
    onConnecting(e) {
      if (stateManage.isConnecting) {
        stateManage.movingCanvas = false;
        //检测鼠标左键是否仍是按下状态    ===1 说明鼠标左键被按下后未松开
        if (e.buttons === 1) {
          //绘制临时的连接线
          stateManage.hasDrawedLine = true;
          this.showTempLine = true;
          let endPoint = this.getEndPoint(e);
          this.updateTempLineData({ endPoint: endPoint });
        } else {
          stateManage.isConnecting = false;
          this.showTempLine = false;
          return;
        }
      }
    },
    updateMoveLineData(data) {
      if (data.startMovingLine) {
        this._isMovingLine = true;
        this._isResizingState = false;
      }
      Object.keys(data).forEach((key) => {
        this.moveLineData[key] = data[key];
      });
    },
    stopMovingLine() {
      this._isMovingLine = false;
      this._movingVerticalOffset = null;
      store.updatePresentData(this.threadIndex);
    },
    //监测线程框内的鼠标移动，改变状态的尺寸
    resizingStateOrMoveLine(e) {
      if (!this._isResizingState && !this._isMovingLine) {
        return false;
      }
      stateManage.movingCanvas = false;
      stateManage.hasMovedLine = true;
      if (this.moveData.operate === "resize-state") {
        this.updateMoveData({
          endPoint: {
            x: e.pageX,
            y: e.pageY,
          },
        });
      } else {
        this.updateMoveLineData({
          endPoint: {
            y: e.pageY,
          },
        });
      }
      let moveData = this.moveData;
      let moveLineData = this.moveLineData;
      if (this._isResizingState) {
        this._isMovingLine = false;
        stateManage.hasResizedState = true;
        this.resizingState(moveData);
      } else if (this._isMovingLine) {
        this._isResizingState = false;
        stateManage.hasMovedLine = true;
        this.movingLine(moveLineData);
      }
    },
    //调节连线，根据鼠标位移的距离更新line.verticalOffset，以供重绘连线
    movingLine(moveLineData) {
      let offsetY = moveLineData.endPoint.y - moveLineData.startPoint.y;
      let lineAry = store.stateData.threadAry[this.threadIndex].lineAry;
      let lineData;
      lineAry.forEach((line) => {
        if (line.lineId === moveLineData.lineId) {
          lineData = line;
        }
      });
      if (!this._movingVerticalOffset) {
        this._movingVerticalOffset = lineData.verticalOffset;
      }
      let lineVerticalOffset = this._movingVerticalOffset + offsetY;
      lineData.verticalOffset = lineVerticalOffset;
    },
    //改变状态的尺寸，嵌套状态内部的状态的尺寸不得大于其父状态
    resizingState(moveData) {
      let resizingState = store.getState(this.threadIndex, moveData.stateId);
      if (!this._resizingWidth) {
        this._resizingWidth = Util.translatePX2Num(resizingState.width);
      }
      if (!this._resizingHeight) {
        this._resizingHeight = Util.translatePX2Num(resizingState.height);
      }

      let offsetX = moveData.endPoint.x - moveData.startPoint.x;
      let offsetY = moveData.endPoint.y - moveData.startPoint.y;
      let stateWidth = this._resizingWidth + offsetX;
      let stateHeight = this._resizingHeight + offsetY;

      if (resizingState.parent) {
        let resizingStateParent = store.getState(
          this.threadIndex,
          resizingState.parent
        );
        let resizingStateParentWidth = Util.translatePX2Num(
          resizingStateParent.width
        );
        let resizingStateParentHeight = Util.translatePX2Num(
          resizingStateParent.height
        );
        if (
          this._resizingWidth + offsetX + resizingState.x >
          resizingStateParentWidth
        ) {
          stateWidth = resizingStateParentWidth - resizingState.x;
        }
        if (
          this._resizingHeight + offsetY + resizingState.y >
          resizingStateParentHeight
        ) {
          stateHeight = resizingStateParentHeight - resizingState.y;
        }
      }
      resizingState.width = stateWidth + "px";
      resizingState.height = stateHeight + "px";
    },
    titleStyle() {
      return `height: ${this.titleHeight}px;`;
    },
    updateTempLineData(lineData) {
      Object.keys(lineData).forEach((key) => {
        this.tempLineData[key] = lineData[key];
      });
    },
    drawConnectLine(e) {
      store.updateUndoData(this.threadIndex);
      store.focusCurrentThread(this.threadIndex);
      let endStateId = this.getEndState(e).stateId;
      let lineData = this.copy(this.tempLineData);
      let startState = store.getState(
        this.threadIndex,
        lineData.startState.stateId
      );
      let endState = store.getState(this.threadIndex, endStateId);
      lineData.endState = endState;
      lineData.lineId = window.genId("line");
      lineData.desc = "";
      lineData.type = "default";
      lineData.verticalOffset = 0;
      store.addLine({
        threadIndex: this.threadIndex,
        lineData: lineData,
      });
      store.updatePresentData(this.threadIndex);
      //需要通过lineId来寻找可能需要删除的连线
      return lineData.lineId;
    },
    copy(obj) {
      return Tools.deepCopy(obj);
    },
    /**
     * 判断两根连线是否相同,如果连线1的开始状态==连线2的开始状态，且连线1的结束状态==连线2的结束状态，说明是同一根连线
     * @return Boolean
     */
    isSameLine(line1, line2, endStateId) {
      return (
        line1.startState.stateId === line2.startState.stateId &&
        line1.endState.stateId === endStateId
      );
    },
    isDuplicateLine(line, endStateId) {
      let dupFlag = false;
      let currentThread = store.stateData.threadAry[this.threadIndex];
      currentThread.lineAry.forEach((item) => {
        if (this.isSameLine(item, line, endStateId)) {
          dupFlag = true;
          return false;
        }
      });
      return dupFlag;
    },
    /**
     * 画连接线时找出起始的状态块
     */
    getStartState() {},
    /**
     * 获取鼠标松开时停留在哪个状态块上面
     * @return object { stateId: 状态块的stateid属性}
     */
    getEndState(e) {
      let stateId = null,
        clazz = ".state-wrap",
        stateIndex;
      if (e.target.closest(clazz)) {
        stateId = e.target.closest(clazz).getAttribute("stateid");
        stateIndex = parseInt(
          e.target.closest(clazz).getAttribute("index"),
          10
        );
      }
      return {
        stateId: stateId,
        stateIndex: stateIndex,
      };
    },
    getEndPoint(e) {
      let curSvg = e.target.closest("svg");
      let curSvgRect = curSvg.getBoundingClientRect();
      let target_class = e.target.getAttribute("class");
      let regIsConnectPoint = /connect-point/;
      let point;
      if (regIsConnectPoint.test(target_class)) {
        point = {
          x:
            e.target.getBoundingClientRect().left -
            curSvgRect.left -
            2 +
            e.target.getBoundingClientRect().width / 2, //e.target.offsetLeft + e.offsetX, // e.clientX,
          y:
            e.target.getBoundingClientRect().top -
            curSvgRect.top +
            e.target.getBoundingClientRect().height / 2, //e.target.offsetTop + e.offsetY // e.clientY
        };
      } else {
        point = {
          x: e.clientX - curSvgRect.left - 2, //e.target.offsetLeft + e.offsetX, // e.clientX,
          y: e.clientY - curSvgRect.top - 2, //e.target.offsetTop + e.offsetY // e.clientY
        };
      }
      return point;
    },
    onMouseup(e) {
      if (!stateManage.isConnecting) {
        this.showTempLine = false;
      }
      if (stateManage.isConnecting) {
        //TODO 触发EventObj更新lineObj
        let curSvg = e.target.closest("svg");
        let curSvgRect = curSvg.getBoundingClientRect();
        let target_class = e.target.getAttribute("class");
        let regIsConnectPoint = /connect-point/;
        let existedLine = false;
        let endStateId = this.getEndState(e).stateId;
        let startState = store.getState(
          this.threadIndex,
          this.tempLineData.startState.stateId
        );
        let endState;
        if (endStateId) {
          endState = store.getState(this.threadIndex, endStateId);
        }
        if (regIsConnectPoint.test(target_class)) {
          //绘制连接线
          existedLine = this.isDuplicateLine(this.tempLineData, endStateId);
          if (existedLine) {
            this.showTempLine = false;
            return;
          } else if (startState.parent !== endState.parent) {
            this.showTempLine = false;
            return;
          } else if (
            endState &&
            endStateId === this.tempLineData.startState.stateId
          ) {
            return;
          } else {
            //TODO: 添加循环组件内部的连线
            let drawingLineId = this.drawConnectLine(e);
            this.handleLoops(
              drawingLineId,
              endStateId,
              this.tempLineData.startState.stateId
            );
            store.updatePresentData(this.threadIndex);
          }
        }
        this.showTempLine = false;
        stateManage.isConnecting = false;
      }
    },
    /**
     * 获取与可能形成循环的状态处在同一级的所有状态
     * @param {endStateId}
     */
    getStatesInCurrentLayer(endStateId) {
      let statesInLoopLayer;
      let loopLayerId = store.getState(this.threadIndex, endStateId).parent;
      if (loopLayerId) {
        let loopLayer = store.getState(this.threadIndex, loopLayerId);
        statesInLoopLayer = loopLayer.children;
        return statesInLoopLayer;
      } else {
        return store.stateData.threadAry[this.threadIndex].stateAry;
      }
    },
    /**
     * 判断与处理状态图内可能存在的循环结构
     *
     * @param {drawingLineId, endStateId}
     */
    handleLoops(drawingLineId, endStateId, startStateId) {
      let lineAry = store.stateData.threadAry[this.threadIndex].lineAry;
      let statesInLoopLayer = this.getStatesInCurrentLayer(endStateId);
      let inLoopStatesId = this.getInLoopStatesId(statesInLoopLayer, lineAry);
      if (inLoopStatesId && inLoopStatesId.length !== 0) {
        alert("该连线会形成循环结构");
        store.deleteLine({
          lineId: drawingLineId,
          threadIndex: this.threadIndex,
        });
        let loopStateData = this.createLoop(inLoopStatesId, statesInLoopLayer);
        //若走到这里，则可以判断当前的endstate为循环状态内的起始状态
        //TODO: 考虑循环状态内部的连线样式
        this.relateLine2LoopStart(
          endStateId,
          loopStateData,
          statesInLoopLayer,
          lineAry
        );
        this.relateLine2LoopEnd(
          startStateId,
          loopStateData,
          statesInLoopLayer,
          lineAry
        );
      }
    },
    /**
     * 根据当前状态图建立用于判断循环结构的图
     * @param {statesInLoopLayer, lineAry}
     */
    createGraphForFindingLoop(statesInLoopLayer, lineAry) {
      var g = new dagre.graphlib.Graph({
        multigraph: true,
      });
      statesInLoopLayer.forEach((state) => {
        g.setNode(state.stateId, {
          label: state.name,
          width: QBlock.State.getStateWidth(state),
          height: QBlock.State.getStateHeight(state),
        });

        state.outputAry.forEach((line) => {
          let lineObj = lineAry.find((item) => {
            return item.lineId === line.lineId;
          });

          let endState = statesInLoopLayer.find((item) => {
            return item.stateId === lineObj.endState.stateId;
          });
          if (!endState) {
            return;
          }
          g.setEdge(state.stateId, endState.stateId, {
            label: line.lineId,
          });
        });
      });
      return g;
    },
    /**
     * 获取当前状态图中形成的环
     * @param {statesInLoopLayer, lineAry}
     */
    getInLoopStatesId(statesInLoopLayer, lineAry) {
      let g = this.createGraphForFindingLoop(statesInLoopLayer, lineAry);
      return dagre.graphlib.alg.findCycles(g)[0];
    },
    /**
     * 建立一个循环状态来包裹形成循环的状态块
     * @param {inLoopStates, statesInLoopLayer}
     */
    createLoop(inLoopStatesId, statesInLoopLayer) {
      let loopStatePosition = this.calculateLoopPosition(inLoopStatesId);
      let loopStateTemplate = {
        x: loopStatePosition.x - 40,
        y: loopStatePosition.y - 40,
        stateType: "loopDiv",
        index: this.threadIndex,
      };
      let loopState = store.getDefaultStateCfg(loopStateTemplate);
      let loopStateId = loopState.stateId;
      loopState.width = this.calculateLoopWidth(inLoopStatesId);
      loopState.height = this.calculateLoopHeight(inLoopStatesId);

      let loopStateParent = store.getState(this.threadIndex, inLoopStatesId[0])
        .parent;
      this.addStateToLoop(
        inLoopStatesId,
        statesInLoopLayer,
        loopState,
        loopStateId
      );
      loopState.parent = loopStateParent;
      statesInLoopLayer.push(loopState);
      let loopStateData = {
        stateId: loopState.stateId,
        loopState: loopState,
        startPoint: {
          x: loopState.x + QBlock.State.getStateWidth(loopState),
          y: loopState.y + QBlock.State.getStateHeight(loopState) / 2,
        },
        endPoint: {
          x: loopState.x,
          y: loopState.y + QBlock.State.getStateHeight(loopState) / 2,
        },
      };
      return loopStateData;
    },
    /**
     * 计算循环状态的左上角位置
     * @param {inLoopStatesId}
     */
    calculateLoopPosition(inLoopStatesId) {
      let minX = 10000;
      let minY = 10000;
      inLoopStatesId.forEach((currentStateId) => {
        let currentState = store.getState(this.threadIndex, currentStateId);
        minX = currentState.x < minX ? currentState.x : minX;
        minY = currentState.y < minY ? currentState.y : minY;
      });
      return {
        x: minX,
        y: minY,
      };
    },
    /**
     * 计算循环状态的宽度
     * @param {inLoopStatesId}
     */
    calculateLoopWidth(inLoopStatesId) {
      let minX = 10000;
      let maxX = 0;
      //获取x坐标最大的状态的宽度
      function findRightestState(inLoopStatesId, threadIndex) {
        let rightestStateX = 0;
        let rightestState;
        for (let i = 0; i < inLoopStatesId.length; i++) {
          let currentState = store.getState(threadIndex, inLoopStatesId[i]);
          if (currentState.x > rightestStateX) {
            rightestStateX = currentState.x;
            rightestState = currentState;
          }
        }
        return rightestState;
      }

      let rightestState = findRightestState(inLoopStatesId, this.threadIndex);
      let rightestStateWidth = QBlock.State.getStateWidth(rightestState);

      inLoopStatesId.forEach((currentStateId) => {
        let currentState = store.getState(this.threadIndex, currentStateId);
        minX = currentState.x < minX ? currentState.x : minX;
        maxX = currentState.x > maxX ? currentState.x : maxX;
        return false;
      });
      let width = maxX - minX + rightestStateWidth + 80 + "px";
      return width;
    },
    /**
     * //计算循环状态的高度
     * @param {inLoopStatesId}
     */
    calculateLoopHeight(inLoopStatesId) {
      let minY = 10000;
      let maxY = 0;
      let threadIndex = this.threadIndex;

      //获取在形成循环的状态中，下边缘最低的状态的下边缘y坐标
      function findLowestStateBottom(inLoopStatesId, threadIndex) {
        let lowestStateBottom = 0;
        for (let i = 0; i < inLoopStatesId.length; i++) {
          let currentState = store.getState(threadIndex, inLoopStatesId[i]);
          let currentStateHeight = QBlock.State.getStateHeight(currentState);
          let currentStateBottom = currentState.y + currentStateHeight;
          if (currentState.y + currentStateHeight > lowestStateBottom) {
            lowestStateBottom = currentStateBottom;
          }
        }
        return lowestStateBottom;
      }

      let lowestStateBottom = findLowestStateBottom(
        inLoopStatesId,
        this.threadIndex
      );
      inLoopStatesId.forEach((currentStateId) => {
        let currentState = store.getState(this.threadIndex, currentStateId);
        minY = currentState.y < minY ? currentState.y : minY;
      });

      let height = lowestStateBottom - minY + 80 + "px";
      return height;
    },
    /**
     * 将形成循环的状态添加进循环状态
     * @param {inLoopStatesId, statesInLoopLayer, loopState, loopStateId}
     */
    addStateToLoop(inLoopStatesId, statesInLoopLayer, loopState, loopStateId) {
      for (let i in inLoopStatesId) {
        let currentState = store.getState(this.threadIndex, inLoopStatesId[i]);
        currentState.x -= loopState.x;
        currentState.y -= loopState.y;
        this.deleteDuplicateState(statesInLoopLayer, currentState.stateId);
        currentState.parent = loopStateId;
        loopState.children.push(currentState);
      }
    },
    relateLine2LoopEnd(
      lastLoopStateId,
      loopStateData,
      statesInLoopLayer,
      lineAry
    ) {
      let loopStateIndex;
      statesInLoopLayer.forEach((state, index) => {
        if (state.stateId === loopStateData.stateId) {
          loopStateIndex = index;
        }
      });
      let lastLoopState = store.getState(this.threadIndex, lastLoopStateId);

      for (let i = 0; i < lastLoopState.outputAry.length; i++) {
        let lineData;
        lineAry.forEach((item) => {
          if (item.lineId === lastLoopState.outputAry[i].lineId) {
            lineData = item;
          }
        });
        lineData.startPoint = {
          x: loopStateData.endPoint.x,
          y: loopStateData.endPoint.y,
        };
        lineData.startState = {
          stateId: loopStateData.stateId,
          stateIndex: loopStateIndex,
        };
        store.relateLine2startState({
          threadIndex: this.threadIndex,
          lineData: lineData,
        });
      }
      lastLoopState.outputAry = [];
      this.updateLines(lastLoopState);
    },
    /**
     * 将外层状态连入循环状态中第一个被执行的状态的连线连接到循环状态的连入点
     * @param {firstLoopStateId, loopStateData, statesInLoopLayer, lineAry}
     */
    relateLine2LoopStart(
      firstLoopStateId,
      loopStateData,
      statesInLoopLayer,
      lineAry
    ) {
      let loopStateIndex;
      statesInLoopLayer.forEach((state, index) => {
        if (state.stateId === loopStateData.stateId) {
          loopStateIndex = index;
        }
      });
      let firstLoopState = store.getState(this.threadIndex, firstLoopStateId);

      for (let i = 0; i < firstLoopState.inputAry.length; i++) {
        let lineData;
        lineAry.forEach((item) => {
          if (item.lineId === firstLoopState.inputAry[i].lineId) {
            lineData = item;
          }
        });
        lineData.endPoint = {
          x: loopStateData.startPoint.x,
          y: loopStateData.startPoint.y,
        };
        lineData.endState = {
          stateId: loopStateData.stateId,
          stateIndex: loopStateIndex,
        };
        store.relateLine2endState({
          threadIndex: this.threadIndex,
          lineData: lineData,
        });
      }
      firstLoopState.inputAry = [];
      this.updateLines(firstLoopState);
    },
    /**
     * 将状态加入循环状态后删除原来的状态
     * @param {statesInLoopLayer, stateId}
     */
    deleteDuplicateState(statesInLoopLayer, stateId) {
      statesInLoopLayer.forEach((state, index) => {
        if (state.stateId === stateId) {
          statesInLoopLayer.splice(index, 1);
          return false;
        }
      });
    },
    drop(e) {
      //TODO：需要处理不允许用户跨线程拖拽状态块的问题
      if (e.dataTransfer.getData("operate") === "addState") {
        store.updateUndoData(this.threadIndex);
        this.addStateToThread(e);
        store.focusCurrentThread(this.threadIndex);
        store.updatePresentData(this.threadIndex);
      } else {
        let theDragStateData = JSON.parse(
          e.dataTransfer.getData("theDragStateData")
        );
        let leftGap = parseInt(e.dataTransfer.getData("mousedowntoleft"), 10);
        let topGap = parseInt(e.dataTransfer.getData("mousedowntotop"), 10);
        let isStateIdInThread = (id, thread) => {
          let flag = false;
          thread.stateAry.forEach((item) => {
            if (item.stateId === id) {
              flag = true;
              return false;
            }
          });
          return flag;
        };

        let stateInThreadFlag = isStateIdInThread(
          theDragStateData.stateId,
          this.thread
        );
        if (stateInThreadFlag) {
          return false;
        }
        //无论是从外层拖拽状态到循环组件内还是循环组件内的状态块移动，都应该将放开时的位置和当前循环块的位置做一次计算，得到目标位置
        //需要减去鼠标按下时与被拖动状态左上角的距离，线程框标题的高度，以及线程框border的宽度
        let x = e.pageX - this.$el.getBoundingClientRect().left - leftGap - 1;
        let y =
          e.pageY -
          this.$el.getBoundingClientRect().top -
          topGap -
          this.titleHeight -
          1;
        theDragStateData.x = x;
        theDragStateData.y = y;

        theDragStateData.parent = null;
        statePageVue.threadAry[this.threadIndex].stateAry.push(
          theDragStateData
        );

        let dragTargetParent =
          statePageVue.threadAry[this.threadIndex].stateAry;
        //去除线程索引
        statePageVue._dragData.indexAry.pop();
        dragTargetParent = this.getDropStateParent(
          statePageVue._dragData.indexAry,
          dragTargetParent
        );
        setTimeout(() => {
          dragTargetParent.splice(statePageVue._dragData.indexAry.pop(), 1);
        }, 10);
        store.updatePresentData(this.threadIndex);
        store.focusCurrentThread(this.threadIndex);
      }
    },
    getStateParentCount(state) {
      let parentCount = 0;
      while (state.parent !== null) {
        parentCount += 1;
        state = store.getState(this.threadIndex, state.parent);
      }
      return parentCount;
    },
    getDragStateLineType(line, dragData) {
      let startState =
        line.startState.stateId === dragData.stateId
          ? dragData
          : store.getState(this.threadIndex, line.startState.stateId);
      let endState =
        line.endState.stateId === dragData.stateId
          ? dragData
          : store.getState(this.threadIndex, line.endState.stateId);
      let startStateParentCount = this.getStateParentCount(startState);
      let endStateParentCount = this.getStateParentCount(endState);
      if (startState.parent === endState.parent) {
        return "default";
      } else if (startStateParentCount > endStateParentCount) {
        return "loopOut";
      } else if (endStateParentCount > startStateParentCount) {
        return "loopIn";
      }
    },
    //将从工具栏上拖拽下来的状态添加进当前线程内
    addStateToThread(e) {
      let threadPosInfo = e.target.getBoundingClientRect();
      let leftGap = e.dataTransfer.getData("mousedowntoleft");
      let topGap = e.dataTransfer.getData("mousedowntotop");
      let osTop = document.documentElement.scrollTop || document.body.srcollTop;
      let data = {
        index: this.threadIndex,
        x: e.x - threadPosInfo.x - leftGap,
        y: e.y - threadPosInfo.y - topGap,
        stateType: e.dataTransfer.getData("stateType"),
      };
      if (osTop) {
        data.y = data.y + osTop;
      }
      store.addState(data);
      return;
    },
    /**
     * 用于判断在drop时将drop的状态块添加为哪个状态块的children
     * @param {indexAry, parentStateAry}
     */
    getDropStateParent(indexAry, parentStateAry) {
      while (indexAry && indexAry.length > 1) {
        let i = indexAry.pop();
        parentStateAry = parentStateAry[i].children;
      }
      return parentStateAry;
    },
    /**
     * 更新状态数据，包括这个状态的位置和输入、输出连线
     */
    updateStateData(eventData) {
      let state = store.getState(this.threadIndex, eventData.stateId);
      this.updateLines(state);
      this.updateSubStatesLines(state);
    },
    /**
     * 更新某个状态块的所有输入连线和输出连线
     */
    updateLines(state) {
      let lineAry = store.stateData.threadAry[this.threadIndex].lineAry;
      let inputLine, outputLine;

      //更新目标状态的连入连线和连出连线
      if (state.inputAry) {
        state.inputAry.forEach((item) => {
          // inputLine --> state中保存的lineId以及对这个触发事件的描述等信息，没有真正的用于画连线的数据
          inputLine = lineAry.find((line) => {
            //line --> line的具体画连线的数据   inputLine与line通过lineId更新数据
            return line.lineId === item.lineId;
          });
          this.updateLinePath(inputLine);
        });
      }

      if (state.outputAry) {
        state.outputAry.forEach((item) => {
          outputLine = lineAry.find((line) => {
            return line.lineId === item.lineId;
          });
          this.updateLinePath(outputLine);
        });
      }
    },
    /**
     * 更新嵌套在父状态内部的状态的连线
     */
    updateSubStatesLines(state) {
      if (state) {
        for (var i = 0; i < state.children.length; i++) {
          this.updateLines(state.children[i]);
          this.updateSubStatesLines(state.children[i]);
        }
      }
    },
    /**
     * 状态移动后更新与状态相连的连线的起始点与结束点，传入LineComp进行渲染
     */
    updateLinePath(line, threadIndex) {
      if (!threadIndex) {
        threadIndex = this.threadIndex;
      }
      let startPoint, endPoint;
      startPoint = QBlock.Line.getStartPoint(line, threadIndex);
      endPoint = QBlock.Line.getEndPoint(line, threadIndex);
      line.startPoint = startPoint;
      line.endPoint = endPoint;
    },

    startResize(e) {
      this.showVirtualBox = true;
      stateManage.movingCanvas = false;
      EventObj.$emit("operateChange", {
        operate: "resize-thread",
        index: this.threadIndex,
        startPosition: {
          x: e.pageX,
          y: e.pageY,
        },
        originW: this.$el.offsetWidth,
        originH: this.$el.offsetHeight,
      });
    },
    endResize(e) {
      if (!this.showVirtualBox) {
        return false;
      }
      this.showVirtualBox = false;
      EventObj.$emit("operateChange", {
        operate: "default",
      });
      this._lastHeight = this.thread.height;
    },
    //复制被选中的状态，开始与结束状态不可被复制
    copyState() {
      let currentActiveStates = Tools.deepCopy(this.activeStates);
      if (!this._copiedStates) {
        this._copiedStates = currentActiveStates;
      }
      for (let i = 0; i < currentActiveStates.length; i++) {
        if (
          currentActiveStates[i].stateId === "state-end" ||
          currentActiveStates[i].stateId === "state-start"
        ) {
          currentActiveStates.splice(i, 1);
        } else {
          if (currentActiveStates[i].inputAry.length !== 0) {
            currentActiveStates[i].inputAry = [];
          }
          if (currentActiveStates[i].outputAry.length !== 0) {
            currentActiveStates[i].outputAry = [];
          }
        }
      }
      store.stateData.copiedStates = currentActiveStates;
      this._copiedStates = currentActiveStates;
    },
    genCopiedStateChildren(parent, state) {
      let newChildrenStateData = {
        stateType: state.stateType,
        x: state.x,
        y: state.y,
      };
      let newChildrenState = store.getDefaultStateCfg(newChildrenStateData);
      newChildrenState.width = state.width;
      newChildrenState.height = state.height;
      newChildrenState.mode = state.mode;
      newChildrenState.name = state.name;
      newChildrenState.parent = parent.stateId;
      return newChildrenState;
    },
    //粘贴被复制嵌套状态内的子状态
    pasteStateChildren(parent, copiedStateChildren) {
      copiedStateChildren.forEach((state, timeOutIndex) => {
        //由于stateId的计算机制是根据当前时间来的，复制完状态后需要间隔一段时间再复制同层的别的状态
        setTimeout(() => {
          let newChildrenState = this.genCopiedStateChildren(parent, state);
          if (state.children.length !== 0) {
            //由于stateId的计算机制是根据当前时间来的，需要间隔一段时间再将子状态复制过来
            setTimeout(() => {
              this.pasteStateChildren(newChildrenState, state.children);
            }, 10 * (timeOutIndex + 1));
          }
          parent.children.push(newChildrenState);
        }, 10 * (timeOutIndex + 1));
      });
    },
    genCopiedState(state) {
      if (typeof state.parent !== "string") {
        state.parent = null;
      }
      let newStateData = {
        stateType: state.stateType,
        x: state.x + Util.translatePX2Num(state.width) + this._offsetCount * 40,
        y:
          state.y + Util.translatePX2Num(state.height) + this._offsetCount * 40,
      };
      let copiedStateChildren = state.children;
      let newState = store.getDefaultStateCfg(newStateData);
      newState.width = state.width;
      newState.height = state.height;
      newState.mode = state.mode;
      newState.name = state.name;
      newState.parent = state.parent;
      return newState;
    },
    //粘贴被复制的状态
    pasteState() {
      store.updateUndoData(this.threadIndex);
      let copiedStateAry = this._copiedStates;
      copiedStateAry.forEach((state, timeOutIndex) => {
        //由于stateId的计算机制是根据当前时间来的，复制完状态后需要间隔一段时间再复制同层的别的状态
        setTimeout(() => {
          let newState = this.genCopiedState(state);
          //由于stateId的计算机制是根据当前时间来的，需要间隔一段时间再将子状态复制过来
          setTimeout(() => {
            this.pasteStateChildren(newState, state.children);
          }, 10 * (timeOutIndex + 1));
          store.stateData.threadAry[this.threadIndex].stateAry.push(newState);
          store.updatePresentData(this.threadIndex);
          this._offsetCount += 1;
        }, 10 * (timeOutIndex + 1));
      });
    },
    //撤销上一个操作
    undo() {
      let undoList = store.stateData.threadAry[this.threadIndex].undoStatesList;
      let redoList = store.stateData.threadAry[this.threadIndex].redoStatesList;
      if (undoList.length === 0) {
        return;
      }
      redoList.push(store.stateData.threadAry[this.threadIndex].presentState);
      store.stateData.threadAry[this.threadIndex].presentState = undoList.pop();
      store.stateData.threadAry[this.threadIndex].lineAry =
        store.stateData.threadAry[this.threadIndex].presentState.lineAry;
      store.stateData.threadAry[this.threadIndex].stateAry =
        store.stateData.threadAry[this.threadIndex].presentState.stateAry;
      store.stateData.threadAry[this.threadIndex].hasUndone = true;
    },
    //恢复上一个操作
    redo() {
      let undoList = store.stateData.threadAry[this.threadIndex].undoStatesList;
      let redoList = store.stateData.threadAry[this.threadIndex].redoStatesList;
      if (redoList.length === 0) {
        return;
      }
      undoList.push(store.stateData.threadAry[this.threadIndex].presentState);
      store.stateData.threadAry[this.threadIndex].presentState = redoList.pop();
      store.stateData.threadAry[this.threadIndex].lineAry =
        store.stateData.threadAry[this.threadIndex].presentState.lineAry;
      store.stateData.threadAry[this.threadIndex].stateAry =
        store.stateData.threadAry[this.threadIndex].presentState.stateAry;
    },
    handleShortcutKeys(e) {
      switch (e.keyCode) {
        case 67:
          this.copyState();
          break;
        case 86:
          this.pasteState();
          break;
        case 89:
          this.redo();
          break;
        case 90:
          this.undo();
          break;
        default:
      }
    },
  },

  mounted() {
    this._offsetCount = 1;
    var _this = this;
    let el = this.$el;
    var elm = el.querySelector("#test");
    if (elm) {
      this.stateBlock = new PlainDraggable(elm);
    }
    //每次重新加载组建时初始化用于恢复和撤销对状态图的操作的列表
    store.stateData.threadAry[this.threadIndex].undoStatesList = [];
    store.stateData.threadAry[this.threadIndex].redoStatesList = [];
  },
  created() {},
  computed: {
    computedH: function () {
      let maxY = 0;
      let threadDivBorderWidth = 1,
        stateDivBorderWidth = 1,
        stateDivHeight = 40; // 50是状态的高度
      this.thread.stateAry.forEach((state) => {
        // TODO  这里还需要根据状态是子状态还是父状态作判断，后续实现状态块时修改
        let stateHeight = Util.translatePX2Num(state.height);
        maxY = Math.max(
          state.y +
            this.titleHeight +
            stateHeight +
            2 * threadDivBorderWidth +
            2 * stateDivBorderWidth,
          maxY
        );
      });
      if (this.showVirtualBox) {
        return Math.max(maxY, this.thread.height);
      }
      this._lastHeight = this._lastHeight || this.thread.height;

      if (maxY > this._lastHeight) {
        this._lastHeight = maxY;
      }
      this.thread.height = this._lastHeight;
      return this._lastHeight;
      // return Math.max(this._lastHeight, this.thread.height);
    },
  },
};
</script>

<style lang="less" scoped>
div.thread {
  position: relative;
  display: inline-block;
  text-align: left;
  /* margin-top: 50px; */
  // margin-left: 50px;
  // left: 50%;
  // transform: translateX(-50%);
  margin: 25px;
  &:focus {
    outline: none;
  }
  foreignObject {
    // border: 1px solid #00cd9a;
    border: 1px solid #487afe;
    border-radius: 4px;
  }
  &.selected {
    box-shadow: 0px 0px 2px 2px #5280ff;
    border-radius: 4px;
  }
}
h4.title {
  margin: 0;
  width: 100%;
  height: 35px;
  padding-left: 15px;
  line-height: 35px;
  color: #ffffff;
  background-color: rgba(72, 122, 254, 0.42);
  // background-color: rgba(0, 219, 255, 0.42);
  // background-color: #487afe;
  // background-image: linear-gradient(100deg, #82FDFF, #7898F9);
}
.operating,
.pausing,
.stopping {
  margin: 0;
  line-height: 35px;
  padding-right: 10px;
  font-size: 15px;
  text-align: center;
  float: right;
  img {
    position: relative;
    top: 5px;
    right: 3px;
  }
}
.delete-thread .el-button,
.toggle-thread .el-button {
  background-color: transparent;
  color: #ffffff;
  border: none;
  font-size: 20px;
  padding-right: 8px;
  padding-top: 7px;
  margin: 0;
  text-align: center;
  float: right;
  position: relative;
}
.tools {
  width: 150px;
  height: 35px;
  position: absolute;
  right: 0px;
  background-color: rgba(255, 255, 255, 0.05);
  z-index: 2;
}
.tools .el-button {
  background-color: transparent;
  color: #ffffff;
  border: none;
  font-size: 20px;
  margin: 0;
  text-align: center;
  float: right;
  position: relative;
}
.delete-thread .el-button:hover,
.toggle-thread .el-button:hover,
.tools .el-button:hover {
  background-color: transparent;
}
.delete-thread .el-button:focus,
.toggle-thread .el-button:focus,
.tools .el-button:focus {
  background-color: transparent;
}

.thread-body {
  position: relative;
  height: calc(100% - 35px);
  /* border: 1px solid #baed00; */
}
.resize-icon {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 14px;
  height: 14px;
}
.resize-icon.resizable {
  right: 1px;
  bottom: 1px;
  left: initial;
  cursor: nwse-resize;
}
.resize-icon.resizable:hover {
  cursor: nwse-resize;
}
/* .thread{
    width: 800px;
    height: 300px;
    stroke: #00DBFF;
    stroke-width: 1;
    fill: none;
} */
.title {
  width: 800px;
  fill: #00dbff;
  fill-opacity: 0.42;
}

text {
  fill: #ffffff;
}

.virtual-box {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 1px dashed #ffffff;
}
</style>    