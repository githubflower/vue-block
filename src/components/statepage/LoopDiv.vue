<template>
  <!-- :stateId="stateData.stateId ? stateData.stateId : genId()"  -->
  <!-- :stateId="stateId"  -->
  <div :index="index" :class="['state-div', { 'is-dragging': isDragging }]">
    <span class="icon" :style="{ backgroundImage: `url( ${loopIcon})` }"></span>
    <el-input
      v-if="showInput"
      class="state-name-input"
      v-model="stateData.name"
      style="position: relative; top: 4px"
      @keyup.enter.native="hideInput"
      @blur="hideInput"
    ></el-input>
    <p v-else :title="stateData.name" @dblclick="rename">
      {{ stateData.name }}
    </p>
    <!-- <div v-show="stateData.inCount > 1" class="in event-count" >{{stateData.inputAry.length}}</div> -->
    <!-- <div v-show="stateData.outCount > 1" class="out event-count">{{stateData.outCount}}</div> -->
    <div
      v-show="stateData.inputAry && stateData.inputAry.length"
      class="in event-count"
      @click="showInputAry = !showInputAry"
    >
      {{ stateData.inputAry.length }}
      <ul class="input-list" v-show="showInputAry">
        <li v-for="(item, index) in stateData.inputAry" :key="index">
          {{ getDesc(item.lineId) }}
        </li>
      </ul>
    </div>
    <div
      v-show="stateData.outputAry && stateData.outputAry.length"
      class="out event-count"
      @click="showOutputAry = !showOutputAry"
    >
      {{ stateData.outputAry.length }}
      <ul class="output-list" v-show="showOutputAry">
        <li
          v-for="(item, index) in stateData.outputAry"
          :key="index"
          @mouseenter="activeLine(item.lineId)"
          @mouseleave="disActiveLine(item.lineId)"
        >
          {{ getDesc(item.lineId) }}
        </li>
      </ul>
    </div>
    <div class="connect-point in"></div>
    <div
      class="connect-point out"
      @mousedown="onConnectPointMousedown"
      @mouseup="onMouseup"
    ></div>
  </div>
</template>

