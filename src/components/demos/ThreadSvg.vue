<template>
  <!-- <div class="thread" :style="{width: thread.width + 'px', height: thread.height + 'px' }" @drop.prevent="drop" @dragover.prevent @mouseup="endResize"  -->
  <div
    class="thread"
    :style="{width: thread.width + 'px', height: computedH + 'px' }"
    @drop.prevent="drop"
    @dragover.prevent
    @mouseup="endResize"
    @mousemove="onResize2"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      :id="thread.id"
      class="thread-svg"
    >
      <foreignObject
        y="0"
        width="100%"
        height="100%"
        @mousemove="onConnecting"
        @mouseup="onMouseup"
      >
        <h4 class="title" contenteditable="true" :style="titleStyle">{{ thread.name }}</h4>
        <div class="thread-body">
          <state-div
            v-for="(stateItem, index) in thread.stateAry"
            :key="index"
            :stateData="stateItem"
            :index="index"
            :threadIndex="threadIndex"
            @updateStateData="updateStateData"
            @updateTempLineData="updateTempLineData"
          />
        </div>
      </foreignObject>
      <!--  <g v-show="showTempLine">
                <path d="" class="templine"></path>
      </g>-->
      <line-svg v-show="showTempLine" :lineClass="tempLineClass" :line="tempLineData" />
      <line-svg v-for="(line, index2) in thread.lineAry" :key="index2" :line="line" :threadIndex="threadIndex"/>
    </svg>
    <!-- <i class="resize-icon" :style="{ backgroundImage: 'url(' + moveVerticalImg + ')'}"></i> -->
    <i
      class="resize-icon resizable"
      :style="{ backgroundImage: 'url(' + resizableImg + ')', backgroundRepeat: 'no-repeat'}"
      @mousedown="startResize"
      @mouseup="endResize"
    ></i>
    <!-- <div v-if="showVirtualBox" class="virtual-box"></div> -->
  </div>
</template>

<script>
import StateDiv from "./StateDiv";
import LineSvg from "./LineSvg";
const MID_POINT_X = 50;
const deepCopy = (obj)=>{
  if(typeof obj !== 'object'){
      return obj;
  }

  let type = Object.prototype.toString.apply(obj);
  let ret = type === '[object Array]' ? [] : {};

  if(type === '[object Array]'){
      ret = [];
      let i = 0;
      while(i < obj.length){
          ret[i] = deepCopy(obj[i]);
          i++;
      }
  }else{
      ret = {};
      for(let k in obj){
        if(obj.hasOwnProperty(k)){
          ret[k] = deepCopy(obj[k]);
        }
      }
  }

  return ret;
}

