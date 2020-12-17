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
import { lineCfg } from "./graphCfg.js";
export default {
  name: "pathAnimation",
  props: ["runningLineId"],
  data() {
    return {
      rectCount: lineCfg.rectCount,
      dur: lineCfg.dur, //一次完整的动画持续的时间 毫秒
      repeatCount: 1, // 'indefinite'
      interval: lineCfg.interval, // 矩形物块开始动画的时间差 毫秒
    };
  },
  methods: {
    /**
     * 计算用于运行时动画的动画路径
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
      // 去除path内的换行符
      path = path.replace(/[\r\n]/g, "");
      // 用于匹配箭头，圆角，开始与结束点的正则表达式
      let arrowReg = /m\s-5\s-5.*/;
      let startReg = /M\s\d+\s\d+/;
      let curveReg = /A[\d\s]+/g;
      let endReg = /L\s\d+\s\d+/;
      let endPoint = path.match(endReg)[0];
      let arrow = path.match(arrowReg)[0];
      let startPoint = path.match(startReg)[0];
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
      // 获取动画开始位置
      let splitedStart = startPoint.split(" ");
      let startX = parseInt(splitedStart[1], 10);
      let startY = parseInt(splitedStart[2], 10);
      // 获取连线结尾位置
      let splitedEnd = endPoint.split(" ");
      let endX = parseInt(splitedEnd[1], 10);
      let endY = parseInt(splitedEnd[2], 10);

      // 去除箭头
      path = path.replace(arrow, "");
      // 圆角部分需要先于动画起始点判断，不然替代时会先行替代动画起始点
      if (path.match("A")) {
        path = path.replace(endY, endY - 5);
        // TODO: 此时是圆角连线，需要根据圆角调整
        let firstCurve = curveList[0].split(" ").slice(6, 9);
        let firstCurveX = parseInt(firstCurve[0], 10);
        let firstCurveY = parseInt(firstCurve[1], 10);
        let secondCurve = curveList[1].split(" ").slice(6, 9);
        let secondCurveX = parseInt(secondCurve[0], 10);
        let secondCurveY = parseInt(secondCurve[1], 10);
        if (curveList.length == 2)
          path = path.replace(firstCurveX, firstCurveX - 5);
        path = path.replace(firstCurveY, firstCurveY - 5);
        path = path.replace(secondCurveX, secondCurveX - 5);
        path = path.replace(secondCurveY, secondCurveY - 5);
        if (curveList.length == 4) {
          path = path.replace(firstCurveX, firstCurveX - 5);
          path = path.replace(firstCurveY, firstCurveY - 5);
          path = path.replace(secondCurveX, secondCurveX);
          path = path.replace(secondCurveY, secondCurveY);
          let thirdCurve = curveList[2].split(" ").slice(6, 9);
          let thirdCurveX = parseInt(thirdCurve[0], 10);
          let thirdCurveY = parseInt(thirdCurve[1], 10);
          let fourthCurve = curveList[3].split(" ").slice(6, 9);
          let fourthCurveX = parseInt(fourthCurve[0], 10);
          let fourthCurveY = parseInt(fourthCurve[1], 10);
          path = path.replace(thirdCurveX, thirdCurveX - 5);
          path = path.replace(thirdCurveY, thirdCurveY - 5);
          path = path.replace(fourthCurveX, fourthCurveX);
          path = path.replace(fourthCurveY, fourthCurveY - 5);
        }
      }
      // 修改动画开始位置
      path = path.replace(startX, startX - 5);
      path = path.replace(startY, startY - 5);
      // 若不是圆角，则结尾处需要用别的方法处理
      if (!path.match("A")) {
        path = path.replace(endX, endX - 5);
        path = path.replace(endY, endY - 5);
      }
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