<script>
// import MyPlainDraggable from 'plain-draggable'
// import MyPlainDraggable from 'plain-draggable/plain-draggable.esm.js'
const IS_MOVING = 1;
const IS_CONNECTING = 2;
// const IS_CREATING_STATE = 3; //通过拖拽新建1个状态
const isNumber = (str) => {
  return typeof str === "number";
};
export default {
  name: "LoopDiv",
  props: ["stateData", "index", "threadIndex"],

  data() {
    return {
      // loopIcon: require('../../../static/imgs/logo2.png'),
      loopIcon: "../../../static/imgs/loop-blue.png",
      showInput: false,
      isDragging: false,
      operate: null, // IS_MOVING    IS_CONNECTING
      stateId: null,
      showInputAry: false,
      showOutputAry: false,
    };
  },
  methods: {
    genId() {
      return window.genId("state");
    },
    generateStatePos(stateData) {
      return isNumber(stateData.x) && isNumber(stateData.y)
        ? `transform: translate(${stateData.x}px, ${stateData.y}px)`
        : "transform: translate(0, 0)";
    },
    isConnectPoint(dom) {
      let connectPointReg = /connect-point/;
      let classStr = dom.getAttribute("class");
      if (connectPointReg.test(classStr)) {
        return true;
      }
      return false;
    },
    onStateMousedown(e) {
      if (this.isConnectPoint(e.target)) {
        this.operate = IS_CONNECTING;
      } else {
        this.operate = null;
      }
    },
    /**
     * 鼠标在连接点按下
     */
    onConnectPointMousedown(e) {
      // this.operate = IS_CONNECTING;
      window.stateManage.isConnecting = true;
      let boundingRect = e.target.getBoundingClientRect();
      let curSvg = e.target.closest("svg");
      let curSvgRect = curSvg.getBoundingClientRect();
      let data = {
        threadIndex: this.threadIndex,
        startState: {
          stateId: this.stateId,
          stateIndex: this.index,
        },
        startPoint: {
          x: boundingRect.left - curSvgRect.left + boundingRect.width / 2,
          y: boundingRect.top - curSvgRect.top + boundingRect.height / 2,
        },
      };
      console.log(JSON.stringify(data));
      this.$emit("updateTempLineData", data);

      window.stateManage.startPoint = {
        x: boundingRect.left - curSvgRect.left + boundingRect.width / 2,
        y: boundingRect.top - curSvgRect.top + boundingRect.height / 2,
      };
    },


    onMouseup(e) {
        stateManage.isConnecting = false;
      
    },
    onDrag(e) {
      this._endInfo = {
        x: e.x,
        y: e.pageY,
      };

      this.judgeBoundary(e.target);
      this.updatePosition(e.target);
    },
    dragStart(e) {
      if (this.operate === IS_CONNECTING) {
        e.preventDefault();
        return false;
      }
      e.dataTransfer.effectAllowed = "copyMove";

      this.isDragging = true;
      // this._startInfo = e.target.getBoundingClientRect();
      this._startInfo = {
        x: e.x,
        y: e.pageY,
      };
      this._startInfo.transform = this.getStyleTransform(e.target);
      console.log("---dragStart---", this._startInfo);
    },
    dragEnd(e) {
      this.isDragging = false;
      // this._endInfo = e.target.getBoundingClientRect();
      this._endInfo = {
        x: e.x,
        y: e.pageY,
      };
      this.updatePosition(e.target);
      console.log("---dragEnd---", this._endInfo);
      this._startInfo = null; //每次开始拖拽时都会重新设置这个_startInfo
    },
    onDrop(e) {
      //当拖拽其他状态放入到循环块里面时，通知statePage修改children的值
    },
    onDragLeave(e) {
      //说明当前不是在进行状态的操作，此时不需要对此事件作出响应
      if (!this._startInfo) {
        return;
      }
      console.log("onDragLeave --- " + e.x + " --- " + e.y);
      console.log("onDragLeave --- " + e.x + " --- " + e.pageY);
      this._endInfo = {
        x: e.x,
        y: e.pageY,
      };

      this.judgeBoundary(e.target);
      this.updatePosition(e.target);
    },
    judgeBoundary(dom) {
      let targetInfo = dom.getBoundingClientRect();
      let curSvg = dom.closest("svg");
      let curSvgRect = curSvg.getBoundingClientRect();
      let needResizeW = targetInfo.right > curSvgRect.right,
        needResizeH = targetInfo.bottom > curSvgRect.bottom,
        needResizeInfo = {
          threadIndex: this.threadIndex,
        };
      if (needResizeH) {
        needResizeInfo.dh = targetInfo.bottom - curSvgRect.bottom;
      }
      if (needResizeW) {
        needResizeInfo.dw = targetInfo.right - curSvgRect.right;
      }
      if (needResizeW || needResizeH) {
        EventObj.$emit("resizeSvg", needResizeInfo);
      }
      // this.$emit('resizeSvg', needResizeInfo);
    },
    updatePosition(dom) {
      let dx = this._endInfo.x - this._startInfo.x,
        dy = this._endInfo.y - this._startInfo.y,
        reg = /transform:\s*translate\((\-?\d*)(px)?,\s*(\-?\d*)(px)?\)/,
        style = dom.getAttribute("style"),
        cx = this._startInfo.transform.x + dx,
        cy = this._startInfo.transform.y + dy;
      // 手動更新样式
      /* if(style){
                style = style.replace(reg, `transform: translate(${cx}px, ${cy}px)`);
            }else{
                style = `transform: translate(${cx}px, ${cy}px)`;
            }
            dom.setAttribute('style', style); */

      //通知父容器更新transform数据 （数据驱动更新样式）
      this.$emit("updateStateData", {
        transform: {
          x: cx,
          y: cy,
        },
        index: this.index,
      });
    },
    getStyleTransform(dom) {
      let style,
        transform = {
          x: 0,
          y: 0,
        },
        reg = /transform:\s*translate\((\-?\d*)(px)?,\s*(\-?\d*)(px)?\)/,
        ret;
      if (dom) {
        style = dom.getAttribute("style");
        if (style) {
          ret = style.match(reg);
          console.log(ret);
          if (ret) {
            transform = {
              x: parseInt(ret[1], 10),
              y: parseInt(ret[3], 10),
            };
          }
        }
      }
      return transform;
    },
    contextmenu() {},
    rename() {
      this.showInput = true;
      // this.$el.child('.state-name-input')
      this.$nextTick(function () {
        // this.$el.firstChild.focus();
        this.$el.firstChild.firstElementChild.focus();
      });
    },
    hideInput() {
      this.showInput = false;
    },
    /**
     * 根据lineId获取这个连线的描述信息
     */
    getDesc(lineId) {
      let line =
        statePageVue.threadAry[this.threadIndex].lineAry.find((item) => {
          return item.lineId === lineId;
        }) || {};
      return line.desc;
    },
    activeLine(lineId) {
      let line =
        statePageVue.threadAry[this.threadIndex].lineAry.find((item) => {
          return item.lineId === lineId;
        }) || {};

      line.active = true;
    },
    disActiveLine(lineId) {
      let line =
        statePageVue.threadAry[this.threadIndex].lineAry.find((item) => {
          return item.lineId === lineId;
        }) || {};

      line.active = false;
    },
  },
  created() {
    this.stateId = this.stateData.stateId
      ? this.stateData.stateId
      : this.genId();
  },
  mounted() {
    /*
        var elm = this.$el;
        window.testVueObj = this;
        window.draggableDiv = new PlainDraggable(elm, {
            snap: {
                step: 30
            }
        });
        draggableDiv.onDragStart = function(pointerXY) {
            let connectPointReg = /connect-point/;
            let classStr = pointerXY.target.getAttribute('class');
            if(connectPointReg.test(classStr)){
                // window.statePageVue.isConnecting = true;
                return false;
            }
            return true;
        };
        draggableDiv.onMove = function(params) {
            console.log('move');
            window.line && window.line.position();
            window.line2 && window.line2.position();
        }
        draggableDiv.onDragEnd = function(params) {
            console.log('drag-end');
            // window.line.position();

        // this.$nextTick(function(){
            // window.line = new LeaderLine(states[0], states[1], );
        }*/
    /* draggable.snap = {
            x: {
                step: 40 //90 + 60
            },
            y: {
                step: 40 //40 + 40
            }
        }; */
  },
};
</script>

