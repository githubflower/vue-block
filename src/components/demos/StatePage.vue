<template>
  <div class="main" @mousemove="onMouseMove">
    <div class="toolbox">
      <el-button type="primary" plain @click="addThread">线程</el-button>
      <!-- dragStart事件只能绑定在html5元素上，绑定el组件无效，所以这里用span包裹一层  -->
      <span draggable="true" @drag="drag" @dragstart="dragStart" @dragend="dragEnd">
        <el-button type="primary" plain>状态</el-button>
      </span>
      <el-button type="primary" plain @click="save">保存</el-button>
      <el-button type="primary" plain @click="loadFromLocal" title="加载localstorage中的数据">加载</el-button>
    </div>
    <div class="content"
        @click="hideLineContextMenu()"
    >
      <line-context-menu
        ref="lineContextMenu"
        v-show="lineContextMenuData.show"
        :mustShowMenu="lineContextMenuData.show"
        :lineId="lineContextMenuData.lineId"
        :lineData="lineContextMenuData.lineData"
        :threadIndex="lineContextMenuData.threadIndex"
        :style="{left: lineContextMenuData.position.x + 'px', top: lineContextMenuData.position.y + 'px'}"
        @selectItem="onSelect"
      ></line-context-menu>
      <thread-svg v-for="(thread, i) in threadAry" :key="i" :thread="thread" :threadIndex="i"></thread-svg>
    </div>
  </div>
</template>

