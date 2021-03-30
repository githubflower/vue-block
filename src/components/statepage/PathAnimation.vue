<template>
  <g id="animationComp">
    <path id="calc" :d="linePath" :style="{ fill: 'none' }" />
    <rect
      id="rec"
      v-for="item in rectCount"
      :key="item"
      width="10"
      height="10"
      :fill="fillColor(item)"
      x="0"
      y="0"
      filter="url(#f1)"
    >
      <animateMotion
        :id="genAnimateMotionId(item)"
        :begin="genBeginValue(item)"
        :dur="computedDur"
        :end="genEndValue(item)"
        :repeatCount="repeatCount"
      >
        <mpath xlink:href="#calc"></mpath>
      </animateMotion>
    </rect>
  </g>
</template>

<script>
import { animationCfg } from "./graphCfg.js";
export default {
  name: "pathAnimation",
  props: ["runningLineId"],
  data() {
    return {
      rectCount: animationCfg.rectCount,
      dur: animationCfg.dur, //一次完整的动画持续的时间 毫秒
      repeatCount: 1, // 'indefinite'
      interval: animationCfg.interval, // 矩形物块开始动画的时间差 毫秒
    };
  },
  methods: {
    //获取当前连线所有的拐角路径
    getCurveList(path) {
      let curveReg = /A[\d\s]+/g;
      // 获取动画圆角拐点位置
      let curveList = path.match(curveReg);
      if (curveList && curveList.length == 2) {
        for (let i = 0; i < 2; i++) {
          curveList[i].replace(/\s\s+/, "");
        }
      }
      if (curveList && curveList.length == 4) {
        for (let i = 0; i < 4; i++) {
          curveList[i].replace(/\s\s+/, "");
        }
      }
      return curveList;
    },
    //计算连线动画物块在水平连线上移动的路径
    replaceHLine(path, Lineindex) {
      let hLineReg = /L\s\d+\s\d+/g;
      let hLine = path.match(hLineReg)[Lineindex];
      let calculatedHLine = path.match(hLineReg)[Lineindex];
      let calculatedHLineY = parseInt(hLine.split(" ")[2], 10);
      calculatedHLine = calculatedHLine.replace(
        calculatedHLineY,
        calculatedHLineY - 5
      );
      path = path.replace(hLine, calculatedHLine);
      return path;
    },
    //计算连线动画物块的拐角路径
    replaceCurve(path, curveIndex, curveList, offsetX, offsetY) {
      let curve = curveList[curveIndex].split(" ").slice(6, 9);
      let curveX = parseInt(curve[0], 10);
      let curveY = parseInt(curve[1], 10);
      let calculatedCurve = curveList[curveIndex];
      calculatedCurve = calculatedCurve.replace(curveX, curveX - offsetX);
      calculatedCurve = calculatedCurve.replace(curveY, curveY - offsetY);
      path = path.replace(curveList[curveIndex], calculatedCurve);
      return path;
    },
    //根据不同的连线种类计算连线动画物块的路径
    replacePathByLine(path, curveList) {
      if (curveList.length == 2) {
        path = this.replaceCurve(path, 0, curveList, 5, 5);
        path = this.replaceCurve(path, 1, curveList, 5, 5);
        path = this.replaceHLine(path, 0);
      }
      if (curveList.length == 4) {
        path = this.replaceCurve(path, 0, curveList, 5, 5);
        path = this.replaceCurve(path, 1, curveList, 5, 5);
        path = this.replaceHLine(path, 0);
        path = this.replaceCurve(path, 2, curveList, 5, 10);
        path = this.replaceCurve(path, 3, curveList, 5, 5);
        path = this.replaceHLine(path, 1);
      }
      return path;
    },
    //计算连线动画物块的开始位置
    replaceStartPoint(path) {
      let startReg = /M\s\d+\s\d+/;
      let startPoint = path.match(startReg)[0];
      let splitedStart = startPoint.split(" ");
      let startX = parseInt(splitedStart[1], 10);
      let startY = parseInt(splitedStart[2], 10);
      path = path.replace(startX, startX - 5);
      path = path.replace(startY, startY - 5);
      return path;
    },
    //由于连线动画物块不需要随着箭头移动，需要将连线上箭头的路径移除
    deleteArrow(path) {
      let arrowReg = /m\s-5\s-5.*/;
      let arrow = path.match(arrowReg)[0];
      path = path.replace(arrow, "");
      return path;
    },
    /**
     * 计算连线动画的路径
     *
     * @param {lineId}
     *
     */
    getAnimationPath(lineId) {
      if (!document.getElementById(lineId)) {
        return "m 0 0";
      }
      var dom = document.getElementById(lineId);
      let path = dom.getAttribute("d");
      let curveList = this.getCurveList(path);
      path = this.replaceStartPoint(path);
      path = this.replacePathByLine(path, curveList);
      path = this.deleteArrow(path);

      return path;
    },
    genAnimateMotionId: function (index) {
      return "animateMotion" + index;
    },
    genBeginValue: function (index) {
      var value = "";
      if (index === 1) {
        value = "animationComp.focus";
      } else {
        value = `animateMotion${index - 1}.begin+${this.interval}ms;`;
      }
      return value;
    },
    genEndValue: function (index) {
      var value = "";
      if (index === 1) {
        value = "animationComp.blur";
      } else {
        value = `animateMotion${index - 1}.end+${this.interval}ms;`;
      }
      return value;
    },
    fillColor: function (item) {
      const colorAry = ["#ff0000", "#00ff00", "#0000ff"];
      // return colorAry[(item - 1) % 3];
      return "#00FFFF";
    },
  },
  computed: {
    computedDur: function () {
      return this.dur + "ms";
    },

    linePath: function () {
      return this.getAnimationPath(this.runningLineId);
    },
  },
};
</script>

<style lang="less">
#animationComp {
  outline: none;
  rect {
    display: none;
  }
  &:focus rect {
    display: initial;
  }
}
</style>
