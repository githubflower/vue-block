<template>
  <!-- :stateId="stateData.stateId ? stateData.stateId : genId()"  -->
  <!-- :style="{transform: generateStatePos(stateData), width: getWidth(stateData), height: getHeight(stateData), backgroundColor: colors[index % 5], zIndex: zIndex}" -->
  <div
    :stateId="stateData.stateId"
    :index="index"
    :class="['state-wrap', { 'is-dragging': isDragging }]"
    :style="{
      transform: generateStatePos(stateData),
      width: getWidth(stateData),
      height: getHeight(stateData),
      zIndex: zIndex,
    }"
    :draggable="draggable"
    :activeStates="activeStates"
    @mousedown="onStateMousedown"
    @mouseup="onStateMouseup"
    @drag.stop="onDrag"
    @dragleave="onDragLeave"
    @dragstart.stop="dragStart"
    @dragend.stop="dragEnd"
    @drop="onDrop"
    @dragover.prevent
    @dragenter="onDragenter"
    @contextmenu.prevent="contextmenu"
  >
    <loop-div
      v-if="stateData.stateType === 'loopDiv'"
      :stateData="stateData"
      :index="index"
      :threadIndex="threadIndex"
      :activeStates="activeStates"
      :showDeleteStateMenu="showDeleteStateMenu"
      :showLineContextMenu="showLineContextMenu"
      @updateTempLineData="updateTempLineData"
      @updateMoveData="updateMoveData"
      @updateActiveState="updateActiveState"
      @setParentDraggable="setParentDraggable"
      @stopMoving="stopMoving"
      @hideMenus="hideMenus"
    ></loop-div>

    <!-- @updateStateData="updateStateData" -->
    <state-div
      v-else
      :stateData="stateData"
      :runningStateData="runningStateData"
      :index="index"
      :threadIndex="threadIndex"
      :activeStates="activeStates"
      :runningStatus="runningStatus"
      :runningAnimation="runningAnimation"
      :showDeleteStateMenu="showDeleteStateMenu"
      :showLineContextMenu="showLineContextMenu"
      @updateTempLineData="updateTempLineData"
      @updateActiveState="updateActiveState"
      @updateMoveData="updateMoveData"
      @setParentDraggable="setParentDraggable"
      @stopMoving="stopMoving"
      @hideMenus="hideMenus"
    ></state-div>
    <!-- <div> -->
    <state-wrap
      class="child"
      v-for="(item, cIndex) in stateData.children"
      :key="cIndex"
      :stateData="item"
      :runningStateData="runningStateData"
      :runningStatus="runningStatus"
      :runningAnimation="runningAnimation"
      :index="cIndex"
      :threadIndex="threadIndex"
      :activeStates="activeStates"
      :showDeleteStateMenu="showDeleteStateMenu"
      :showLineContextMenu="showLineContextMenu"
      @updateStateData="updateStateData"
      @updateTempLineData="updateTempLineData"
      @updateActiveState="updateActiveState"
      @updateMoveData="updateMoveData"
      @setParentDraggable="setParentDraggable"
      @stopMoving="stopMoving"
      @hideMenus="hideMenus"
    ></state-wrap>
    <!-- </div> -->
    <!-- <component v-for="(item, cIndex) in stateData.children" :key="cIndex" :is="getCompType(item.stateType)" 
            :stateData="item"
            :index="cIndex"
            :threadIndex="threadIndex"
            @updateStateData="updateStateData"
            @updateTempLineData="updateTempLineData"
            style="position: absolute; top: 30px; left: 10px;"
        ></component> -->
    <i
      v-if="stateData.stateType === 'loopDiv' || stateData.mode === 'nest'"
      class="resize-icon resizable"
      :style="{
        backgroundImage: 'url(' + resizableImg + ')',
        backgroundRepeat: 'no-repeat',
      }"
      @mousedown="onResizeIconMousedown"
      @mouseup="onResizeIconMouseup"
    ></i>
  </div>
</template>

