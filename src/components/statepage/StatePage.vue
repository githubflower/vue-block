<template>
  <div class="main" @mousemove="onMouseMove">
    <div class="toolbox">
      <el-button type="primary" plain @click="addThread">线程</el-button>
      <!-- dragStart事件只能绑定在html5元素上，绑定el组件无效，所以这里用span包裹一层  -->
      <span
        draggable="true"
        @drag="drag"
        @dragstart="dragStart"
        @dragend="dragEnd"
      >
        <el-button type="primary" plain stateType="stateDiv">状态</el-button>
      </span>
      <span
        draggable="true"
        @drag="drag"
        @dragstart="dragStart"
        @dragend="dragEnd"
      >
        <el-button type="primary" plain stateType="loopDiv">循环</el-button>
      </span>
      <!-- <el-button type="primary" plain @click="save">保存</el-button>
      <el-button
        type="primary"
        plain
        @click="loadFromLocal"
        title="加载localstorage中的数据"
        >加载</el-button
      >
      <el-button
        type="primary"
        plain
        @click="exportFile"
        title="将当前图面数据以文件形式导出"
        >导出</el-button
      >
      <el-button
        type="primary"
        plain
        @click="json2xml"
        title="将当前图面数据以文件形式导出"
        >生成block.xml</el-button
      >
      <el-button
        type="primary"
        plain
        @click="genFromBlockly2QBlock"
        title="根据Blockly生成QBlock"
        >根据Blockly生成QBlock</el-button
      >
      <el-button
        type="primary"
        plain
        @click="importFile"
        title="从文件导入图面数据"
        >导入</el-button
      > -->
      <!-- <input type="file" name="importFile" id="importFile" /> -->
      <!-- <el-button-group style="position: absolute; top: 10px; left: 700px;"> -->
      <!-- <span>输入变量名称：</span>
      <input type="text" name="search" id="demovar" v-model="varName" />
      <el-button type="primary" plain @click="searchVar" title="查询变量的值"
        >查询</el-button
      >
      <el-button type="primary" plain @click="run" title="运行程序"
        >运行</el-button
      >
      <el-button type="primary" plain @click="step" title="单步执行"
        >单步</el-button
      >
      <el-button
        type="primary"
        plain
        @click="stopDebugger"
        title="终止被调试端运行的虚拟机"
        >停止调试</el-button
      >
      <el-button type="primary" plain @click="stop" title="停止程序"
        >停止程序</el-button
      >
      <el-button type="primary" plain @click="releaseAuth" title="释放权限"
        >释放权限</el-button
      >
      <el-button-group>
        <el-button type="primary" size="medium" @click="activeStatePage"
          >State Diagram</el-button
        >
        <el-button type="primary" size="medium" @click="activeBlockly"
          >Blockly</el-button
        >
      </el-button-group> -->
    </div>
    <div
      v-show="activeName === 'statePage'"
      class="content"
      @click="hideLineContextMenu()"
    >
      <line-context-menu
        ref="lineContextMenu"
        v-show="lineContextMenuData.show"
        :mustShowMenu="lineContextMenuData.show"
        :lineId="lineContextMenuData.lineId"
        :lineData="lineContextMenuData.lineData"
        :threadIndex="lineContextMenuData.threadIndex"
        :style="{
          left: lineContextMenuData.position.x + 'px',
          top: lineContextMenuData.position.y + 'px',
        }"
        @selectItem="onSelect"
      ></line-context-menu>
      <state-context-menu
        v-show="showDeleteStateMenu"
        @deleteStateFn="deleteStateFn"
        :xy="contextmenuXY"
      ></state-context-menu>
      <thread-svg
        v-for="(thread, i) in threadAry"
        :key="i"
        :thread="thread"
        :threadIndex="i"
      ></thread-svg>
    </div>
   <!--  <iframe
      v-show="activeName === 'blocklyPage'"
      src="./static/blockly/demos/code/index.html"
      frameborder="0"
      width="100%"
      :height="iframeHeight"
      style="position: absolute; top: 60px; left: 0px"
    ></iframe> -->
  </div>
