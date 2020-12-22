<template>
  <g
    @contextmenu.prevent="onContextMenu"
    @click="activeLineChange"
    :class="[{ showdesc: line.showdesc }, { active: isInActiveLines() }]"
  >
    <path
      :lineId="line.lineId"
      :d="linePath"
      :class="lineType === 'default' ? 'connect-line': 'temp-line'"
      :style="{ strokeWidth: lineType === 'default' ? strokeWidth : '1px'}"
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
      forceRefreshFlag: false
    };
  },
  methods: {
    activeLineChange() {
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
      return this.lineClass ? this.lineClass : "connect-line";
    },
    generatePath(startPoint, endPoint, startState, endState) {
      let isDynamicRadiusFlag =
        Math.abs(startPoint.y - endPoint.y) < 2 * LINE_RADIUS;
      let path;
      if (endPoint.y === startPoint.y && endPoint.x > startPoint.x) {
        path = this.drawStraightConnectLine(startPoint, endPoint);
      } else if (startPoint.x > endPoint.x) {
        path = this.drawLine5ByStateAndPoint(
          startPoint,
          endPoint,
          startState,
          endState
        );
      } else {
        //若两个状态块之间的y轴距离小于2个预设拐角半径，则需要动态计算连线拐角的半径，并绘制连线
        var radius = LINE_RADIUS;
        if (isDynamicRadiusFlag) {
          radius = Math.abs(startPoint.y - endPoint.y) / 2;
        }
        path = this.drawLine3ByPoint(startPoint, endPoint, radius);
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
    /*
     * 获取连线中点，然后以这个中点为起点绘制文字的路径
     *
     */
    getTextPath(line) {
      let startX,
        startY,
        endY,
        midPointPath,
        midPoint,
        startPoint = QBlock.Line.getStartPoint(line, this.threadIndex),
        endPoint = QBlock.Line.getEndPoint(line, this.threadIndex);
      startX = startPoint.x;
      startY = startPoint.y;
      endY = endPoint.y;
      //console.log([startX, line_h, startY, endY]);
      midPointPath = `M ${startX + LINE_H} ${(startY + endY) / 2} h 300`;
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

    //分段处理向后和向前的连线
    drawLineOutputH(startPoint, endPoint, lineRadius) {
      let tempLinePath = "";
      tempLinePath += this.moveToStartPoint(startPoint);
      tempLinePath += this.drawHorizontalSetLine();
      let firstArcEnd = {
        x: 0,
        y: 0,
      };
      //若起始点的y坐标大于结束点的y坐标
      if (startPoint.y > endPoint.y) {
        firstArcEnd.x = startPoint.x + LINE_H + lineRadius;
        firstArcEnd.y = startPoint.y - lineRadius;
        tempLinePath += this.drawArc(
          lineRadius,
          1,
          0,
          firstArcEnd
        );
      } else {
        firstArcEnd.x = startPoint.x + LINE_H + lineRadius;
        firstArcEnd.y = startPoint.y + lineRadius;
        tempLinePath += this.drawArc(
          lineRadius,
          0,
          1,
          firstArcEnd
        );
      }
      return tempLinePath;
    },
    //因为连线的坐标是相对于svg元素的，所以需要加上threadTitleHeight以获取连线的准确坐标
    drawLine5OutputVUp(startPoint, endPoint, startStateTop, endStateTop) {
      let tempLinePath = "";
      let secondArcStart;
      let secondArcEnd = {
        x: 0,
        y: 0,
      };
      if (startStateTop < endStateTop) {
        //比较起始状态和结束状态的上边缘的高低，根据上边缘高的状态决定垂直绘制连线的坐标
        secondArcStart = startStateTop - LINE_V + LINE_RADIUS + lineCfg.threadTitleHeight;
        tempLinePath += this.drawVerticalLine(secondArcStart);
        secondArcEnd.x = startPoint.x + LINE_H;
        secondArcEnd.y = startStateTop - LINE_V + lineCfg.threadTitleHeight;
        tempLinePath += this.drawArc(
          LINE_RADIUS,
          0,
          0,
          secondArcEnd
        );
      } else {
        secondArcStart = endStateTop - LINE_V + LINE_RADIUS + lineCfg.threadTitleHeight;
        tempLinePath += this.drawVerticalLine(secondArcStart);
        secondArcEnd.x = startPoint.x + LINE_H;
        secondArcEnd.y = endStateTop - LINE_V + lineCfg.threadTitleHeight;
        tempLinePath += this.drawArc(
          LINE_RADIUS,
          0,
          0,
          secondArcEnd
        );
      }
      return tempLinePath;
    },
    //因为连线的坐标是相对于svg元素的，所以需要加上threadTitleHeight以获取连线的准确坐标
    drawLine5OutputVDown(
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
        secondArcStart = endStateBottom + LINE_V - LINE_RADIUS + lineCfg.threadTitleHeight;
        tempLinePath += this.drawVerticalLine(secondArcStart);
        secondArcEnd.x = startPoint.x + LINE_H;
        secondArcEnd.y = endStateBottom + LINE_V + lineCfg.threadTitleHeight;
        tempLinePath += this.drawArc(
          LINE_RADIUS,
          0,
          1,
          secondArcEnd
        );
      } else {
        secondArcStart = startStateBottom + LINE_V - LINE_RADIUS + lineCfg.threadTitleHeight;
        tempLinePath += this.drawVerticalLine(secondArcStart);
        secondArcEnd.x = startPoint.x + LINE_H;
        secondArcEnd.y = startStateBottom + LINE_V + lineCfg.threadTitleHeight;
        tempLinePath += this.drawArc(
          LINE_RADIUS,
          0,
          1,
          secondArcEnd
        );
      }
      return tempLinePath;
    },
    drawLine5OutputV(startPoint, endPoint, startState, endState) {
      let startStateHeight,
        endStateHeight,
        startStateTop,
        endStateTop,
        startStateBottom,
        endStateBottom;
      startStateHeight = QBlock.State.getStateHeight(startState);
      endStateHeight = QBlock.State.getStateHeight(endState);
      //因嵌套内部状态的xy是相对于父状态的，需手动计算状态的上边缘与下边缘的y坐标
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
        tempLinePath += this.drawLine5OutputVUp(
          startPoint,
          endPoint,
          startStateTop,
          endStateTop
        );
      } else {
        tempLinePath += this.drawLine5OutputVDown(
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
    drawLine5OutputVWithoutEndState(startPoint, endPoint) {
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
        tempLinePath += this.drawArc(
          LINE_RADIUS,
          0,
          0,
          secondArcEnd
        );
      } else {
        secondArcStart = endPoint.y + LINE_V - LINE_RADIUS;
        tempLinePath += this.drawVerticalLine(secondArcStart);
        secondArcEnd.x = startPoint.x + LINE_H;
        secondArcEnd.y = endPoint.y + LINE_V;
        tempLinePath += this.drawArc(
          LINE_RADIUS,
          0,
          1,
          secondArcEnd
        );
      }
      tempLinePath += " ";
      return tempLinePath;
    },
    //因为连线的坐标是相对于svg元素的，所以需要加上threadTitleHeight以获取连线的准确坐标
    drawLine5HUp(startPoint, endPoint, startStateTop, endStateTop) {
      let tempLinePath = "";
      let thirdArcStart = {
        x: 0,
        y: 0,
      };
      let thirdArcEnd = {
        x: 0,
        y: 0,
      };
      //比较起始状态和结束状态的上边缘的高低，根据上边缘高的状态决定水平绘制连线的坐标
      if (startStateTop < endStateTop) {
        thirdArcStart.x = endPoint.x - LINE_H + LINE_RADIUS;
        thirdArcStart.y = startStateTop - LINE_V + lineCfg.threadTitleHeight;
        tempLinePath += this.drawLineToEndPoint(
          thirdArcStart
        );

        thirdArcEnd.x = endPoint.x - LINE_H;
        thirdArcEnd.y = startStateTop - LINE_V + LINE_RADIUS + lineCfg.threadTitleHeight;
        tempLinePath += this.drawArc(
          LINE_RADIUS,
          1,
          0,
          thirdArcEnd
        );
      } else {
        thirdArcStart.x = endPoint.x - LINE_H + LINE_RADIUS;
        thirdArcStart.y = endStateTop - LINE_V + lineCfg.threadTitleHeight;
        tempLinePath += this.drawLineToEndPoint(
          thirdArcStart
        );

        thirdArcEnd.x = endPoint.x - LINE_H;
        thirdArcEnd.y = endStateTop - LINE_V + LINE_RADIUS + lineCfg.threadTitleHeight;
        tempLinePath += this.drawArc(
          LINE_RADIUS,
          1,
          0,
          thirdArcEnd
        );
      }
      return tempLinePath;
    },
    //因为连线的坐标是相对于svg元素的，所以需要加上threadTitleHeight以获取连线的准确坐标
    drawLine5HDown(startPoint, endPoint, startStateBottom, endStateBottom) {
      let tempLinePath = "";
      let thirdArcStart = {
        x: 0,
        y: 0,
      };
      let thirdArcEnd = {
        x: 0,
        y: 0,
      };
      //比较起始状态和结束状态的下边缘的高低，根据下边缘低的状态决定水平绘制连线的坐标
      if (startStateBottom < endStateBottom) {
        thirdArcStart.x = endPoint.x - LINE_H + LINE_RADIUS;
        thirdArcStart.y = endStateBottom + LINE_V + lineCfg.threadTitleHeight;
        tempLinePath += this.drawLineToEndPoint(
          thirdArcStart
        );

        thirdArcEnd.x = endPoint.x - LINE_H;
        thirdArcEnd.y = endStateBottom + LINE_V - LINE_RADIUS + lineCfg.threadTitleHeight;
        tempLinePath += this.drawArc(
          LINE_RADIUS,
          0,
          1,
          thirdArcEnd
        );
      } else {
        thirdArcStart.x = endPoint.x - LINE_H + LINE_RADIUS;
        thirdArcStart.y = startStateBottom + LINE_V + lineCfg.threadTitleHeight;
        tempLinePath += this.drawLineToEndPoint(
          thirdArcStart
        );

        thirdArcEnd.x = endPoint.x - LINE_H;
        thirdArcEnd.y = startStateBottom + LINE_V - LINE_RADIUS + lineCfg.threadTitleHeight;
        tempLinePath += this.drawArc(
          LINE_RADIUS,
          0,
          1,
          thirdArcEnd
        );
      }
      return tempLinePath;
    },
    drawLine5H(startPoint, endPoint, startState, endState, line) {
      let startStateHeight,
        endStateHeight,
        startStateTop,
        endStateTop,
        startStateBottom,
        endStateBottom;
      startStateHeight = QBlock.State.getStateHeight(startState);
      endStateHeight = QBlock.State.getStateHeight(endState);
      //因嵌套内部状态的xy是相对于父状态的，需手动计算状态的上边缘与下边缘的y坐标
      startStateTop = QBlock.State.getXY2Canvas(startState, this.threadIndex).y;
      endStateTop = QBlock.State.getXY2Canvas(endState, this.threadIndex).y;
      startStateBottom =
        QBlock.State.getXY2Canvas(startState, this.threadIndex).y +
        startStateHeight
      endStateBottom =
        QBlock.State.getXY2Canvas(endState, this.threadIndex).y +
        endStateHeight
      let tempLinePath = "";
      if (startPoint.y > endPoint.y) {
        tempLinePath += this.drawLine5HUp(
          startPoint,
          endPoint,
          startStateTop,
          endStateTop
        );
      } else {
        tempLinePath += this.drawLine5HDown(
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
    drawLine5HWithoutEndState(startPoint, endPoint) {
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
        tempLinePath += this.drawLineToEndPoint(
          thirdArcStart
        );

        thirdArcEnd.x = endPoint.x - LINE_H;
        thirdArcEnd.y = endPoint.y - LINE_V + LINE_RADIUS;
        tempLinePath += this.drawArc(
          LINE_RADIUS,
          1,
          0,
          thirdArcEnd
        );
      } else {
        thirdArcStart.x = endPoint.x - LINE_H + LINE_RADIUS;
        thirdArcStart.y = endPoint.y + LINE_V;
        tempLinePath += this.drawLineToEndPoint(
          thirdArcStart
        );

        thirdArcEnd.x = endPoint.x - LINE_H;
        thirdArcEnd.y = endPoint.y + LINE_V - LINE_RADIUS;
        tempLinePath += this.drawArc(
          LINE_RADIUS,
          0,
          1,
          thirdArcEnd
        );
      }
      tempLinePath += " ";
      return tempLinePath;
    },

    drawLine3V(startPoint, endPoint, lineRadius) {
      let secondArcStart;
      let secondArcEnd = {
        x: 0,
        y: 0,
      };
      let tempLinePath = "";
      if (startPoint.y > endPoint.y) {
        secondArcStart = endPoint.y + lineRadius;
        tempLinePath += this.drawVerticalLine(secondArcStart);

        secondArcEnd.x = startPoint.x + LINE_H + 2 * lineRadius;
        secondArcEnd.y = endPoint.y;
        tempLinePath += this.drawArc(
          lineRadius,
          0,
          1,
          secondArcEnd
        );
      } else {
        secondArcStart = endPoint.y - lineRadius;
        tempLinePath += this.drawVerticalLine(secondArcStart);

        secondArcEnd.x = startPoint.x + LINE_H + 2 * lineRadius;
        secondArcEnd.y = endPoint.y;
        tempLinePath += this.drawArc(
          lineRadius,
          0,
          0,
          secondArcEnd
        );
      }
      return tempLinePath;
    },
    drawLineInputV(startPoint, endPoint) {
      let FourthArcStart;
      let fourthArcEnd = {
        x: 0,
        y: 0,
      };
      let tempLinePath = "";
      if (startPoint.y > endPoint.y) {
        FourthArcStart = endPoint.y - LINE_RADIUS;
        tempLinePath += this.drawVerticalLine(FourthArcStart);

        fourthArcEnd.x = endPoint.x - LINE_H + LINE_RADIUS;
        fourthArcEnd.y = endPoint.y;
        tempLinePath += this.drawArc(
          LINE_RADIUS,
          0,
          0,
          fourthArcEnd
        );
      } else {
        FourthArcStart = endPoint.y + LINE_RADIUS;
        tempLinePath += this.drawVerticalLine(FourthArcStart);

        fourthArcEnd.x = endPoint.x - LINE_H + LINE_RADIUS;
        fourthArcEnd.y = endPoint.y;
        tempLinePath += this.drawArc(
          LINE_RADIUS,
          0,
          1,
          fourthArcEnd
        );
      }
      return tempLinePath;
    },
    drawLineInputH(endPoint) {
      let tempLinePath = this.drawLineToEndPoint(endPoint);
      return tempLinePath;
    },

    //向后绘制连线
    drawLine5ByStateAndPoint(startPoint, endPoint, startState, endState) {
      let linePath = "";
      let outputH = this.drawLineOutputH(startPoint, endPoint, LINE_RADIUS);
      let outputV, output2InputH;
      if (!endState) {
        outputV = this.drawLine5OutputVWithoutEndState(startPoint, endPoint);
        output2InputH = this.drawLine5HWithoutEndState(startPoint, endPoint);
      } else {
        outputV = this.drawLine5OutputV(
          startPoint,
          endPoint,
          startState,
          endState
        );
        output2InputH = this.drawLine5H(
          startPoint,
          endPoint,
          startState,
          endState
        );
      }
      let inputV = this.drawLineInputV(startPoint, endPoint);
      let inputH = this.drawLineInputH(endPoint);
      let arrow = this.drawArrow(endPoint);
      linePath = outputH + outputV + output2InputH + inputV + inputH + arrow;
      return linePath;
    },

    //向前绘制连线
    drawLine3ByPoint(startPoint, endPoint, lineRadius) {
      let linePath = "";
      let outputH = this.drawLineOutputH(startPoint, endPoint, lineRadius);
      let output2InputV = this.drawLine3V(startPoint, endPoint, lineRadius);
      let inputH = this.drawLineInputH(endPoint);
      let arrow = this.drawArrow(endPoint);
      linePath = outputH + output2InputV + inputH + arrow;
      return linePath;
    },
    refresh(){
      this.forceRefreshFlag = true;
    }
  },
  created() {
    this.$set(this.line, "showdesc", false);
    if (!this.line.lineId) {
      this.line.lineId = this.genId();
    }
    store.stateData.lineMap[this.line.lineId] = this;
  },
  beforeDestroy(){
    store.stateData.lineMap[this.line.lineId] = null;
    delete store.stateData.lineMap[this.line.lineId];
  },
  mounted() {

  },
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
        endState
      );
    },
  },
};
</script>

<style lang="less">
@qkmGrey: #aaaaaa;
@qkmLightBlue: #70ffff;
@qkmOrange: #ffaf3d;
@qkmRed: #e83e3e;
@qkmYellow: #f8f837;
.temp-line {
  stroke: @qkmRed;
  fill: none;
}
.connect-line{
  stroke: @qkmGrey;
  fill: none;
}
 
.connect-line:hover {
  stroke: @qkmLightBlue;
  fill: none;
  cursor: pointer;
}
.active .connect-line{
  stroke: @qkmLightBlue;
  fill: none;
}
.warning .connect-line{
  stroke: @qkmOrange;
  fill: none;
}
.error .connect-line{
  stroke: @qkmRed;
  fill: none;
}
.showdesc .connect-line{
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
</style>    