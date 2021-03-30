<template>
  <g
    @contextmenu.prevent="onContextMenu"
    @click.stop="activeLineChange"
    @mouseup="stopMovingLine"
    :class="[
      { showdesc: line.showdesc },
      { active: isInActiveLines() },
      { 'nearby-hover': isNearbyHoverLine() },
    ]"
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
      id="movablePoint"
      v-show="isInActiveLines() && isNotBackConnectLine(line)"
      :x="getMovablePoint(line).x"
      :y="getMovablePoint(line).y"
      @mousedown.stop="startMovingLine"
      @mouseup="stopMovingLine"
    ></rect>
  </g>
</template>

<script>
import { lineCfg } from "./graphCfg.js";
import { threadCfg } from "./graphCfg.js";
import Util from "./util.js";
import QBlock from "./qblock.js";
import DrawLine from "./drawLine.js";
const LINE_H = lineCfg.line_h;
const LINE_V = lineCfg.line_v;
const LINE_RADIUS = lineCfg.line_radius;
const STROKE_WIDTH = lineCfg.stroke_width;
const DESC_LIMIT = lineCfg.desc_limit;

const HIGHLIGHT_LIMIT = threadCfg.highlight_limit;
export default {
  name: "LineComp",
  props: [
    "line",
    "threadIndex",
    "lineType",
    "activeLines",
    "nearbyHoverLineId",
  ],
  data() {
    return {
      strokeWidth: STROKE_WIDTH,
      descLimit: DESC_LIMIT,
      forceRefreshFlag: false,
    };
  },
  methods: {
    isNearbyHoverLine() {
      if (this.line.lineId === this.nearbyHoverLineId) {
        return true;
      }
      return false;
    },
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
        case "startLoop":
          clazz = "start-loop";
          break;
        case "endLoop":
          clazz = "end-loop";
          break;
        case "continueLoop":
          clazz = "continue-loop";
          break;
        default:
          clazz = "connect-line";
      }
      return clazz;
    },
    generatePath(startPoint, endPoint, startState, endState, verticalOffset) {
      //用于决定前向3段式连线的两个拐角的半径是否需要动态更新
      let isDynamicRadiusFlag =
        Math.abs(startPoint.y - endPoint.y) < 2 * LINE_RADIUS;
      //用于决定前向5段式连线的前两个拐角的半径是否需要动态更新
      let forward5isDynamicRadiusFlag =
        Math.abs(startPoint.y - (endPoint.y + verticalOffset)) <
        2 * LINE_RADIUS;
      /**
       * 前向5段式连线的后两个拐角的半径
       * 若根据 verticalOffset / 2 计算的前向5段式的后两个拐角的半径大于LINE_RADIUS，则限制前向5段式的后两个拐角的半径的大小为LINE_RADIUS
       */
      var forward5LastTwoRadius = Math.min(
        Math.abs(verticalOffset / 2),
        LINE_RADIUS
      );
      //前向3段式的拐角，后向5段式的拐角，前向5段式连线的前两个拐角的半径
      var radius = LINE_RADIUS;
      let path;
      //此时绘制前向直线或前向直线经调节后的五段连线
      if (endPoint.y === startPoint.y && endPoint.x > startPoint.x) {
        if (!this.line.verticalOffset || this.line.verticalOffset === 0) {
          path = DrawLine.drawStraightConnectLine(startPoint, endPoint);
        } else {
          if (forward5isDynamicRadiusFlag) {
            radius = Math.abs(startPoint.y - (endPoint.y + verticalOffset)) / 2;
          }
          path = DrawLine.drawStraightLineForward5ByPoint(
            startPoint,
            endPoint,
            radius,
            forward5LastTwoRadius,
            verticalOffset
          );
        }
      } else if (startPoint.x + LINE_H + 2 * LINE_RADIUS > endPoint.x) {
        //此时绘制反向五段连线
        this.line.verticalOffset = 0;
        path = DrawLine.drawLineBack5ByStateAndPoint(
          startPoint,
          endPoint,
          startState,
          endState,
          this.threadIndex
        );
      } else {
        //若两个状态块之间的y轴距离小于2个预设拐角半径，则需要动态计算连线拐角的半径，并绘制连线
        if (!this.line.verticalOffset || this.line.verticalOffset === 0) {
          //走到这里说明是三段式连线
          if (isDynamicRadiusFlag) {
            radius = Math.abs(startPoint.y - endPoint.y) / 2;
          }
          path = DrawLine.drawLine3ByPoint(
            startPoint,
            endPoint,
            radius,
            this.line.type
          );
        } else {
          //若连线调节后开始与结束状态的x坐标相差小于2 * LINE_H + 3 * LINE_RADIUS, 则此时也需要画前向三段连线
          if (endPoint.x - startPoint.x < 2 * LINE_H + 3 * LINE_RADIUS) {
            this.line.verticalOffset = 0;
            if (isDynamicRadiusFlag) {
              radius = Math.abs(startPoint.y - endPoint.y) / 2;
            }
            path = DrawLine.drawLine3ByPoint(
              startPoint,
              endPoint,
              radius,
              this.line.type
            );
          } else {
            //在对前向5段式的连线的拐角半径进行更新时，需要根据开始点y坐标与结束点y坐标加上verticalOffset之间的差来进行更新
            if (forward5isDynamicRadiusFlag) {
              radius =
                Math.abs(startPoint.y - (endPoint.y + verticalOffset)) / 2;
            }
            path = DrawLine.drawLineForward5ByPoint(
              startPoint,
              endPoint,
              radius,
              forward5LastTwoRadius,
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
      }
      return line.endPoint;
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
      if (offset && offset !== 0) {
        halflineInputH = (endPoint.x - startPoint.x - 2 * LINE_H) / 2;
        thirdMovablePoint.x = endPoint.x - LINE_H - halflineInputH;
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
      straightLineMovablePoint.y = endPoint.y - 4;
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
      if (startPoint.x + 2 * LINE_H + 6 * LINE_RADIUS < endPoint.x) {
        return true;
      }
      return false;
    },
    getMovablePoint(line) {
      var movablePoint;
      if (this.isStraightLine(line)) {
        movablePoint = this.getStraightLineMovablePoint(line);
        if (line.verticalOffset !== 0) {
          movablePoint = this.getThirdMovablePoint(line, line.verticalOffset);
        }
      } else {
        movablePoint = this.getThirdMovablePoint(line, line.verticalOffset);
      }
      return movablePoint;
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
      midPointPath = `M ${startX + LINE_H} ${(startY + endY) / 2 - 5} h 300`;
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
      EventObj.$emit("hideStateContextMenu");
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
    refresh() {
      this.forceRefreshFlag = true;
    },
  },
  created() {
    //this.$set(this.line, "showdesc", false);
    if (!this.line.lineId) {
      this.line.lineId = this.genId();
    }
    if (!this.line.threadIndex) {
      this.line.threadIndex = this.threadIndex;
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
* {
  user-select: none;
}
.temp-line {
  stroke: @qkmRed;
  fill: none;
}

.connect-line,
.start-loop,
.end-loop,
.continue-loop {
  stroke: @qkmGrey;
  fill: none;
}

.connect-line,
.start-loop,
.end-loop,
.continue-loop {
  &:hover {
    stroke: @qkmLightBlue;
    fill: none;
    cursor: pointer;
  }
}

.nearby-hover {
  .connect-line,
  .start-loop,
  .end-loop,
  .continue-loop {
    stroke: @qkmLightBlue;
    fill: none;
  }
}
.active {
  .connect-line,
  .start-loop,
  .end-loop,
  .continue-loop {
    stroke: @qkmLightBlue;
    fill: none;
  }
}
.warning .connect-line {
  stroke: @qkmOrange;
  fill: none;
}
.error .connect-line {
  stroke: @qkmRed;
  fill: none;
}
.showdesc {
  .connect-line,
  .start-loop,
  .end-loop,
  .continue-loop {
    stroke: @qkmYellow;
    fill: none;
  }
}
text {
  display: none;
  fill: yellow;
  font-size: 15px;
}
.active text,
.showdesc text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
#movablePoint {
  width: 8px;
  height: 8px;
  fill: white;
  stroke: black;
  stroke-width: 1px;
}
#movablePoint:hover {
  cursor: ns-resize;
}
</style>    