<template>
  <!-- <div class="thread" :style="{width: thread.width + 'px', height: thread.height + 'px' }" @drop.prevent="drop" @dragover.prevent @mouseup="endResize"  -->
  <div
    class="thread"
    :style="{ width: thread.width + 'px', height: computedH + 'px' }"
    @drop.prevent="drop"
    @dragover.prevent
    @mouseup="endResize"
    @mousemove="onMousemove"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      :id="thread.id"
      class="thread-svg"
    >
      <g>
        <foreignObject
          y="0"
          width="100%"
          height="100%"
          @mousemove="onConnecting"
          @mouseup="onMouseup"
        >
            <div class="operating" v-show="operationStatus == 'operating'" style="color: rgb(26,250,41);">
              <img src="/static/imgs/operating.png">运行中</div>
            <div class="pausing" v-show="operationStatus == 'pausing'" style="color: yellow;">
              <img src="/static/imgs/pausing.png">暂停</div>
            <div class="stopping" v-show="operationStatus == 'stopping'" style="color: red;">
              <img src="/static/imgs/stopping.png">停止</div>
            <div v-show=false></div>
            <h4 class="title" contenteditable=true :style="titleStyle">
              {{ thread.name }}
            </h4>

          <div class="thread-body">
            <state-wrap
              v-for="(stateItem, index) in thread.stateAry"
              :key="index"
              :stateData="stateItem"
              :index="index"
              :threadIndex="threadIndex"
              :runningStateData="runningStateData"
              @updateStateData="updateStateData"
              @updateTempLineData="updateTempLineData"
              @updateMoveData="updateMoveData"
              @stopMoving="stopMoving"
            />
          </div>
        </foreignObject>
      </g>
      <!--  <g v-show="showTempLine">
                <path d="" class="templine"></path>
      </g>-->
      <line-svg
        v-show="showTempLine"
        :lineClass="tempLineClass"
        :line="tempLineData"
      />
      <line-svg
        v-for="(line, index2) in thread.lineAry"
        :key="index2"
        :line="line"
        :threadIndex="threadIndex"
        
      />
      <path-animation
        v-if="isInCurrentThread(runningLineId)"
        :runningLineId="runningLineId">
      </path-animation>
    </svg>
    <!-- <i class="resize-icon" :style="{ backgroundImage: 'url(' + moveVerticalImg + ')'}"></i> -->
    <i
      class="resize-icon resizable"
      :style="{
        backgroundImage: 'url(' + resizableImg + ')',
        backgroundRepeat: 'no-repeat',
      }"
      @mousedown="startResize"
      @mouseup="endResize"
    ></i>
    <!-- <div v-if="showVirtualBox" class="virtual-box"></div> -->

  </div>
</template>

<script>
import StateWrap from "./StateWrap";
import LineSvg from "./LineSvg";
import PathAnimation from"./PathAnimation"
import { lineCfg } from "./graphCfg.js";
import Tools from "@/Tools.js";
const line_h = lineCfg.line_h;
const line_v = lineCfg.line_v;
const line_radius = lineCfg.line_radius;
const deepCopy = (obj) => {
  if (typeof obj !== "object") {
    return obj;
  }

  let type = Object.prototype.toString.apply(obj);
  let ret = type === "[object Array]" ? [] : {};

  if (type === "[object Array]") {
    ret = [];
    let i = 0;
    while (i < obj.length) {
      ret[i] = deepCopy(obj[i]);
      i++;
    }
  } else {
    ret = {};
    for (let k in obj) {
      if (obj.hasOwnProperty(k)) {
        ret[k] = deepCopy(obj[k]);
      }
    }
  }

  return ret;
};