</template>

<script>
// import MyPlainDraggable from 'plain-draggable'
// import MyPlainDraggable from 'plain-draggable/plain-draggable.esm.js'
import ThreadSvg from "./ThreadSvg";
import StateDiv from "./StateDiv";
import LineContextMenu from "./LineContextMenu";
import StateContextMenu from "./StateContextMenu";
import Tools from "@/Tools.js";
export default {
  name: "StatePage",
  components: {
    ThreadSvg,
    StateDiv,
    LineContextMenu,
    StateContextMenu,
  },
  data() {
    return {
      varName: null,
      statenameIndex: 0,
      _statenameIndex: 0, //todo  为什么这里不能用_开头命名？
      iframeHeight: 0,
      activeName: "statePage", //'statePage'    'blocklyPage'
      // activeName: "statePage", //'statePage'
      showTempLine: false,
      showDeleteStateMenu: false,
      contextmenuXY: {
        x: 0,
        y: 0,
      },
      tempLineData: null,
      operate: "default",
      threadAry: store.stateData.threadAry,
      lineContextMenuData: {
        show: false,
        lineId: null,
        lineData: null,
        threadIndex: null,
        position: {
          x: 0,
          y: 0,
        },
      },

      fileList: [],
    };
  },
  methods: {
    addThread() {
      store.addThread({
        name: "线程名称" + (this.threadAry.length + 1),
        width: 1000,
        height: 300,
        stateAry: [
          {
            name: "开始",
            stateId: "state-start",
            inputAry: [],
            outputAry: [],

            x: 50,
            y: 50,
          },
          {
            name: "结束",
            stateId: "state-end",
            inputAry: [],
            outputAry: [],
            x: 350,
            y: 50,
          },
        ],
      });
    },
    deleteState(data) {
      this.contextmenuXY.x = data.mousedownPoint.x;
      this.contextmenuXY.y = data.mousedownPoint.y;
      this.showDeleteStateMenu = true;
      this._deleteStateData = data;
    },
    deleteStateFn() {
      let data = this._deleteStateData;
      let tI = data.indexAry.pop(); //线程索引
      let target = this.threadAry[tI].stateAry;
      while (data.indexAry.length > 1) {
        let i = data.indexAry.pop();
        target = target[i].children;
      }
      target.splice(data.indexAry.pop(), 1);
      this.showDeleteStateMenu = false;
    },
    /* generateDefaultPos(index){
            const gap = 35;
            return `translate(50, ${(300 + gap) * (index - 1)})`;
        },
        generateStatePos(index){
            const gapX = 60;
            return `translate(${(90 + gapX) * (index - 1)}, 40)`;
        }, */
    drag() {},
    dragStart(e) {
      // e.dataTransfer.items.push('aaa');
      // e.dataTransfer.items.add('aaa');
      let stateType = e.target.firstElementChild.getAttribute("stateType");
      e.dataTransfer.setData("operate", "addState");
      e.dataTransfer.setData("stateType", stateType);
    },
    dragEnd() {
      // console.log("dragend");
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
      this.threadAry[index].stateAry.forEach((state) => {
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
    },
    loadFromLocal() {
      let data = window.localStorage.getItem("stateData");
      this.threadAry = JSON.parse(data);
      if (data) {
        // console.log("load success!");
      }
    },
    genFromBlockly2QBlock() {
      //todo
      let blocklyPage = document.getElementsByTagName("iframe")[0];
      let data = [blocklyPage.contentWindow.aa];
      this.threadAry = data;
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
    hideLineContextMenu() {
      // this.lineContextMenuData.show = false;
    },
    updateLineData(data) {
      let line = this.threadAry[data.threadIndex].lineAry.find((lineItem) => {
        return lineItem.lineId === data.lineId;
      });
      line.desc = data.desc;
      this.lineContextMenuData.show = false;
    },
    exportFile() {
      Tools.downloadFlie();
    },
    importFile() {},

    handleExceed() {
      debugger;
    },
    onUpload(rs, file, fileList) {
      debugger;
    },
    json2xml() {
      const NAME_SPACE = "https://developers.google.com/blockly/xml";
      const createEl = (tagName) => {
        return document.createElementNS(NAME_SPACE, tagName);
      };
      /**
       * 1.找到线程中有开始标记的根状态
       * 2.遍历根状态的output，生成特殊的if-else if 结构，注意：默认不采用else
       *
       */
      let blocklyPageData;
      let statePageData = this.threadAry;
      const genBlockType = (type) => {
        let ret = "run_state";
        if (type === "loopDiv") {
          ret = "controls_whileUntil";
        }
        return ret;
      };
      let state2dom = (rootState, threadData) => {
        let rootEl = createEl("block");
        console.log(
          rootState.stateId +
            " --- " +
            rootState.name +
            " --- " +
            rootState.stateType
        );
        rootEl.setAttribute("id", rootState.stateId);
        // rootEl.setAttribute('type', rootState.type || 'state_run');
        rootEl.setAttribute("type", genBlockType(rootState.stateType));

        // allFieldsToDom_
        let field2dom = (field) => {
          let container = createEl("field");
          container.setAttribute("name", field.name);
          container.textContent = field.value;
          return container;
        };
        let fieldDom = field2dom({
          name: "NAME",
          value: rootState.name,
        });
        rootEl.appendChild(fieldDom);

        let nextDom = createEl("next");

        let outputDom = createEl("block");
        outputDom.setAttribute("type", "controls_if");

        if (rootState.outputAry.length) {
          if (rootState.outputAry.length > 1) {
            let mutation = createEl("mutation");
            mutation.setAttribute("elseif", rootState.outputAry.length - 1);
            outputDom.appendChild(mutation);
          }
          rootState.outputAry.forEach((outputItem, index) => {
            let outputStateDom;
            outputStateDom = createEl("statement");
            outputStateDom.setAttribute("name", `DO${index}`);
            outputStateDom.setAttribute("id", `${outputItem.lineId}`);
            //outputAry里面只存放了lineId 所以我们需要做以下事情：
            //1 根据lineId找到对应的line数据
            //2 根据line里面的endState的stateId找到对应的state数据
            let line = threadData.lineAry.find((item) => {
              return item.lineId === outputItem.lineId;
            });
            if (line) {
              let state = threadData.stateAry.find((item) => {
                return item.stateId === line.endState.stateId;
              });
              if (state) {
                outputStateDom.appendChild(state2dom(state, threadData));
              } else {
                console.error("data error -^- ");
              }
            }
            if (outputStateDom) {
              outputDom.appendChild(outputStateDom);
            }
          });
          nextDom.appendChild(outputDom);
          rootEl.appendChild(nextDom);
        }
        return rootEl;
      };

      let blocklyXml = createEl("xml");
      blocklyXml.setAttribute(
        "xmlns",
        "https://developers.google.com/blockly/xml"
      );
      statePageData.forEach((thread) => {
        let firstState = thread.stateAry[0];
        blocklyXml.appendChild(state2dom(firstState, thread));
      });
      window.stateDataXml = blocklyXml.outerHTML;
      let hiddenInput = document.createElement("input");
      hiddenInput.setAttribute("type", "text");
      hiddenInput.setAttribute("value", blocklyXml.outerHTML);
      hiddenInput.setAttribute("style", "height: 0; overflow: hidden;");
      document.body.appendChild(hiddenInput);
      hiddenInput.focus();
      hiddenInput.select();
      document.execCommand("copy");
      document.body.removeChild(hiddenInput);
    },

    activeStatePage() {
      if (this.activeName === "statePage") {
        return;
      }
      this.activeName = "statePage";
    },

    activeBlockly() {
      if (this.activeName === "blocklyPage") {
        return;
      }
      this.activeName = "blocklyPage";
      let iframeNode = document.querySelector("iframe");
      // iframeNode.contentWindow.postMessage('updateFromLocalStorage', '*');
      iframeNode.contentWindow.postMessage(window.stateDataXml, "*");
    },
    saveDragData(data) {
      this._dragData = data;
    },
    setBp(blockId) {
      this.axios({
        url: "/service/setBreakpoint",
        method: "post",
        data: {
          blockId: blockId,
        },
      }).then((res) => {
        alert(res.data.msg);
      });
    },
    searchVar() {
      this.axios({
        url: "/service/searchVar",
        method: "post",
        data: {
          varName: this.varName,
        },
      }).then((res) => {
        console.log(res);
        let msg = res.data.msg;
        let successFlag = msg.indexOf("[Debug]:ok;eval;") > -1;
        let reg = /\{(.*)\}/;
        let valAry = reg.exec(msg);
        let val = null;
        if (successFlag && valAry) {
          val = this.varName + "的值是：" + valAry[1];
        } else {
          val = "查询失败：" + msg;
        }
        alert(val);
      });
    },
    run() {
      this.axios({
        url: "/service/run",
        method: "post",
        data: {
          path: "",
        },
      });
    },
    stop() {
      this.debugService("stop", {});
    },
    stopDebugger() {
      this.debugService("stopDebugger", {});
    },
    debugService(appName, data) {
      this.axios({
        url: "/service/" + appName,
        method: "post",
        data: data,
      }).then((res) => {
        console.log(res);
      });
    },
    releaseAuth() {
      this.axios({
        url: "/service/releaseAuth",
        method: "post",
        data: {},
      }).then((res) => {
        console.log(res);
      });
    },
    step() {
      this.axios({
        url: "/service/step",
        method: "post",
        data: {},
      }).then((res) => {
        alert(res.data.msg);
        let blocklyPage = document.getElementsByTagName("iframe")[0];
        let grps = blocklyPage.contentDocument.getElementsByTagName("g");
        let ary = Array.prototype.slice.call(grps);
        let block;
        if (ary) {
          block = ary.find((item) => {
            return item.getAttribute("data-id") === res.data.blockId;
          });
          if (block) {
            block.firstElementChild.setAttribute(
              "style",
              "fill: yellow; fill-opacity: 1;"
            );
          }
        }
      });
    },
  },
  computed: {
    sumHeight: function (i) {
      return 0;
    },
  },

  created() {
    // this.loadFromLocal();
    EventObj.$on("deleteState", this.deleteState, this);
    EventObj.$on("operateChange", this.operateChange, this);
    
    EventObj.$on("updateTempLineData", this.updateTempLineData, this);
    EventObj.$on("updateLineData", this.updateLineData, this);
    EventObj.$on("updateContextMenu", this.updateContextMenu, this);
    EventObj.$on("saveDragData", this.saveDragData, this);

    window.addEventListener("message", function (e) {
      let data = e.data;
      if (data.eventType === "setBreakpoint") {
        statePageVue.setBp(data.blockId);
      }
    });
  },
  mounted() {
    window.statePageVue = this;

    var importFileBtn = document.getElementById("importFile");
    if (importFileBtn) {
      importFileBtn.addEventListener("change", function (e) {
        var file = e.target.files[0];
        var reader = new FileReader();
        reader.onload = (fe) => {
          window.statePageVue.threadAry = JSON.parse(fe.target.result);
        };
        reader.readAsText(file);
      });
    }

    this.iframeHeight = window.innerHeight - 65; //header与toolbox的高度
  },
};
</script>

<style scope>
html {
  background-color: #192A49;
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