<template>
      <g :id="lineId + '-animation'" v-show=isLineId>
        <path id="calc" :d="getAnimationPath(this.lineId)" :style="{fill:'none'}"/>
        <rect width="10" height="10" fill="#00ffff">
          <animateMotion begin="0s" dur="1.2s" repeatCount="indefinite">
            <mpath xlink:href="#calc"></mpath>
          </animateMotion>
        </rect>
        <rect width="10" height="10" fill="#00ffff">
          <animateMotion begin="0.1s" dur="1.2s" repeatCount="indefinite">
            <mpath xlink:href="#calc"></mpath>
          </animateMotion>
        </rect>
        <rect width="10" height="10" fill="#00ffff">
          <animateMotion  begin="0.2s" dur="1.2s" repeatCount="indefinite">
            <mpath xlink:href="#calc"></mpath>
          </animateMotion>
        </rect>
      </g>
</template>

<script>
export default {
  
  name: "pathAnimation",
  props: ['lineId'],
  data() {
    return {
      isLineId: true,
    };
  },
  methods:{
    /**
     * 
     * 计算用于显示动画运行时箭头的路径
     * 
     */
    getLinePath(lineId){
      if(!document.getElementById(lineId)){
        this.isLineId = false
        return
      }
      return document.getElementById(lineId).getAttribute('d')
    },
    /**
     * 计算用于运行时动画的动画路径
     * @param {lineId}
     * 
     */
    getAnimationPath(lineId){
      if(!document.getElementById(lineId)){
        this.isLineId = false
        return
      }
      var dom = document.getElementById(lineId);
      let path = dom.getAttribute("d");
      // 去除path内的换行符
      path = path.replace(/[\r\n]/g,"");
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
      if(curveList){
        for(let i = 0; i < 2; i++){
          curveList[i].replace(/\s\s+/,"")
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
      if(path.match("A")){
        path = path.replace(endY, endY - 5);
        // TODO: 此时是圆角连线，需要根据圆角调整
        let firstCurve = curveList[0].split(" ").slice(6,9);
        let firstCurveX = parseInt(firstCurve[0], 10);
        let firstCurveY = parseInt(firstCurve[1], 10);
        let secondCurve = curveList[1].split(" ").slice(6,9);
        let secondCurveX = parseInt(secondCurve[0], 10);
        let secondCurveY = parseInt(secondCurve[1], 10);
        path = path.replace(firstCurveX, firstCurveX - 5);
        path = path.replace(firstCurveY, firstCurveY - 5);
        path = path.replace(secondCurveX, secondCurveX - 5);
        path = path.replace(secondCurveY, secondCurveY - 5);
      }
      // 修改动画开始位置
      path = path.replace(startX, startX - 5);
      path = path.replace(startY, startY - 5);
      // 若不是圆角，则结尾处需要用别的方法处理
      if(!path.match("A")){
        path = path.replace(endX, endX - 5);
        path = path.replace(endY, endY - 5);
      }
      return path
    },
  },
};
</script>

<style>

</style>