<style lang="less" scoped>
@templateDivH: 30px;
@qkmLightGreen: #1cf9ea;
@qkmOrange: #ffaf3d;
@qkmBlue: #3897e7;
@qkmPink: #ed5e67;
@qkmPurple: #9373ec;
@qkmGrey: #aaaaaa;
@qkmWhite: #ffffff;
.state-div {
  /* 76+76+40 */
  /* min-width: 192px; */
  /* height: 120px; */
  width: 100%;
  height: 100%;
  border: 1px solid @qkmPink;
  box-shadow: 1px 1px 3px 0px @qkmPink;
  /* background-color: #ccdd00; */
  border-radius: 5px;
  color: #aaaaaa;
}
.state-div:hover {
  color: #ce5050;
  border-color: #ce5050;
}
span.icon {
  position: absolute;
  display: inline-block;
  background-size: cover;
  width: 24px;
  height: 24px;
  top: 0px;
  left: 5px;
}
.state-div > p {
  display: -webkit-box;
  position: relative;
  /* top: 50%; */
  /* transform: translateY(-50%); */
  text-align: center;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  text-overflow: ellipsis;
  overflow: hidden;
  font-size: 14px;
}
.event-count {
  width: 20px;
  height: 20px;
  border-radius: 10px;
  background-color: rgba(0, 157, 218, 0.33);
  color: #ffffff;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  text-align: center;
  line-height: 20px;
  font-size: 14px;
}
.event-count:hover {
  background-color: rgba(0, 157, 218, 1);
  cursor: pointer;
}
.in {
  left: 0;
}
.out {
  right: 0;
}
.connect-point {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 10px;
  height: 10px;
  border-radius: 10px;
}
.connect-point:hover {
  border: 2px solid #ff0000 !important;
  cursor: default;
}
.state-div:hover .connect-point {
  border: 2px solid blue;
  cursor: default;
}
.connect-point.in {
  transform: translate(-50%, -50%);
}
.connect-point.out {
  transform: translate(50%, -50%);
}
.is-dragging {
  cursor: move;
}

.input-list,
.output-list {
  list-style: none;
  position: absolute;
  top: 20px;
  right: 20px;
  background-color: #ffffff;
  color: #000000;
  z-index: 1;
}
.output-list {
  left: 20px;
  right: initial;
}

.input-list > li,
.output-list > li {
  width: 120px;
}
.input-list > li:hover,
.output-list > li:hover {
  background-color: #e6f7ff;
}
</style>    