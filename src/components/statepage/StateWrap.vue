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
      @updateTempLineData="updateTempLineData"
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
      @updateTempLineData="updateTempLineData"
      @updateActiveState="updateActiveState"
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
      @updateStateData="updateStateData"
      @updateTempLineData="updateTempLineData"
      @updateActiveState="updateActiveState"
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
      @mousedown.stop="onResizeIconMousedown"
      @mouseup.stop="onResizeIconMouseup"
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

const IS_MOVING = 1;
const IS_CONNECTING = 2;
// const IS_CREATING_STATE = 3; //通过拖拽新建1个状态
const isNumber = (str) => {
  return typeof str === "number";
};
export default {
  name: "StateWrap",
  props: [
    "stateData",
    "index",
    "threadIndex",
    "runningStateData",
    "activeStates",
  ],
  components: {
    LoopDiv,
    StateDiv,
  },
  data() {
    return {
      zIndex: 1,
      colors: ["#A30014", "#52D3F0", "#BFBF00", "#70B603", "#00BFBF"],
      draggable: true,
      showInput: false,
      isDragging: false,
      operate: null, // IS_MOVING    IS_CONNECTING
      stateId: null,
      showInputAry: false,
      showOutputAry: false,
      resizableImg: "../../../static/imgs/resizable.png",
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
    /* generateStatePos(stateData){
            return (isNumber(stateData.x) && isNumber(stateData.y)) ? `transform: translate(${stateData.x}px, ${stateData.y}px)` : 'transform: translate(0, 0)';
        }, */
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
      this._isResizing = false;
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
      this.$emit("updateTempLineData", data);

      window.stateManage.startPoint = {
        x: boundingRect.left - curSvgRect.left + boundingRect.width / 2,
        y: boundingRect.top - curSvgRect.top + boundingRect.height / 2,
      };
    },
    onMouseup() {
      stateManage.isConnecting = false;
    },
    onDrag(e) {
      if (this._isResizing) {
        return false;
      }
      // 鼠标按下的位置
      this._endInfo = {
        x: e.x,
        y: e.pageY,
      };
      //console.log(this._endInfo)

      this.judgeBoundary(e.target);
      this.updatePosition(e.target);
    },

    dragStart(e) {
      //console.log("--dragStart")
      if (this._isResizing) {
        return false;
      }
      /*  if(e.target){
                let childReg = /child/;
                let resizeIconReg = /resize\-icon/;
                    debugger;
                if(resizeIconReg.test(e.target.getAttribute('class'))){
                    return false;
                }
            } */
      if (this.operate === IS_CONNECTING) {
        e.preventDefault();
        return false;
      }
      e.dataTransfer.effectAllowed = "copyMove";

      this.isDragging = true;
      // this._startInfo = e.target.getBoundingClientRect();
      // 鼠标点击位置
      this._startInfo = {
        x: e.x,
        y: e.pageY,
      };

      this._mousedownPoint = {
        x: this.$el.getBoundingClientRect().left,
        y: this.$el.getBoundingClientRect().top,
      };

      this._startInfo.transform = this.getStyleTransform(e.target);

      console.log("---dragStart---", this._startInfo);
      e.dataTransfer.setData(
        "theDragStateData",
        JSON.stringify(this.stateData)
      );
      e.dataTransfer.setData("startInfo", JSON.stringify(this._startInfo));
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
      EventObj.$emit("saveDragData", {
        mousedownPoint: {
          x: this._mousedownPoint.x,
          y: this._mousedownPoint.y,
        },
        indexAry: indexAry,
      });

      this.zIndex = 0;
    },
    dragEnd(e) {
      if (this._isResizing) {
        this._isResizing = false;
        return false;
      }
      this.isDragging = false;
      // this._endInfo = e.target.getBoundingClientRect();
      this._endInfo = {
        x: e.x,
        y: e.pageY,
      };
      this.updatePosition(e.target);
      this._startInfo = null; //每次开始拖拽时都会重新设置这个_startInfo

      this.zIndex = 1;
    },
    onDragenter(e) {},
    getStateIndex(state) {
      let indexAry = [];
      let parent = state.$parent;
      while (parent && parent.$options.name !== "StatePage") {
        if (parent.$options.name === "ThreadSvg") {
          indexAry.push(parent.threadIndex);
        } else {
          indexAry.push(parent.index);
        }
        parent = parent.$parent;
      }
      indexAry.push(state.index);
      return indexAry;
    },
    onDrop(e) {
      //获取从工具栏中直接拖拽下来的状态块的index，需要在stateAry添加了被拖拽的状态块的信息后获取
      let dropStateIndex;
      let stateAry = store.stateData.threadAry[this.threadIndex].stateAry
      let theDragStateData = this.dragInType(e, stateAry)
      let traverseData = Tools.stateTraverse(
          stateAry,
          theDragStateData.stateId,
          true
      );
        //直接将state添加进被嵌套的状态中会使程序不可控，还是需要先将state添加进stateAry的最外层，再删除外层元素
        dropStateIndex = traverseData[1];
        theDragStateData = traverseData[0];
       
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
      //如果鼠标松开时当前拖拽对象仍然在其父组件内部，则说明只是移动状态
      let isTargetInParent = (el, e) => {
        let inFlag = true;
        let info = el.getBoundingClientRect();
        if (
          e.pageX < info.x ||
          e.pageX > info.x + info.width ||
          e.pageY < info.y ||
          e.pageY > info.y + info.height
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
          e.stopPropagation();
        }
        if (!TargetInFlag && this.stateData.children.length <= 1) {
          this.nestToNormal(this.stateData)
        }
        return false;
      }

      let TargetInFlag = isTargetInParent(this.$el, e);
      if (!TargetInFlag) {
        return;
      }

      // 无论是从外层拖拽状态到循环组件内还是循环组件内的状态块移动，都应该将放开时的位置和当前循环块的位置做一次计算，得到目标位置
      let x = e.pageX - this.$el.getBoundingClientRect().left;
      let y = e.pageY - this.$el.getBoundingClientRect().top;

      theDragStateData.x = x;
      theDragStateData.y = y;
      //theDragStateData.x = 0 /* - statePageVue._dragData.mousedownPoint.x */;
      //theDragStateData.y = 0 /*  - statePageVue._dragData.mousedownPoint.y */;
      this.calculateStateParent(this.index, theDragStateData)

      //若状态从非嵌套变为嵌套状态，改变状态的模式与大小
      if (
        this.stateData.stateType === "stateDiv" &&
        this.stateData.mode !== "nest"
      ) {
        this.normalToNest(this.stateData)
      }

      this.stateData.children.push(theDragStateData);

      let dragTargetParentStates = stateAry;
      //因为在从工具栏直接拖拽下来形成嵌套时，无法在线程框内获取拖拽下来的状态块，只能通过与拖拽下来的状态块嵌套的状态来判断被拖拽下来的状态块的index
      let directDropIndexAry = this.getDirectDropIndexAry(this, dropStateIndex);

      if (e.dataTransfer.getData("operate") === "addState") {
        dragTargetParentStates = this.dropTraverseChildren(
          directDropIndexAry,
          dragTargetParentStates
        );
      } else {
        dragTargetParentStates = this.dropTraverseChildren(
          statePageVue._dragData.indexAry,
          dragTargetParentStates
        );
      }

      if (e.dataTransfer.getData("operate") === "addState") {
        setTimeout(() => {
          //因为从工具栏直接拖拽下来的状态块时默认添加到线程框的最外面一层的，所以需要在最外面一层进行删除
          stateAry.splice(directDropIndexAry.pop(), 1);
        }, 10);
      } else {
        setTimeout(() => {
          //这里必须等drog逻辑执行完以后再去删除外层元素，否则会影响到theDragStateData数据 TODO  后面开始编码后再解决这个问题，使用setTimeout会让程序不可控！！！
          dragTargetParentStates.splice(
            statePageVue._dragData.indexAry.pop(),
            1
          );
        }, 10);
      }
      e.stopPropagation();
    },
    //更新状态的parent属性
    calculateStateParent(parentIndex, theDragStateData){
      theDragStateData.parent = parentIndex
      // 当拖动的组件为循环组件时，动态更新循环组件内children的parent
      if (theDragStateData.children) {
        let i = 0;
        while (i < theDragStateData.children.length) {
          theDragStateData.children[i].parent = this.stateData.children.length;
          i++;
        }
      }
    },
    normalToNest(stateData){
      stateData.mode = "nest";
      stateData.width = "222px";
      stateData.height = "120px";
    },
    nestToNormal(stateData){
      stateData.mode = "normal";
      stateData.width = "76px";
      stateData.height = "40px";
    },
    //判断状态是从工具栏拖拽下来的还是在线程框内的移动
    dragInType(e, stateAry){
      let theDragStateData;
      if (e.dataTransfer.getData("operate") === "addState") {
        let threadPosInfo = e.target.getBoundingClientRect();
        let data = {
          index: this.threadIndex,
          x: e.x - threadPosInfo.x,
          y: e.y - threadPosInfo.y,
          stateType: e.dataTransfer.getData("stateType"),
        };

        theDragStateData = store.getDefaultStateCfg(data);
        stateAry.push(theDragStateData);
        e.stopPropagation();
      } else {
        theDragStateData = JSON.parse(
          e.dataTransfer.getData("theDragStateData")
        );
      }
      return theDragStateData
    },
    //用于判断在drop时将被drop的状态块添加为哪个状态块的children
    dropTraverseChildren(indexAry, parentStateAry) {
      indexAry.pop(); //除去线程索引
      while (indexAry && indexAry.length > 1) {
        let i = indexAry.pop();
        parentStateAry = parentStateAry[i].children;
      }
      return parentStateAry;
    },

    //用于获取从工具栏中直接拖拽下来的状态块的indexAry
    getDirectDropIndexAry(dropTarget, dropStateIndex) {
      let directDropIndexAry = this.getStateIndex(dropTarget);
      //除去与被拖拽下来的状态块的状态块本身的index，并将添加下来的状态块的index推进directDropIndexAry
      directDropIndexAry.pop();
      directDropIndexAry.push(dropStateIndex);
      //为寻找对应的形成嵌套的状态块以及删除多余的被拖拽下来的状态块的快照，需要将形成的directDropIndexAry进行reverse
      directDropIndexAry.reverse();
      return directDropIndexAry;
    },
    //用于判断在drop时将被drop的状态块添加为哪个状态块的children
    dropTraverseChildren(indexAry, parentStateAry) {
      indexAry.pop(); //除去线程索引
      while (indexAry && indexAry.length > 1) {
        let i = indexAry.pop();
        parentStateAry = parentStateAry[i].children;
        console.log(parentStateAry);
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
        store.resizeThread(needResizeInfo);
      }
      // this.$emit('resizeSvg', needResizeInfo);
    },
    updatePosition(dom) {
      // 获取当前线程框的绝对位置
      let threadPos = document
        .getElementsByClassName("thread")
        [this.threadIndex].getBoundingClientRect();
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
        stateId: this.stateData.stateId,
        // 相对于当前线程框的绝对位置
        absolutePosition: {
          x: dom.getBoundingClientRect().left - threadPos.left,
          y: dom.getBoundingClientRect().top - threadPos.top,
        },
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
      });
    },
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
        this.$parent.$parent.threadAry[this.threadIndex].lineAry.find(
          (item) => {
            return item.lineId === lineId;
          }
        ) || {};
      return line.desc;
    },
    activeLine(lineId) {
      let line =
        this.$parent.$parent.threadAry[this.threadIndex].lineAry.find(
          (item) => {
            return item.lineId === lineId;
          }
        ) || {};

      line.active = true;
    },
    disActiveLine(lineId) {
      let line =
        this.$parent.$parent.threadAry[this.threadIndex].lineAry.find(
          (item) => {
            return item.lineId === lineId;
          }
        ) || {};

      line.active = false;
    },
    updateTempLineData(data) {
      this.$emit("updateTempLineData", data);
    },
    updateActiveState(selectedData) {
      this.$emit("updateActiveState", selectedData);
    },
    updateStateData(data) {
      this.$emit("updateStateData", {
        data: data,
        index: this.index, //cIndex: 子状态的索引
        stateId: data.stateId,
      });
    },
    onResizeIconMousedown(e) {
      this.draggable = false;
      this._isResizing = true;
      //TODO:连线需要随着状态块放大缩小而更新
      let resizingStateId = e.target.parentElement.getAttribute("stateid");
      this.$emit("updateMoveData", {
        operate: "resize-state",
        stateIndex: this.index,
        startPoint: {
          x: e.pageX,
          y: e.pageY,
        },
        originW: this.$el.offsetWidth,
        originH: this.$el.offsetHeight,
      });
    },
    onResizeIconMouseup(e) {
      this.draggable = true;
      this._isResizing = false;
      this.$emit("stopMoving");
      // this._lastHeight = this.thread.height;
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

<style lang="less" scoped>
.state-wrap {
  position: absolute;
  top: 0;
  left: 0;
  display: inline-block;
  &.is-auto-layouting{
    transition: all 1s;
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
.state-wrap:hover .connect-point {
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