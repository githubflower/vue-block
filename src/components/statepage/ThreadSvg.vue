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
      <line-svg
        v-show="showTempLine"
        :lineClass="tempLineClass"
        :line="tempLineData"
        :activeLines="activeLines"
      />
      <line-svg
        v-for="(line, index2) in thread.lineAry"
        :key="index2"
        :line="line"
        :activeLines="activeLines"
        :threadIndex="threadIndex"
        @updateActiveLine="updateActiveLine"
      />
      <path-animation
        v-if="isInCurrentThread(runningLineId)"
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
import LineSvg from "./LineSvg";
import PathAnimation from "./PathAnimation";
import { lineCfg } from "./graphCfg.js";
import Tools from "@/Tools.js";
import QBlock from './qblock.js'
const line_h = lineCfg.line_h;
const line_v = lineCfg.line_v;
const LINE_RADIUS = lineCfg.line_radius;
const highlight_limit = lineCfg.highlight_limit;
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
    LineSvg,
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
      titleHeight: 35,
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
      //处理连线的高亮，逻辑比高亮状态块要简单
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
        if (this.activeStates.length > highlight_limit) {
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
    isInCurrentThread(lineId) {
      let currentThread = store.stateData.threadAry[this.threadIndex].lineAry;
      for (let i = 0; i < currentThread.length; i++) {
        if (currentThread[i].lineId == lineId) {
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
      function translatePX2Num(str) {
        if (/px/.test(str)) {
          str = str.replace("px", "");
        }
        return +str;
      }
      if (!this._testWidth) {
        this._testWidth = translatePX2Num(
          threadData.stateAry[this.moveData.stateIndex].width
        );
      }
      if (!this._testHeight) {
        this._testHeight = translatePX2Num(
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

    //将绘制连线的方法拆分为以下方法
    moveToStartPoint(lineStartPoint) {
      return `M ${lineStartPoint.x} ${lineStartPoint.y}`;
    },
    //以配置好的连线长度绘制连线
    drawHorizontalSetLine() {
      return `h ${line_h}`;
    },
    drawHorizontalLine(lineEndPointX) {
      return `H ${lineEndPointX}`;
    },
    drawVerticalLine(lineEndPointY) {
      return `m 0 0 V ${lineEndPointY}`;
    },
    drawLineToPoint(lineEndPointX, lineEndPointY) {
      return `m 0 0 L ${lineEndPointX} ${lineEndPointY}`;
    },
    drawArc(radius, xRotation, sweepFlag, lineEndPointX, lineEndPointY) {
      return `m 0 0 A ${radius} ${radius} ${xRotation} 0 ${sweepFlag} ${lineEndPointX} ${lineEndPointY}`;
    },
    drawArrow(lineEndPoint) {
      return `m -5 -5 L ${lineEndPoint.x} ${lineEndPoint.y} L ${
        lineEndPoint.x - 5
      } ${lineEndPoint.y + 5}`;
    },

    //绘制现有的几种连线样式
    drawStraightConnectLine(startPoint, endPoint, lineRadius) {
      let linePath = [];
      linePath.push(this.moveToStartPoint(startPoint));
      linePath.push(this.drawHorizontalLine(endPoint.x));
      linePath.push(this.drawArrow(endPoint));
      return linePath.join(" ");
    },
    drawUpperBackConnectLine(startPoint, endPoint, lineRadius, stateHeight) {
      let linePath = [];
      linePath.push(this.moveToStartPoint(startPoint));
      linePath.push(this.drawHorizontalSetLine());

      let firstArcX = startPoint.x + line_h + LINE_RADIUS;
      let firstArcY = startPoint.y - LINE_RADIUS;
      linePath.push(this.drawArc(LINE_RADIUS, 1, 0, firstArcX, firstArcY));

      let lineToSecondArc = endPoint.y - line_v + LINE_RADIUS - stateHeight;
      linePath.push(this.drawVerticalLine(lineToSecondArc));

      let secondArcX = startPoint.x + line_h;
      let secondArcY = endPoint.y - line_v - stateHeight;
      linePath.push(this.drawArc(LINE_RADIUS, 0, 0, secondArcX, secondArcY));

      let lineToThirdArcX = endPoint.x - line_h + LINE_RADIUS;
      let lineToThirdArcY = endPoint.y - line_v - stateHeight;
      linePath.push(this.drawLineToPoint(lineToThirdArcX, lineToThirdArcY));

      let thirdArcX = endPoint.x - line_h;
      let thirdArcY = endPoint.y - line_v + LINE_RADIUS - stateHeight;
      linePath.push(this.drawArc(LINE_RADIUS, 1, 0, thirdArcX, thirdArcY));

      let lineToFourthArc = endPoint.y - LINE_RADIUS;
      linePath.push(this.drawVerticalLine(lineToFourthArc));

      let fourthArcX = endPoint.x - line_h + LINE_RADIUS;
      let fourthArcY = endPoint.y;
      linePath.push(this.drawArc(LINE_RADIUS, 0, 0, fourthArcX, fourthArcY));

      let lineToArrowX = endPoint.x;
      let lineToArrowY = endPoint.y;
      linePath.push(this.drawLineToPoint(lineToArrowX, lineToArrowY));
      linePath.push(this.drawArrow(endPoint));

      return linePath.join(" ");
    },
    drawLowerBackConnectLine(startPoint, endPoint, lineRadius, stateHeight) {
      let linePath = [];
      linePath.push(this.moveToStartPoint(startPoint));
      linePath.push(this.drawHorizontalSetLine());

      let firstArcX = startPoint.x + line_h + LINE_RADIUS;
      let firstArcY = startPoint.y + LINE_RADIUS;
      linePath.push(this.drawArc(LINE_RADIUS, 0, 1, firstArcX, firstArcY));

      let lineToSecondArc = endPoint.y + line_v - LINE_RADIUS + stateHeight;
      linePath.push(this.drawVerticalLine(lineToSecondArc));

      let secondArcX = startPoint.x + line_h;
      let secondArcY = endPoint.y + line_v + stateHeight;
      linePath.push(this.drawArc(LINE_RADIUS, 0, 1, secondArcX, secondArcY));

      let lineToThirdArcX = endPoint.x - line_h + LINE_RADIUS;
      let lineToThirdArcY = endPoint.y + line_v + stateHeight;
      linePath.push(this.drawLineToPoint(lineToThirdArcX, lineToThirdArcY));

      let thirdArcX = endPoint.x - line_h;
      let thirdArcY = endPoint.y + line_v - LINE_RADIUS + stateHeight;
      linePath.push(this.drawArc(LINE_RADIUS, 0, 1, thirdArcX, thirdArcY));

      let lineToFourthArc = endPoint.y + LINE_RADIUS;
      linePath.push(this.drawVerticalLine(lineToFourthArc));

      let fourthArcX = endPoint.x - line_h + LINE_RADIUS;
      let fourthArcY = endPoint.y;
      linePath.push(this.drawArc(LINE_RADIUS, 0, 1, fourthArcX, fourthArcY));

      let lineToArrowX = endPoint.x;
      let lineToArrowY = endPoint.y;
      linePath.push(this.drawLineToPoint(lineToArrowX, lineToArrowY));
      linePath.push(this.drawArrow(endPoint));

      return linePath.join(" ");
    },
    drawUpperConnectLine(startPoint, endPoint, lineRadius) {
      let linePath = [];
      linePath.push(this.moveToStartPoint(startPoint));
      linePath.push(this.drawHorizontalSetLine());

      let firstArcX = startPoint.x + line_h + LINE_RADIUS;
      let firstArcY = startPoint.y - LINE_RADIUS;
      linePath.push(this.drawArc(LINE_RADIUS, 0, 0, firstArcX, firstArcY));

      let lineToSecondArc = endPoint.y + LINE_RADIUS;
      linePath.push(this.drawVerticalLine(lineToSecondArc));

      let secondArcX = startPoint.x + line_h + 2 * LINE_RADIUS;
      let secondArcY = endPoint.y;
      linePath.push(this.drawArc(LINE_RADIUS, 0, 1, secondArcX, secondArcY));

      let lineToArrowX = endPoint.x;
      let lineToArrowY = endPoint.y;
      linePath.push(this.drawLineToPoint(lineToArrowX, lineToArrowY));
      linePath.push(this.drawArrow(endPoint));

      return linePath.join(" ");
    },
    drawLowerConnectLine(startPoint, endPoint, lineRadius) {
      let linePath = [];
      linePath.push(this.moveToStartPoint(startPoint));
      linePath.push(this.drawHorizontalSetLine());

      let firstArcX = startPoint.x + line_h + LINE_RADIUS;
      let firstArcY = startPoint.y + LINE_RADIUS;
      linePath.push(this.drawArc(LINE_RADIUS, 0, 1, firstArcX, firstArcY));

      let lineToSecondArc = endPoint.y - LINE_RADIUS;
      linePath.push(this.drawVerticalLine(lineToSecondArc));

      let secondArcX = startPoint.x + line_h + 2 * LINE_RADIUS;
      let secondArcY = endPoint.y;
      linePath.push(this.drawArc(LINE_RADIUS, 0, 0, secondArcX, secondArcY));

      let lineToArrowX = endPoint.x;
      let lineToArrowY = endPoint.y;
      linePath.push(this.drawLineToPoint(lineToArrowX, lineToArrowY));
      linePath.push(this.drawArrow(endPoint));

      return linePath.join(" ");
    },
    /*
     * 绘制临时连线
     *
     */
    drawOnConnectingLine(startPoint, endPoint, lineRadius, stateHeight = 20) {
      let tempRadius = LINE_RADIUS;
      // y坐标相等时绘制直线
      if (endPoint.y == startPoint.y && endPoint.x > startPoint.x) {
        this.updateTempLineData({
          endPoint: endPoint,
          d: this.drawStraightConnectLine(startPoint, endPoint, LINE_RADIUS),
        });
      }

      // 鼠标在连接点左侧时
      if (
        endPoint.x - line_h - LINE_RADIUS < startPoint.x &&
        endPoint.y < startPoint.y
      ) {
        if (endPoint.x - startPoint.x < line_h) {
        }
        this.updateTempLineData({
          endPoint: endPoint,
          d: this.drawUpperBackConnectLine(
            startPoint,
            endPoint,
            LINE_RADIUS,
            stateHeight
          ),
        });
      }

      if (
        endPoint.x - line_h - LINE_RADIUS < startPoint.x &&
        endPoint.y > startPoint.y
      ) {
        if (endPoint.x - startPoint.x < line_h) {
        }
        this.updateTempLineData({
          endPoint: endPoint,
          d: this.drawLowerBackConnectLine(
            startPoint,
            endPoint,
            LINE_RADIUS,
            stateHeight
          ),
        });
      }

      // 当结束点的x, y坐标均大于起始点的时候
      if (
        endPoint.x > startPoint.x + line_h + LINE_RADIUS &&
        endPoint.y > startPoint.y
      ) {
        // 当结束点与起始点的y坐标差距小于两个拐角半径时，根据结束点和起始点的y坐标的差动态决定拐角半径
        if (endPoint.y - startPoint.y < 2 * tempRadius) {
          let doubleRadius = endPoint.y - startPoint.y;
          tempRadius = doubleRadius / 2;
          this.updateTempLineData({
            endPoint: endPoint,
            d: this.drawLowerConnectLine(startPoint, endPoint, tempRadius),
          });
        } else {
          this.updateTempLineData({
            endPoint: endPoint,
            d: this.drawLowerConnectLine(startPoint, endPoint, LINE_RADIUS),
          });
        }
      }
      // 当结束点的x坐标大于起始点，y坐标小于起始点时
      if (
        endPoint.x > startPoint.x + line_h + LINE_RADIUS &&
        endPoint.y < startPoint.y
      ) {
        // 当结束点与起始点的y坐标差距小于两个拐角半径时，根据结束点和起始点的y坐标的差动态决定拐角半径
        if (startPoint.y - endPoint.y < 2 * tempRadius) {
          let doubleRadius = startPoint.y - endPoint.y;
          tempRadius = doubleRadius / 2;
          this.updateTempLineData({
            endPoint: endPoint,
            d: this.drawUpperConnectLine(startPoint, endPoint, tempRadius),
          });
        } else {
          this.updateTempLineData({
            endPoint: endPoint,
            d: this.drawUpperConnectLine(startPoint, endPoint, LINE_RADIUS),
          });
        }
      }
    },
    // 根据连入状态的高度绘制连线
    drawLineByEndState(endStateId, endPoint) {
      let stateAry = store.stateData.threadAry[this.threadIndex].stateAry;
      let targetState = Tools.stateTraverse(stateAry, endStateId);

      if (targetState) {
        let targetStateHeight =
          parseInt(targetState.height.replace("px", ""), 10) / 2;
        this.drawOnConnectingLine(
          this.tempLineData.startPoint,
          endPoint,
          LINE_RADIUS,
          targetStateHeight
        );
      } else {
        this.drawOnConnectingLine(
          this.tempLineData.startPoint,
          endPoint,
          LINE_RADIUS
        );
      }
    },

    onConnecting(e) {
      if (stateManage.isConnecting) {
        //检测鼠标左键是否仍是按下状态    ===1 说明鼠标左键被按下后未松开
        if (e.buttons === 1) {
          //绘制临时的连接线
          stateManage.isConnecting = true;
          this.showTempLine = true;
          let endPoint = this.getEndPoint(e);
          let endState = this.getEndState(e);
          //修改画线方法
          if (endState.stateId) {
            this.drawLineByEndState(endState.stateId, endPoint);
          } else {
            this.drawOnConnectingLine(
              this.tempLineData.startPoint,
              endPoint,
              LINE_RADIUS
            );
          }
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
      //debugger;
      let endState = this.getEndState(e);
      let lineData = this.copy(this.tempLineData);
      lineData.endState = endState;
      lineData.lineId = window.genId("line");
      lineData.desc = "";
      store.addLine({
        threadIndex: this.threadIndex,
        lineData: lineData,
      });
    },

    copy(obj) {
      return deepCopy(obj);
    },
    /**
     * 判断两根连线是否相同,如果连线1的开始状态==连线2的开始状态，且连线1的结束状态==连线2的结束状态，说明是同一根连线
     * 因为鼠标松开之前无法更新连线的endstate,手动获取endstate用于判断
     * @return Boolean
     */
    isSameLine(line1, line2, endStateId) {
      return (
        line1.startState.stateId == line2.startState.stateId &&
        line1.endState.stateId == endStateId
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
      let loopConnectPointReg = /loop-connect-point/;
      let point;
      if (
        regIsConnectPoint.test(target_class) ||
        loopConnectPointReg.test(target_class)
      ) {
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
      //debugger;
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

        let stateAry = store.stateData.threadAry[this.threadIndex].stateAry;
        let lineAry = store.stateData.threadAry[this.threadIndex].lineAry;
        // 寻找连线的起始状态,
        let startStateId = this.tempLineData.startState.stateId;
        let inLoopData = this.createInLoopData(startStateId, stateAry);

        if (regIsConnectPoint.test(target_class)) {
          //绘制连接线
          existedLine = this.isDuplicateLine(this.tempLineData, endStateId);
          if (existedLine) {
            return;
          } else {
            this.drawConnectLine(e);
            inLoopData = this.getInLoopData(inLoopData, stateAry, lineAry);
            if (inLoopData.inLoopFlag) {
              alert("该连线会形成循环结构");
              console.log(inLoopData.inLoopStates);
              this.createNestStructure(
                startStateId,
                endStateId,
                inLoopData.inLoopStates
              );
            }
          }
        }
        this.showTempLine = false;
        stateManage.isConnecting = false;
      }
    },
    //根据lineId寻找对应连线
    findLine(lineId, lineAry) {
      let lineData =
        lineAry.find((item) => {
          return lineId === item.lineId;
        }) || {};
      return lineData;
    },
    /**
     * 根据当前连线连出的状态块的id，生成用于传入isInLoop中判断当前状态图是否存在环的数据
     * @param {startStateId, stateAry}
     */
    createInLoopData(startStateId, stateAry) {
      let startState = Tools.stateTraverse(stateAry, startStateId);
      let inLoopData = {
        currentState: startState,
        startState: startState,
        inLoopStates: [],
        inLoopFlag: false,
      };
      return inLoopData;
    },
    /**
     *
     * 获取判断从当前状态块连出当前连线后，状态图内是否存在循环的数据。若图中存在寻环，则获取形成循环的状态。
     *
     * @param {inLoopData}
     */
    getInLoopData(inLoopData, stateAry, lineAry) {
      let result = [];
      this.isInLoop(inLoopData, stateAry, lineAry, result);
      if (result.length > 0) {
        return result.pop();
      } else {
        return {
          inLoopFlag: false,
        };
      }
    },
    /**判断添加连线后，状态图内是否会形成循环
     *
     * @param {inLoopData, stateAry, lineAry, result} inLoopData
     *
     */
    isInLoop(inLoopData, stateAry, lineAry, result) {
      //遍历当前状态的inputAry
      for (let i = 0; i < inLoopData.currentState.inputAry.length; i++) {
        //因为状态的inputAry内只存储了lineId，到lineAry内获取当前连线的连出状态
        let lineData = this.findLine(
          inLoopData.currentState.inputAry[i].lineId,
          lineAry
        );
        let inputStateId = lineData.startState.stateId;
        //若连线的连出状态与开始判断是否存在循环的状态相同，则存在循环，删除当前连线，并用循环结构包裹
        if (inputStateId === inLoopData.startState.stateId) {
          store.deleteLine(lineData);
          inLoopData.inLoopStates.push(inLoopData.startState);
          inLoopData.inLoopFlag = true;
          result.push(inLoopData);
          return;
        }
        //若连线的连出状态与开始判断是否存在循环的状态不同，则继续遍历当前连线的连出状态的inputAry
        let inputState = Tools.stateTraverse(stateAry, inputStateId);
        //追踪处于循环结构内的状态
        inLoopData.inLoopStates.push(inputState);
        inLoopData.currentState = inputState;
        this.isInLoop(inLoopData, stateAry, lineAry, result);
      }
    },
    /**
     * 若该连线会形成循环结构，则用一个嵌套结构的状态包裹形成循环结构的状态
     * TODO：需要处理与形成循环结构的状态相连的连线以及删除原本状态的问题
     *
     * @param {startStateId, endStateId, inLoopStates}
     */
    createNestStructure(startStateId, endStateId, inLoopStates) {
      debugger;
      let stateAry = store.stateData.threadAry[this.threadIndex].stateAry;
      let startState = Tools.stateTraverse(stateAry, startStateId);
      let endState = Tools.stateTraverse(stateAry, endStateId);
      let loopStateTemplate = {
        x: startState.x < endState.x ? startState.x - 20 : endState.x - 20,
        y: startState.y < endState.y ? startState.y - 20 : endState.y - 20,
        stateType: "stateDiv",
        index: this.threadIndex,
      };
      let loopState = store.getDefaultStateCfg(loopStateTemplate);
      loopState.width = Math.abs(startState.x - endState.x) + "px";
      loopState.height = Math.abs(startState.y - endState.y) + "px";
      loopState.mode = "nest";
      for (var i in inLoopStates) {
        loopState.children.push(inLoopStates[i]);
      }
      stateAry.push(loopState);
    },

    drop(e) {
      if (e.dataTransfer.getData("operate") === "addState") {
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
        let findingIndex = (stateAry, DragStateId) => {
          let stateIndex = 0;
          for (let i = 0; i < stateAry.length; i++) {
            if (stateAry[i].stateId === DragStateId) {
              stateIndex = i;
              break;
            }
          }
          return stateIndex;
        };
        if (stateInThreadFlag) {
          // 进入这里说明是同一层级内部的拖动
          let copiedIndexAry = Tools.deepCopy(statePageVue._dragData.indexAry);
          let copiedThreadIndex = copiedIndexAry.pop();
          let parentIndex = null;
          theDragStateData.parent = parentIndex;
          // 当拖动的组件为循环组件时，动态更新循环组件内children的parent
          if (theDragStateData.children) {
            let i = 0;
            while (i < theDragStateData.children.length) {
              // 通过在stateAry里寻找父数据来确认parent，不可以直接用length
              theDragStateData.children[i].parent = findingIndex(
                statePageVue.threadAry[copiedThreadIndex].stateAry,
                theDragStateData.stateId
              );
              i++;
            }
          }
          //console.log("drop内移动阶段：", theDragStateData)
          return false;
        }
        //无论是从外层拖拽状态到循环组件内还是循环组件内的状态块移动，都应该将放开时的位置和当前循环块的位置做一次计算，得到目标位置
        let x = e.pageX - this.$el.getBoundingClientRect().left;
        let y = e.pageY - this.$el.getBoundingClientRect().top;
        theDragStateData.x = x /* - statePageVue._dragData.mousedownPoint.x */;
        theDragStateData.y = y /*  - statePageVue._dragData.mousedownPoint.y */;
        // 放开时重新计算状态的parent属性

        let copiedIndexAry = Tools.deepCopy(statePageVue._dragData.indexAry);
        let copiedThreadIndex = copiedIndexAry.pop();
        let parentIndex = null;
        theDragStateData.parent = parentIndex;
        // 当拖动的组件为循环组件时，动态更新循环组件内children的parent
        if (theDragStateData.children) {
          let i = 0;
          while (i < theDragStateData.children.length) {
            // 走到这里说明是从循环内部拖动到外部，因为增加了一个模块，直接用stateAry.length来做parent
            theDragStateData.children[i].parent =
              statePageVue.threadAry[copiedThreadIndex].stateAry.length;
            i++;
          }
        }
        //console.log("drop内嵌套阶段：", theDragStateData)
        let tI = statePageVue._dragData.indexAry.pop(); //线程索引
        statePageVue.threadAry[tI].stateAry.push(theDragStateData);

        let dragTargetParent = statePageVue.threadAry[tI].stateAry;
        while (
          statePageVue._dragData &&
          statePageVue._dragData.indexAry.length > 1
        ) {
          let i = statePageVue._dragData.indexAry.pop();
          dragTargetParent = dragTargetParent[i].children;
        }
        setTimeout(() => {
          dragTargetParent.splice(statePageVue._dragData.indexAry.pop(), 1);
        }, 10);
      }
    },
    getXYFromEventData(eventData){
      let xy = {};
      //组件嵌套的情况，会将数据依次往上传递，传递的过程中会包一层data
      if(typeof eventData.data !== 'undefined'){
        xy = this.getXYFromEventData(eventData.data);
      }else{
        xy = {
          x: eventData.transform.x,
          y: eventData.transform.y
        }
      }
      return xy;
    },
    /**
     * 更新状态的位置 这里xy数据更新后视图自动更新
     */
    updateStateXY(state, xy){
      if(state){
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
      this.updateLines(state, eventData);
      this.updateSubStatesAbsoluteXY(state, xy);
    },
    /**
     * 更新某个状态块的所有输入连线和输出连线
     */
    updateLines(state, eventData) {
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
          this.updateInputLines(inputLine, eventData);
        });
      }

      if (currentState.outputAry) {
        currentState.outputAry.forEach((item) => {
          // inputLine --> state中保存的lineId以及对这个触发事件的描述等信息，没有真正的用于画连线的数据
          outputLine = lineAry.find((line) => {
            //line --> line的具体画连线的数据   inputLine与line通过lineId更新数据
            return line.lineId === item.lineId;
          });
          this.updateOutputLines(outputLine, eventData);
        });
      }
    },
    /**
     * 更新这个状态的子状态相对于线程框的xy坐标 即absolutePosition 此数据仅用于绘制line
     */
    updateSubStatesAbsoluteXY(state, xy){
      // 递归处理嵌套在父状态内的所有状态的连线
      if(state){
        for (var i = 0; i < state.children.length; i++) {
          // 绘制连线需要用到一些属性，定义childrenData来将属性一层层传递
          let childrenData = this.updateChildrenData(
            state.children[i],
            xy
          );
          this.updateLines(childrenData);
          this.updateSubStatesAbsoluteXY(state.children[i], xy); //TODO 更深层次的状态的连线更新 待验证
        }
      }
    },

    //用于更新嵌套状态中子状态的连线的方法
    updateChildrenData(stateChildren, xy) {
      let childrenData = {
        children: stateChildren.children,
        // 使用状态块的绝对位置来判断连线的位置，连线现在是以绝对位置实现的，后续可能需要修改
        absolutePosition: {
          x: stateChildren.x + xy.x,
          y: stateChildren.y + xy.y,
        },
        stateType: stateChildren.stateType,
        inputAry: stateChildren.inputAry,
        outputAry: stateChildren.outputAry,
        width: stateChildren.width,
        height: stateChildren.height,
        inLoop: true,
        stateId: stateChildren.stateId,
      };
      return childrenData;
    },
    /**
     * 当连线的结束点变化时，动态更新连线
     * 现在的实现为单纯的通过起始与结束点来判断该绘制哪种连线，自动布局的grid实现后需要通过grid的行列来进行判断
     */
    drawInputLine(curLine, stateHeight, endPoint) {
      let lineRadius = LINE_RADIUS;
      let linepath;

      // 计算得到endPoint
      if(!endPoint){
        let threadPos = document.getElementsByClassName("thread")[this.threadIndex].getBoundingClientRect();
        let statePos =  document.getElementById(curLine.endState.stateId).getBoundingClientRect();
        endPoint = {
          x: statePos.getBoundingClientRect().left - threadPos.left,
          y: statePos.getBoundingClientRect().top - threadPos.top
        }
      }

      // y坐标相同，绘制直线
      if (
        endPoint.x > curLine.startPoint.x + line_h + LINE_RADIUS &&
        endPoint.y == curLine.startPoint.y
      ) {
        linepath = this.drawStraightConnectLine(
          curLine.startPoint,
          endPoint,
          LINE_RADIUS
        );
        curLine.endPoint = endPoint;
        curLine.d = linepath;
        return;
      }

      // 当结束点的x坐标小于起始点且y坐标相等时或小于起始点时
      if (
        (endPoint.x - line_h - LINE_RADIUS < curLine.startPoint.x &&
          endPoint.y < curLine.startPoint.y) ||
        (endPoint.x < curLine.startPoint.x &&
          endPoint.y == curLine.startPoint.y)
      ) {
        linepath = this.drawUpperBackConnectLine(
          curLine.startPoint,
          endPoint,
          LINE_RADIUS,
          stateHeight
        );
        curLine.endPoint = endPoint;
        curLine.d = linepath;
        return;
      }
      // 当结束点的x坐标小于起始点时且y坐标大于起始点时
      if (
        endPoint.x - line_h - LINE_RADIUS < curLine.startPoint.x &&
        endPoint.y > curLine.startPoint.y
      ) {
        linepath = this.drawLowerBackConnectLine(
          curLine.startPoint,
          endPoint,
          LINE_RADIUS,
          stateHeight
        );
        curLine.endPoint = endPoint;
        curLine.d = linepath;
        return;
      }

      // 当结束点的x, y坐标均大于起始点的时候
      if (
        endPoint.x > curLine.startPoint.x + line_h + LINE_RADIUS &&
        endPoint.y > curLine.startPoint.y
      ) {
        // 当结束点与起始点的y坐标差距小于两个拐角半径时，根据结束点和起始点的y坐标的差动态决定拐角半径
        if (endPoint.y - curLine.startPoint.y < 2 * tempRadius) {
          let doubleRadius = endPoint.y - curLine.startPoint.y;
          tempRadius = doubleRadius / 2;
          linepath = this.drawLowerConnectLine(
            curLine.startPoint,
            endPoint,
            tempRadius
          );
          curLine.endPoint = endPoint;
          curLine.d = linepath;
          return;
        } else {
          linepath = this.drawLowerConnectLine(
            curLine.startPoint,
            endPoint,
            LINE_RADIUS
          );
          curLine.endPoint = endPoint;
          curLine.d = linepath;
          return;
        }
      }
      //当结束点的x坐标大于起始点，y坐标小于起始点时
      if (
        endPoint.x > curLine.startPoint.x + line_h + LINE_RADIUS &&
        endPoint.y < curLine.startPoint.y
      ) {
        // 当结束点与起始点的y坐标差距小于两个拐角半径时，根据结束点和起始点的y坐标的差动态决定拐角半径
        if (curLine.startPoint.y - endPoint.y < 2 * tempRadius) {
          let doubleRadius = curLine.startPoint.y - endPoint.y;
          tempRadius = doubleRadius / 2;
          (linepath = this.drawUpperConnectLine(
            curLine.startPoint,
            endPoint,
            tempRadius
          )),
            (curLine.endPoint = endPoint);
          curLine.d = linepath;
          return;
        } else {
          (linepath = this.drawUpperConnectLine(
            curLine.startPoint,
            endPoint,
            LINE_RADIUS
          )),
            (curLine.endPoint = endPoint);
          curLine.d = linepath;
          return;
        }
      }
    },
    /**
     * 当连线的起始点发生变化时，动态更新连线
     * 现在的实现为单纯的通过起始与结束点来判断该绘制哪种连线，自动布局的grid实现后需要通过grid的行列来进行判断
     */
    drawOutputLine(startPoint, stateHeight, curLine, lineRadius) {
      let tempRadius = LINE_RADIUS;
      let linepath;
      // y坐标相同，绘制直线
      if (
        curLine.endPoint.x > startPoint.x + line_h + LINE_RADIUS &&
        curLine.endPoint.y == startPoint.y
      ) {
        linepath = this.drawStraightConnectLine(
          startPoint,
          curLine.endPoint,
          LINE_RADIUS
        );
        curLine.startPoint = startPoint;
        curLine.d = linepath;
        return;
      }

      if (
        (curLine.endPoint.x - line_h - LINE_RADIUS < startPoint.x &&
          curLine.endPoint.y < startPoint.y) ||
        (curLine.endPoint.x < startPoint.x &&
          curLine.endPoint.y == startPoint.y)
      ) {
        linepath = this.drawUpperBackConnectLine(
          startPoint,
          curLine.endPoint,
          LINE_RADIUS,
          stateHeight
        );
        curLine.startPoint = startPoint;
        curLine.d = linepath;
        return;
      }

      // 当结束点的x坐标小于起始点时且y坐标大于起始点时
      if (
        curLine.endPoint.x - line_h - LINE_RADIUS < startPoint.x &&
        curLine.endPoint.y > startPoint.y
      ) {
        linepath = this.drawLowerBackConnectLine(
          startPoint,
          curLine.endPoint,
          LINE_RADIUS,
          stateHeight
        );
        curLine.startPoint = startPoint;
        curLine.d = linepath;
        return;
      }
      // 当结束点的x, y坐标均大于起始点的时候
      if (
        curLine.endPoint.x > startPoint.x + line_h + LINE_RADIUS &&
        curLine.endPoint.y > startPoint.y
      ) {
        // 当结束点与起始点的y坐标差距小于两个拐角半径时，根据结束点和起始点的y坐标的差动态决定拐角半径
        if (curLine.endPoint.y - startPoint.y < 2 * tempRadius) {
          let doubleRadius = curLine.endPoint.y - startPoint.y;
          tempRadius = doubleRadius / 2;
          linepath = this.drawLowerConnectLine(
            startPoint,
            curLine.endPoint,
            tempRadius
          );
          curLine.startPoint = startPoint;
          curLine.d = linepath;
          return;
        } else {
          linepath = this.drawLowerConnectLine(
            startPoint,
            curLine.endPoint,
            LINE_RADIUS
          );
          curLine.startPoint = startPoint;
          curLine.d = linepath;
          return;
        }
      }
      //当结束点的x坐标大于起始点，y坐标小于起始点时
      if (
        curLine.endPoint.x > startPoint.x + line_h + LINE_RADIUS &&
        curLine.endPoint.y < startPoint.y
      ) {
        // 当结束点与起始点的y坐标差距小于两个拐角半径时，根据结束点和起始点的y坐标的差动态决定拐角半径
        if (startPoint.y - curLine.endPoint.y < 2 * tempRadius) {
          let doubleRadius = startPoint.y - curLine.endPoint.y;
          tempRadius = doubleRadius / 2;
          linepath = this.drawUpperConnectLine(
            startPoint,
            curLine.endPoint,
            tempRadius
          );
          curLine.startPoint = startPoint;
          curLine.d = linepath;
          return;
        } else {
          linepath = this.drawUpperConnectLine(
            startPoint,
            curLine.endPoint,
            LINE_RADIUS
          );
          curLine.startPoint = startPoint;
          curLine.d = linepath;
          return;
        }
      }
    },
    createLinePath(line){

    },
    drawLine(line, startState, endState){
      let tempRadius = LINE_RADIUS;
      let startPoint, endPoint, stateHeight, linepath;
      startPoint = QBlock.Line.getStartPoint(line, this.threadIndex);
      endPoint = QBlock.Line.getEndPoint(line, this.threadIndex);
      stateHeight = Math.max(QBlock.State.getStateHeight(startState)/2, QBlock.State.getStateHeight(endState)/2);

      // y坐标相同，绘制直线
      if (
        endPoint.x > startPoint.x + line_h + LINE_RADIUS &&
        endPoint.y == startPoint.y
      ) {
        linepath = this.drawStraightConnectLine(
          startPoint,
          endPoint,
          LINE_RADIUS
        );
        line.endPoint = endPoint;
        line.d = linepath;
        return;
      }

      // 当结束点的x坐标小于起始点且y坐标相等时或小于起始点时
      if (
        (endPoint.x - line_h - LINE_RADIUS < startPoint.x &&
          endPoint.y < startPoint.y) ||
        (endPoint.x < startPoint.x &&
          endPoint.y == startPoint.y)
      ) {
        linepath = this.drawUpperBackConnectLine(
          startPoint,
          endPoint,
          LINE_RADIUS,
          stateHeight
        );
        line.endPoint = endPoint;
        line.d = linepath;
        return;
      }
      // 当结束点的x坐标小于起始点时且y坐标大于起始点时
      if (
        endPoint.x - line_h - LINE_RADIUS < startPoint.x &&
        endPoint.y > startPoint.y
      ) {
        linepath = this.drawLowerBackConnectLine(
          startPoint,
          endPoint,
          LINE_RADIUS,
          stateHeight
        );
        line.endPoint = endPoint;
        line.d = linepath;
        return;
      }

      // 当结束点的x, y坐标均大于起始点的时候
      if (
        endPoint.x > startPoint.x + line_h + LINE_RADIUS &&
        endPoint.y > startPoint.y
      ) {
        // 当结束点与起始点的y坐标差距小于两个拐角半径时，根据结束点和起始点的y坐标的差动态决定拐角半径
        if (endPoint.y - startPoint.y < 2 * tempRadius) {
          let doubleRadius = endPoint.y - startPoint.y;
          tempRadius = doubleRadius / 2;
          linepath = this.drawLowerConnectLine(
            startPoint,
            endPoint,
            tempRadius
          );
          line.endPoint = endPoint;
          line.d = linepath;
          return;
        } else {
          linepath = this.drawLowerConnectLine(
            startPoint,
            endPoint,
            LINE_RADIUS
          );
          line.endPoint = endPoint;
          line.d = linepath;
          return;
        }
      }
      //当结束点的x坐标大于起始点，y坐标小于起始点时
      if (
        endPoint.x > startPoint.x + line_h + LINE_RADIUS &&
        endPoint.y < startPoint.y
      ) {
        // 当结束点与起始点的y坐标差距小于两个拐角半径时，根据结束点和起始点的y坐标的差动态决定拐角半径
        if (startPoint.y - endPoint.y < 2 * tempRadius) {
          let doubleRadius = startPoint.y - endPoint.y;
          tempRadius = doubleRadius / 2;
          (linepath = this.drawUpperConnectLine(
            startPoint,
            endPoint,
            tempRadius
          )),
            (line.endPoint = endPoint);
          line.d = linepath;
          return;
        } else {
          (linepath = this.drawUpperConnectLine(
            startPoint,
            endPoint,
            LINE_RADIUS
          )),
            (line.endPoint = endPoint);
          line.d = linepath;
          return;
        }
      }
    },
    /**
     * 根据状态块的transform数据更新其endPoint, 然后更新用于画线的数据d   todo
     * 连线方案：判断当前的鼠标位置，目标状态，如果存在这样1个状态a，它的纵坐标和startState，endState相等，且a的横坐标在startState，endState中间，则需要绕着a画折线
     * 连线分多种复杂场景，这部分后面逐渐完善
     */
    updateInputLines(curLine, eventData) {
      let line = curLine;
      function translatePX2Num(str) {
        if (/px/.test(str)) {
          str = str.replace("px", "");
        }
        return +str;
      }
      let currentThread = store.stateData.threadAry[this.threadIndex];

      // let currentState = store.getState(this.threadIndex, eventData.stateId);
      // 可以替换为
      let currentState = store.getState(this.threadIndex, line.endState.stateId);
      
      let stateType = currentState.stateType;
      let stateHeight = parseInt(translatePX2Num(currentState.height), 10) / 2;
      let stateWidth = parseInt(translatePX2Num(currentState.width), 10);

      // 更新连线的垂直高度时，需要获取连线连出点的可缩放的嵌套状态的高度
      let startState = store.getState(this.threadIndex, curLine.startState.stateId);
      let endState = currentState;
      this.drawLine(line, startState, endState);
    },

    updateOutputLines(curLine, stateData) {
      function translatePX2Num(str) {
        if (/px/.test(str)) {
          str = str.replace("px", "");
        }
        return +str;
      }
      let currentThread = store.stateData.threadAry[this.threadIndex];
      let currentState = Tools.stateTraverse(
        currentThread.stateAry,
        stateData.stateId
      );
      let stateType = currentState.stateType;
      let stateHeight = parseInt(translatePX2Num(currentState.height), 10) / 2;
      let stateWidth = parseInt(translatePX2Num(currentState.width), 10);

      //更新连线的垂直高度时，需要获取连线连入点的可缩放的嵌套状态的高度
      let inputState = Tools.stateTraverse(
        currentThread.stateAry,
        curLine.endState.stateId
      );
      let inputStateHeight =
        parseInt(translatePX2Num(inputState.height), 10) / 2;

      //非嵌套状态时，使用transform判断位置
      let startPoint;
      if (!stateData.data && !stateData.inLoop) {
        startPoint = {
          x: stateData.transform.x + stateWidth + 2,
          y: stateData.transform.y + stateHeight,
        };
      }
      // 因为嵌套状态时传递上来的属性包裹在了data内，需要到data内获取更新连线所需的数据
      while (stateData.data) {
        stateData = stateData.data;
      }

      startPoint = {
        x: stateData.absolutePosition.x + stateWidth + 2,
        y: stateData.absolutePosition.y + stateHeight,
      };

      if (inputStateHeight > stateHeight) {
        this.drawOutputLine(
          startPoint,
          inputStateHeight,
          curLine,
          LINE_RADIUS
        );
      } else {
        this.drawOutputLine(
          startPoint,
          stateHeight,
          curLine,
          LINE_RADIUS
        );
      }
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

.templine {
  stroke: #ff0000;
  stroke-width: 1px !important;
  fill: none;
}
.templine:hover {
  stroke: yellow;
  fill: none;
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