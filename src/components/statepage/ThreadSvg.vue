<template>
  <!-- <div class="thread" :style="{width: thread.width + 'px', height: thread.height + 'px' }" @drop.prevent="drop" @dragover.prevent @mouseup="endResize"  -->
  <div
    class="thread"
    :style="{ width: thread.width + 'px', height: computedH + 'px' }"
    @drop.prevent="drop"
    @dragover.prevent
    @mouseup="endResize"
    @mousemove="onMousemove"

  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      :id="thread.id"
      class="thread-svg"
    >
      <g>
        <foreignObject
          y="0"
          width="100%"
          height="100%"
          @mousemove="onConnecting"
          @mouseup="onMouseup"
        >
            <div class="operating" v-show="operationStatus == 'operating'" style="color: rgb(26,250,41);">
              <img src="/static/imgs/operating.png">运行中</div>
            <div class="pausing" v-show="operationStatus == 'pausing'" style="color: yellow;">
              <img src="/static/imgs/pausing.png">暂停</div>
            <div class="stopping" v-show="operationStatus == 'stopping'" style="color: red;">
              <img src="/static/imgs/stopping.png">停止</div>
            <div v-show=false></div>
            <h4 class="title" contenteditable=true :style="titleStyle">
              {{ thread.name }}
            </h4>

          <div class="thread-body">
            <state-wrap
              v-for="(stateItem, index) in thread.stateAry"
              :key="index"
              :stateData="stateItem"
              :index="index"
              :threadIndex="threadIndex"
              :runningStateData="runningStateData"
              :activeStates="activeStates"
              @updateStateData="updateStateData"
              @updateTempLineData="updateTempLineData"
              @updateMoveData="updateMoveData"
              @updateActiveState="updateActiveState"
              @stopMoving="stopMoving"
            />
          </div>
        </foreignObject>
      </g>
      <defs>
        <filter id="f1" x="0" y="0" width="200%" height="200%">
          <feOffset result="offOut" in="SourceGraphic" dx="1.5" dy="1.5" />
          <feGaussianBlur result="blurOut" in="offOut" stdDeviation="3" />
          <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
        </filter>
      </defs>
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
        :lineType="'default'"
        :threadIndex="threadIndex"
        @updateActiveLine="updateActiveLine"
      />
      <path-animation
        v-if="isLineInCurrentThread(runningLineId)"
        :runningLineId="runningLineId">
      </path-animation>
      
    </svg>
    <!-- <i class="resize-icon" :style="{ backgroundImage: 'url(' + moveVerticalImg + ')'}"></i> -->
    <i
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
const deepCopy = (obj) => {
  if (typeof obj !== "object") {
    return obj;
  }

  let type = Object.prototype.toString.apply(obj);
  let ret = type === "[object Array]" ? [] : {};

  if (type === "[object Array]") {
    ret = [];
    let i = 0;
    while (i < obj.length) {
      ret[i] = deepCopy(obj[i]);
      i++;
    }
  } else {
    ret = {};
    for (let k in obj) {
      if (obj.hasOwnProperty(k)) {
        ret[k] = deepCopy(obj[k]);
      }
    }
  }

  return ret;
};

