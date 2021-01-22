<template>
  <g
    @contextmenu.prevent="onContextMenu"
    @click.stop="activeLineChange"
    @mouseup="stopMovingLine"
    :class="[{ showdesc: line.showdesc }, { active: isInActiveLines() }]"
  >
    <path
      :lineId="line.lineId"
      :id="line.lineId"
      :d="linePath"
      :class="genClass(lineType)"
      :style="{ strokeWidth: lineType === 'tempLine' ? '1px' : strokeWidth }"
    >
    </path>
    <path
      v-if="lineType !== 'tempLine'"
      :d="getTextPath(line)"
      :id="line.lineId + '-textpath'"
    ></path>
    <text v-if="line.desc" x="15" y="0">
      <title>{{ line.desc }}</title>
      <textPath
        :xlink:href="'#' + line.lineId + '-textpath'"
        :id="line.lineId + '-text'"
        >{{
          line.desc.length > descLimit
            ? line.desc.slice(0, 8) + "..."
            : line.desc
        }}</textPath
      >
    </text>

    <rect
      :id="genMovablePointId(3)"
      v-show="isInActiveLines() && isNotBackConnectLine(line)"
      :x="getMovablePoint(line).x"
      :y="getMovablePoint(line).y"
      width="8"
      height="8"
      fill="white"
      stroke="black"
      stroke-width="1"
      @mousedown="startMovingLine"
      @mouseup="stopMovingLine"
    ></rect>
  </g>
</template>

