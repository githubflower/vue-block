<template>
  <!-- <div class="thread" :style="{width: thread.width + 'px', height: thread.height + 'px' }" @drop.prevent="drop" @dragover.prevent @mouseup="endResize"  -->
  <div
    :class="['thread', showThread ? 'is-expanded' : 'is-collapsed', {selected: isInActiveThread()}]"
    :style="{ width: thread.width + 'px', height: thread.height + 'px' }"
    @drop.prevent="drop"
    @dragover.prevent
    @mouseup="endResizeOrDrawLine"
    @mousemove="resizingStateOrMoveLine"
    @mouseleave="stopMovingLine"
    @keyup.ctrl="handleShortcutKeys"
    tabindex="0"
  >
  <div class="tools" v-show="showThread">
    <el-button plain icon="el-icon-aim" @click.stop="leftTopPosition"></el-button>
  </div>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      :width=thread.width
      :height=titleHeight
      :id="thread.id"
      class="operation-and-title-svg"
    >
      <g class="operation-and-title">
        <foreignObject :width=thread.width :height=titleHeight>
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
          <h4 class="title" contenteditable="true" @keydown.enter.exact="updateTitle">
            {{ thread.name }}
          </h4>
        </foreignObject>
      </g>
    </svg>
    <div class="scroll-wrapper" 
         :style="{ width:thread.width, height: thread.height - titleHeight + 'px' }" 
         v-show="showThread">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      :width=computedCanvasWidth
      :height=computedCanvasHeight
      :id="thread.id"
      class="state-and-line-svg">
        <g class="state-and-line">
            <foreignObject 
              :width=computedCanvasWidth 
              :height=computedCanvasHeight  
              @click="selectNearestLine">
            <div class="thread-body"  
                @mouseup="stopMovingLine"
                @mousedown="startMovingCanvas"
                @mousemove="onMovingCanvasOrDrawTempLine"
                @click="updateActiveThread"
                @contextmenu="nearestLineContextMenu">
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
                :isMovingLine="moveLineData.startMovingLine"
                @updateStateData="updateStateData"
                @updateTempLineData="updateTempLineData"
                @updateMoveData="updateMoveData"
                @updateActiveState="updateActiveState"
                @stopMoving="stopMoving"
                @stopMovingLine="stopMovingLine"
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
        </g>
        <path-animation
          v-if="isLineInCurrentThread(runningLineId)"
          :runningLineId="runningLineId"
        ></path-animation>
      <defs>
        <filter id="f1" x="0" y="0" width="200%" height="200%">
          <feOffset result="offOut" in="SourceGraphic" dx="1.5" dy="1.5" />
          <feGaussianBlur result="blurOut" in="offOut" stdDeviation="3" />
          <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
        </filter>
      </defs>
      </svg>
    </div>

    <!-- <i class="resize-icon" :style="{ backgroundImage: 'url(' + moveVerticalImg + ')'}"></i> -->
    <i
      v-show="showThread"
      class="resize-icon resizable"
      :style="{
        backgroundImage: 'url(' + resizableImg + ')',
        backgroundRepeat: 'no-repeat',
      }"
      @mousedown.stop="startResize"
      @mouseup="endResizeOrDrawLine"
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
const DEFAULT_CANVAS_WIDTH = lineCfg.default_canvas_width;
const DEFAULT_CANVAS_HEIGHT = lineCfg.default_canvas_height;
const LINE_DISPLACE = lineCfg.line_displace;
const RANKSEP = lineCfg.rank_sep;
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
      bgImg: "./static/imgs/tmp3.png",
      showVirtualBox: false,
      showTempLine: false,
      showThread: true,
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
      titleHeight: lineCfg.threadTitleHeight,
      moveVerticalImg: "./static/imgs/move-vertical.png",
      resizableImg: "./static/imgs/resizable.png",
      moveLineData: {
        startMovingLine: false,
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
      },
    };
  },
  methods: {
    //TODO: 当前视图按照当前激活的状态自动左右平移
    move2CurrentRunningState() {
      if (this.runningStateData.stateId !== "") {
        let currentRunningState = store.getState(
          this.threadIndex,
          this.runningStateData.stateId
        );
        console.log(currentRunningState);
      }
    },
    getNearestLineData(e) {
      if (stateManage.hasDrawedLine) {
        stateManage.hasDrawedLine = false;
        return false;
      }
      if (stateManage.hasMovedCanvas) {
        stateManage.hasMovedCanvas = false;
        return false;
      }
      let lineAry = store.stateData.threadAry[this.threadIndex].lineAry;
      if (lineAry.length === 0) {
        return;
      }
      let canvasDom = document.getElementsByClassName("scroll-wrapper")[
        this.threadIndex
      ];
      let mouseDownPoint = {
        x: e.pageX,
        y: e.pageY,
      };
      let canvasMouseDownPoint = {
        x: e.pageX - canvasDom.getBoundingClientRect().left,
        y: e.pageY - canvasDom.getBoundingClientRect().top,
      };
      let DomInLineArea = this.isInLineDomArea(mouseDownPoint, LINE_DISPLACE);
      let lineInDisplace = this.computeNearValue(
        DomInLineArea,
        canvasMouseDownPoint,
        LINE_DISPLACE
      );
      let nearestLineData = this.getNearestLine(lineInDisplace);
      return nearestLineData;
    },
    nearestLineContextMenu(e) {
      let lineAry = store.stateData.threadAry[this.threadIndex].lineAry;
      let nearestLineData = this.getNearestLineData(e);
      if (!nearestLineData) {
        return;
      }
      let highlightLine = nearestLineData.lineId;
      let lineData;
      lineAry.forEach((line) => {
        if (line.lineId === highlightLine) {
          lineData = line;
        }
      });
      let position = {
        x: e.pageX,
        y: e.pageY,
      };
      let nearOffset = -nearestLineData.nearValue;
      //根据鼠标靠近连线的种类重新计算连线菜单所在的位置
      if (nearestLineData.nearType === "y") {
        position.y += nearOffset;
      } else if (nearestLineData.nearType === "x") {
        position.x += nearOffset;
      }
      EventObj.$emit("hideStateContextMenu");
      EventObj.$emit("updateContextMenu", {
        lineId: lineData.lineId,
        threadIndex: this.threadIndex,
        lineData: lineData,
        position: position,
      });
    },
    selectNearestLine(e) {
      let nearestLineData = this.getNearestLineData(e);
      if (!nearestLineData) {
        return;
      }
      if (this.showLineContextMenu || this.showDeleteStateMenu) {
        return;
      }
      let highlightLine = nearestLineData.lineId;
      this.updateActiveLine(highlightLine);
    },
    isInLineDomArea(mouseDownPoint, displace) {
      let lineAry = store.stateData.threadAry[this.threadIndex].lineAry;
      let lineInArea = [];
      lineAry.forEach((line) => {
        let lineDom = document.getElementById(line.lineId);
        let lineDomArea = lineDom.getBoundingClientRect();
        let lineTop = lineDomArea.top + window.scrollY;
        let lineBottom = lineDomArea.bottom + window.scrollY;
        let lineLeft = lineDomArea.left + window.scrollX;
        let lineRight = lineDomArea.right + window.scrollX;
        if (
          mouseDownPoint.y > lineTop - displace &&
          mouseDownPoint.y < lineBottom + displace &&
          mouseDownPoint.x > lineLeft &&
          mouseDownPoint.x < lineRight
        ) {
          lineInArea.push(line);
        }
      });
      return lineInArea;
    },
    computeForward3LineNearValue(lineStart, lineEnd, clickPoint, displace) {
      let smallestNearValue = 1000000;
      let lineMiddle = lineStart.x + LINE_H + LINE_RADIUS;
      //TODO：靠近连线右键弹出连线菜单时需要按照对应的靠近方式将连线菜单显示在连线上
      let nearType, nearValue, absNearValue;
      if (
        Math.abs(clickPoint.y - lineStart.y) < displace &&
        clickPoint.x < lineMiddle
      ) {
        nearValue = clickPoint.y - lineStart.y;
        absNearValue = Math.abs(clickPoint.y - lineStart.y);
        if (absNearValue < smallestNearValue) {
          smallestNearValue = nearValue;
          nearType = "y";
        }
      }
      if (
        Math.abs(clickPoint.y - lineEnd.y) < displace &&
        clickPoint.x > lineMiddle
      ) {
        nearValue = clickPoint.y - lineEnd.y;
        absNearValue = Math.abs(clickPoint.y - lineEnd.y);
        if (absNearValue < smallestNearValue) {
          smallestNearValue = nearValue;
          nearType = "y";
        }
      }
      if (Math.abs(clickPoint.x - lineMiddle) < displace) {
        nearValue = clickPoint.x - lineMiddle;
        absNearValue = Math.abs(clickPoint.x - lineMiddle);
        if (absNearValue < smallestNearValue) {
          smallestNearValue = nearValue;
          nearType = "x";
        }
      }
      let nearData = {
        smallestNearValue: smallestNearValue,
        nearType: nearType,
      };
      return nearData;
    },
    computeBackward5LineNearValue(
      line,
      lineStart,
      lineEnd,
      clickPoint,
      displace
    ) {
      let smallestNearValue = 1000000;
      let lineDom = document.getElementById(line.lineId).getAttribute("d");
      let middleHorizontalLineRe = /V \d+/;
      let firstVerticalLine = lineStart.x + LINE_H + LINE_RADIUS;
      let secondVerticalLine = lineEnd.x - LINE_H - LINE_RADIUS;
      let middleHorizontalLine = parseInt(
        lineDom.match(middleHorizontalLineRe)[0].split(" ")[1],
        10
      );
      let nearType, nearValue, absNearValue;
      if (
        Math.abs(clickPoint.y - lineStart.y) < displace &&
        clickPoint.x < firstVerticalLine
      ) {
        nearValue = clickPoint.y - lineStart.y;
        absNearValue = Math.abs(clickPoint.y - lineStart.y);
        if (absNearValue < smallestNearValue) {
          smallestNearValue = nearValue;
          nearType = "y";
        }
      }
      if (Math.abs(clickPoint.x - firstVerticalLine) < displace) {
        nearValue = clickPoint.x - firstVerticalLine;
        absNearValue = Math.abs(clickPoint.x - firstVerticalLine);
        if (absNearValue < smallestNearValue) {
          smallestNearValue = nearValue;
          nearType = "x";
        }
      }
      if (
        Math.abs(clickPoint.y - middleHorizontalLine) < displace &&
        clickPoint.x < firstVerticalLine &&
        clickPoint.x > secondVerticalLine
      ) {
        nearValue = clickPoint.y - middleHorizontalLine;
        absNearValue = Math.abs(clickPoint.y - middleHorizontalLine);
        if (absNearValue < smallestNearValue) {
          smallestNearValue = nearValue;
          nearType = "y";
        }
      }
      if (Math.abs(clickPoint.x - secondVerticalLine) < displace) {
        nearValue = clickPoint.x - secondVerticalLine;
        absNearValue = Math.abs(clickPoint.x - secondVerticalLine);
        if (absNearValue < smallestNearValue) {
          smallestNearValue = nearValue;
          nearType = "x";
        }
      }
      if (
        Math.abs(clickPoint.y - lineEnd.y) < displace &&
        clickPoint.x > secondVerticalLine &&
        clickPoint.x < lineEnd.x
      ) {
        nearValue = clickPoint.y - lineEnd.y;
        absNearValue = Math.abs(clickPoint.y - lineEnd.y);
        if (absNearValue < smallestNearValue) {
          smallestNearValue = nearValue;
          nearType = "y";
        }
      }
      let nearData = {
        smallestNearValue: smallestNearValue,
        nearType: nearType,
      };
      return nearData;
    },
    computeForward5LineNearValue(
      line,
      lineStart,
      lineEnd,
      clickPoint,
      displace
    ) {
      let smallestNearValue = 1000000;
      let firstVerticalLine = lineStart.x + LINE_H + LINE_RADIUS;
      let middleHorizontalLine = lineEnd.y + line.verticalOffset;
      let secondVerticalLine = lineEnd.x - LINE_H - LINE_RADIUS;
      let nearType, nearValue, absNearValue;
      if (
        Math.abs(clickPoint.y - lineStart.y) < displace &&
        clickPoint.x < firstVerticalLine
      ) {
        nearValue = clickPoint.y - lineStart.y;
        absNearValue = Math.abs(clickPoint.y - lineStart.y);
        if (absNearValue < smallestNearValue) {
          smallestNearValue = nearValue;
          nearType = "y";
        }
      }
      if (Math.abs(clickPoint.x - firstVerticalLine) < displace) {
        nearValue = clickPoint.x - firstVerticalLine;
        absNearValue = Math.abs(clickPoint.x - firstVerticalLine);
        if (absNearValue < smallestNearValue) {
          smallestNearValue = nearValue;
          nearType = "x";
        }
      }
      if (
        Math.abs(clickPoint.y - middleHorizontalLine) < displace &&
        clickPoint.x > firstVerticalLine &&
        clickPoint.x < secondVerticalLine
      ) {
        nearValue = clickPoint.y - middleHorizontalLine;
        absNearValue = Math.abs(clickPoint.y - middleHorizontalLine);
        if (absNearValue < smallestNearValue) {
          smallestNearValue = nearValue;
          nearType = "y";
        }
      }
      if (Math.abs(clickPoint.x - secondVerticalLine) < displace) {
        nearValue = clickPoint.x - secondVerticalLine;
        absNearValue = Math.abs(clickPoint.x - secondVerticalLine);
        if (absNearValue < smallestNearValue) {
          smallestNearValue = nearValue;
          nearType = "x";
        }
      }
      if (
        Math.abs(clickPoint.y - lineEnd.y) < displace &&
        clickPoint.x > secondVerticalLine
      ) {
        nearValue = clickPoint.y - lineEnd.y;
        absNearValue = Math.abs(clickPoint.y - lineEnd.y);
        if (absNearValue < smallestNearValue) {
          smallestNearValue = nearValue;
          nearType = "y";
        }
      }
      let nearData = {
        smallestNearValue: smallestNearValue,
        nearType: nearType,
      };
      return nearData;
    },
    computeNearValue(lineInArea, clickPoint, displace) {
      let lineNearValueData = [];
      let nearData;
      let scrollBarDom = document.getElementsByClassName("scroll-wrapper")[
        this.threadIndex
      ];
      clickPoint.x = clickPoint.x + scrollBarDom.scrollLeft - window.scrollX;
      clickPoint.y = clickPoint.y + scrollBarDom.scrollTop - window.scrollY;
      lineInArea.forEach((line) => {
        let lineStart = QBlock.Line.getStartPoint(line, this.threadIndex);
        let lineEnd = QBlock.Line.getEndPoint(line, this.threadIndex);
        if (lineEnd.x > lineStart.x) {
          if (line.verticalOffset === 0) {
            nearData = this.computeForward3LineNearValue(
              lineStart,
              lineEnd,
              clickPoint,
              displace
            );
          } else {
            nearData = this.computeForward5LineNearValue(
              line,
              lineStart,
              lineEnd,
              clickPoint,
              displace
            );
          }
        } else if (lineEnd.x < lineStart.x) {
          nearData = this.computeBackward5LineNearValue(
            line,
            lineStart,
            lineEnd,
            clickPoint,
            displace
          );
        }
        if (nearData.smallestNearValue > displace) {
          return;
        } else {
          lineNearValueData.push({
            nearValue: nearData.smallestNearValue,
            nearType: nearData.nearType,
            lineId: line.lineId,
          });
        }
      });
      return lineNearValueData;
    },
    getNearestLine(lineNearValue) {
      if (!lineNearValue) {
        return;
      }
      let smallestNearValue = 1000000;
      let smallestLineData;
      lineNearValue.forEach((lineNearData) => {
        if (Math.abs(lineNearData.nearValue) <= smallestNearValue) {
          smallestNearValue = Math.abs(lineNearData.nearValue);
          smallestLineData = lineNearData;
        }
      });
      return smallestLineData;
    },
    updateTitle(e) {
      e.preventDefault();
      e.target.blur();
      store.stateData.threadAry[this.threadIndex].name = e.target.innerText;
    },
    isInActiveThread() {
      if (this.activeThreadIndex === this.threadIndex) {
        return true;
      }
      return false;
    },
    //判断在当前线程框内鼠标移动的情况，若当前鼠标正在移动画布，绘制连线，改变状态的尺寸时，不触发高亮线程框的事件
    hasNotMovedInThread() {
      if (stateManage.hasDrawedLine) {
        return false;
      } else if (stateManage.hasResizedState) {
        stateManage.hasResizedState = false;
        return false;
      } else if (stateManage.hasMovedCanvas) {
        return false;
      }
      return true;
    },
    updateActiveThread() {
      if (this.hasNotMovedInThread()) {
        this.$emit("updateActiveThread", this.threadIndex);
      }
    },
    //将当前状态图内的状态向左上角对齐
    leftTopPosition() {
      let stateAry = store.stateData.threadAry[this.threadIndex].stateAry;
      let leftMostState = QBlock.State.getLeftMostState(this.threadIndex);
      let upMostState = QBlock.State.getUpMostState(this.threadIndex);
      let offset = {
        x: leftMostState.x - 20,
        y: upMostState.y - 40,
      };
      stateAry.forEach((state) => {
        state.x = state.x - offset.x;
        state.y = state.y - offset.y;
      });
      //对齐后重置滚动条的位置
      let scrollBarDom = document.getElementsByClassName("scroll-wrapper")[
        this.threadIndex
      ];
      scrollBarDom.scrollLeft = 0;
      scrollBarDom.scrollTop = 0;
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
      this.$emit("updateActiveThread", this.threadIndex);
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
      let isHighlightingLine = this.getNearestLineData(selectedState.e);
      if (isHighlightingLine) {
        return;
      }
      //取消选择已经存在于activeState内的state时，从activeState内删除被取消选择的状态
      let spliceIndex = this.activeStates.indexOf(selectedState.stateData);
      if (spliceIndex !== -1) {
        let disactiveState = this.activeStates.splice(spliceIndex, 1)[0];
        this.disHighlightLines(disactiveState);
      } else {
        //选中的状态个数超出选中状态的上限时，删除存在于activeStates内的状态
        this.activeStates.push(selectedState.stateData);
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
    //停止对状态的拖拽改变尺寸
    stopMoving() {
      this._isResizingState = false;
      this._resizingWidth = null;
      this._resizingHeight = null;
      //停止对状态的拖拽改变尺寸时，更新用于储存当前状态图的状态的数据
      store.updatePresentData(this.threadIndex);
    },
    startMovingCanvas(e) {
      //获取当前鼠标点下位置的path，若在path内index为1的dom的class不为null，则是在状态块以及循环状态上按下，此时不触发画布移动
      if (e.path[1].getAttribute("class") !== null) {
        return false;
      }
      this._startMoveCanvasInfo = {
        x: e.pageX,
        y: e.pageY,
      };
      this._isMovingCanvas = true;
      let scrollBarDom = document.getElementsByClassName("scroll-wrapper")[
        this.threadIndex
      ];
      this._startScrollBarLeft = scrollBarDom.scrollLeft;
      this._startScrollBarTop = scrollBarDom.scrollTop;
    },
    //根据鼠标的位移来设置滑动条的偏移值，从而实现拖动画布
    onMovingCanvasOrDrawTempLine(e) {
      if (stateManage.isConnecting) {
        this.drawTempLine(e);
      } else if (!this._isMovingCanvas) {
        return false;
      } else if (this.moveLineData.startMovingLine) {
        return false;
      } else {
        if (e.buttons === 1) {
          this._endMoveCanvasInfo = {
            x: e.pageX,
            y: e.pageY,
          };
          let canvasOffset = {
            x: -(this._endMoveCanvasInfo.x - this._startMoveCanvasInfo.x),
            y: -(this._endMoveCanvasInfo.y - this._startMoveCanvasInfo.y),
          };
          let scrollBarDom = document.getElementsByClassName("scroll-wrapper")[
            this.threadIndex
          ];
          let offsetX, offsetY;
          offsetX = canvasOffset.x + this._startScrollBarLeft;
          offsetY = canvasOffset.y + this._startScrollBarTop;
          scrollBarDom.scrollLeft = offsetX;
          scrollBarDom.scrollTop = offsetY;
          if (canvasOffset.x !== 0 || canvasOffset.y !== 0) {
            stateManage.hasMovedCanvas = true;
          }
        } else {
          this._isMovingCanvas = false;
          this._startMoveCanvasInfo = null;
          this._endMoveCanvasInfo = null;
        }
      }
    },
    drawTempLine(e) {
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
      }
      Object.keys(data).forEach((key) => {
        this.moveLineData[key] = data[key];
      });
    },
    stopMovingLine() {
      this.moveLineData.startMovingLine = false;
      this._isMovingLine = false;
      this._movingVerticalOffset = null;
      //停止调节连线时，更新当前状态图的状态
      store.updatePresentData(this.threadIndex);
    },
    //监测线程框内的鼠标移动，改变状态的尺寸
    resizingStateOrMoveLine(e) {
      if (!this._isResizingState && !this._isMovingLine) {
        return false;
      }
      stateManage.movingCanvas = false;
      if (this.moveLineData.startMovingLine !== true) {
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
        this.resizingState(moveData);
      } else if (this._isMovingLine) {
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
      stateManage.hasResizedState = true;
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
    updateTempLineData(lineData) {
      Object.keys(lineData).forEach((key) => {
        this.tempLineData[key] = lineData[key];
      });
    },
    setLineType(lineData) {
      let lineType;
      lineType = "default";
      if (lineData.startPointClass === "connect-point in") {
        lineType = "startLoop";
      } else if (lineData.endPointClass === "connect-point loop") {
        lineType = "continueLoop";
      } else if (
        lineData.startPointClass === "connect-point out" &&
        lineData.endPointClass === "connect-point out"
      ) {
        lineType = "endLoop";
      }
      return lineType;
    },
    drawConnectLineByType(lineData) {
      if (lineData.type === "startLoop") {
        store.addStartLoopLine({
          threadIndex: this.threadIndex,
          lineData: lineData,
        });
      } else if (
        lineData.type === "continueLoop" ||
        lineData.type === "endLoop"
      ) {
        store.addEndOrContinueLoopLine({
          threadIndex: this.threadIndex,
          lineData: lineData,
        });
      } else {
        store.addLine({
          threadIndex: this.threadIndex,
          lineData: lineData,
        });
      }
    },
    drawConnectLine(e) {
      //当绘制连线时，需要在连线被绘制之前更新用于撤销的当前状态图的状态，在连线被绘制后更新当前状态图的状态
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
      lineData.type = this.setLineType(lineData);
      lineData.verticalOffset = 0;
      lineData.event = {
        ioStateNum: null,
        ioStateBool: null,
      };
      this.drawConnectLineByType(lineData);
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
    isDuplicateLine(line, endStateId) {
      let dupFlag = false;
      let currentThread = store.stateData.threadAry[this.threadIndex];
      currentThread.lineAry.forEach((item) => {
        if (
          item.startState.stateId === line.startState.stateId &&
          item.endState.stateId === endStateId &&
          item.startPointClass === line.startPointClass &&
          item.endPointClass === line.endPointClass
        ) {
          dupFlag = true;
          return false;
        }
      });
      return dupFlag;
    },
    /**
     * 获取鼠标松开时停留在哪个状态块上面
     * @return object { stateId: 状态块的stateid属性}
     */
    getEndState(e) {
      let stateId = null,
        clazz = ".state-wrap",
        stateIndex,
        endPointClass;
      if (e.target.closest(clazz)) {
        endPointClass = e.target.getAttribute("class");
        stateId = e.target.closest(clazz).getAttribute("stateid");
      }
      return {
        stateId: stateId,
        endPointClass: endPointClass,
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
            e.target.getBoundingClientRect().width / 2,
          y:
            e.target.getBoundingClientRect().top -
            curSvgRect.top +
            e.target.getBoundingClientRect().height / 2,
        };
      } else {
        point = {
          x: e.clientX - curSvgRect.left - 2,
          y: e.clientY - curSvgRect.top - 2,
        };
      }
      return point;
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
     * @param {drawingLineId, endStateId, startStateId}
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
        let loopState = loopStateData.loopState;
        let startState = store.getState(this.threadIndex, startStateId);
        this.relateLine2LoopStart(loopStateData, statesInLoopLayer, lineAry);
        this.relateLine2LoopEnd(loopStateData, statesInLoopLayer, lineAry);
        QBlock.Line.addContinueLoopLine2State(
          startState,
          loopState,
          this.threadIndex
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
      let width = maxX - minX + rightestStateWidth + 120 + "px";
      return width;
    },
    /**
     * 计算循环状态的高度
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

      let height = lowestStateBottom - minY + 180 + "px";
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
    /**
     * 获取形成循环状态时所有与从循环内侧连出循环内侧状态连线相连的状态
     */
    getStateRelated2LoopEnd(loopStateData, statesInLoopLayer, lineAry) {
      let loopStateIndex;
      statesInLoopLayer.forEach((state, index) => {
        if (state.stateId === loopStateData.stateId) {
          loopStateIndex = index;
        }
      });

      let loopState = store.getState(this.threadIndex, loopStateData.stateId);
      let loopStateChildren = loopState.children;
      let statesOutsideLoop = [];
      let loopStateHasOutsideLine = [];
      let lineToDelete = [];
      loopStateChildren.forEach((stateInLoop) => {
        if (stateInLoop.outputAry.length !== 0) {
          stateInLoop.outputAry.forEach((outputLine) => {
            let lineData;
            lineAry.forEach((item) => {
              if (item.lineId === outputLine.lineId) {
                lineData = item;
              }
            });
            let endState = store.getState(
              this.threadIndex,
              lineData.endState.stateId
            );
            if (endState.parent !== stateInLoop.parent) {
              if (statesOutsideLoop.indexOf(lineData.endState.stateId) === -1) {
                statesOutsideLoop.push(endState.stateId);
              }
              if (loopStateHasOutsideLine.indexOf(stateInLoop.stateId) === -1) {
                loopStateHasOutsideLine.push(stateInLoop.stateId);
              }
              lineToDelete.push(lineData.lineId);
            }
          });
        }
      });
      let dataRelated2LoopEnd = {
        statesOutsideLoop: statesOutsideLoop,
        loopStateHasOutsideLine: loopStateHasOutsideLine,
        lineToDelete: lineToDelete,
      };
      return dataRelated2LoopEnd;
    },
    //用于在连线形成循环结构时，对循环状态内连出至循环状态外的状态添加从循环连接至循环外部的连线
    addLine2LoopEnd(statesOutsideLoop, loopState) {
      statesOutsideLoop.forEach((stateId, timeOutIndex) => {
        let stateConnect2LoopEnd = store.getState(this.threadIndex, stateId);
        if (
          stateConnect2LoopEnd.stateType !== "loopDiv" &&
          stateConnect2LoopEnd.mode !== "nest"
        ) {
          setTimeout(() => {
            QBlock.Line.addDefaultLine2State(
              loopState,
              stateConnect2LoopEnd,
              this.threadIndex
            );
          }, 10 * (timeOutIndex + 1));
        } else {
          setTimeout(() => {
            QBlock.Line.addEndLoopLine2State(
              loopState,
              stateConnect2LoopEnd,
              this.threadIndex
            );
          }, 10 * (timeOutIndex + 1));
          /*
          setTimeout(() => {
            QBlock.Line.addContinueLoopLine2State(
              loopState,
              stateConnect2LoopEnd,
              this.threadIndex
            );
          }, 10 * (timeOutIndex + 2));
          */
        }
      });
    },
    //用于在连线形成循环结构时，添加结束循环的连线
    addLineFromLoopEnd2StateOutsideLoop(loopStateHasOutsideLine, loopState) {
      loopStateHasOutsideLine.forEach((stateId, timeOutIndex) => {
        let endLoopState = store.getState(this.threadIndex, stateId);
        setTimeout(() => {
          QBlock.Line.addEndLoopLine2State(
            endLoopState,
            loopState,
            this.threadIndex
          );
        }, 10 * (timeOutIndex + 1));
      });
    },
    /**
     * 将循环状态中连出至外层状态的连线连接到循环状态的连出点
     */
    relateLine2LoopEnd(loopStateData, statesInLoopLayer, lineAry) {
      let loopState = loopStateData.loopState;
      let dataRelated2LoopEnd = this.getStateRelated2LoopEnd(
        loopStateData,
        statesInLoopLayer,
        lineAry
      );
      let lineToDelete = dataRelated2LoopEnd.lineToDelete;
      //TODO:根据line的type来决定新增的循环内连线的种类
      lineToDelete.forEach((lineId) => {
        store.deleteLine({
          threadIndex: this.threadIndex,
          lineId: lineId,
        });
      });
      this.$nextTick(function () {
        this.addLine2LoopEnd(dataRelated2LoopEnd.statesOutsideLoop, loopState);
        setTimeout(() => {
          this.addLineFromLoopEnd2StateOutsideLoop(
            dataRelated2LoopEnd.loopStateHasOutsideLine,
            loopState
          );
        }, 10);
      });
    },
    /**
     * 获取形成循环状态时所有与从循环外侧连入循环内侧状态连线相连的状态
     */
    getStateRelated2LoopStart(loopStateData, statesInLoopLayer, lineAry) {
      let loopStateIndex;
      statesInLoopLayer.forEach((state, index) => {
        if (state.stateId === loopStateData.stateId) {
          loopStateIndex = index;
        }
      });

      let loopState = store.getState(this.threadIndex, loopStateData.stateId);
      let loopStateChildren = loopState.children;
      let statesOutsideLoop = [];
      let loopStateHasOutsideLine = [];
      let lineToDelete = [];
      loopStateChildren.forEach((stateInLoop) => {
        if (stateInLoop.inputAry.length !== 0) {
          stateInLoop.inputAry.forEach((inputLine) => {
            let lineData;
            lineAry.forEach((item) => {
              if (item.lineId === inputLine.lineId) {
                lineData = item;
              }
            });
            let startState = store.getState(
              this.threadIndex,
              lineData.startState.stateId
            );
            if (startState.parent !== stateInLoop.parent) {
              if (
                statesOutsideLoop.indexOf(lineData.startState.stateId) === -1
              ) {
                statesOutsideLoop.push(startState.stateId);
              }
              if (loopStateHasOutsideLine.indexOf(stateInLoop.stateId) === -1) {
                loopStateHasOutsideLine.push(stateInLoop.stateId);
              }
              lineToDelete.push(lineData.lineId);
            }
          });
        }
      });
      let dataRelated2LoopStart = {
        statesOutsideLoop: statesOutsideLoop,
        loopStateHasOutsideLine: loopStateHasOutsideLine,
        lineToDelete: lineToDelete,
      };
      return dataRelated2LoopStart;
    },
    //用于在连线形成循环结构时，对循环状态外连入循环状态内的状态添加从循环外部连接至循环的连线
    addLine2LoopStart(statesOutsideLoop, loopState) {
      statesOutsideLoop.forEach((stateId, timeOutIndex) => {
        let stateConnect2LoopStart = store.getState(this.threadIndex, stateId);
        if (
          stateConnect2LoopStart.stateType !== "loopDiv" &&
          stateConnect2LoopStart.mode !== "nest"
        ) {
          setTimeout(() => {
            QBlock.Line.addDefaultLine2State(
              stateConnect2LoopStart,
              loopState,
              this.threadIndex
            );
          }, 10 * (timeOutIndex + 1));
        } else {
          setTimeout(() => {
            QBlock.Line.addStartLoopLine2State(
              stateConnect2LoopStart,
              loopState,
              this.threadIndex
            );
          }, 10 * (timeOutIndex + 1));
        }
      });
    },
    //用于在连线形成循环结构时，添加开始循环的连线
    addLineFromLoopStart2StateInLoop(loopStateHasOutsideLine, loopState) {
      loopStateHasOutsideLine.forEach((stateId, timeOutIndex) => {
        let startLoopState = store.getState(this.threadIndex, stateId);
        setTimeout(() => {
          QBlock.Line.addStartLoopLine2State(
            loopState,
            startLoopState,
            this.threadIndex
          );
        }, 10 * (timeOutIndex + 1));
      });
    },
    /**
     * 将外层状态连入循环状态中状态的连线连接到循环状态的连入点
     */
    relateLine2LoopStart(loopStateData, statesInLoopLayer, lineAry) {
      let loopState = loopStateData.loopState;
      let dataRelated2LoopStart = this.getStateRelated2LoopStart(
        loopStateData,
        statesInLoopLayer,
        lineAry
      );
      let lineToDelete = dataRelated2LoopStart.lineToDelete;
      lineToDelete.forEach((lineId) => {
        store.deleteLine({
          threadIndex: this.threadIndex,
          lineId: lineId,
        });
      });
      this.$nextTick(function () {
        this.addLine2LoopStart(
          dataRelated2LoopStart.statesOutsideLoop,
          loopState
        );
        setTimeout(() => {
          this.addLineFromLoopStart2StateInLoop(
            dataRelated2LoopStart.loopStateHasOutsideLine,
            loopState
          );
        }, 10);
      });
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
        //当进行拖拽添加状态块的操作时，需要在状态块被添加之前更新用于撤销的当前状态图的状态，在状态块被添加之后更新当前状态图的状态
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
    //将从工具栏上拖拽下来的状态添加进当前线程内
    addStateToThread(e) {
      let threadPosInfo = e.target.getBoundingClientRect();
      let leftGap = e.dataTransfer.getData("mousedowntoleft");
      let topGap = e.dataTransfer.getData("mousedowntotop");
      let scrollTop =
        document.documentElement.scrollTop || document.body.srcollTop;
      let data = {
        index: this.threadIndex,
        x: e.x - threadPosInfo.x - leftGap,
        y: e.y - threadPosInfo.y - topGap,
        stateType: e.dataTransfer.getData("stateType"),
      };
      if (scrollTop) {
        data.y = data.y + scrollTop;
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
    //处理连线时的鼠标松开动作
    onMouseupDrawLine(e) {
      //TODO 触发EventObj更新lineObj
      let target_class = e.target.getAttribute("class");
      let regIsConnectPoint = /connect-point/;
      let existedLine = false;
      let endStateId = this.getEndState(e).stateId;
      let startState = store.getState(
        this.threadIndex,
        this.tempLineData.startState.stateId
      );
      let endState;
      this.tempLineData.endPointClass = this.getEndState(e).endPointClass;
      if (endStateId) {
        endState = store.getState(this.threadIndex, endStateId);
      }
      if (regIsConnectPoint.test(target_class)) {
        existedLine = this.isDuplicateLine(this.tempLineData, endStateId);
        if (existedLine) {
          this.showTempLine = false;
          return;
        }
        if (startState.parent !== endState.parent) {
          //处理循环内部状态与其属于的循环状态之间的连线
          if (
            endState.parent === startState.stateId ||
            startState.parent === endState.stateId
          ) {
            //若从循环状态内部连线至循环状态的开始点，则禁止连线
            if (
              this.tempLineData.startPointClass === "connect-point out" &&
              this.tempLineData.endPointClass === "connect-point in"
            ) {
              this.showTempLine = false;
              return;
            }
            this.drawConnectLine(e);
          }
          this.showTempLine = false;
          return;
        }
        if (
          //走到这里，说明是状态自身连入自身，此时不允许绘制连线
          endState &&
          endStateId === startState.stateId
        ) {
          return;
        } else {
          if (
            this.tempLineData.startPointClass ===
            this.tempLineData.endPointClass
          ) {
            //走到这里，说明是从连入点连线至连入点，或是从连出点连至连出点，此时禁止用户连线
            this.showTempLine = false;
            return;
          }
          let drawingLineId = this.drawConnectLine(e);
          //TODO：需要考虑循环内部再嵌套形成循环的情况
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
    },
    onMouseupEndResize(e) {
      this.showVirtualBox = false;
      EventObj.$emit("operateChange", {
        operate: "default",
      });
      this._lastHeight = this.thread.height;
    },
    endResizeOrDrawLine(e) {
      if (this.showVirtualBox) {
        this.onMouseupEndResize(e);
      } else if (stateManage.isConnecting) {
        this.onMouseupDrawLine(e);
      }
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
    //新建被被复制嵌套状态的子状态
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
          state.y +
          Util.translatePX2Num(state.height) +
          this._offsetCount * Util.translatePX2Num(state.height),
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
      //将当前状态的前一个状态添加进用于储存恢复状态的数组内
      redoList.push(store.stateData.threadAry[this.threadIndex].presentState);
      //更新当前状态为当前状态的前一个状态
      store.stateData.threadAry[this.threadIndex].presentState = undoList.pop();
      //加载更新后的当前状态
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
      //将当前状态的后一个状态添加进用于储存撤销状态的数组内
      undoList.push(store.stateData.threadAry[this.threadIndex].presentState);
      //更新当前状态为当前状态的后一个状态
      store.stateData.threadAry[this.threadIndex].presentState = redoList.pop();
      //加载更新后的当前状态
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
    /*
    var elm = el.querySelector("#test");
    if (elm) {
      this.stateBlock = new PlainDraggable(elm);
    }*/
    //每次重新加载组件时初始化用于恢复和撤销对状态图的操作的列表
    store.stateData.threadAry[this.threadIndex].undoStatesList = [];
    store.stateData.threadAry[this.threadIndex].redoStatesList = [];
    window.localStorage;
    document.getElementsByClassName("thread")[
      this.threadIndex
    ].oncontextmenu = function () {
      return false;
    };
    window.addEventListener("keydown", (e) => {
      if (e.keyCode === 89 || e.keyCode === 90 || e.keyCode === 83) {
        e.preventDefault();
      }
    });
  },
  created() {},
  watch: {
    runningStateData: {
      handler(newVal, oldVal) {
        console.log(newVal.stateId);
      },
      deep: true,
    },
  },
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
            2 * stateDivBorderWidth +
            15,
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
    computedCanvasWidth: function () {
      let rightMostState = QBlock.State.getRightMostState(this.threadIndex);
      let rightMostStateWidth = Util.translatePX2Num(rightMostState.width);
      let leftMostState = QBlock.State.getLeftMostState(this.threadIndex);
      let currentCanvasWidth =
        rightMostState.x + rightMostStateWidth + 40 - leftMostState.x;
      if (currentCanvasWidth < DEFAULT_CANVAS_WIDTH) {
        return DEFAULT_CANVAS_WIDTH;
      } else {
        return currentCanvasWidth;
      }
    },
    computedCanvasHeight: function () {
      let topMostState = QBlock.State.getUpMostState(this.threadIndex);
      let bottomMostState = QBlock.State.getBottomMostState(this.threadIndex);
      let bottomMostStateHeight = Util.translatePX2Num(bottomMostState.height);
      let currentCanvasHeight =
        bottomMostState.y + bottomMostStateHeight + 80 - topMostState.y;
      if (currentCanvasHeight < DEFAULT_CANVAS_HEIGHT) {
        return DEFAULT_CANVAS_HEIGHT;
      } else {
        return currentCanvasHeight;
      }
    },
  },
};
</script>

<style lang="less" scoped>
* {
  user-select: none;
  font-size: 0;
}
::-webkit-scrollbar-button {
  display: none;
}
::-webkit-scrollbar-corner {
  display: none;
}
::-webkit-scrollbar {
  width: 15px;
  height: 15px;
}
::-webkit-scrollbar-thumb {
  border-radius: 10px;
  background-color: rgba(139, 139, 139, 0.281);
}
::-webkit-scrollbar-thumb:hover {
  background-color: rgba(136, 136, 136, 0.603);
}
div.thread {
  position: relative;
  display: inline-block;
  text-align: left;
  margin: 25px;
  border: 1px solid #487afe;
  border-radius: 4px;
  &:focus {
    outline: none;
  }
  &.selected {
    box-shadow: 0px 0px 2px 2px #5280ff;
    border-radius: 4px;
  }
}
.scroll-wrapper {
  overflow-x: auto;
  overflow-y: auto;
}
h4.title {
  margin: 0;
  width: 100%;
  height: 35px;
  padding-left: 15px;
  line-height: 35px;
  font-size: 16px;
  color: #ffffff;
  background-color: rgba(72, 122, 254, 0.42);
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
  top: 35px;
  right: 15px;
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
  height: 100%;
  width: 100%;
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