export default {
  name: "ThreadSvg",
  props: ["thread", "threadIndex", "runningLineId", "runningStateData"],
  components: {
    StateWrap,
    LineComp,
    PathAnimation,
  },
  data() {
    return {
      // bgImg: '../../../../static/imgs/grid3-50x50.png',
      bgImg: "../../../static/imgs/tmp3.png",
      arrowImg: "../../../static/imgs/startActive.png",
      showVirtualBox: false,
      showTempLine: false,
      //线程的运行状态：只能为operating, pausing, stopping中的其中一个
      operationStatus: "",
      tempLineClass: "templine",
      activeStates: [],
      activeLines: [],
      tempLineData: {
        type: "tempLine",
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
      threadCount: 1,
      titleHeight: lineCfg.threadTitleHeight,
      moveVerticalImg: "../../../static/imgs/move-vertical.png",
      resizableImg: "../../../static/imgs/resizable.png",
      moveData: {
        stateIndex: 0,
        startPoint: {
          x: 0,
          y: 0,
        },
        endPoint: {},
      }, //在线程框内鼠标移动相关的数据
    };
  },
  methods: {
    updateActiveLine(selectedLine) {
      //处理连线的高亮
      let lineIndex = this.activeLines.indexOf(selectedLine);
      if (lineIndex !== -1) {
        this.activeLines.splice(lineIndex, 1);
      } else {
        this.activeLines.push(selectedLine);
      }
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
      this._testWidth = null;
      this._testHeight = null;
    },
    //监测线程框内的鼠标移动，设置状态的resize
    onMousemove(e) {
      if (!this._isResizingState) {
        return;
      }
      this.updateMoveData({
        endPoint: {
          x: e.pageX,
          y: e.pageY,
        },
      });
      let moveData = this.moveData;
      let threadData = store.stateData.threadAry[this.threadIndex];
      // threadData = this.thread;
      // this.$set(this.thread.stateAry[this.moveData.stateIndex], 'width', this.thread.stateAry[this.moveData.stateIndex].width + (moveData.endPoint.x - moveData.startPoint.x))

      if (!this._testWidth) {
        this._testWidth = Util.translatePX2Num(
          threadData.stateAry[this.moveData.stateIndex].width
        );
      }
      if (!this._testHeight) {
        this._testHeight = Util.translatePX2Num(
          threadData.stateAry[this.moveData.stateIndex].height
        );
      }
      threadData.stateAry[this.moveData.stateIndex].width =
        this._testWidth + (moveData.endPoint.x - moveData.startPoint.x) + "px";
      threadData.stateAry[this.moveData.stateIndex].height =
        this._testHeight + (moveData.endPoint.y - moveData.startPoint.y) + "px";
    },
    titleStyle() {
      return `height: ${this.titleHeight}px;`;
    },
    /* generateDefaultPos(index) {
      const gap = 35;
      return `translate(50, ${(300 + gap) * (index - 1)})`;
    },
    generateStatePos(index) {
      const gapX = 60;
      return `translate(${(90 + gapX) * (index - 1)}, 40)`;
    }, */
    onConnecting(e) {
      if (stateManage.isConnecting) {
        //检测鼠标左键是否仍是按下状态    ===1 说明鼠标左键被按下后未松开
        if (e.buttons === 1) {
          //绘制临时的连接线
          stateManage.isConnecting = true;
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
    updateTempLineData(lineData) {
      Object.keys(lineData).forEach((key) => {
        this.tempLineData[key] = lineData[key];
      });
    },
    drawConnectLine(e) {
      let endState = this.getEndState(e);
      let lineData = this.copy(this.tempLineData);
      lineData.endState = endState;
      lineData.lineId = window.genId("line");
      lineData.desc = "";
      lineData.type = "connectLine"
      store.addLine({
        threadIndex: this.threadIndex,
        lineData: lineData,
      });
      //需要通过lineId来寻找可能需要删除的连线
      return lineData.lineId;
    },
    copy(obj) {
      return deepCopy(obj);
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

        if (regIsConnectPoint.test(target_class)) {
          //绘制连接线
          existedLine = this.isDuplicateLine(this.tempLineData, endStateId);
          if (existedLine) {
            return;
          } else {
            let drawingLineId = this.drawConnectLine(e);
            this.handleLoops(drawingLineId, endStateId);
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
     * @param {drawingLineId, endStateId}
     */
    handleLoops(drawingLineId, endStateId) {
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
        this.relateLine2Loop(
          endStateId,
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
          // g.setEdge(state.stateId, endState.stateId, line.lineId, lineObj.desc); //这种设置方式会报错 可能是dagre对graphlib的封装接口未同步
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

      this.addStateToLoop(
        inLoopStatesId,
        statesInLoopLayer,
        loopState,
        loopStateId
      );

      let loopStateData = {
        stateId: loopState.stateId,
        loopState: loopState,
        startPoint: {
          x: loopState.x + QBlock.State.getStateWidth(loopState) / 2,
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
      statesInLoopLayer.push(loopState);
    },
    /**
     * 将外层状态连入循环状态中第一个被执行的状态的连线连接到循环状态的连入点
     * @param {firstLoopStateId, loopStateData, statesInLoopLayer, lineAry}
     */
    relateLine2Loop(
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
      if (e.dataTransfer.getData("operate") === "addState") {
        this.addStateToThread(e);
      } else {
        let theDragStateData = JSON.parse(
          e.dataTransfer.getData("theDragStateData")
        );
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
        let x = e.pageX - this.$el.getBoundingClientRect().left;
        let y = e.pageY - this.$el.getBoundingClientRect().top;
        theDragStateData.x = x /* - statePageVue._dragData.mousedownPoint.x */;
        theDragStateData.y = y /*  - statePageVue._dragData.mousedownPoint.y */;

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
      }
    },
    //将从工具栏上拖拽下来的状态添加进当前线程内
    addStateToThread(e) {
      let threadPosInfo = e.target.getBoundingClientRect();
      let leftGap = e.dataTransfer.getData("mousedowntoleft");
      let topGap = e.dataTransfer.getData("mousedowntotop");
      let data = {
        index: this.threadIndex,
        x: e.x - threadPosInfo.x - leftGap,
        y: e.y - threadPosInfo.y - topGap,
        stateType: e.dataTransfer.getData("stateType"),
      };
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
    getXYFromEventData(eventData) {
      let xy = {};
      //组件嵌套的情况，会将数据依次往上传递，传递的过程中会包一层data
      if (typeof eventData.data !== "undefined") {
        xy = this.getXYFromEventData(eventData.data);
      } else {
        xy = {
          x: eventData.transform.x,
          y: eventData.transform.y,
        };
      }
      return xy;
    },
    /**
     * 更新状态的位置 这里xy数据更新后视图自动更新
     */
    updateStateXY(state, xy) {
      if (state) {
        state.x = xy.x;
        state.y = xy.y;
      }
    },
    /**
     * 更新状态数据，包括这个状态的位置和输入、输出连线
     */
    updateStateData(eventData) {
      let xy = this.getXYFromEventData(eventData);
      let state = store.getState(this.threadIndex, eventData.stateId);
      this.updateStateXY(state, xy);
      this.updateLines(state);
      this.updateSubStatesLines(state);
    },
    /**
     * 更新某个状态块的所有输入连线和输出连线
     */
    updateLines(state) {
      let currentState = state;
      let lineAry = store.stateData.threadAry[this.threadIndex].lineAry;
      let inputLine, outputLine;

      //更新目标状态的连入连线和连出连线
      if (currentState.inputAry) {
        currentState.inputAry.forEach((item) => {
          // inputLine --> state中保存的lineId以及对这个触发事件的描述等信息，没有真正的用于画连线的数据
          inputLine = lineAry.find((line) => {
            //line --> line的具体画连线的数据   inputLine与line通过lineId更新数据
            return line.lineId === item.lineId;
          });
          this.updateLinePath(inputLine);
        });
      }

      if (currentState.outputAry) {
        currentState.outputAry.forEach((item) => {
          // inputLine --> state中保存的lineId以及对这个触发事件的描述等信息，没有真正的用于画连线的数据
          outputLine = lineAry.find((line) => {
            //line --> line的具体画连线的数据   inputLine与line通过lineId更新数据
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
      // 递归处理嵌套在父状态内的所有状态的连线
      if (state) {
        for (var i = 0; i < state.children.length; i++) {
          // 绘制连线需要用到一些属性，定义childrenData来将属性一层层传递
          let childrenData = state.children[i];
          this.updateLines(childrenData);
          this.updateSubStatesLines(childrenData);
        }
      }
    },

    createLinePath(line) {},
    /* reUpdateLinePath(line, threadIndex){
      this.updateLinePath(line, line.startState, line.endState, threadIndex);
    }, */

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
      this.showVirtualBox = false;
      EventObj.$emit("operateChange", {
        operate: "default",
      });
      this._lastHeight = this.thread.height;
    },
  },

  mounted() {
    let el = this.$el;
    var elm = el.querySelector("#test");
    if (elm) {
      this.stateBlock = new PlainDraggable(elm);
    }
    /* var states = el.getElementsByClassName('state-div');
        var lineOption = {
            color: '#aaaaaa',
            size: 2,
            startSocket: 'right',
            endSocket: 'left',
            path: 'grid'
        }
        this.line = new LeaderLine(states[0], states[1], lineOption);
        this.line2 =  new LeaderLine(states[0], states[2], lineOption); */
  },
  computed: {
    computedH: function () {
      let maxY = 0;
      let threadDivBorderWidth = 1,
        stateDivBorderWidth = 1,
        stateDivHeight = 40; // 50是状态的高度
      if (this.showVirtualBox) {
        return Math.max(maxY, this.thread.height);
      }
      this._lastHeight = this._lastHeight || this.thread.height;
      this.thread.stateAry.forEach((state) => {
        // TODO  这里还需要根据状态是子状态还是父状态作判断，后续实现状态块时修改
        maxY = Math.max(
          state.y +
            this.titleHeight +
            stateDivHeight +
            2 * threadDivBorderWidth +
            2 * stateDivBorderWidth,
          maxY
        );
      });
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

<style lang="less">
div.thread {
  position: relative;
  display: inline-block;
  text-align: left;
  /* margin-top: 50px; */
  // margin-left: 50px;
  // left: 50%;
  // transform: translateX(-50%);
  margin: 25px;
  foreignObject {
    // border: 1px solid #00cd9a;
    border: 1px solid #487afe;
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
  height: 35px;
  padding-right: 15px;
  font-size: 15px;
  text-align: center;
  float: right;
  img {
    position: relative;
    top: 5px;
    right: 3px;
  }
}

/*
.operating{
  margin: 0;
  right:15%;
  line-height: 35px;
  height: 35px;
  color: rgb(26,250,41);
  font-size: 15px;
  text-align: center;
  background-color: rgba(72, 122, 254, 0.42);
}
img{
  position: relative;
  top: 4px;
}*/
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