export default {
  name: "ThreadSvg",
  props: ["thread", "threadIndex", "runningLineId", "runningStateData"],
  components: {
    StateWrap,
    LineSvg,
    PathAnimation
  },
  data() {
    return {
      // bgImg: '../../../../static/imgs/grid3-50x50.png',
      bgImg: "../../../static/imgs/tmp3.png",
      arrowImg: "../../../static/imgs/startActive.png",
      showVirtualBox: false,
      showTempLine: false,
      componentKey: 0,
      //线程的运行状态：只能为operating, pausing, stopping中的其中一个
      operationStatus:"",
      tempLineClass: "templine",
      tempLineData: {
        startState: null,
        endState: null,
        startPoint: {
          x: 0,
          y: 0,
        },
        endPoint: {
          x: 0,
          y: 0,
        },
        d: "",
        isActive: false,
      },
      threadCount: 1,
      titleHeight: 35,
      moveVerticalImg: "../../../static/imgs/move-vertical.png",
      resizableImg: "../../../static/imgs/resizable.png",
      moveData: {
        stateIndex: 0,
        startPoint: {
          x: 0,
          y: 0,
        },
        endPoint: {},
      }, //在线程框内鼠标移动相关的数据
    };
  },
  methods: {
    isInCurrentThread(lineId){
      let currentThread = store.stateData.threadAry[this.threadIndex].lineAry;
      for (let i=0; i<currentThread.length; i++){
        if (currentThread[i].lineId == lineId){
          return true
        }
      }
      return false
    },

    /**
     * 拖拽缩放部分
     */
    updateMoveData(data) {
      if (!this._isResizingState) {
        this._isResizingState = true;
      }
      Object.keys(data).forEach((key) => {
        this.moveData[key] = data[key];
      });
    },
    //停止对状态框的拖拽
    stopMoving() {
      this._isResizingState = false;
      this._testWidth = null;
      this._testHeight = null;
    },
    //监测线程框内的鼠标移动，设置状态的resize
    onMousemove(e) {
      if (!this._isResizingState) {
        return;
      }
      this.updateMoveData({
        endPoint: {
          x: e.pageX,
          y: e.pageY,
        },
      });
      let moveData = this.moveData;
      let threadData = store.stateData.threadAry[this.threadIndex];
      // threadData = this.thread;
      // this.$set(this.thread.stateAry[this.moveData.stateIndex], 'width', this.thread.stateAry[this.moveData.stateIndex].width + (moveData.endPoint.x - moveData.startPoint.x))
      function translatePX2Num(str) {
        if (/px/.test(str)) {
          str = str.replace("px", "");
        }
        return +str;
      }
      if (!this._testWidth) {
        this._testWidth = translatePX2Num(
          threadData.stateAry[this.moveData.stateIndex].width
        );
      }
      if (!this._testHeight) {
        this._testHeight = translatePX2Num(
          threadData.stateAry[this.moveData.stateIndex].height
        );
      }
      threadData.stateAry[this.moveData.stateIndex].width =
        this._testWidth + (moveData.endPoint.x - moveData.startPoint.x) + "px";
      threadData.stateAry[this.moveData.stateIndex].height =
        this._testHeight + (moveData.endPoint.y - moveData.startPoint.y) + "px";
    },
    titleStyle() {
      return `height: ${this.titleHeight}px;`;
    },
    /* generateDefaultPos(index) {
      const gap = 35;
      return `translate(50, ${(300 + gap) * (index - 1)})`;
    },
    generateStatePos(index) {
      const gapX = 60;
      return `translate(${(90 + gapX) * (index - 1)}, 40)`;
    }, */

    /*
     * 绘制临时连线
     */
    drawOnConnectingLine(startPoint, endPoint, lineRadius) {
      let tempRadius = lineRadius;
      // y坐标相等时绘制直线
      if (endPoint.y == startPoint.y && endPoint.x > startPoint.x) {
        this.updateTempLineData({
          endPoint: endPoint,
          d: `M ${startPoint.x} ${startPoint.y} L ${endPoint.x} ${endPoint.y}
          m -5 -5 L ${endPoint.x} ${endPoint.y} L ${endPoint.x - 5} ${endPoint.y + 5}`,
        });
      } 

      // 鼠标在连接点左侧时
      // 在这里不对被连接的状态块的宽度进行计算，等到连线完成之后再更新一次
      if ((endPoint.x - line_h - lineRadius < startPoint.x &&
          endPoint.y < startPoint.y)) {
        this.updateTempLineData({
          endPoint: endPoint,
          d: `M ${startPoint.x} ${startPoint.y} h ${line_h} 
          m 0 0 A ${lineRadius} ${lineRadius} 1 0 0 ${startPoint.x + line_h + lineRadius} ${startPoint.y - lineRadius}
          m 0 0 V ${endPoint.y - line_v + lineRadius - 20}
          m 0 0 A ${lineRadius} ${lineRadius} 0 0 0 ${startPoint.x + line_h} ${endPoint.y - line_v - 20}
          m 0 0 L ${endPoint.x - 20 + lineRadius} ${endPoint.y - line_v - 20}
          m 0 0 A ${lineRadius} ${lineRadius} 1 0 0 ${endPoint.x - 20} ${endPoint.y - line_v + lineRadius - 20}
          m 0 0 V ${endPoint.y - lineRadius}
          m 0 0 A ${lineRadius} ${lineRadius} 0 0 0 ${endPoint.x - 20 + lineRadius} ${endPoint.y}
          m 0 0 L ${endPoint.x} ${endPoint.y}
          m -5 -5 L ${endPoint.x} ${endPoint.y} L ${endPoint.x - 5} ${endPoint.y + 5}`,
        });
      }
      if (endPoint.x - line_h - lineRadius < startPoint.x &&
          endPoint.y > startPoint.y){
          this.updateTempLineData({
            endPoint: endPoint,
            d: `M ${startPoint.x} ${startPoint.y} h ${line_h}
            m 0 0 A ${lineRadius} ${lineRadius} 0 0 1 ${startPoint.x + line_h + lineRadius} ${startPoint.y + lineRadius}
            m 0 0 V ${endPoint.y + line_v - line_radius + 20}
            m 0 0 A ${lineRadius} ${lineRadius} 0 0 1 ${startPoint.x + line_h} ${endPoint.y + line_v + 20}
            m 0 0 L ${endPoint.x - 20 + line_radius} ${endPoint.y + line_v + 20}
            m 0 0 A ${lineRadius} ${lineRadius} 0 0 1 ${endPoint.x - 20} ${endPoint.y + line_v - lineRadius + 20}
            m 0 0 V ${endPoint.y + lineRadius}
            m 0 0 A ${lineRadius} ${lineRadius} 0 0 1 ${endPoint.x - 20 + lineRadius} ${endPoint.y}
            m 0 0 L ${endPoint.x} ${endPoint.y}
            m -5 -5 L ${endPoint.x} ${endPoint.y} L ${endPoint.x - 5} ${endPoint.y + 5}`
          }) 
          }

        // 当结束点的x, y坐标均大于起始点的时候 
        if (
          endPoint.x  > startPoint.x + line_h + lineRadius&&
          endPoint.y > startPoint.y
        ) {
          // 当结束点与起始点的y坐标差距小于两个拐角半径时，根据结束点和起始点的y坐标的差动态决定拐角半径
          if (endPoint.y - startPoint.y < 2 * tempRadius) {
            let doubleRadius = endPoint.y - startPoint.y;
            tempRadius = doubleRadius / 2;
            this.updateTempLineData({
              endPoint: endPoint,
              d: `M ${startPoint.x} ${startPoint.y} h ${line_h} 
              m 0 0 A ${tempRadius} ${tempRadius} 0 0 1 ${startPoint.x + line_h + tempRadius} ${startPoint.y + tempRadius}
              m 0 0 V ${endPoint.y - tempRadius}
              m 0 0 A ${tempRadius} ${tempRadius} 0 0 0 ${startPoint.x + line_h + 2 * tempRadius} ${endPoint.y}
              m 0 0 L ${endPoint.x} ${endPoint.y} 
              m -5 -5 L ${endPoint.x} ${endPoint.y} L ${endPoint.x - 5} ${endPoint.y + 5}`,
            });
          } else {
            this.updateTempLineData({
              endPoint: endPoint,
              d: `M ${startPoint.x} ${startPoint.y} h ${line_h} 
              m 0 0 A ${lineRadius} ${lineRadius} 0 0 1 ${startPoint.x + line_h + lineRadius} ${startPoint.y + lineRadius}
              m 0 0 V ${endPoint.y - lineRadius}
              m 0 0 A ${lineRadius} ${lineRadius} 0 0 0 ${startPoint.x + line_h + 2 * lineRadius} ${endPoint.y}
              m 0 0 L ${endPoint.x} ${endPoint.y}
              m -5 -5 L ${endPoint.x} ${endPoint.y} L ${endPoint.x - 5} ${endPoint.y + 5}`,
            });
          }
        }
        // 当结束点的x坐标大于起始点，y坐标小于起始点时
        if (
          endPoint.x > startPoint.x + line_h + lineRadius &&
          endPoint.y < startPoint.y
        ) {
          // 当结束点与起始点的y坐标差距小于两个拐角半径时，根据结束点和起始点的y坐标的差动态决定拐角半径
          if (startPoint.y - endPoint.y < 2 * tempRadius) {
            let doubleRadius = startPoint.y - endPoint.y;
            tempRadius = doubleRadius / 2;
            this.updateTempLineData({
              endPoint: endPoint,
              d: `M ${startPoint.x} ${startPoint.y} h ${line_h}
              m 0 0 A ${tempRadius} ${tempRadius} 0 0 0 ${startPoint.x + line_h + tempRadius} ${startPoint.y - tempRadius}
              m 0 0 V ${endPoint.y + tempRadius}
              m 0 0 A ${tempRadius} ${tempRadius} 0 0 1 ${startPoint.x + line_h + 2 * tempRadius} ${endPoint.y}
              m 0 0 L ${endPoint.x} ${endPoint.y} 
              m -5 -5 L ${endPoint.x} ${endPoint.y} L ${endPoint.x - 5} ${endPoint.y + 5}`,
            });
          } else {
            this.updateTempLineData({
              endPoint: endPoint,
              d: `M ${startPoint.x} ${startPoint.y} h ${line_h}
              m 0 0 A ${lineRadius} ${lineRadius} 0 0 0 ${startPoint.x + line_h + lineRadius} ${startPoint.y - lineRadius}
              m 0 0 V ${endPoint.y + lineRadius}
              m 0 0 A ${lineRadius} ${lineRadius} 0 0 1 ${startPoint.x + line_h + 2 * lineRadius} ${endPoint.y}
              m 0 0 L ${endPoint.x} ${endPoint.y} 
              m -5 -5 L ${endPoint.x} ${endPoint.y} L ${endPoint.x - 5} ${endPoint.y + 5}`,
            });
          }
        }
      
    },
    onConnecting(e) {
      if (stateManage.isConnecting) {
        //检测鼠标左键是否仍是按下状态    ===1 说明鼠标左键被按下后未松开
        if (e.buttons === 1) {
          //绘制临时的连接线
          stateManage.isConnecting = true;
          this.showTempLine = true;
          let endPoint = this.getEndPoint(e);
          this.drawOnConnectingLine(
            this.tempLineData.startPoint,
            endPoint,
            line_radius
          );
        } else {
          stateManage.isConnecting = false;
          this.showTempLine = false;
          return;
        }
      }
    },
    updateTempLineData(lineData) {
      Object.keys(lineData).forEach((key) => {
        this.tempLineData[key] = lineData[key];
      });
    },

    drawConnectLine(e) {
      //debugger;
      let endState = this.getEndState(e);
      let lineData = this.copy(this.tempLineData);
      lineData.endState = endState;
      lineData.lineId = window.genId("line");
      lineData.desc = "";
      store.addLine({
        threadIndex: this.threadIndex,
        lineData: lineData,
      });
    },

    copy(obj) {
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
    isDuplicateLine(line) {
      let dupFlag = false;
      let currentThread = store.stateData.threadAry[this.threadIndex]
      currentThread.lineAry.forEach((item) => {
        if (this.isSameLine(item, line)) {
          dupFlag = true;
          return false;
        }
      });
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
      //debugger;
      let stateId = null,
        clazz = ".state-wrap",
        stateIndex;
      // debugger;
      if (e.target.closest(clazz)) {
        stateId = e.target.closest(clazz).getAttribute("stateid");
        stateIndex = parseInt(
          e.target.closest(clazz).getAttribute("index"),
          10
        );
      }
      return {
        stateId: stateId,
        stateIndex: stateIndex,
      };
    },
    getEndPoint(e) {
      //debugger;
      let curSvg = e.target.closest("svg");
      let curSvgRect = curSvg.getBoundingClientRect();
      let target_class = e.target.getAttribute("class");
      let regIsConnectPoint = /connect-point/;
      let loopConnectPointReg = /loop-connect-point/;
      let point;
      if (regIsConnectPoint.test(target_class) || loopConnectPointReg.test(target_class)) {
        point = {
          x:
            e.target.getBoundingClientRect().left -
            curSvgRect.left -
            2 +
            e.target.getBoundingClientRect().width / 2, //e.target.offsetLeft + e.offsetX, // e.clientX,
          y:
            e.target.getBoundingClientRect().top -
            curSvgRect.top +
            e.target.getBoundingClientRect().height / 2, //e.target.offsetTop + e.offsetY // e.clientY
        };
      } else {
        point = {
          x: e.clientX - curSvgRect.left - 2, //e.target.offsetLeft + e.offsetX, // e.clientX,
          y: e.clientY - curSvgRect.top - 2, //e.target.offsetTop + e.offsetY // e.clientY
        };
      }
      return point;
    },
    onMouseup(e) {
      //debugger;
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
          if (existedLine) {
            return;
          } else {
            this.drawConnectLine(e);
          }
        }
        this.showTempLine = false;
        stateManage.isConnecting = false;
      }
    },

    /**
     * 
     * 需要考虑移动带有其余嵌套状态的循环状态时将连线一并移动
     * 
     */

    drop(e) {
      if (e.dataTransfer.getData("operate") === "addState") {
        let threadPosInfo = e.target.getBoundingClientRect();
        let leftGap = e.dataTransfer.getData("mousedowntoleft")
        let topGap = e.dataTransfer.getData("mousedowntotop")
        let data = {
          index: this.threadIndex,
          x: e.x - threadPosInfo.x - leftGap,
          y: e.y - threadPosInfo.y - topGap,
          stateType: e.dataTransfer.getData("stateType"),
        };
        store.addState(data);
      } else {
        let theDragStateData = JSON.parse(
          e.dataTransfer.getData("theDragStateData")
        );
        let isStateIdInThread = (id, thread) => {
          let flag = false;
          thread.stateAry.forEach((item) => {
            if (item.stateId === id) {
              flag = true;
              return false;
            }
          });
          return flag;
        };

        let stateInThreadFlag = isStateIdInThread(
          theDragStateData.stateId,
          this.thread
        );
        let findingIndex = (stateAry, DragStateId) =>{
          let stateIndex = 0;
          for(let i = 0; i < stateAry.length; i++){
            if (stateAry[i].stateId === DragStateId){
              stateIndex = i;
              break
            }
          }
          return stateIndex;
        };
        if (stateInThreadFlag) {
          // 进入这里说明是同一层级内部的拖动
          let copiedIndexAry = Tools.deepCopy(statePageVue._dragData.indexAry);
          let copiedThreadIndex = copiedIndexAry.pop();
          let parentIndex = null;
          theDragStateData.parent = parentIndex;
          // 当拖动的组件为循环组件时，动态更新循环组件内children的parent
          if(theDragStateData.children){
            let i = 0;
            while(i < theDragStateData.children.length){
              // 通过在stateAry里寻找父数据来确认parent，不可以直接用length
              theDragStateData.children[i].parent = findingIndex(statePageVue.threadAry[copiedThreadIndex].stateAry, theDragStateData.stateId);
              i++;
            }
        }
          //console.log("drop内移动阶段：", theDragStateData)
          return false;
        }
        //无论是从外层拖拽状态到循环组件内还是循环组件内的状态块移动，都应该将放开时的位置和当前循环块的位置做一次计算，得到目标位置
        let x = e.pageX - this.$el.getBoundingClientRect().left;
        let y = e.pageY - this.$el.getBoundingClientRect().top;
        theDragStateData.x = x /* - statePageVue._dragData.mousedownPoint.x */;
        theDragStateData.y = y /*  - statePageVue._dragData.mousedownPoint.y */;
        // 放开时重新计算状态的parent属性
        
        let copiedIndexAry = Tools.deepCopy(statePageVue._dragData.indexAry);
        let copiedThreadIndex = copiedIndexAry.pop();
        let parentIndex = null;
        theDragStateData.parent = parentIndex;
        // 当拖动的组件为循环组件时，动态更新循环组件内children的parent
        if(theDragStateData.children){
          
          let i = 0;
          while(i < theDragStateData.children.length){
            // 走到这里说明是从循环内部拖动到外部，因为增加了一个模块，直接用stateAry.length来做parent
            theDragStateData.children[i].parent = statePageVue.threadAry[copiedThreadIndex].stateAry.length;
            i++;
          }
        }
        //console.log("drop内嵌套阶段：", theDragStateData)
        let tI = statePageVue._dragData.indexAry.pop(); //线程索引
        statePageVue.threadAry[tI].stateAry.push(theDragStateData);

        let dragTargetParent = statePageVue.threadAry[tI].stateAry;
        while (
          statePageVue._dragData &&
          statePageVue._dragData.indexAry.length > 1
        ) {
          let i = statePageVue._dragData.indexAry.pop();
          dragTargetParent = dragTargetParent[i].children;
        }
        setTimeout(() => {
          dragTargetParent.splice(statePageVue._dragData.indexAry.pop(), 1);
        }, 10);
      }
    },
    // 需要修改成通过id寻找state
    updateStateData(stateData) {
      //debugger;
      let currentThread = store.stateData.threadAry[this.threadIndex]
      let result = []
      // 用于深度搜索stateId的方法，寻找到的state存储在result内
      function traverse(stateAry) {
        for (var i in stateAry){
            if (stateAry[i].stateId === stateData.stateId){
            result.push(stateAry[i]);
            return
            }
          traverse(stateAry[i].children);
        } 
      };
      traverse(currentThread.stateAry);
      let currentState = result[0]
      if (typeof stateData.data !== "undefined") {
        let update = (obj, data) => {
          //组件嵌套的情况，会将数据依次往上传递，传递的过程中会包一层data
          if (typeof data.data !== "undefined") {
            update(obj[data.index].children, data.data);
          } else {
            obj[data.index].x = data.transform.x;
            obj[data.index].y = data.transform.y;
          }
        };
        update(currentThread.stateAry, stateData);
        this.updateLines(stateData);
      } else {
        //currentThread.stateAry[stateData.index].x = stateData.transform.x;
        //currentThread.stateAry[stateData.index].y = stateData.transform.y;
        currentState.x = stateData.transform.x;
        currentState.y = stateData.transform.y;
        this.updateLines(stateData);
      }
    },
    /**
     * 更新某个状态块的所有输入连线和输出连线
     * 
     * 
     */
    updateLines(stateData) {
      //debugger;
      let currentThread = store.stateData.threadAry[this.threadIndex]
      let result = []
      // 用于深度搜索stateId的方法，寻找到的state存储在result内
      function traverse(stateAry) {
        for (var i in stateAry){
            if (stateAry[i].stateId === stateData.stateId){
            result.push(stateAry[i]);
            return
            }
          traverse(stateAry[i].children);
          }
      };
      traverse(currentThread.stateAry)
      let lineAry, curLine;

      // 判断传入的stateData是通过事件传入的还是递归传入的childrenData
      let state
      if(!stateData.stateId){
        state = stateData
      }
      else{
        state = result[0]
      }

      if (state.inputAry) {
        lineAry = currentThread.lineAry;
        state.inputAry.forEach((inputLine) => {
          // inputLine --> state中保存的lineId以及对这个触发事件的描述等信息，没有真正的用于画连线的数据
          curLine = lineAry.find((line) => {
            //line --> line的具体画连线的数据   inputLine与line通过lineId更新数据
            return line.lineId === inputLine.lineId;
          });
          this.updateLineData(curLine, stateData);
        });
      }

      if (state.outputAry) {
        lineAry = currentThread.lineAry;
        state.outputAry.forEach((outputLine) => {
          // inputLine --> state中保存的lineId以及对这个触发事件的描述等信息，没有真正的用于画连线的数据
          curLine = lineAry.find((line) => {
            //line --> line的具体画连线的数据   inputLine与line通过lineId更新数据
            return line.lineId === outputLine.lineId;
          });
          this.updateOutputLineData(curLine, stateData);
        });
      }

      // 在更新stateData的连线状态时递归更新stateData的children的连线状态。
      // 因为拖动父状态时嵌套在父状态内的子状态没有独立事件，所以使用childrenData来更新连线数据
      let copiedStateData = Tools.deepCopy(stateData)
      let copiedState = Tools.deepCopy(state)
      while(copiedStateData.data){
        copiedStateData = copiedStateData.data
      };
      
      while(state.children){
        for (var i in state.children){
          let copiedChildren = Tools.deepCopy(state.children[i]);
          let childrenData;
            //第一次计算嵌套组件的位置信息时调用if块
            if(copiedStateData.AbsolutePosition){
              childrenData = {
                children: copiedChildren.children,
                // 状态块的绝对位置
                statePos: {
                  x: copiedChildren.x + copiedStateData.AbsolutePosition.x,
                  y: copiedChildren.y + copiedStateData.AbsolutePosition.y,
                },
                parentStatePos: copiedStateData.AbsolutePosition,
                stateType: copiedChildren.stateType,
                inputAry: copiedChildren.inputAry,
                outputAry: copiedChildren.outputAry,
                width: copiedChildren.width,
                height: copiedChildren.height,
                inLoop: true
              }
            }
            //第二次以上计算嵌套组件的位置信息时调用else块
            else{
              childrenData = {
                children: copiedChildren.children,
                statePos: {
                  x: copiedChildren.x + copiedStateData.statePos.x,
                  y: copiedChildren.y + copiedStateData.statePos.y,
                },
                parentStatePos: copiedStateData.statePos,
                stateType: copiedChildren.stateType,
                inputAry: copiedChildren.inputAry,
                outputAry: copiedChildren.outputAry,
                width: copiedChildren.width,
                height: copiedChildren.height,
                inLoop: true
              }
            }
          //}
          this.updateLines(childrenData)
        }
        state = state.children
      }
    },

    /**
     * 当连线的结束点变化时，动态更新连线
     *
     * NOTE: 请勿改变下面绘制连线时的路径排版，否则用于计算动画路径的function会失效
     * TODO: 增加连线样式
     */
    drawUpdateLine(curLine, stateHeight, endPoint, lineRadius) {
      //debugger
      let tempRadius = lineRadius;
      let linepath;
      // y坐标相同，绘制直线
      if (endPoint.x > curLine.startPoint.x + line_h + lineRadius && endPoint.y == curLine.startPoint.y) {
        linepath = `M ${curLine.startPoint.x} ${curLine.startPoint.y} L ${endPoint.x} ${endPoint.y} 
        m -5 -5 L ${endPoint.x} ${endPoint.y} L ${endPoint.x - 5} ${endPoint.y + 5}`;
        curLine.endPoint = endPoint;
        curLine.d = linepath;
        return;
      }

      
      // 当结束点的x坐标小于起始点且y坐标相等时或小于起始点时
      if ((endPoint.x - line_h - lineRadius < curLine.startPoint.x &&
          endPoint.y < curLine.startPoint.y) || (endPoint.x < curLine.startPoint.x && endPoint.y == curLine.startPoint.y)){
            linepath = `M ${curLine.startPoint.x} ${curLine.startPoint.y} h ${line_h}
            m 0 0 A ${lineRadius} ${lineRadius} 1 0 0 ${curLine.startPoint.x + line_h + lineRadius} ${curLine.startPoint.y - lineRadius}
            m 0 0 V ${endPoint.y - line_v - stateHeight + lineRadius}
            m 0 0 A ${lineRadius} ${lineRadius} 0 0 0 ${curLine.startPoint.x + line_h} ${endPoint.y - line_v - stateHeight}
            m 0 0 L ${endPoint.x - 20 + lineRadius} ${endPoint.y - line_v - stateHeight}
            m 0 0 A ${lineRadius} ${lineRadius} 1 0 0 ${endPoint.x - 20} ${endPoint.y - line_v - stateHeight + lineRadius}
            m 0 0 V ${endPoint.y - lineRadius}
            m 0 0 A ${lineRadius} ${lineRadius} 0 0 0 ${endPoint.x - 20 + lineRadius} ${endPoint.y}
            m 0 0 L ${endPoint.x} ${endPoint.y}
            m -5 -5 L ${endPoint.x} ${endPoint.y} L ${endPoint.x - 5} ${endPoint.y + 5}`
            curLine.endPoint = endPoint;
            curLine.d = linepath;
            return;
          }
      // 当结束点的x坐标小于起始点时且y坐标大于起始点时
      if (endPoint.x - line_h - lineRadius < curLine.startPoint.x &&
          endPoint.y > curLine.startPoint.y){
            linepath = `M ${curLine.startPoint.x} ${curLine.startPoint.y} h ${line_h}
            m 0 0 A ${lineRadius} ${lineRadius} 0 0 1 ${curLine.startPoint.x + line_h + lineRadius} ${curLine.startPoint.y + lineRadius}
            m 0 0 V ${endPoint.y + line_v + stateHeight - line_radius}
            m 0 0 A ${lineRadius} ${lineRadius} 0 0 1 ${curLine.startPoint.x + line_h} ${endPoint.y + line_v + stateHeight}
            m 0 0 L ${endPoint.x - 20 + line_radius} ${endPoint.y + line_v + stateHeight}
            m 0 0 A ${lineRadius} ${lineRadius} 0 0 1 ${endPoint.x - 20} ${endPoint.y + line_v + stateHeight - lineRadius}
            m 0 0 V ${endPoint.y + lineRadius}
            m 0 0 A ${lineRadius} ${lineRadius} 0 0 1 ${endPoint.x - 20 + lineRadius} ${endPoint.y}
            m 0 0 L ${endPoint.x} ${endPoint.y}
            m -5 -5 L ${endPoint.x} ${endPoint.y} L ${endPoint.x - 5} ${endPoint.y + 5}`
            curLine.endPoint = endPoint;
            curLine.d = linepath
            return
          }
      // 当结束点的x, y坐标均大于起始点的时候

        if (
          endPoint.x > curLine.startPoint.x + line_h + lineRadius &&
          endPoint.y > curLine.startPoint.y
        ) {
          // 当结束点与起始点的y坐标差距小于两个拐角半径时，根据结束点和起始点的y坐标的差动态决定拐角半径
          if (endPoint.y - curLine.startPoint.y < 2 * tempRadius) {
            let doubleRadius = endPoint.y - curLine.startPoint.y;
            tempRadius = doubleRadius / 2;
            linepath = `M ${curLine.startPoint.x} ${curLine.startPoint.y } h ${line_h}
            m 0 0 A ${tempRadius} ${tempRadius} 0 0 1 ${curLine.startPoint.x + line_h + tempRadius} ${curLine.startPoint.y + tempRadius}
            m 0 0 v ${endPoint.y - curLine.startPoint.y - 2 * tempRadius} 
            m 0 0 A ${tempRadius} ${tempRadius} 0 0 0 ${curLine.startPoint.x + line_h + 2 * tempRadius} ${endPoint.y}
            m 0 0 L ${endPoint.x} ${endPoint.y} 
            m -5 -5 L ${endPoint.x} ${endPoint.y} L ${endPoint.x - 5} ${endPoint.y + 5}`;
            curLine.endPoint = endPoint;
            curLine.d = linepath;
            return;
          } else {
            linepath = `M ${curLine.startPoint.x} ${curLine.startPoint.y} h ${line_h}
            m 0 0 A ${lineRadius} ${lineRadius} 0 0 1 ${curLine.startPoint.x + line_h + lineRadius} ${curLine.startPoint.y + lineRadius}
            m 0 0 v ${endPoint.y - curLine.startPoint.y - 2 * lineRadius} 
            m 0 0 A ${lineRadius} ${lineRadius} 0 0 0 ${curLine.startPoint.x + line_h + 2 * lineRadius} ${endPoint.y}
            m 0 0 L ${endPoint.x} ${endPoint.y} 
            m -5 -5 L ${endPoint.x} ${endPoint.y} L ${endPoint.x - 5} ${endPoint.y + 5}`;
            curLine.endPoint = endPoint;
            curLine.d = linepath;
            return;
          }
        }
        //当结束点的x坐标大于起始点，y坐标小于起始点时
        if (
          endPoint.x > curLine.startPoint.x + line_h + lineRadius &&
          endPoint.y < curLine.startPoint.y
        ) {
          // 当结束点与起始点的y坐标差距小于两个拐角半径时，根据结束点和起始点的y坐标的差动态决定拐角半径
          if (curLine.startPoint.y - endPoint.y < 2 * tempRadius) {
            let doubleRadius = curLine.startPoint.y - endPoint.y;
            tempRadius = doubleRadius / 2;
            linepath = `M ${curLine.startPoint.x} ${curLine.startPoint.y} h ${line_h}
            m 0 0 A ${tempRadius} ${tempRadius} 0 0 0 ${curLine.startPoint.x + line_h + tempRadius} ${curLine.startPoint.y - tempRadius}
            m 0 0 v ${endPoint.y - curLine.startPoint.y + 2 * tempRadius}
            m 0 0 A ${tempRadius} ${tempRadius} 0 0 1 ${curLine.startPoint.x + line_h + 2 * tempRadius} ${endPoint.y}
            m 0 0 L ${endPoint.x} ${endPoint.y} 
            m -5 -5 L ${endPoint.x} ${endPoint.y} L ${endPoint.x - 5} ${endPoint.y + 5}`,
            curLine.endPoint = endPoint;
            curLine.d = linepath;
            return;
          } else {
            linepath = `M ${curLine.startPoint.x} ${curLine.startPoint.y} h ${line_h}
            m 0 0 A ${lineRadius} ${lineRadius} 0 0 0 ${curLine.startPoint.x + line_h + lineRadius} ${curLine.startPoint.y - lineRadius}
            m 0 0 v ${endPoint.y - curLine.startPoint.y + 2 * lineRadius}
            m 0 0 A ${lineRadius} ${lineRadius} 0 0 1 ${curLine.startPoint.x + line_h + 2 * lineRadius} ${endPoint.y}
            m 0 0 L ${endPoint.x} ${endPoint.y} 
            m -5 -5 L ${endPoint.x} ${endPoint.y} L ${endPoint.x - 5} ${endPoint.y + 5}`,
            curLine.endPoint = endPoint;
            curLine.d = linepath;
            return;
          }
        
      }
    },
    /**
     * 当连线的起始点发生变化时，动态更新连线
     * 
     * NOTE: 请勿改变下面绘制连线时的路径排版，否则用于计算动画路径的function会失效
     * 
     */
    drawUpdateOutputLine(startPoint, stateHeight, curLine, lineRadius) {
      //debugger
      let tempRadius = lineRadius;
      let linepath;
      // y坐标相同，绘制直线
      if (curLine.endPoint.x > startPoint.x + line_h + lineRadius && curLine.endPoint.y == startPoint.y) {
        linepath = `M ${startPoint.x} ${startPoint.y}v ${curLine.endPoint.y - startPoint.y} 
        m 0 0 L ${curLine.endPoint.x} ${curLine.endPoint.y} 
        m -5 -5 L ${curLine.endPoint.x} ${curLine.endPoint.y} L ${curLine.endPoint.x - 5} ${curLine.endPoint.y + 5}`;
        curLine.startPoint = startPoint;
        curLine.d = linepath;
        return;
      } 

      if ((curLine.endPoint.x - line_h - lineRadius < startPoint.x &&
          curLine.endPoint.y < startPoint.y) || (curLine.endPoint.x < startPoint.x && curLine.endPoint.y == startPoint.y)){
            linepath = `M ${startPoint.x} ${startPoint.y} h ${line_h}
            m 0 0 A ${lineRadius} ${lineRadius} 1 0 0 ${startPoint.x + line_h + lineRadius} ${startPoint.y - lineRadius}
            m 0 0 V ${curLine.endPoint.y - line_v - stateHeight + lineRadius}
            m 0 0 A ${lineRadius} ${lineRadius} 0 0 0 ${startPoint.x + line_h} ${curLine.endPoint.y - line_v - stateHeight}
            m 0 0 L ${curLine.endPoint.x - 20 + lineRadius} ${curLine.endPoint.y - line_v - stateHeight}
            m 0 0 A ${lineRadius} ${lineRadius} 1 0 0 ${curLine.endPoint.x - 20} ${curLine.endPoint.y - line_v - stateHeight + lineRadius}
            m 0 0 V ${curLine.endPoint.y - lineRadius}
            m 0 0 A ${lineRadius} ${lineRadius} 0 0 0 ${curLine.endPoint.x - 20 + lineRadius} ${curLine.endPoint.y}
            m 0 0 L ${curLine.endPoint.x} ${curLine.endPoint.y}
            m -5 -5 L ${curLine.endPoint.x} ${curLine.endPoint.y} L ${curLine.endPoint.x - 5} ${curLine.endPoint.y + 5}`
            curLine.startPoint = startPoint;
            curLine.d = linepath;
            return
          }
              // 当结束点的x坐标小于起始点时且y坐标大于起始点时
      if (curLine.endPoint.x - line_h - lineRadius < startPoint.x &&
          curLine.endPoint.y > startPoint.y){
            linepath = `M ${startPoint.x} ${startPoint.y} h ${line_h}
            m 0 0 A ${lineRadius} ${lineRadius} 0 0 1 ${startPoint.x + line_h + lineRadius} ${startPoint.y + lineRadius}
            m 0 0 V ${curLine.endPoint.y + line_v + stateHeight - line_radius}
            m 0 0 A ${lineRadius} ${lineRadius} 0 0 1 ${startPoint.x + line_h} ${curLine.endPoint.y + line_v + stateHeight}
            m 0 0 L ${curLine.endPoint.x - 20 + line_radius} ${curLine.endPoint.y + line_v + stateHeight}
            m 0 0 A ${lineRadius} ${lineRadius} 0 0 1 ${curLine.endPoint.x - 20} ${curLine.endPoint.y + line_v + stateHeight - lineRadius}
            m 0 0 V ${curLine.endPoint.y + lineRadius}
            m 0 0 A ${lineRadius} ${lineRadius} 0 0 1 ${curLine.endPoint.x - 20 + lineRadius} ${curLine.endPoint.y}
            m 0 0 L ${curLine.endPoint.x} ${curLine.endPoint.y}
            m -5 -5 L ${curLine.endPoint.x} ${curLine.endPoint.y} L ${curLine.endPoint.x - 5} ${curLine.endPoint.y + 5}`
            curLine.startPoint = startPoint;
            curLine.d = linepath;
            return
          }
        // 当结束点的x, y坐标均大于起始点的时候
        if (
          curLine.endPoint.x > startPoint.x + line_h + lineRadius &&
          curLine.endPoint.y > startPoint.y
        ) {
          // 当结束点与起始点的y坐标差距小于两个拐角半径时，根据结束点和起始点的y坐标的差动态决定拐角半径
          if (curLine.endPoint.y - startPoint.y < 2 * tempRadius) {
            let doubleRadius = curLine.endPoint.y - startPoint.y;
            tempRadius = doubleRadius / 2;
            linepath = `M ${startPoint.x} ${startPoint.y} h ${line_h}
            m 0 0 A ${tempRadius} ${tempRadius} 0 0 1 ${startPoint.x + line_h + tempRadius} ${startPoint.y + tempRadius}
            m 0 0 v ${curLine.endPoint.y - startPoint.y - 2 * tempRadius} 
            m 0 0 A ${tempRadius} ${tempRadius} 0 0 0 ${startPoint.x + line_h + 2 * tempRadius} ${curLine.endPoint.y}
            m 0 0 L ${curLine.endPoint.x} ${curLine.endPoint.y} 
            m -5 -5 L ${curLine.endPoint.x} ${curLine.endPoint.y} L ${curLine.endPoint.x - 5} ${curLine.endPoint.y + 5}`;
            curLine.startPoint = startPoint;
            curLine.d = linepath;
            return;
          } else {
            linepath = `M ${startPoint.x} ${startPoint.y} h ${line_h}
            m 0 0 A ${lineRadius} ${lineRadius} 0 0 1 ${startPoint.x + line_h + lineRadius} ${startPoint.y + lineRadius}
            m 0 0 v ${curLine.endPoint.y - startPoint.y - 2 * lineRadius} 
            m 0 0 A ${lineRadius} ${lineRadius} 0 0 0 ${startPoint.x + line_h + 2 * lineRadius} ${curLine.endPoint.y}
            m 0 0 L ${curLine.endPoint.x} ${curLine.endPoint.y} 
            m -5 -5 L ${curLine.endPoint.x} ${curLine.endPoint.y} L ${curLine.endPoint.x - 5} ${curLine.endPoint.y + 5}`;
            curLine.startPoint = startPoint;
            curLine.d = linepath;
            return;
          }
        }
        //当结束点的x坐标大于起始点，y坐标小于起始点时
        if (
          curLine.endPoint.x > startPoint.x + line_h + lineRadius &&
          curLine.endPoint.y < startPoint.y
        ) {
          // 当结束点与起始点的y坐标差距小于两个拐角半径时，根据结束点和起始点的y坐标的差动态决定拐角半径
          if (startPoint.y - curLine.endPoint.y < 2 * tempRadius) {
            let doubleRadius = startPoint.y - curLine.endPoint.y;
            tempRadius = doubleRadius / 2;
            (linepath = `M ${startPoint.x} ${startPoint.y} h ${line_h}
            m 0 0 A ${tempRadius} ${tempRadius} 0 0 0 ${startPoint.x + line_h + tempRadius} ${startPoint.y - tempRadius}
            m 0 0 v ${curLine.endPoint.y - startPoint.y + 2 * tempRadius}
            m 0 0 A ${tempRadius} ${tempRadius} 0 0 1 ${startPoint.x + line_h + 2 * tempRadius} ${curLine.endPoint.y}
            m 0 0 L ${curLine.endPoint.x} ${curLine.endPoint.y} 
            m -5 -5 L ${curLine.endPoint.x} ${curLine.endPoint.y} L ${curLine.endPoint.x - 5} ${curLine.endPoint.y + 5}`),
            curLine.startPoint = startPoint;
            curLine.d = linepath;
            return;
          } else {
            linepath = `M ${startPoint.x} ${startPoint.y} h ${line_h}
            m 0 0 A ${lineRadius} ${lineRadius} 0 0 0 ${startPoint.x + line_h + lineRadius} ${startPoint.y - lineRadius}
            m 0 0 v ${curLine.endPoint.y - startPoint.y + 2 * lineRadius}
            m 0 0 A ${lineRadius} ${lineRadius} 0 0 1 ${startPoint.x + line_h + 2 * lineRadius} ${curLine.endPoint.y}            
            m 0 0 L ${curLine.endPoint.x} ${curLine.endPoint.y} 
            m -5 -5 L ${curLine.endPoint.x} ${curLine.endPoint.y} L ${curLine.endPoint.x - 5} ${curLine.endPoint.y + 5}`;
            curLine.startPoint = startPoint;
            curLine.d = linepath;
            return;
          }
        
      }
    },
    /**
     * 根据状态块的transform数据更新其endPoint, 然后更新用于画线的数据d   todo
     * 连线方案：判断当前的鼠标位置，目标状态，如果存在这样1个状态a，它的纵坐标和startState，endState相等，且a的横坐标在startState，endState中间，则需要绕着a画折线
     * 连线分多种复杂场景，这部分后面逐渐完善
     * 
     * 
     */
    updateLineData(curLine, stateData) {
      //debugger;
      function translatePX2Num(str) {
        if (/px/.test(str)) {
          str = str.replace("px", "");
        }
        return +str;
      }
      let currentThread = store.stateData.threadAry[this.threadIndex]
      let result = []
      // 用于深度搜索stateId的方法，寻找到的state存储在result内
      function traverse(stateAry) {
        for (var i in stateAry){
            if (stateAry[i].stateId === stateData.stateId){
            result.push(stateAry[i]);
            return
            }
          traverse(stateAry[i].children);
          }
      };
      traverse(currentThread.stateAry);
      let currentState
      if(!stateData.stateId){
        currentState = stateData
      }
      else{
        currentState = result[0]
      }

      let stateType = currentState.stateType
      let stateHeight = parseInt(translatePX2Num(currentState.height) / 2, 10)
      //TODO: 需要设计一下要如何储存这里的height
      window.localStorage.setItem("heightForCalc", stateHeight);
      let stateWidth = parseInt(translatePX2Num(currentState.width), 10)
      let copiedStateData = Tools.deepCopy(stateData);
      let copiedTransform = copiedStateData.transform;
      while(copiedStateData.data){
        copiedStateData = copiedStateData.data
      }
      let endPoint;
      //需要再添加一个条件来判断多层嵌套状态下传入的数据
      if(!stateData.data){
        //多层嵌套下时套用这个起始位置的数据
        if(stateData.inLoop){
          if (stateType == "loopDiv") {
          endPoint = {
            x: stateData.statePos.x,
            y: stateData.statePos.y + stateHeight,
          };
          } else {
          endPoint = {
            x: stateData.statePos.x,
            y: stateData.statePos.y + 20,
            };
          }
        }
        //无嵌套情况下套用这个位置的数据
        else{
          if (stateType == "loopDiv") {
          endPoint = {
            x: stateData.transform.x,
            y: stateData.transform.y + stateHeight + 36,
          };
          } else {
          endPoint = {
            x: stateData.transform.x,
            y: stateData.transform.y + 56,
            };
          }
        
        }
      }
      //单层嵌套下套用这个起始位置的数据
      else{
        if (stateType == "loopDiv") {
          endPoint = {
            x: copiedStateData.AbsolutePosition.x,
            y: copiedStateData.AbsolutePosition.y + stateHeight,
          };
        } else {
          endPoint = {
            x: copiedStateData.AbsolutePosition.x,
            y: copiedStateData.AbsolutePosition.y + 20,
          };
        }
      }
      this.drawUpdateLine(curLine, stateHeight, endPoint, line_radius);
    },

    updateOutputLineData(curLine, stateData) {
      //debugger
      function translatePX2Num(str) {
        if (/px/.test(str)) {
          str = str.replace("px", "");
        }
        return +str;
      }
      let currentThread = store.stateData.threadAry[this.threadIndex]
      
      // 用于深度搜索stateId的方法，寻找到的state存储在result内
      let result = []
      function traverse(stateAry) {
        for (let i in stateAry){
            if (stateAry[i].stateId === stateData.stateId){
            result.push(stateAry[i]);
            return result
            }
          traverse(stateAry[i].children);
          }
      };
      traverse(currentThread.stateAry);
      let currentState
      if(!stateData.stateId){
        currentState = stateData
      }
      else{
        currentState = result[0]
      }
      let stateType = currentState.stateType
      let stateHeight = parseInt(translatePX2Num(currentState.height)/ 2, 10)
      // 用于计算往左边模块连线时的被连线模块的高度
      let inputStateHeight
      inputStateHeight = parseInt(window.localStorage.getItem("heightForCalc"), 10)
      let stateWidth = parseInt(translatePX2Num(currentState.width), 10)
      let copiedStateData = Tools.deepCopy(stateData);
      while(copiedStateData.data){
        copiedStateData = copiedStateData.data
      }
      let startPoint;
      //需要再添加一个条件来判断多层嵌套状态下传入的数据
      if(!stateData.data){
        //多层嵌套下时套用这个起始位置的数据
        if(stateData.inLoop){
          if (stateType == "loopDiv") {
          startPoint = {
            x: stateData.statePos.x + stateWidth + 2,
            y: stateData.statePos.y + stateHeight,
          };
          } else {
            startPoint = {
              x: stateData.statePos.x + stateWidth,
              y: stateData.statePos.y + stateHeight,
            };
          }
        }
        //无嵌套情况下套用这个位置的数据
        else{
          if (stateType == "loopDiv") {
          startPoint = {
            x: stateData.transform.x + stateWidth + 2,
            y: stateData.transform.y + stateHeight + 36,
          };
          } else {
            startPoint = {
              x: stateData.transform.x + 79,
              y: stateData.transform.y + 56,
            };
          }
        }
    
      }
      else{
        //单层嵌套下套用这个起始位置的数据
        if (stateType == "loopDiv") {
          startPoint = {
            x: copiedStateData.AbsolutePosition.x + stateWidth + 2,
            y: copiedStateData.AbsolutePosition.y + stateHeight + 1,
          };
        } else {
          startPoint = {
            x: copiedStateData.AbsolutePosition.x + 79,
            y: copiedStateData.AbsolutePosition.y + 20,
          };
        }
      }
      this.drawUpdateOutputLine(startPoint, inputStateHeight, curLine, line_radius);
    },
    startResize(e) {
      this.showVirtualBox = true;
      EventObj.$emit("operateChange", {
        operate: "resize-thread",
        index: this.threadIndex,
        startPosition: {
          x: e.pageX,
          y: e.pageY,
        },
        originW: this.$el.offsetWidth,
        originH: this.$el.offsetHeight,
      });
    },
    endResize(e) {
      this.showVirtualBox = false;
      EventObj.$emit("operateChange", {
        operate: "default",
      });
      this._lastHeight = this.thread.height;
    },


    /**
     * TODO:自动布局
     *
     */
     autoPosition(){
       var style = document.getElementsByClassName("thread")[this.threadIndex].getAttribute("style");
       var depth;
     },
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
    computedH: function () {
      let maxY = 0;
      let threadDivBorderWidth = 1,
        stateDivBorderWidth = 1,
        stateDivHeight = 40; // 50是状态的高度
      if (this.showVirtualBox) {
        return Math.max(maxY, this.thread.height);
      }
      this._lastHeight = this._lastHeight || this.thread.height;
      this.thread.stateAry.forEach((state) => {
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
    },
  },
};
</script>

<style lang="less">
div.thread {
  position: relative;
  display: inline-block;
  text-align: left;
  /* margin-top: 50px; */
  // margin-left: 50px;
  // left: 50%;
  // transform: translateX(-50%);
  margin: 25px;
  foreignObject {
    // border: 1px solid #00cd9a;
    border: 1px solid #487afe;
    border-radius: 4px;
  }
}

h4.title {
  margin: 0;
  width: 100%;
  height: 35px;
  padding-left: 15px;
  line-height: 35px;
  color: #ffffff;
  background-color: rgba(72, 122, 254, 0.42);
  // background-color: rgba(0, 219, 255, 0.42);
    // background-color: #487afe;
    // background-image: linear-gradient(100deg, #82FDFF, #7898F9);
}
.operating, .pausing, .stopping{
  margin: 0;
  line-height: 35px;
  height: 35px;
  padding-right: 15px;
  font-size: 15px;
  text-align: center;
  float:right;
  img{
    position: relative;
    top: 5px;
    right: 3px;
  }
}

/*
.operating{
  margin: 0;
  right:15%;
  line-height: 35px;
  height: 35px;
  color: rgb(26,250,41);
  font-size: 15px;
  text-align: center;
  background-color: rgba(72, 122, 254, 0.42);
}
img{
  position: relative;
  top: 4px;
}*/
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
  stroke-width: 1px !important;
  fill: none;
}
.templine:hover {
  stroke: yellow;
  fill: none;
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