<script>
import { lineCfg } from "./graphCfg.js";
import Util from "./util.js";
import QBlock from "./qblock.js";
const LINE_H = lineCfg.line_h;
const LINE_V = lineCfg.line_v;
const LINE_RADIUS = lineCfg.line_radius;
const HIGHLIGHT_LIMIT = lineCfg.highlight_limit;
const STROKE_WIDTH = lineCfg.stroke_width;
const DESC_LIMIT = lineCfg.desc_limit;
export default {
  name: "LineComp",
  props: ["line", "threadIndex", "lineType", "activeLines"],
  data() {
    return {
      strokeWidth: STROKE_WIDTH,
      descLimit: DESC_LIMIT,
      forceRefreshFlag: false,
    };
  },
  methods: {
    activeLineChange() {
      if (this._hasMovedLine) {
        this._hasMovedLine = false;
        return;
      }
      this.$emit("updateActiveLine", this.line.lineId);
    },
    isInActiveLines() {
      if (this.lineType === "tempLine") {
        return false;
      }
      for (let i = 0; i < this.activeLines.length; i++) {
        if (this.line.lineId === this.activeLines[i]) {
          return true;
        }
      }
      return false;
    },
    genClass(type) {
      var clazz = "";
      switch (type) {
        case "tempLine":
          clazz = "temp-line";
          break;
        case "default":
          clazz = "connect-line";
          break;
        case "loopStart":
          clazz = "connect-line";
          break;
        case "loopEnd":
          clazz = "connect-line";
          break;
        default:
          clazz = "connect-line";
      }
      return clazz;
    },
    generatePath(startPoint, endPoint, startState, endState, verticalOffset) {
      let isDynamicRadiusFlag =
        Math.abs(startPoint.y - endPoint.y) < 2 * LINE_RADIUS;
      let forward5isDynamicRadiusFlag =
        Math.abs(startPoint.y - (endPoint.y + verticalOffset)) <
        2 * LINE_RADIUS;
      let path;
      if (endPoint.y === startPoint.y && endPoint.x > startPoint.x) {
        path = this.drawStraightConnectLine(startPoint, endPoint);
      } else if (startPoint.x + LINE_H + 2 * LINE_RADIUS > endPoint.x) {
        path = this.drawLineBack5ByStateAndPoint(
          startPoint,
          endPoint,
          startState,
          endState
        );
      } else {
        //若两个状态块之间的y轴距离小于2个预设拐角半径，则需要动态计算连线拐角的半径，并绘制连线
        var radius = LINE_RADIUS;
        if (this.line.verticalOffset === 0) {
          //走到这里说明是三段式连线
          if (isDynamicRadiusFlag) {
            radius = Math.abs(startPoint.y - endPoint.y) / 2;
          }
          path = this.drawLine3ByPoint(startPoint, endPoint, radius);
        } else {
          var forward5LineRadius = Math.abs(verticalOffset / 2);
          //若根据verticalOffset/2计算的forward5LineRadius大于LINE_RADIUS，则限制forward5LineRadius的大小为LINE_RADIUS
          if (forward5LineRadius > LINE_RADIUS) {
            forward5LineRadius = LINE_RADIUS;
          }
          if (forward5isDynamicRadiusFlag) {
            radius = Math.abs(startPoint.y - (endPoint.y + verticalOffset)) / 2;
          }
          //若连线调节后开始与结束状态的x坐标相差小于2*LINE_H + 3*LINE_RADIUS, 则此时也需要画前向3段连线
          if (endPoint.x - startPoint.x < 2 * LINE_H + 3 * LINE_RADIUS) {
            var forward3LineRadius = LINE_RADIUS;
            if (isDynamicRadiusFlag) {
              forward3LineRadius = Math.abs(startPoint.y - endPoint.y) / 2;
            }
            path = this.drawLine3ByPoint(
              startPoint,
              endPoint,
              forward3LineRadius
            );
          } else {
            path = this.drawLineForward5ByPoint(
              startPoint,
              endPoint,
              radius,
              forward5LineRadius,
              verticalOffset
            );
          }
        }
      }
      //console.log(">>> " + path);
      return path;
    },
    generateByPoint() {},
    generateByState() {},
    /**
     * 根据连线的开始状态获取连线的起点
     */
    getStartPoint(line) {
      //如果开始点不存在
      if (
        !line.startPoint ||
        line.startPoint.x === null ||
        typeof line.startPoint.x === "undefined" ||
        isNaN(line.startPoint.x)
      ) {
        let startState = store.getState(
          this.threadIndex,
          line.startState.stateId,
          false /**isThreadId: false */
        );
        line.startPoint = {
          x: startState.x + Util.translatePX2Num(startState.width),
          y: startState.y + Util.translatePX2Num(startState.height) / 2,
        };
      } else {
        //debugger;
      }
      return line.startPoint;
    },
    getEndPoint(line) {
      //如果结束点不存在
      if (
        !line.endPoint ||
        line.endPoint.x === null ||
        typeof line.endPoint.x === "undefined" ||
        isNaN(line.endPoint.x)
      ) {
        let endState = store.getState(
          this.threadIndex,
          line.endState.stateId,
          false /**isThreadId: false */
        );
        line.endPoint = {
          x: endState.x,
          y: endState.y + Util.translatePX2Num(endState.height) / 2,
        };
      } else {
        //debugger;
      }
      return line.endPoint;
    },
    genMovablePointId(index) {
      return "movablePoint" + index;
    },
    getThirdMovablePoint(line, offset) {
      let thirdMovablePoint = {
        x: 0,
        y: 0,
      };
      if (!line.endState) {
        return thirdMovablePoint;
      }
      let startPoint = QBlock.Line.getStartPoint(line, this.threadIndex),
        endPoint = QBlock.Line.getEndPoint(line, this.threadIndex),
        halflineInputH = (endPoint.x - startPoint.x - LINE_H) / 2;
      thirdMovablePoint.x = endPoint.x - halflineInputH;
      thirdMovablePoint.y = endPoint.y - 4;
      if (offset) {
        thirdMovablePoint.y = endPoint.y - 4 + offset;
      }
      return thirdMovablePoint;
    },
    getStraightLineMovablePoint(line) {
      let straightLineMovablePoint = {
        x: 0,
        y: 0,
      };
      if (!line.endState) {
        return straightLineMovablePoint;
      }
      let startPoint = QBlock.Line.getStartPoint(line, this.threadIndex),
        endPoint = QBlock.Line.getEndPoint(line, this.threadIndex);
      straightLineMovablePoint.x =
        startPoint.x + (endPoint.x - startPoint.x) / 2;
      straightLineMovablePoint.y = endPoint.y - 3.5;
      return straightLineMovablePoint;
    },
    isStraightLine(line) {
      if (!line.endState) {
        return false;
      }
      let startPoint = QBlock.Line.getStartPoint(line, this.threadIndex),
        endPoint = QBlock.Line.getEndPoint(line, this.threadIndex);
      if (startPoint.y === endPoint.y) {
        return true;
      }
      return false;
    },
    isNotBackConnectLine(line) {
      let startPoint = QBlock.Line.getStartPoint(line, this.threadIndex),
        endPoint = QBlock.Line.getEndPoint(line, this.threadIndex);
      if (startPoint.x + 2 * LINE_H + 5 * LINE_RADIUS < endPoint.x) {
        return true;
      }
      return false;
    },
    getMovablePoint(line) {
      var movablePoint;
      if (this.isStraightLine(line)) {
        return this.getStraightLineMovablePoint(line);
      } else {
        movablePoint = this.getThirdMovablePoint(line, line.verticalOffset);
        return movablePoint;
      }
    },
    startMovingLine(e) {
      store.updateUndoData(this.threadIndex);
      this._hasMovedLine = true;
      let data = {
        startMovingLine: true,
        lineId: this.line.lineId,
        startPoint: {
          y: e.pageY,
        },
      };
      this.$emit("updateMoveLineData", data);
    },
    stopMovingLine() {
      this.$emit("stopMovingLine");
    },
    /*
     * 获取连线中点，然后以这个中点为起点绘制文字的路径
     *
     */
    getTextPath(line) {
      let startX,
        startY,
        endY,
        midPointPath,
        startPoint = QBlock.Line.getStartPoint(line, this.threadIndex),
        endPoint = QBlock.Line.getEndPoint(line, this.threadIndex);
      startX = startPoint.x;
      startY = startPoint.y;
      endY = endPoint.y;
      midPointPath = `M ${startX + LINE_H} ${(startY + endY) / 2} h 300`;
      if (line.verticalOffset) {
        midPointPath = `M ${startX + LINE_H} ${
          (startY + (endY + line.verticalOffset)) / 2
        } h 300`;
      }
      return midPointPath;
    },
    genId() {
      return window.genId("line");
    },
    onContextMenu(e) {
      EventObj.$emit("updateContextMenu", {
        lineId: this.line.lineId,
        threadIndex: this.threadIndex,
        lineData: this.line,
        position: {
          x: e.pageX,
          y: e.pageY,
        },
      });
    },

    //-------------------------------------------------------------
    //将绘制连线的方法拆分为以下方法
    moveToStartPoint(lineStartPoint) {
      return `M ${lineStartPoint.x} ${lineStartPoint.y} `;
    },
    //以配置好的连线长度绘制连线
    drawHorizontalSetLine() {
      return `h ${LINE_H} `;
    },
    drawHorizontalLine(lineEndPointX) {
      return `H ${lineEndPointX} `;
    },
    drawVerticalLine(lineEndPointY) {
      return `m 0 0 V ${lineEndPointY} `;
    },
    drawLineToEndPoint(lineEndPoint) {
      return `m 0 0 L ${lineEndPoint.x} ${lineEndPoint.y} `;
    },
    drawArc(radius, xRotation, sweepFlag, lineEndPoint) {
      return `m 0 0 A ${radius} ${radius} ${xRotation} 0 ${sweepFlag} ${lineEndPoint.x} ${lineEndPoint.y} `;
    },
    drawArrow(lineEndPoint) {
      return `m -5 -5 L ${lineEndPoint.x} ${lineEndPoint.y} L ${
        lineEndPoint.x - 5
      } ${lineEndPoint.y + 5} `;
    },

    //绘制直线连线
    drawStraightConnectLine(startPoint, endPoint) {
      let linePath = [];
      linePath.push(this.moveToStartPoint(startPoint));
      linePath.push(this.drawHorizontalLine(endPoint.x));
      linePath.push(this.drawArrow(endPoint));
      return linePath.join(" ");
    },
    //前向3段，前向5段，以及反向5段式连线通用的绘制连进连入点的直线的方法
    drawLineInputH(endPoint) {
      let tempLinePath = this.drawLineToEndPoint(endPoint);
      return tempLinePath;
    },
    /**
     * 反向5段式连线方法
     */
    //分段处理向后和向前的连线
    drawLineBack5OutputH(startPoint, endPoint, startState, endState) {
      let tempLinePath = "";
      tempLinePath += this.moveToStartPoint(startPoint);
      tempLinePath += this.drawHorizontalSetLine();
      tempLinePath += this.drawLine3Back5FirstArc(
        startPoint,
        endPoint,
        LINE_RADIUS
      );
      return tempLinePath;
    },
    //绘制前向3段连线与反向5段连线的第一个拐角
    drawLine3Back5FirstArc(startPoint, endPoint, lineRadius) {
      let tempLinePath = "";
      let firstArcEnd = {
        x: 0,
        y: 0,
      };
      //若起始点的y坐标大于结束点的y坐标
      if (startPoint.y > endPoint.y) {
        firstArcEnd.x = startPoint.x + LINE_H + lineRadius;
        firstArcEnd.y = startPoint.y - lineRadius;
        tempLinePath += this.drawArc(lineRadius, 1, 0, firstArcEnd);
      } else {
        firstArcEnd.x = startPoint.x + LINE_H + lineRadius;
        firstArcEnd.y = startPoint.y + lineRadius;
        tempLinePath += this.drawArc(lineRadius, 0, 1, firstArcEnd);
      }
      return tempLinePath;
    },
    drawLineBack5SecondArcUp(startPoint, endPoint, stateTop) {
      let tempLinePath = "";
      let secondArcEnd = {
        x: 0,
        y: 0,
      };
      secondArcEnd.x = startPoint.x + LINE_H;
      secondArcEnd.y = stateTop - LINE_V + lineCfg.threadTitleHeight;
      tempLinePath += this.drawArc(LINE_RADIUS, 0, 0, secondArcEnd);
      return tempLinePath;
    },
    drawLineBack5SecondArcDown(startPoint, endPoint, stateBottom) {
      let tempLinePath = "";
      let secondArcEnd = {
        x: 0,
        y: 0,
      };
      secondArcEnd.x = startPoint.x + LINE_H;
      secondArcEnd.y = stateBottom + LINE_V + lineCfg.threadTitleHeight;
      tempLinePath += this.drawArc(LINE_RADIUS, 0, 1, secondArcEnd);
      return tempLinePath;
    },
    //因为连线的坐标是相对于svg元素的，所以需要加上threadTitleHeight以获取连线的准确坐标
    drawLineBack5OutputVUp(startPoint, endPoint, startStateTop, endStateTop) {
      let tempLinePath = "";
      let secondArcStart;
      if (startStateTop < endStateTop) {
        //比较起始状态和结束状态的上边缘的高低，根据上边缘高的状态决定垂直绘制连线的坐标
        secondArcStart =
          startStateTop - LINE_V + LINE_RADIUS + lineCfg.threadTitleHeight;
        tempLinePath += this.drawVerticalLine(secondArcStart);
        tempLinePath += this.drawLineBack5SecondArcUp(
          startPoint,
          endPoint,
          startStateTop
        );
      } else {
        secondArcStart =
          endStateTop - LINE_V + LINE_RADIUS + lineCfg.threadTitleHeight;
        tempLinePath += this.drawVerticalLine(secondArcStart);
        tempLinePath += this.drawLineBack5SecondArcUp(
          startPoint,
          endPoint,
          endStateTop
        );
      }
      return tempLinePath;
    },
    //因为连线的坐标是相对于svg元素的，所以需要加上threadTitleHeight以获取连线的准确坐标
    drawLineBack5OutputVDown(
      startPoint,
      endPoint,
      startStateBottom,
      endStateBottom
    ) {
      let tempLinePath = "";
      let secondArcStart;
      let secondArcEnd = {
        x: 0,
        y: 0,
      };
      if (startStateBottom < endStateBottom) {
        //比较起始状态和结束状态的下边缘的高低，根据下边缘低的状态决定垂直绘制连线的坐标
        secondArcStart =
          endStateBottom + LINE_V - LINE_RADIUS + lineCfg.threadTitleHeight;
        tempLinePath += this.drawVerticalLine(secondArcStart);
        tempLinePath += this.drawLineBack5SecondArcDown(
          startPoint,
          endPoint,
          endStateBottom
        );
      } else {
        secondArcStart =
          startStateBottom + LINE_V - LINE_RADIUS + lineCfg.threadTitleHeight;
        tempLinePath += this.drawVerticalLine(secondArcStart);
        tempLinePath += this.drawLineBack5SecondArcDown(
          startPoint,
          endPoint,
          startStateBottom
        );
      }
      return tempLinePath;
    },
    drawLineBack5OutputV(startPoint, endPoint, startState, endState) {
      let startStateHeight,
        endStateHeight,
        startStateTop,
        endStateTop,
        startStateBottom,
        endStateBottom;
      startStateHeight = QBlock.State.getStateHeight(startState);
      endStateHeight = QBlock.State.getStateHeight(endState);

      startStateTop = QBlock.State.getXY2Canvas(startState, this.threadIndex).y;
      endStateTop = QBlock.State.getXY2Canvas(endState, this.threadIndex).y;
      startStateBottom =
        QBlock.State.getXY2Canvas(startState, this.threadIndex).y +
        startStateHeight;
      endStateBottom =
        QBlock.State.getXY2Canvas(endState, this.threadIndex).y +
        endStateHeight;
      let tempLinePath = "";

      if (startPoint.y > endPoint.y) {
        tempLinePath += this.drawLineBack5OutputVUp(
          startPoint,
          endPoint,
          startStateTop,
          endStateTop
        );
      } else {
        tempLinePath += this.drawLineBack5OutputVDown(
          startPoint,
          endPoint,
          startStateBottom,
          endStateBottom
        );
      }
      tempLinePath += " ";
      return tempLinePath;
    },
    //在临时连线未找到结束state时，使用此方法绘制垂直连线
    //NOTE:由于不需要考虑临时连线的连线拖动重绘，这里绘制拐角圆弧的方法不进行拆分
    drawLineBack5OutputVWithoutEndState(startPoint, endPoint) {
      let tempLinePath = "";
      let secondArcStart;
      let secondArcEnd = {
        x: 0,
        y: 0,
      };
      if (startPoint.y > endPoint.y) {
        secondArcStart = endPoint.y - LINE_V + LINE_RADIUS;
        tempLinePath += this.drawVerticalLine(secondArcStart);
        secondArcEnd.x = startPoint.x + LINE_H;
        secondArcEnd.y = endPoint.y - LINE_V;
        tempLinePath += this.drawArc(LINE_RADIUS, 0, 0, secondArcEnd);
      } else {
        secondArcStart = endPoint.y + LINE_V - LINE_RADIUS;
        tempLinePath += this.drawVerticalLine(secondArcStart);
        secondArcEnd.x = startPoint.x + LINE_H;
        secondArcEnd.y = endPoint.y + LINE_V;
        tempLinePath += this.drawArc(LINE_RADIUS, 0, 1, secondArcEnd);
      }
      tempLinePath += " ";
      return tempLinePath;
    },
    drawLineBack5ThirdArcUp(startPoint, endPoint, stateTop) {
      let tempLinePath = "";
      let thirdArcEnd = {
        x: 0,
        y: 0,
      };
      thirdArcEnd.x = endPoint.x - LINE_H;
      thirdArcEnd.y =
        stateTop - LINE_V + LINE_RADIUS + lineCfg.threadTitleHeight;
      tempLinePath += this.drawArc(LINE_RADIUS, 1, 0, thirdArcEnd);
      return tempLinePath;
    },
    drawLineBack5ThirdArcDown(startPoint, endPoint, stateBottom) {
      let tempLinePath = "";
      let thirdArcEnd = {
        x: 0,
        y: 0,
      };
      thirdArcEnd.x = endPoint.x - LINE_H;
      thirdArcEnd.y =
        stateBottom + LINE_V - LINE_RADIUS + lineCfg.threadTitleHeight;
      tempLinePath += this.drawArc(LINE_RADIUS, 0, 1, thirdArcEnd);
      return tempLinePath;
    },
    //因为连线的坐标是相对于svg元素的，所以需要加上threadTitleHeight以获取连线的准确坐标
    drawLineBack5HUp(startPoint, endPoint, startStateTop, endStateTop) {
      let tempLinePath = "";
      let thirdArcStart = {
        x: 0,
        y: 0,
      };
      //比较起始状态和结束状态的上边缘的高低，根据上边缘高的状态决定水平绘制连线的坐标
      if (startStateTop < endStateTop) {
        thirdArcStart.x = endPoint.x - LINE_H + LINE_RADIUS;
        thirdArcStart.y = startStateTop - LINE_V + lineCfg.threadTitleHeight;
        tempLinePath += this.drawLineToEndPoint(thirdArcStart);
        tempLinePath += this.drawLineBack5ThirdArcUp(
          startPoint,
          endPoint,
          startStateTop
        );
      } else {
        thirdArcStart.x = endPoint.x - LINE_H + LINE_RADIUS;
        thirdArcStart.y = endStateTop - LINE_V + lineCfg.threadTitleHeight;
        tempLinePath += this.drawLineToEndPoint(thirdArcStart);
        tempLinePath += this.drawLineBack5ThirdArcUp(
          startPoint,
          endPoint,
          endStateTop
        );
      }
      return tempLinePath;
    },
    //因为连线的坐标是相对于svg元素的，所以需要加上threadTitleHeight以获取连线的准确坐标
    drawLineBack5HDown(startPoint, endPoint, startStateBottom, endStateBottom) {
      let tempLinePath = "";
      let thirdArcStart = {
        x: 0,
        y: 0,
      };
      //比较起始状态和结束状态的下边缘的高低，根据下边缘低的状态决定水平绘制连线的坐标
      if (startStateBottom < endStateBottom) {
        thirdArcStart.x = endPoint.x - LINE_H + LINE_RADIUS;
        thirdArcStart.y = endStateBottom + LINE_V + lineCfg.threadTitleHeight;
        tempLinePath += this.drawLineToEndPoint(thirdArcStart);
        tempLinePath += this.drawLineBack5ThirdArcDown(
          startPoint,
          endPoint,
          endStateBottom
        );
      } else {
        thirdArcStart.x = endPoint.x - LINE_H + LINE_RADIUS;
        thirdArcStart.y = startStateBottom + LINE_V + lineCfg.threadTitleHeight;
        tempLinePath += this.drawLineToEndPoint(thirdArcStart);
        tempLinePath += this.drawLineBack5ThirdArcDown(
          startPoint,
          endPoint,
          startStateBottom
        );
      }
      return tempLinePath;
    },
    drawLineBack5H(startPoint, endPoint, startState, endState, line) {
      let startStateHeight,
        endStateHeight,
        startStateTop,
        endStateTop,
        startStateBottom,
        endStateBottom;
      startStateHeight = QBlock.State.getStateHeight(startState);
      endStateHeight = QBlock.State.getStateHeight(endState);
      startStateTop = QBlock.State.getXY2Canvas(startState, this.threadIndex).y;
      endStateTop = QBlock.State.getXY2Canvas(endState, this.threadIndex).y;
      startStateBottom =
        QBlock.State.getXY2Canvas(startState, this.threadIndex).y +
        startStateHeight;
      endStateBottom =
        QBlock.State.getXY2Canvas(endState, this.threadIndex).y +
        endStateHeight;
      let tempLinePath = "";
      if (startPoint.y > endPoint.y) {
        tempLinePath += this.drawLineBack5HUp(
          startPoint,
          endPoint,
          startStateTop,
          endStateTop
        );
      } else {
        tempLinePath += this.drawLineBack5HDown(
          startPoint,
          endPoint,
          startStateBottom,
          endStateBottom
        );
      }
      tempLinePath += " ";
      return tempLinePath;
    },
    //在临时连线未找到结束state时，使用此方法绘制横向连线
    //NOTE:由于不需要考虑临时连线的连线拖动重绘，这里绘制拐角圆弧的方法不进行拆分
    drawLineBack5HWithoutEndState(startPoint, endPoint) {
      let thirdArcStartX, thirdArcStartY, thirdArcEndX, thirdArcEndY;
      let thirdArcStart = {
        x: 0,
        y: 0,
      };
      let thirdArcEnd = {
        x: 0,
        y: 0,
      };
      let tempLinePath = "";
      if (startPoint.y > endPoint.y) {
        thirdArcStart.x = endPoint.x - LINE_H + LINE_RADIUS;
        thirdArcStart.y = endPoint.y - LINE_V;
        tempLinePath += this.drawLineToEndPoint(thirdArcStart);

        thirdArcEnd.x = endPoint.x - LINE_H;
        thirdArcEnd.y = endPoint.y - LINE_V + LINE_RADIUS;
        tempLinePath += this.drawArc(LINE_RADIUS, 1, 0, thirdArcEnd);
      } else {
        thirdArcStart.x = endPoint.x - LINE_H + LINE_RADIUS;
        thirdArcStart.y = endPoint.y + LINE_V;
        tempLinePath += this.drawLineToEndPoint(thirdArcStart);

        thirdArcEnd.x = endPoint.x - LINE_H;
        thirdArcEnd.y = endPoint.y + LINE_V - LINE_RADIUS;
        tempLinePath += this.drawArc(LINE_RADIUS, 0, 1, thirdArcEnd);
      }
      tempLinePath += " ";
      return tempLinePath;
    },
    //向后绘制连线
    drawLineBack5ByStateAndPoint(startPoint, endPoint, startState, endState) {
      let linePath = "";
      //TODO:添加一种新的情况：当两个状态的右边缘距离差小于LINE_H时，根据右边缘最靠右的状态绘制连出状态的连线
      let outputH = this.drawLineBack5OutputH(
        startPoint,
        endPoint,
        startState,
        endState
      );
      let outputV, output2InputH;
      if (!endState) {
        outputV = this.drawLineBack5OutputVWithoutEndState(
          startPoint,
          endPoint
        );
        output2InputH = this.drawLineBack5HWithoutEndState(
          startPoint,
          endPoint
        );
      } else {
        outputV = this.drawLineBack5OutputV(
          startPoint,
          endPoint,
          startState,
          endState
        );
        output2InputH = this.drawLineBack5H(
          startPoint,
          endPoint,
          startState,
          endState
        );
      }
      let inputV = this.drawLineBack5InputV(startPoint, endPoint);
      let inputH = this.drawLineInputH(endPoint);
      let arrow = this.drawArrow(endPoint);
      linePath = outputH + outputV + output2InputH + inputV + inputH + arrow;
      return linePath;
    },
    drawLineBack5FourthArc(endPoint, sweepFlag) {
      let tempLinePath = "";
      let fourthArcEnd = {
        x: 0,
        y: 0,
      };
      fourthArcEnd.x = endPoint.x - LINE_H + LINE_RADIUS;
      fourthArcEnd.y = endPoint.y;
      tempLinePath += this.drawArc(LINE_RADIUS, 0, sweepFlag, fourthArcEnd);
      return tempLinePath;
    },
    drawLineBack5InputV(startPoint, endPoint) {
      let tempLinePath = "";
      let FourthArcStart;

      if (startPoint.y > endPoint.y) {
        FourthArcStart = endPoint.y - LINE_RADIUS;
        tempLinePath += this.drawVerticalLine(FourthArcStart);
        tempLinePath += this.drawLineBack5FourthArc(endPoint, 0);
      } else {
        FourthArcStart = endPoint.y + LINE_RADIUS;
        tempLinePath += this.drawVerticalLine(FourthArcStart);
        tempLinePath += this.drawLineBack5FourthArc(endPoint, 1);
      }
      return tempLinePath;
    },
    /**
     * 前向3段式连线相关方法（包括上方的drawLine3Back5FirstArc())
     *
     */
    drawLine3OutputH(startPoint, endPoint, lineRadius) {
      let tempLinePath = "";
      tempLinePath += this.moveToStartPoint(startPoint);
      tempLinePath += this.drawHorizontalSetLine();
      tempLinePath += this.drawLine3Back5FirstArc(
        startPoint,
        endPoint,
        lineRadius
      );
      return tempLinePath;
    },
    drawLine3SecondArc(startPoint, endPoint, lineRadius, sweepFlag) {
      let tempLinePath = "";
      let secondArcEnd = {
        x: 0,
        y: 0,
      };
      secondArcEnd.x = startPoint.x + LINE_H + 2 * lineRadius;
      secondArcEnd.y = endPoint.y;
      tempLinePath += this.drawArc(lineRadius, 0, sweepFlag, secondArcEnd);
      return tempLinePath;
    },
    drawLine3V(startPoint, endPoint, lineRadius) {
      let tempLinePath = "";
      let secondArcStart;
      if (startPoint.y > endPoint.y) {
        secondArcStart = endPoint.y + lineRadius;
        tempLinePath += this.drawVerticalLine(secondArcStart);
        tempLinePath += this.drawLine3SecondArc(
          startPoint,
          endPoint,
          lineRadius,
          1
        );
      } else {
        secondArcStart = endPoint.y - lineRadius;
        tempLinePath += this.drawVerticalLine(secondArcStart);
        tempLinePath += this.drawLine3SecondArc(
          startPoint,
          endPoint,
          lineRadius,
          0
        );
      }
      return tempLinePath;
    },
    //向前绘制3段式连线
    drawLine3ByPoint(startPoint, endPoint, lineRadius) {
      let linePath = "";
      let outputH = this.drawLine3OutputH(startPoint, endPoint, lineRadius);
      let output2InputV = this.drawLine3V(startPoint, endPoint, lineRadius);
      let inputH = this.drawLineInputH(endPoint);
      let arrow = this.drawArrow(endPoint);
      linePath = outputH + output2InputV + inputH + arrow;
      return linePath;
    },
    /**
     * 前向5段式连线相关方法
     */
    drawLineForward5OutputHUp(
      startPoint,
      endPoint,
      lineRadius,
      verticalOffset
    ) {
      let tempLinePath = "";
      let firstArcStart;
      let firstArcEnd = {
        x: 0,
        y: 0,
      };
      if (startPoint.y < endPoint.y + verticalOffset) {
        tempLinePath += this.drawHorizontalSetLine();
        firstArcStart = startPoint.x + LINE_H;
        firstArcEnd.x = startPoint.x + LINE_H + lineRadius;
        firstArcEnd.y = startPoint.y + lineRadius;
        tempLinePath += this.drawArc(lineRadius, 0, 1, firstArcEnd);
      } else if (startPoint.y > endPoint.y + verticalOffset) {
        tempLinePath += this.drawHorizontalSetLine();
        firstArcEnd.x = startPoint.x + LINE_H + lineRadius;
        firstArcEnd.y = startPoint.y - lineRadius;
        tempLinePath += this.drawArc(lineRadius, 0, 0, firstArcEnd);
      }
      return tempLinePath;
    },
    drawLineForward5OutputHDown(
      startPoint,
      endPoint,
      lineRadius,
      verticalOffset
    ) {
      let tempLinePath = "";
      let firstArcStart;
      let firstArcEnd = {
        x: 0,
        y: 0,
      };
      if (startPoint.y < endPoint.y + verticalOffset) {
        tempLinePath += this.drawHorizontalSetLine();
        firstArcStart = startPoint.x + LINE_H;
        firstArcEnd.x = startPoint.x + LINE_H + lineRadius;
        firstArcEnd.y = startPoint.y + lineRadius;
        tempLinePath += this.drawArc(lineRadius, 0, 1, firstArcEnd);
      } else if (startPoint.y > endPoint.y + verticalOffset) {
        tempLinePath += this.drawHorizontalSetLine();
        firstArcEnd.x = startPoint.x + LINE_H + lineRadius;
        firstArcEnd.y = startPoint.y - lineRadius;
        tempLinePath += this.drawArc(lineRadius, 0, 0, firstArcEnd);
      }
      return tempLinePath;
    },
    drawLineForward5OutputH(startPoint, endPoint, lineRadius, verticalOffset) {
      let tempLinePath = "";
      if (endPoint.y + verticalOffset < endPoint.y) {
        tempLinePath = this.drawLineForward5OutputHUp(
          startPoint,
          endPoint,
          lineRadius,
          verticalOffset
        );
      } else {
        tempLinePath = this.drawLineForward5OutputHUp(
          startPoint,
          endPoint,
          lineRadius,
          verticalOffset
        );
      }
      return tempLinePath;
    },
    drawLineForward5FirstVUp(startPoint, endPoint, lineRadius, verticalOffset) {
      let tempLinePath = "";
      let secondArcStart;
      let secondArcEnd = {
        x: 0,
        y: 0,
      };
      if (startPoint.y < endPoint.y + verticalOffset) {
        secondArcStart = endPoint.y + verticalOffset - lineRadius;
        tempLinePath += this.drawVerticalLine(secondArcStart);
        secondArcEnd.x = startPoint.x + LINE_H + 2 * lineRadius;
        secondArcEnd.y = endPoint.y + verticalOffset;
        tempLinePath += this.drawArc(lineRadius, 0, 0, secondArcEnd);
      } else if (startPoint.y > endPoint.y + verticalOffset) {
        secondArcStart = endPoint.y + verticalOffset + lineRadius;
        tempLinePath += this.drawVerticalLine(secondArcStart);
        secondArcEnd.x = startPoint.x + LINE_H + 2 * lineRadius;
        secondArcEnd.y = endPoint.y + verticalOffset;
        tempLinePath += this.drawArc(lineRadius, 0, 1, secondArcEnd);
      }
      return tempLinePath;
    },
    drawLineForward5FirstVDown(
      startPoint,
      endPoint,
      lineRadius,
      verticalOffset
    ) {
      let tempLinePath = "";
      let secondArcStart;
      let secondArcEnd = {
        x: 0,
        y: 0,
      };
      if (startPoint.y < endPoint.y + verticalOffset) {
        secondArcStart = endPoint.y + verticalOffset - lineRadius;
        tempLinePath += this.drawVerticalLine(secondArcStart);
        secondArcEnd.x = startPoint.x + LINE_H + 2 * lineRadius;
        secondArcEnd.y = endPoint.y + verticalOffset;
        tempLinePath += this.drawArc(lineRadius, 0, 0, secondArcEnd);
      } else if (startPoint.y > endPoint.y + verticalOffset) {
        secondArcStart = endPoint.y + verticalOffset + lineRadius;
        tempLinePath += this.drawVerticalLine(secondArcStart);
        secondArcEnd.x = startPoint.x + LINE_H + 2 * lineRadius;
        secondArcEnd.y = endPoint.y + verticalOffset;
        tempLinePath += this.drawArc(lineRadius, 0, 1, secondArcEnd);
      }
      return tempLinePath;
    },
    drawLineForward5FirstV(startPoint, endPoint, lineRadius, verticalOffset) {
      let tempLinePath = "";
      if (endPoint.y + verticalOffset < endPoint.y) {
        tempLinePath = this.drawLineForward5FirstVUp(
          startPoint,
          endPoint,
          lineRadius,
          verticalOffset
        );
      } else if (endPoint.y + verticalOffset > endPoint.y) {
        tempLinePath = this.drawLineForward5FirstVDown(
          startPoint,
          endPoint,
          lineRadius,
          verticalOffset
        );
      }
      return tempLinePath;
    },
    drawLineForward5SecondHUp(
      startPoint,
      endPoint,
      lineRadius,
      verticalOffset
    ) {
      let tempLinePath = "";
      let thirdArcStart;
      let thirdArcEnd = {
        x: 0,
        y: 0,
      };
      thirdArcStart = endPoint.x - LINE_H - 2 * lineRadius;
      tempLinePath += this.drawHorizontalLine(thirdArcStart);
      thirdArcEnd.x = endPoint.x - LINE_H - lineRadius;
      thirdArcEnd.y = endPoint.y + verticalOffset + lineRadius;
      tempLinePath += this.drawArc(lineRadius, 0, 1, thirdArcEnd);
      return tempLinePath;
    },
    drawLineForward5SecondHDown(
      startPoint,
      endPoint,
      lineRadius,
      verticalOffset
    ) {
      let tempLinePath = "";
      let thirdArcStart;
      let thirdArcEnd = {
        x: 0,
        y: 0,
      };
      thirdArcStart = endPoint.x - LINE_H - 2 * lineRadius;
      tempLinePath += this.drawHorizontalLine(thirdArcStart);
      thirdArcEnd.x = endPoint.x - LINE_H - lineRadius;
      thirdArcEnd.y = endPoint.y + verticalOffset - lineRadius;
      tempLinePath += this.drawArc(lineRadius, 0, 0, thirdArcEnd);
      return tempLinePath;
    },
    drawLineForward5SecondH(startPoint, endPoint, lineRadius, verticalOffset) {
      let tempLinePath = "";
      if (endPoint.y + verticalOffset < endPoint.y) {
        tempLinePath = this.drawLineForward5SecondHUp(
          startPoint,
          endPoint,
          lineRadius,
          verticalOffset
        );
      } else if (endPoint.y + verticalOffset > endPoint.y) {
        tempLinePath = this.drawLineForward5SecondHDown(
          startPoint,
          endPoint,
          lineRadius,
          verticalOffset
        );
      }
      return tempLinePath;
    },
    drawLineForward5SecondVUp(
      startPoint,
      endPoint,
      lineRadius,
      verticalOffset
    ) {
      let tempLinePath = "";
      let fourthArcStart;
      let fourthArcEnd = {
        x: 0,
        y: 0,
      };
      fourthArcStart = endPoint.y - lineRadius;
      tempLinePath += this.drawVerticalLine(fourthArcStart);
      fourthArcEnd.x = endPoint.x - LINE_H;
      fourthArcEnd.y = endPoint.y;
      tempLinePath += this.drawArc(lineRadius, 0, 0, fourthArcEnd);
      return tempLinePath;
    },
    drawLineForward5SecondVDown(
      startPoint,
      endPoint,
      lineRadius,
      verticalOffset
    ) {
      let tempLinePath = "";
      let fourthArcStart;
      let fourthArcEnd = {
        x: 0,
        y: 0,
      };
      fourthArcStart = endPoint.y + lineRadius;
      tempLinePath += this.drawVerticalLine(fourthArcStart);
      fourthArcEnd.x = endPoint.x - LINE_H;
      fourthArcEnd.y = endPoint.y;
      tempLinePath += this.drawArc(lineRadius, 0, 1, fourthArcEnd);
      return tempLinePath;
    },
    drawLineForward5SecondV(startPoint, endPoint, lineRadius, verticalOffset) {
      let tempLinePath = "";
      if (endPoint.y + verticalOffset < endPoint.y) {
        tempLinePath = this.drawLineForward5SecondVUp(
          startPoint,
          endPoint,
          lineRadius,
          verticalOffset
        );
      } else if (endPoint.y + verticalOffset > endPoint.y) {
        tempLinePath = this.drawLineForward5SecondVDown(
          startPoint,
          endPoint,
          lineRadius,
          verticalOffset
        );
      }
      return tempLinePath;
    },
    //向前绘制5段式连线
    //TODO: 需要多添加一个radius, 用于控制连入状态的连线部分的圆角拐角半径
    drawLineForward5ByPoint(
      startPoint,
      endPoint,
      lineRadius,
      forward5LineRadius,
      verticalOffset
    ) {
      let linePath = "";
      let initStartPoint = this.moveToStartPoint(startPoint);
      let outputH = this.drawLineForward5OutputH(
        startPoint,
        endPoint,
        lineRadius,
        verticalOffset
      );
      let firstOutputV = this.drawLineForward5FirstV(
        startPoint,
        endPoint,
        lineRadius,
        verticalOffset
      );

      let secondOutputH = this.drawLineForward5SecondH(
        startPoint,
        endPoint,
        forward5LineRadius,
        verticalOffset
      );

      let secondOutputV = this.drawLineForward5SecondV(
        startPoint,
        endPoint,
        forward5LineRadius,
        verticalOffset
      );

      let inputH = this.drawLineInputH(endPoint);
      let arrow = this.drawArrow(endPoint);
      linePath =
        initStartPoint +
        outputH +
        firstOutputV +
        secondOutputH +
        secondOutputV +
        inputH +
        arrow;
      return linePath;
    },
    /**
     *
     * 前向直线调节之后的五段式连线
     *
     */
    drawStraightLineForward5secondVDown(
      startPoint,
      endPoint,
      lineRadius,
      verticalOffset
    ) {},
    drawStraightLineForward5secondVUp(
      startPoint,
      endPoint,
      lineRadius,
      verticalOffset
    ) {},
    drawStraightLineForward5secondV(
      startPoint,
      endPoint,
      lineRadius,
      verticalOffset
    ) {
      let tempLinePath = "";
      if (endPoint.y + verticalOffset < endPoint.y) {
        tempLinePath = this.drawStraightLineForward5secondVUp(
          startPoint,
          endPoint,
          lineRadius,
          verticalOffset
        );
      } else if (endPoint.y + verticalOffset > endPoint.y) {
        tempLinePath = this.drawStraightLineForward5secondVDown(
          startPoint,
          endPoint,
          lineRadius,
          verticalOffset
        );
      }
      return tempLinePath;
    },
    drawStraightLineForward5secondHDown(
      startPoint,
      endPoint,
      lineRadius,
      verticalOffset
    ) {},
    drawStraightLineForward5secondHUp(
      startPoint,
      endPoint,
      lineRadius,
      verticalOffset
    ) {},
    drawStraightLineForward5secondH(
      startPoint,
      endPoint,
      lineRadius,
      verticalOffset
    ) {
      let tempLinePath = "";
      if (endPoint.y + verticalOffset < endPoint.y) {
        tempLinePath = this.drawStraightLineForward5secondHUp(
          startPoint,
          endPoint,
          lineRadius,
          verticalOffset
        );
      } else if (endPoint.y + verticalOffset > endPoint.y) {
        tempLinePath = this.drawStraightLineForward5secondHDown(
          startPoint,
          endPoint,
          lineRadius,
          verticalOffset
        );
      }
      return tempLinePath;
    },
    drawStraightLineForward5FirstVDown(
      startPoint,
      endPoint,
      lineRadius,
      verticalOffset
    ) {},
    drawStraightLineForward5FirstVUp(
      startPoint,
      endPoint,
      lineRadius,
      verticalOffset
    ) {},
    drawStraightLineForward5FirstV(
      startPoint,
      endPoint,
      lineRadius,
      verticalOffset
    ) {
      let tempLinePath = "";
      if (endPoint.y + verticalOffset < endPoint.y) {
        tempLinePath = this.drawStraightLineForward5FirstVUp(
          startPoint,
          endPoint,
          lineRadius,
          verticalOffset
        );
      } else if (endPoint.y + verticalOffset > endPoint.y) {
        tempLinePath = this.drawStraightLineForward5FirstVDown(
          startPoint,
          endPoint,
          lineRadius,
          verticalOffset
        );
      }
      return tempLinePath;
    },
    drawStraightLineForward5OutputHDown(
      startPoint,
      endPoint,
      lineRadius,
      verticalOffset
    ) {
      let tempLinePath = "";
      let firstArcStart;
      let firstArcEnd = {
        x: 0,
        y: 0,
      };
      tempLinePath += this.drawHorizontalSetLine();
      firstArcStart = startPoint.x + LINE_H;
      firstArcEnd.x = startPoint.x + LINE_H + lineRadius;
      firstArcEnd.y = startPoint.y - lineRadius;
      tempLinePath += this.drawArc(lineRadius, 0, 0, firstArcEnd);
      return tempLinePath;
    },
    drawStraightLineForward5OutputHUp(
      startPoint,
      endPoint,
      lineRadius,
      verticalOffset
    ) {
      let tempLinePath = "";
      let firstArcStart;
      let firstArcEnd = {
        x: 0,
        y: 0,
      };
      tempLinePath += this.drawHorizontalSetLine();
      firstArcStart = startPoint.x + LINE_H;
      firstArcEnd.x = startPoint.x + LINE_H + lineRadius;
      firstArcEnd.y = startPoint.y + lineRadius;
      tempLinePath += this.drawArc(lineRadius, 0, 1, firstArcEnd);
      return tempLinePath;
    },
    drawStraightLineForward5OutputH(
      startPoint,
      endPoint,
      lineRadius,
      verticalOffset
    ) {
      let tempLinePath = "";
      if (endPoint.y + verticalOffset < endPoint.y) {
        tempLinePath = this.drawStraightLineForward5OutputHUp(
          startPoint,
          endPoint,
          lineRadius,
          verticalOffset
        );
      } else if (endPoint.y + verticalOffset > endPoint.y) {
        tempLinePath = this.drawStraightLineForward5OutputHDown(
          startPoint,
          endPoint,
          lineRadius,
          verticalOffset
        );
      }
      return tempLinePath;
    },
    //向前绘制五段式直线连线
    //TODO
    drawStraightLineForward5ByPoint(
      startPoint,
      endPoint,
      lineRadius,
      verticalOffset
    ) {
      let linePath = "";
      return linePath;
    },
    //----------------------------------------------------------------------
    refresh() {
      this.forceRefreshFlag = true;
    },
  },
  created() {
    this.$set(this.line, "showdesc", false);
    if (!this.line.lineId) {
      this.line.lineId = this.genId();
    }
    if (this.line.type !== "tempLine") {
      store.stateData.lineMap[this.line.lineId] = this;
    }
  },
  mounted() {},
  computed: {
    linePath: function () {
      if (this.line.d && this.line.d !== "m 0 0 " && !this.forceRefreshFlag) {
        return this.line.d;
      }
      // if(!this.line.startPoint){

      this.line.startPoint = QBlock.Line.getStartPoint(
        this.line,
        this.threadIndex
      );
      let startState = store.getState(
        this.threadIndex,
        this.line.startState.stateId
      );
      // }
      let endState;
      if (this.line.endState) {
        this.line.endPoint = QBlock.Line.getEndPoint(
          this.line,
          this.threadIndex
        );
        endState = store.getState(this.threadIndex, this.line.endState.stateId);
      }

      // }
      return this.generatePath(
        this.line.startPoint,
        this.line.endPoint,
        startState,
        endState,
        this.line.verticalOffset
      );
    },
    /*
    movablePoint: function(){
      return this.getMovablePoint(this.line)
    }*/
  },
};
</script>

<style lang="less" scoped>
@qkmGrey: #aaaaaa;
@qkmLightBlue: #70ffff;
@qkmOrange: #ffaf3d;
@qkmRed: #e83e3e;
@qkmYellow: #f8f837;
@qkmPurple: #9373ec;
@qkmLightGreen: #1cf9ea;
.temp-line {
  stroke: @qkmRed;
  fill: none;
}

.connect-line {
  stroke: @qkmGrey;
  fill: none;
}

.connect-line:hover {
  stroke: @qkmLightBlue;
  fill: none;
  cursor: pointer;
}
.active .connect-line {
  stroke: @qkmLightBlue;
  fill: none;
}
.warning .connect-line {
  stroke: @qkmOrange;
  fill: none;
}
.error .connect-line {
  stroke: @qkmRed;
  fill: none;
}
.showdesc .connect-line {
  stroke: @qkmYellow;
  fill: none;
}
text {
  display: none;
  fill: yellow;
}
.active text,
.showdesc text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
#movablePoint1:hover,
#movablePoint3:hover {
  cursor: ns-resize;
}
#movablePoint2:hover {
  cursor: ew-resize;
}
</style>    