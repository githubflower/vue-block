<template>
  <!-- :stateId="stateData.stateId ? stateData.stateId : genId()"  -->
  <!-- :stateId="stateId"  -->
  <div
    :index="index"
    :class="['loop-div', { selected: isInActiveStates() }, runningStatus]"
    @click="selectStateOrHideMenu"
  >
    <div :class="runningAnimation" :v-show="runningAnimation"></div>
    <span class="icon" :style="{ backgroundImage: `url( ${loopIcon})` }"></span>
    <el-input
      v-if="showInput"
      class="state-name-input"
      v-model="stateData.name"
      style="position: relative; top: 4px"
      @keyup.enter.native="hideInput"
      @blur="hideInput"
    ></el-input>
    <p :class="runningStatus" v-else :title="stateData.name" @dblclick="rename">
      {{
        stateData.name.length > 8
          ? stateData.name.slice(0, 8) + "..."
          : stateData.name
      }}
    </p>
    <div
      v-show="stateData.inputAry && stateData.inputAry.length"
      class="in event-count"
      @click.stop="showInputDesc"
    >
      {{ stateData.inputAry.length }}
      <ul class="input-list" v-show="showInputAry">
        <li
          v-for="(item, index) in stateData.inputAry"
          :key="index"
          @mouseenter="activeLine(item.lineId)"
          @mouseleave="disActiveLine(item.lineId)"
        >
          {{ getDesc(item.lineId) }}
        </li>
      </ul>
    </div>
    <div
      v-show="stateData.outputAry && stateData.outputAry.length"
      class="out event-count"
      @click.stop="showOutputDesc"
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
    <div
      class="connect-point in"
      @mousedown.prevent="onConnectPointMousedown"
    ></div>
    <div
      class="connect-point out"
      @mousedown.prevent="onConnectPointMousedown"
    ></div>

    <img
      class="connect-point loop"
      src="../../../static/imgs/looping.png"
      width="20"
      height="20"
    />
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
  props: [
    "stateData",
    "index",
    "threadIndex",
    "activeStates",
    "runningStatus",
    "runningAnimation",
    "showDeleteStateMenu",
    "showLineContextMenu",
  ],

  data() {
    return {
      // loopIcon: require('../../../static/imgs/logo2.png'),
      loopIcon: "../../../static/imgs/loop-blue.png",
      showInput: false,
      isDragging: false,
      isActive: false,
      operate: null, // IS_MOVING    IS_CONNECTING
      stateId: null,
      showInputAry: false,
      showOutputAry: false,
    };
  },
  methods: {
    /**
     * 判断当前状态是否在已被高亮的状态块内
     */
    isInActiveStates() {
      for (let i = 0; i < this.activeStates.length; i++) {
        if (this.stateData.stateId === this.activeStates[i].stateId) {
          return true;
        }
      }
      return false;
    },
    selectStateOrHideMenu(e) {
      let data = {
        stateData: this.stateData,
        e: e,
      };
      if (this.showDeleteStateMenu || this.showLineContextMenu) {
        EventObj.$emit("hideMenus");
      } else {
        this.hideInput();
        this.$emit("updateActiveState", data);
      }
    },
    genId() {
      return window.genId("state");
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
     *
     */
    onConnectPointMousedown(e) {
      // this.operate = IS_CONNECTING;
      window.stateManage.isConnecting = true;
      let boundingRect = e.target.getBoundingClientRect();
      let curSvg = e.target.closest("svg");
      let curSvgRect = curSvg.getBoundingClientRect();
      let stateId = this.$el.parentElement.getAttribute("stateid");
      let startPointClass = e.path[0].getAttribute("class");
      let data = {
        threadIndex: this.threadIndex,
        startState: {
          stateId: stateId,
          stateIndex: this.index,
        },
        startPointClass: startPointClass,
      };
      this.$emit("updateTempLineData", data);
    },

    onMouseup(e) {
      stateManage.isConnecting = false;
    },
    rename() {
      this.showInput = true;
      // this.$el.child('.state-name-input')
      this.$nextTick(function () {
        // this.$el.firstChild.focus();
        var inputDom = this.$el.querySelector(".state-name-input");
        if (inputDom) {
          inputDom.focus();
        }
      });
    },
    hideInput() {
      this.showInput = false;
    },
    showInputDesc() {
      this.showInputAry = !this.showInputAry;
    },
    showOutputDesc() {
      this.showOutputAry = !this.showOutputAry;
    },
    /**
     * 根据lineId获取这个连线的描述信息
     */
    getDesc(lineId) {
      let line =
        store.stateData.threadAry[this.threadIndex].lineAry.find((item) => {
          return item.lineId === lineId;
        }) || {};
      return line.desc;
    },
    activeLine(lineId) {
      let lineAry = store.stateData.threadAry[this.threadIndex].lineAry;
      let line =
        lineAry.find((item) => {
          return item.lineId === lineId;
        }) || {};
      line.showdesc = true;
    },
    disActiveLine(lineId) {
      let lineAry = store.stateData.threadAry[this.threadIndex].lineAry;
      let line =
        lineAry.find((item) => {
          return item.lineId === lineId;
        }) || {};
      line.showdesc = false;
    },
  },
  created() {
    this.stateId = this.stateData.stateId
      ? this.stateData.stateId
      : this.genId();
  },
  mounted() {
    document.addEventListener("click", () => {
      if (this.showInputAry === true) {
        this.showInputAry = false;
      }
      if (this.showOutputAry === true) {
        this.showOutputAry = false;
      }
    });
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
@qkmLightBlue: #70ffff;
@qkmOrange: #ffaf3dcc;
@qkmRed: #e83e3ecc;
@qkmBlue: #3897e7;
@qkmPink: #ed5e67;
@qkmLightOrange: #ffaf3d;
@qkmLightRed: #e83e3e;
.loop-div {
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
.loop-div:hover {
  color: #ce5050;
  border-color: #ce5050;
}
.loop-div.selected {
  border: 2px solid @qkmLightOrange;
  box-shadow: 2px 2px 4px 0px @qkmLightOrange;
}
.loop-div.active {
  border: 2px solid @qkmLightBlue;
  box-shadow: 2px 2px 4px 0px @qkmLightBlue;
}
.active-animation {
  width: 10px;
  height: 10px;
  top: -5px;
  left: -5px;
  border-radius: 2px;
  background: @qkmLightBlue;
  box-shadow: 2px 2px 4px 0px @qkmLightBlue;
  position: absolute;
  float: left;
  animation-name: activeMove;
  animation-duration: 3s;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  animation-play-state: running;
}
@keyframes activeMove {
  0% {
    left: -5px;
    top: -5px;
  }
  25% {
    left: calc(100% - 5px);
    top: -5px;
  }
  50% {
    left: calc(100% - 5px);
    top: calc(100% - 5px);
  }
  75% {
    left: -5px;
    top: calc(100% - 5px);
  }
  100% {
    left: -5px;
    top: -5px;
  }
}
.loop-div.warning {
  border: 2px solid;
  border-color: @qkmOrange;
  box-shadow: 2px 2px 4px 0px @qkmOrange;
}

.warning-animation {
  width: 99%;
  height: 99%;
  border: 8px solid @qkmLightOrange;
  float: left;
  border-radius: 5px;
  top: -4px;
  left: -4px;
  position: absolute;
  filter: blur(2px);
  animation-name: errorWarningMove;
  animation-delay: 0.5s;
  animation-duration: 2s;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  animation-play-state: running;
}
.loop-div.error {
  border: 2px solid;
  border-color: @qkmRed;
  box-shadow: 2px 2px 4px 0px @qkmRed;
}

.error-animation {
  width: 99%;
  height: 99%;
  border: 8px solid @qkmLightRed;
  float: left;
  border-radius: 5px;
  top: -4px;
  left: -4px;
  position: absolute;
  filter: blur(2px);
  animation-name: errorWarningMove;
  animation-delay: 0.5s;
  animation-duration: 1s;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  animation-play-state: running;
}
@keyframes errorWarningMove {
  0% {
    opacity: 1;
  }
  25% {
    opacity: 0.7;
  }
  50% {
    opacity: 0.35;
  }
  75% {
    opacity: 0.7;
  }
  100% {
    opacity: 1;
  }
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
.loop-div > p {
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
  width: 13px;
  height: 13px;
  border-radius: 10px;
}
.connect-point.in:hover,
.connect-point.out:hover {
  border: 2px solid #ff0000 !important;
  cursor: default;
}
.connect-point.loop:hover {
  border: 2px solid rgb(113, 255, 255) !important;
  cursor: default;
}
.loop-div:hover .connect-point.in {
  border: 2px solid blue;
  cursor: default;
}
.loop-div:hover .connect-point.out {
  border: 2px solid rgb(251, 255, 0);
  cursor: default;
}
.connect-point.in {
  transform: translate(-50%, -50%);
}
.connect-point.out {
  transform: translate(50%, -50%);
}
.connect-point.loop {
  right: 0;
  top: 25%;
  transform: translate(50%);
  border-radius: 20px;
  width: 20px;
  height: 20px;
  border: 1px solid rgb(113, 255, 255);
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
  opacity: 0.75;
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