<script>
// import MyPlainDraggable from 'plain-draggable'
// import MyPlainDraggable from 'plain-draggable/plain-draggable.esm.js'
import ThreadSvg from "./ThreadSvg";
import StateDiv from "./StateDiv";
import LineContextMenu from "./LineContextMenu";
export default {
  name: "StatePage",
  components: {
    ThreadSvg,
    StateDiv,
    LineContextMenu
  },
  data() {
    return {
      showTempLine: false,
      tempLineData: null,
      operate: "default",
      threadAry: [
        {
          name: "线程名称1",
          width: 1000,
          height: 300,
          stateAry: [
            {
              stateId: "custom-state-id",
              name: "流水线视觉定位",
              inputAry: [],
              outputAry: [],
              x: 5,
              y: 0
            },
            {
              name: "取料",
              inputAry: [],
              outputAry: [],
              x: 190,
              y: 0
            },
            {
              name: "状态名称很长的时候会显示省略号鼠标放上去显示详细描述",
              inputAry: [],
              outputAry: [],
              x: 500,
              y: 350
            }
          ],
          lineAry: [
            /* {
                        lineId: 'custom-line-id',
                        d: 'M 240.5 174.5 h 50 v 106 L 394 280 m 0 0 z',
                        startPoint: {
                            x: 0,
                            y: 0
                        },
                        endPoint: {
                            x: 0,
                            y: 0
                        },
                        startState: {
                            stateId: '',
                            stateIndex: 0
                        },
                        endState: {
                            stateId: '',
                            stateIndex: 1
                        }
                    } */
          ]
        },
        {
          name: "线程名称2",
          width: 1000,
          height: 500,
          stateAry: [
            {
              name: "流水线视觉定位",
              inputAry: [],
              outputAry: [],
              x: 100,
              y: 50
            },
            {
              name: "取料",
              inputAry: [],
              outputAry: [],
              x: 300,
              y: 50
            },
            {
              name: "状态名称很长的时候会显示省略号鼠标放上去显示详细描述",
              inputAry: [],
              outputAry: [],
              x: 500,
              y: 450
            }
          ],
          lineAry: []
        }
      ],
      
      lineContextMenuData: {
        show: false,
        lineId: null,
        lineData: null,
        threadIndex: null,
        position: {
          x: 0,
          y: 0
        }
      }
    };
  },
  methods: {
    addThread() {
      console.log("---add thread---");
      this.threadAry.push({
        name: "线程名称" + (this.threadAry.length + 1),
        width: 1000,
        height: 300,
        stateAry: [
          {
            name: "开始",
            inCount: 0,
            outCount: 0,
            x: 50,
            y: 50
          },
          {
            name: "结束",
            inCount: 0,
            outCount: 0,
            x: 350,
            y: 50
          }
        ]
      });
    },
    addState(data) {
      this.threadAry[data.index].stateAry.push({
        name: "状态描述",
        inputAry: [],
        outputAry: [],
        x: data.x,
        y: data.y
      });
    },
    /* generateDefaultPos(index){
            const gap = 35;
            return `translate(50, ${(300 + gap) * (index - 1)})`;
        },
        generateStatePos(index){
            const gapX = 60;
            return `translate(${(90 + gapX) * (index - 1)}, 40)`;
        }, */
    resizeSvg(resizeInfo) {
      if (resizeInfo.dh) {
        this.threadAry[resizeInfo.threadIndex].height += resizeInfo.dh;
      }
      if (resizeInfo.dw) {
        this.threadAry[resizeInfo.threadIndex].width += resizeInfo.dw;
      }
    },
    drag() {},
    dragStart(e) {
      // e.dataTransfer.items.push('aaa');
      // e.dataTransfer.items.add('aaa');
      e.dataTransfer.setData("operate", "addState");
    },
    dragEnd() {
      console.log("dragend");
    },
    onMouseMove(e) {
      if (this.operate === "resize-thread") {
        // default, resize-thread,
        let dx = e.pageX - this.operateData.startPosition.x,
          dy = e.pageY - this.operateData.startPosition.y,
          minH = this.getMinHeightOfThread(this.operateData.index);
        this.threadAry[this.operateData.index].width =
          this.operateData.originW + dx;
        this.threadAry[this.operateData.index].height = Math.max(
          minH,
          this.operateData.originH + dy
        );
      }
    },
    operateChange(data) {
      this.operateData = data;
      this.operate = data.operate;
    },
    getMinHeightOfThread(index) {
      let maxY = 0,
        threadDivBorderWidth = 1,
        stateDivBorderWidth = 1,
        stateDivHeight = 50; // 50是状态的高度
      this.threadAry[index].stateAry.forEach(state => {
        // TODO  这里还需要根据状态是子状态还是父状态作判断，后续实现状态块时修改
        // maxY = Math.max(state.y + this.titleHeight + stateDivHeight + 2 * threadDivBorderWidth + 2 * stateDivBorderWidth, maxY);
        maxY = Math.max(
          state.y +
            35 +
            stateDivHeight +
            2 * threadDivBorderWidth +
            2 * stateDivBorderWidth,
          maxY
        );
      });
      return maxY;
    },
    /**
     * 将图面数据保存到localstorage
     */
    save() {
      window.localStorage.setItem("stateData", JSON.stringify(this.threadAry));
      console.log("save success!");
    },
    loadFromLocal() {
      let data = window.localStorage.getItem("stateData");
      this.threadAry = JSON.parse(data);
      if (data) {
        console.log("load success!");
      }
    },
    addLine2svg(data) {
      //新增连线
      this.threadAry[data.threadIndex].lineAry.push(data.lineData);
      //将连线数据添加到首尾2个状态块
      this.addLine2startState(data);
      this.addLine2endState(data);
    },
    addLine2startState(data) {
      if (data.lineData.startState) {
        let outputAry = this.threadAry[data.threadIndex].stateAry[
          data.lineData.startState.stateIndex
        ].outputAry;
        if (!outputAry) {
          outputAry = [];
          this.threadAry[data.threadIndex].stateAry[
            data.lineData.startState.stateIndex
          ].outputAry = outputAry;
        }
        outputAry.push({
          lineId: data.lineData.lineId //这里只存放连线的lineId，对连线的具体数据只保存一份，放在thread.lineAry里面，避免维护多份数据
        });
      }
    },
    addLine2endState(data) {
      if (
        data.lineData.endState &&
        data.lineData.endState.stateIndex !== null
      ) {
        let inputAry = this.threadAry[data.threadIndex].stateAry[
          data.lineData.endState.stateIndex
        ].inputAry;
        if (!inputAry) {
          inputAry = [];
          this.threadAry[data.threadIndex].stateAry[
            data.lineData.endState.stateIndex
          ].inputAry = inputAry;
        }
        inputAry.push({
          lineId: data.lineData.lineId
        });
      }
    },
    // 用于绘制连线的临时数据
    updateTempLineData(data) {
      /* {
                threadIndex: this.threadIndex,
                stateIndex: this.index,
                startState: {
                    stateId: this.stateId
                },
                startPoint: {
                    x: boundingRect.left - curSvgRect.left + boundingRect.width / 2,
                    y: boundingRect.top - curSvgRect.top + boundingRect.height / 2
                }
            }; */
      this.tempLineData = data;
    },
    /**
     * 在连线上右键，然后在弹出的菜单中选择某一项操作
     */
    onSelect(data) {
      switch (data.type) {
        case "editDesc":
          break;
        case "delete":
          break;
        default:
        // pass through
      }
    },
    updateContextMenu(data) {
      this.lineContextMenuData.show = true;
      this.lineContextMenuData.position.x = data.position.x;
      this.lineContextMenuData.position.y = data.position.y;
      this.lineContextMenuData.lineId = data.lineId;
      this.lineContextMenuData.lineData = data.lineData;
      this.lineContextMenuData.threadIndex = data.threadIndex;
    },
    hideLineContextMenu(){
        // this.lineContextMenuData.show = false;
    },
    updateLineData(data){
        let line = this.threadAry[data.threadIndex].lineAry.find(lineItem => {
            return lineItem.lineId === data.lineId;
        });
        line.desc = data.desc;
        this.lineContextMenuData.show = false;
    }
  },
  computed: {
    sumHeight: function(i) {
      return 0;
    }
  },

  created() {
    // this.loadFromLocal();
    EventObj.$on("resizeSvg", this.resizeSvg, this);
    EventObj.$on("addState", this.addState, this);
    EventObj.$on("operateChange", this.operateChange, this);
    EventObj.$on("addLine2svg", this.addLine2svg, this);
    EventObj.$on("updateTempLineData", this.updateTempLineData, this);
    EventObj.$on("updateLineData", this.updateLineData, this);
    EventObj.$on("updateContextMenu", this.updateContextMenu, this);
  },
  mounted() {
    window.statePageVue = this;
  }
};
</script>

<style scope>
html {
  background-color: #001f3a;
}
.main {
  margin-top: 61px; /*Header的高度*/
}

h4.title {
  margin: 0;
  width: 100%;
  height: 35px;
  color: #ffffff;
  background-color: rgba(0, 219, 255, 0.42);
}
.thread-body {
  /* height: calc(100% -35px); */
  height: 265px;
}

.toolbox {
  position: fixed;
  width: 100%;
  background-color: #ffffff;
  padding: 10px;
  border: 1px solid #ebebeb;
  border-radius: 3px;
  z-index: 1;
}
.content {
  padding-top: 54px;
}
.content > svg {
  /* width: 100%;  */
  /* height: calc(100%); */
  border: 1px solid rgba(0, 219, 255, 0.42);
  background-color: #001f3a;
}

text {
  fill: #ffffff;
}

.state {
  stroke: #aaaaaa;
  stroke-width: 1;
  fill: #00dbff;
}
.templine {
  stroke: rgba(0, 219, 255, 0.42);
  stroke-width: 1px;
}
.templine:hover {
  stroke: yellow;
}
</style>    