<script>
// import MyPlainDraggable from 'plain-draggable'
// import MyPlainDraggable from 'plain-draggable/plain-draggable.esm.js'
import LoopDiv from "./LoopDiv";
import StateDiv from "./StateDiv";
import StatePageVue from "./StatePage.vue";
import Tools from "@/Tools.js";
import Util from "./util.js";
import { lineCfg } from "./graphCfg.js";
const IS_MOVING = 1;
const IS_CONNECTING = 2;
const UNDO_REDO_LIMIT = lineCfg.undo_redo_limit;
// const IS_CREATING_STATE = 3; //通过拖拽新建1个状态
export default {
  name: "StateWrap",
  props: [
    "stateData",
    "index",
    "threadIndex",
    "runningStateData",
    "activeStates",
    "showDeleteStateMenu",
    "showLineContextMenu",
  ],
  components: {
    LoopDiv,
    StateDiv,
  },
  data() {
    return {
      zIndex: 1,
      //colors: ["#A30014", "#52D3F0", "#BFBF00", "#70B603", "#00BFBF"],
      draggable: true,
      isDragging: false,
      operate: null, // IS_MOVING    IS_CONNECTING
      stateId: null,
      resizableImg: "./static/imgs/resizable.png",
    };
  },
  methods: {
    StateRunningStatus() {
      if (this.stateData.stateId === this.runningStateData.stateId) {
        return this.runningStateData.runningStatus;
      }
      return "";
    },
    StateRunningAnimation() {
      if (this.stateData.stateId === this.runningStateData.stateId) {
        return this.runningStateData.runningStatus + "-animation";
      }
      return "";
    },
    getCompType(stateType) {
      return "StateWrap";
      // return stateType === 'loopDiv' ? 'LoopDiv' : 'StateDiv';
    },
    genId() {
      return window.genId("state");
    },
    /**
     * 将状态的位置信息转成像素字符串
     */
    getTransformNum(strOrNum) {
      var str;
      if (typeof strOrNum === "number") {
        str = strOrNum + "px";
      } else if (typeof strOrNum === "string") {
        let reg = /px/;
        if (!reg.test(strOrNum)) {
          str = strOrNum + "px";
        } else {
          str = strOrNum;
        }
      }
      return str;
    },
    generateStatePos(stateData) {
      return `translate(${this.getTransformNum(
        stateData.x
      )}, ${this.getTransformNum(stateData.y)})`;
    },
    getWidth(stateData) {
      return stateData.width
        ? stateData.width
        : stateData.stateType === "loopDiv"
        ? "192px"
        : "76px";
    },
    getHeight(stateData) {
      return stateData.height
        ? stateData.height
        : stateData.stateType === "loopDiv"
        ? "120px"
        : "40px";
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
    onStateMouseup() {
      // console.info(this.stateData.name + ' --- ' + this.stateData.stateId);
      //this._isResizing = false;
    },
    onDrag(e) {
      //TODO:拖动速度过快时会导致endInfo记录的坐标错误，被拖动的状态块会飞出线程框
      if (this._isResizing) {
        this.$emit("stopMoving");
        return false;
      }
      this._endInfo = {
        x: e.x,
        y: e.pageY,
      };
      this.judgeBoundary(e.target);
      this.updatePosition(e.target);
    },

    dragStart(e) {
      store.updateUndoData(this.threadIndex);
      let movingState = store.getState(
        this.threadIndex,
        this.stateData.stateId
      );
      if (this._isResizing) {
        return false;
      }
      if (this.operate === IS_CONNECTING) {
        e.preventDefault();
        return false;
      }
      e.dataTransfer.effectAllowed = "copyMove";

      let leftGap;
      let topGap;
      leftGap = e.pageX - Math.round(e.target.getBoundingClientRect().left);
      topGap = e.pageY - Math.round(e.target.getBoundingClientRect().top);
      this.isDragging = true;

      this._startInfo = {
        x: e.x,
        y: e.pageY,
      };

      this._mousedownPoint = {
        x: this.$el.getBoundingClientRect().left,
        y: this.$el.getBoundingClientRect().top,
      };

      this._startInfo.transform = {
        x: movingState.x,
        y: movingState.y,
      };

      e.dataTransfer.setData(
        "theDragStateData",
        JSON.stringify(this.stateData)
      );

      e.dataTransfer.setData("startInfo", JSON.stringify(this._startInfo));
      e.dataTransfer.setData("mousedowntoleft", leftGap);
      e.dataTransfer.setData("mousedowntotop", topGap);
      let indexAry = this.calculateDragDataIndex(this);
      EventObj.$emit("saveDragData", {
        mousedownPoint: {
          x: this._mousedownPoint.x,
          y: this._mousedownPoint.y,
        },
        indexAry: indexAry,
      });

      this.zIndex = 0;
    },
    /**
     * 由内到外获取当前状态的索引
     * @param {dragData}
     */
    calculateDragDataIndex(dragData) {
      let indexAry = [];
      indexAry.push(dragData.index);

      let parent = dragData.$parent;
      while (parent && parent.$options.name !== "StatePage") {
        if (parent.$options.name === "ThreadSvg") {
          indexAry.push(parent.threadIndex);
        } else {
          indexAry.push(parent.index);
        }
        parent = parent.$parent;
      }
      return indexAry;
    },
    dragEnd(e) {
      if (this._isResizing) {
        this._isResizing = false;
        return false;
      }
      this.isDragging = false;
      //console.log(this._endInfo)
      this._endInfo = {
        x: e.x,
        y: e.pageY,
      };

      this._startInfo = null; //每次开始拖拽时都会重新设置这个_startInfo
      this.zIndex = 1;
    },
    onDragenter(e) {},
    onDrop(e) {
      //获取从工具栏中直接拖拽下来的状态块的index，需要在stateAry添加了被拖拽的状态块的信息后获取
      let stateAry = store.stateData.threadAry[this.threadIndex].stateAry;
      let theDragStateData = this.dragInType(e, stateAry);
      let leftGap = parseInt(e.dataTransfer.getData("mousedowntoleft"), 10);
      let topGap = parseInt(e.dataTransfer.getData("mousedowntotop"), 10);
      //直接将state添加进被嵌套的状态中会使程序不可控，还是需要先将state添加进stateAry的最外层，再删除外层元素
      let dropStateIndex = stateAry.length - 1;

      if (this.stateData.stateId === theDragStateData.stateId) {
        return false;
      }

      //如果拖拽的块本身就是这个drop监听事件块的子节点则直接返回
      let isStateIdInChildren = (id, children) => {
        let flag = false;
        if (children && children.length) {
          children.forEach((item) => {
            if (item.stateId === id) {
              flag = true;
              return false;
            }
          });
        }
        return flag;
      };
      //如果鼠标松开时当前拖拽对象仍然在其父组件内部，则说明只是移动状态，判断时需减去垂直滚动条的滚动距离
      let isTargetInParent = (el, e) => {
        let inFlag = true;
        var osTop =
          document.documentElement.scrollTop || document.body.srcollTop;
        let info = el.getBoundingClientRect();
        if (
          e.pageX < info.x ||
          e.pageX > info.x + info.width ||
          e.pageY - osTop < info.y ||
          e.pageY - osTop > info.y + info.height
        ) {
          inFlag = false;
        }

        return inFlag;
      };

      let stateInChildrenFlag = isStateIdInChildren(
        theDragStateData.stateId,
        this.stateData.children
      );
      if (stateInChildrenFlag) {
        let TargetInFlag = isTargetInParent(this.$el, e);
        if (TargetInFlag) {
          //走到这里说明是将状态由里面移出到外面，需要冒泡到外层容器
          store.updatePresentData(this.threadIndex);
          e.stopPropagation();
        }
        //若没有嵌套在嵌套状态内的子状态，将嵌套状态变回为普通状态
        if (
          !TargetInFlag &&
          this.stateData.children.length <= 1 &&
          this.stateData.stateType !== "loopDiv"
        ) {
          this.nestToDefault(this.stateData);
        }
        return false;
      }

      let TargetInFlag = isTargetInParent(this.$el, e);
      if (!TargetInFlag) {
        return;
      }
      // 无论是从外层拖拽状态到循环组件内还是循环组件内的状态块移动，都应该将放开时的位置和当前循环块的位置做一次计算，得到目标位置
      let x, y;

      x = e.pageX - this.$el.getBoundingClientRect().left - leftGap;
      y = e.pageY - this.$el.getBoundingClientRect().top - topGap;
      theDragStateData.x = x;
      theDragStateData.y = y;

      this.stateData.children.push(theDragStateData);
      theDragStateData.parent = this.stateData.stateId;
      //this.setDragStateLineType(theDragStateData);
      //若状态从非嵌套变为嵌套状态，改变状态的模式与大小
      if (
        this.stateData.stateType === "stateDiv" &&
        this.stateData.mode !== "nest"
      ) {
        this.defaultToNest(this.stateData);
      }

      let dragStateParentStates = stateAry;
      //获取在直接拖拽形成嵌套时，正在拖拽的状态父状态的索引
      let directDropIndexAry = this.getdropParentIndexAry(this);
      if (e.dataTransfer.getData("operate") === "addState") {
        dragStateParentStates = this.getDropStateParent(
          directDropIndexAry,
          dragStateParentStates
        );
      } else {
        //去除线程索引
        statePageVue._dragData.indexAry.pop();
        dragStateParentStates = this.getDropStateParent(
          statePageVue._dragData.indexAry,
          dragStateParentStates
        );
      }

      if (e.dataTransfer.getData("operate") === "addState") {
        setTimeout(() => {
          //从工具栏直接拖拽下来的状态块默认添加到线程框的最外面一层，需要在最外面一层进行删除
          stateAry.splice(dropStateIndex, 1);
          store.updatePresentData(this.threadIndex);
        }, 10);
      } else {
        setTimeout(() => {
          //这里必须等dragEnd逻辑执行完以后再去删除外层元素，否则会影响到theDragStateData数据
          dragStateParentStates.splice(
            statePageVue._dragData.indexAry.pop(),
            1
          );
        }, 10);
      }
      store.focusCurrentThread(this.threadIndex);
      e.stopPropagation();
    },
    getStateParentCount(state) {
      let parentCount = 0;
      while (state.parent !== null) {
        parentCount += 1;
        state = store.getState(this.threadIndex, state.parent);
      }
      return parentCount;
    },
    getDragStateLineType(line, dragData) {
      let startState =
        line.startState.stateId === dragData.stateId
          ? dragData
          : store.getState(this.threadIndex, line.startState.stateId);
      let endState =
        line.endState.stateId === dragData.stateId
          ? dragData
          : store.getState(this.threadIndex, line.endState.stateId);
      let startStateParentCount = this.getStateParentCount(startState);
      let endStateParentCount = this.getStateParentCount(endState);
      if (startState.parent === endState.parent) {
        return "default";
      } else if (startStateParentCount > endStateParentCount) {
        return "loopOut";
      } else if (endStateParentCount > startStateParentCount) {
        return "loopIn";
      }
    },
    //对状态进行drop时设置状态的连线样式
    setDragStateLineType(dragData) {
      let lineAry = store.stateData.threadAry[0].lineAry;
      let stateInputAry = dragData.inputAry;
      let stateOutputAry = dragData.outputAry;
      stateInputAry.forEach((line) => {
        let lineObj = lineAry.find((item) => {
          return item.lineId === line.lineId;
        });
        lineObj.type = this.getDragStateLineType(lineObj, dragData);
      });
      stateOutputAry.forEach((line) => {
        let lineObj = lineAry.find((item) => {
          return item.lineId === line.lineId;
        });
        lineObj.type = this.getDragStateLineType(lineObj, dragData);
      });
      return;
    },
    defaultToNest(stateData) {
      stateData.mode = "nest";
      stateData.width = "222px";
      stateData.height = "120px";
    },
    nestToDefault(stateData) {
      stateData.mode = "default";
      stateData.width = "76px";
      stateData.height = "40px";
    },
    //判断状态是从工具栏拖拽下来的还是在线程框内的移动，并返回当前状态
    dragInType(e, stateAry) {
      let theDragStateData;
      if (e.dataTransfer.getData("operate") === "addState") {
        store.updateUndoData(this.threadIndex);
        let threadPosInfo = e.target.getBoundingClientRect();
        let data = {
          index: this.threadIndex,
          x: e.x - threadPosInfo.x,
          y: e.y - threadPosInfo.y,
          stateType: e.dataTransfer.getData("stateType"),
        };
        let stateDataToAdd = store.getDefaultStateCfg(data);
        stateAry.push(stateDataToAdd);
        theDragStateData = stateAry[stateAry.length - 1];
        store.focusCurrentThread(this.threadIndex);
        e.stopPropagation();
      } else {
        theDragStateData = JSON.parse(
          e.dataTransfer.getData("theDragStateData")
        );
      }
      return theDragStateData;
    },
    //获取当前拖拽状态的父状态在当前线程框内的索引
    getdropParentIndexAry(state) {
      let indexAry = [];
      let parent = state.$parent;
      while (parent && parent.$options.name !== "StatePage") {
        if (parent.$options.name !== "ThreadSvg") {
          indexAry.push(parent.index);
        }
        parent = parent.$parent;
      }
      return indexAry.reverse();
    },

    //用于判断在drop时将drop的状态块添加为哪个状态块的children
    getDropStateParent(indexAry, parentStateAry) {
      while (indexAry && indexAry.length > 1) {
        let i = indexAry.pop();
        parentStateAry = parentStateAry[i].children;
      }
      return parentStateAry;
    },

    onDragLeave(e) {
      //说明当前不是在进行状态的操作，此时不需要对此事件作出响应
      if (!this._startInfo) {
        return;
      }

      this._endInfo = {
        x: e.x,
        y: e.pageY,
      };

      this.judgeBoundary(e.target);
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
        store.resizeThread(needResizeInfo);
      }
      // this.$emit('resizeSvg', needResizeInfo);
    },
    updatePosition(dom) {
      let movingState = store.getState(
        this.threadIndex,
        this.stateData.stateId
      );
      let dx = this._endInfo.x - this._startInfo.x,
        dy = this._endInfo.y - this._startInfo.y,
        style = dom.getAttribute("style");
      (movingState.x = this._startInfo.transform.x + dx),
        (movingState.y = this._startInfo.transform.y + dy);

      //通知父容器更新transform数据 （数据驱动更新样式）
      this.$emit("updateStateData", {
        stateId: this.stateData.stateId,
      });
    },
    contextmenu(e) {
      let indexAry = [];
      indexAry.push(this.index);
      let parent = this.$parent;
      while (parent && parent.$options.name !== "StatePage") {
        if (parent.$options.name === "ThreadSvg") {
          indexAry.push(parent.threadIndex);
        } else {
          indexAry.push(parent.index);
        }
        parent = parent.$parent;
      }

      EventObj.$emit("deleteState", {
        mousedownPoint: {
          x: e.pageX,
          y: e.pageY,
        },
        indexAry: indexAry,
        stateId: e.currentTarget.getAttribute("stateid"),
      });
    },

    updateTempLineData(data) {
      this.$emit("updateTempLineData", data);
    },
    updateMoveData(data) {
      this.$emit("updateMoveData", data);
    },
    stopMoving() {
      this.$emit("stopMoving");
    },

    updateActiveState(selectedData) {
      this.$emit("updateActiveState", selectedData);
    },
    updateStateData(data) {
      this.$emit("updateStateData", {
        stateId: data.stateId,
      });
    },
    hideMenus() {
      this.$emit("hideMenus");
    },
    onResizeIconMousedown(e) {
      store.updateUndoData(this.threadIndex);
      let stateId = this.$el.getAttribute("stateid");
      this.draggable = false;
      this._isResizing = true;
      this.$emit("setParentDraggable", false);
      this.$emit("updateMoveData", {
        operate: "resize-state",
        stateId: stateId,
        startPoint: {
          x: e.pageX,
          y: e.pageY,
        },
      });
    },
    onResizeIconMouseup(e) {
      this.draggable = true;
      this._isResizing = false;
      this.$emit("setParentDraggable", true);
      this.$emit("stopMoving");
    },
    setParentDraggable(bool) {
      this.draggable = bool;
      this.$emit("setParentDraggable", bool);
    },
  },
  computed: {
    runningStatus: function () {
      return this.StateRunningStatus();
    },
    runningAnimation: function () {
      return this.StateRunningAnimation();
    },
  },
  created() {},
  // created(){
  //     this.stateId = this.stateData.stateId ? this.stateData.stateId : this.genId();
  // },
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

<style lang="less">
* {
  user-select: none;
}
.state-wrap {
  position: absolute;
  top: 0;
  left: 0;
  display: inline-block;
  &.is-auto-layouting {
    transition: all 0.3s;
  }
  /* background-color: rgba(50, 50, 50, 0.62); */
}

.state-wrap > p {
  display: -webkit-box;
  position: relative;
  top: 50%;
  transform: translateY(-50%);
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
</style>    