export default {
  name: "ThreadSvg",
  props: ["thread", "threadIndex"],
  components: {
    StateDiv,
    LineSvg
  },
  data() {
    return {
      showVirtualBox: false,
      showTempLine: false,
      tempLineClass: "templine",
      tempLineData: {
        startState: null,
        endState: null,
        startPoint: {
          x: 0,
          y: 0
        },
        endPoint: {
          x: 0,
          y: 0
        },
        d: ""
      },
      threadCount: 1,
      titleHeight: 35,
      moveVerticalImg: "../../../static/imgs/move-vertical.png",
      resizableImg: "../../../static/imgs/resizable.png"
    };
  },
  methods: {
    onResize2() {
      // console.log('onResize---2---' + +new Date());
    },
    titleStyle() {
      return `height: ${this.titleHeight}px;`;
    },
    addState() {
      this.stateAry.push({
        name: "状态",
        inCount: 0,
        outCount: 0
      });
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

          this.updateTempLineData({
            endPoint: endPoint,
            d: `M ${this.tempLineData.startPoint.x} ${
              this.tempLineData.startPoint.y
            } h ${MID_POINT_X} V ${endPoint.y} L ${endPoint.x} ${
              endPoint.y
            } m 0 0 z`
           /*  d: `M ${this.tempLineData.startPoint.x} ${
              this.tempLineData.startPoint.y
            } h ${MID_POINT_X} v ${endPoint.y -
              this.tempLineData.startPoint.y} L ${endPoint.x} ${
              endPoint.y
            } m 0 0 z` */
          });
        } else {
          stateManage.isConnecting = false;
          return;
        }
      }
    },
    updateTempLineData(lineData) {
      Object.keys(lineData).forEach(key => {
        this.tempLineData[key] = lineData[key];
      });
      // debugger;
    },
    drawConnectLine(e) {
      let endState = this.getEndState(e);
      let lineData = this.copy(this.tempLineData);
      lineData.endState = endState;
      lineData.lineId = window.genId('line');
      lineData.desc = '';
      EventObj.$emit('addLine2svg', {
          threadIndex: this.threadIndex,
          lineData: lineData
      })
    },
    copy(obj){
      return deepCopy(obj);
    },
    /**
     *  判断两根连线是否相同,如果连线1的开始状态==连线2的开始状态，且连线1的结束状态==连线2的结束状态，说明是同一根连线
     * @return Boolean
     */
    isSameLine(line1, line2) {
      return (
        line1.startState === line2.startState &&
        line1.endState === line2.endState
      );
    },
    isDuplicateLine(line){
      let dupFlag = false;
      this.thread.lineAry.forEach(item => {
        if(this.isSameLine(item, line)){
          dupFlag = true;
          return false;
        }
      })
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
          stateIndex;
      if (e.target.closest(".state-div")) {
        stateId = e.target.closest(".state-div").getAttribute("stateid");
        stateIndex = parseInt(e.target.closest(".state-div").getAttribute("index"), 10);
      }
      return {
        stateId: stateId,
        stateIndex: stateIndex
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
            e.target.getBoundingClientRect().height / 2 //e.target.offsetTop + e.offsetY // e.clientY
        };
      } else {
        point = {
          x: e.clientX - curSvgRect.left - 2, //e.target.offsetLeft + e.offsetX, // e.clientX,
          y: e.clientY - curSvgRect.top - 2 //e.target.offsetTop + e.offsetY // e.clientY
        };
      }
      return point;
    },
    onMouseup(e) {
      if (stateManage.isConnecting) {
        //TODO 触发EventObj更新lineObj
        let curSvg = e.target.closest("svg");
        let curSvgRect = curSvg.getBoundingClientRect();
        let target_class = e.target.getAttribute("class");
        let regIsConnectPoint = /connect-point/;
        let existedLine = false;
        if (regIsConnectPoint.test(target_class)) {
          //绘制连接线
          existedLine = this.isDuplicateLine(this.tempLineData);
          if(existedLine){
            return;
          }else{
            this.drawConnectLine(e);
          }
        }
        this.showTempLine = false;
        stateManage.isConnecting = false;
      }
    },

    drop(e) {
      if (e.dataTransfer.getData("operate") === "addState") {
        let threadPosInfo = e.target.getBoundingClientRect();
        EventObj.$emit("addState", {
          index: this.threadIndex,
          x: e.x - threadPosInfo.x,
          y: e.y - threadPosInfo.y
        });
      }
    },

    updateStateData(stateData) {
      //todo 后续这个数据应更新到外层的threadAry     this.thread相当于只是临时的显示数据
      this.thread.stateAry[stateData.index].x = stateData.transform.x;
      this.thread.stateAry[stateData.index].y = stateData.transform.y;

      this.updateLines(stateData);
    },
    /**
     * 更新某个状态块的所有输入连线和输出连线
     */
    updateLines(stateData){
      let lineAry,
        curLine;
      let state = this.thread.stateAry[stateData.index];
      debugger;
      if(state.inputAry){
        lineAry = this.thread.lineAry;
        state.inputAry.forEach(inputLine => {
          // inputLine --> state中保存的lineId以及对这个触发事件的描述等信息，没有真正的用于画连线的数据
          curLine = lineAry.find(line => {
            //line --> line的具体画连线的数据   inputLine与line通过lineId更新数据
            return line.lineId === inputLine.lineId;
          })
          this.updateLineData(curLine, stateData);
        })
      }

      if(state.outputAry){
        lineAry = this.thread.lineAry;
        state.outputAry.forEach(outputLine => {
          // inputLine --> state中保存的lineId以及对这个触发事件的描述等信息，没有真正的用于画连线的数据
          curLine = lineAry.find(line => {
            //line --> line的具体画连线的数据   inputLine与line通过lineId更新数据
            return line.lineId === outputLine.lineId;
          })
          this.updateOutputLineData(curLine, stateData);
        })
      }
    },
    /**
     * 根据状态块的transform数据更新其endPoint, 然后更新用于画线的数据d   todo
     * 连线方案：判断当前的鼠标位置，目标状态，如果存在这样1个状态a，它的纵坐标和startState，endState相等，且a的横坐标在startState，endState中间，则需要绕着a画折线
     * 连线分多种复杂场景，这部分后面逐渐完善
     */
    updateLineData(curLine, stateData){
      //todo
      let testY = 57;
      /* `M ${this.tempLineData.startPoint.x} ${
              this.tempLineData.startPoint.y
            } h ${MID_POINT_X} V ${endPoint.y} L ${endPoint.x} ${
              endPoint.y
            } m 0 0 z` */
            let endPoint = {
              x: stateData.transform.x,
              y: stateData.transform.y + testY
            };
            let d = `M ${curLine.startPoint.x} ${
              curLine.startPoint.y
            } h ${MID_POINT_X} v ${endPoint.y - curLine.startPoint.y} L ${endPoint.x} ${
              endPoint.y
            } m 0 0 z`;
            curLine.endPoint = endPoint;
            console.log('1---'+ curLine.d);
            curLine.d = d;
            console.log('2---'+ curLine.d);
            debugger;
    },
    updateOutputLineData(curLine, stateData){
      let startPoint = {
        x: stateData.transform.x + 116,
        y: stateData.transform.y + 57
      };
      let d = `M ${startPoint.x} ${
              startPoint.y
            } h ${MID_POINT_X} v ${ curLine.endPoint.y - startPoint.y} L ${curLine.endPoint.x} ${
              curLine.endPoint.y
            } m 0 0 z`;
            curLine.startPoint = startPoint;
            curLine.d = d;
    },
    startResize(e) {
      this.showVirtualBox = true;
      EventObj.$emit("operateChange", {
        operate: "resize-thread",
        index: this.threadIndex,
        startPosition: {
          x: e.pageX,
          y: e.pageY
        },
        originW: this.$el.offsetWidth,
        originH: this.$el.offsetHeight
      });
    },
    endResize(e) {
      this.showVirtualBox = false;
      EventObj.$emit("operateChange", {
        operate: "default"
      });
      this._lastHeight = this.thread.height;
    }
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
    computedH: function() {
      let maxY = 0;
      let threadDivBorderWidth = 1,
        stateDivBorderWidth = 1,
        stateDivHeight = 40; // 50是状态的高度
      if (this.showVirtualBox) {
        return Math.max(maxY, this.thread.height);
      }
      this._lastHeight = this._lastHeight || this.thread.height;
      this.thread.stateAry.forEach(state => {
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
    }
  }
};
</script>

<style>
div.thread {
  position: relative;
  /* margin-top: 50px; */
  /* margin-left: 50px; */
  margin: 25px;
}
foreignObject {
  border: 1px solid #00cd9a;
  border-radius: 4px;
}
h4.title {
  margin: 0;
  width: 100%;
  height: 35px;
  line-height: 35px;
  color: #ffffff;
  background-color: rgba(0, 219, 255, 0.42);
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

.templine {
  stroke: #ff0000;
  stroke-width: 1px;
  fill: transparent;
}
.templine:hover {
  stroke: yellow;
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