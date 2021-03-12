<template>
  <div class="menu-wrap" @click.stop>
    <ul v-if="showMenu" class="line-context-menu">
      <li
        v-for="(item, index) in menuData"
        :key="index"
        :type="item.type"
        @click.stop="onItemClick(index)"
      >
        {{ item.desc }}
      </li>
    </ul>

    <el-form
      v-if="showForm"
      ref="form"
      :model="form"
      label-width="80px"
      style="background-color: #ffffff; width: 400px; border-radius: 5px"
      @keydown.enter.native="onSubmit"
    >
      <el-form-item label="事件描述" style="padding: 5px">
        <el-input type="textarea" v-model="form.desc"></el-input>
      </el-form-item>
      <el-form-item style="padding: 5px">
        <el-button type="primary" @click="onSubmit">确定</el-button>
        <el-button @click="onCancelClick">取消</el-button>
      </el-form-item>
    </el-form>

    <el-form
      v-if="showEvent"
      ref="event"
      :model="event"
      label-width="80px"
      style="background-color: #ffffff; width: 325px; border-radius: 5px"
      @keydown.enter.native="onSubmitEvent"
    >
      <el-form-item label="触发事件" style="padding: 5px">
        <el-input
          style="width: 150px"
          v-model="event.ioStateNum"
          onKeypress="return(/^[0-9]*$/.test(String.fromCharCode(event.keyCode)))"
        ></el-input>
        =
        <el-select
          style="width: 55px"
          v-model="event.ioStateBool"
          placeholder=""
        >
          <el-option v-for="item in ioBool" :key="item" :value="item">
          </el-option>
        </el-select>
      </el-form-item>
      <p class="invalid-input" v-show="invalidInput">
        端口与端口的bool值都不能为空！
      </p>
      <el-form-item style="padding: 5px">
        <el-button type="primary" @click="onSubmitEvent">确定</el-button>
        <el-button @click="onCancelClick">取消</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import Util from "./util.js";
import Tools from "@/Tools.js";
import QBlock from "./qblock.js";
export default {
  name: "LineContextMenu",
  props: ["lineId", "threadIndex", "lineData", "mustShowMenu"],
  data() {
    return {
      showMenu: true,
      showForm: false,
      showEvent: false,
      invalidInput: false,
      ioBool: [0, 1],
      form: {
        desc: "",
      },
      event: {
        ioStateNum: null,
        ioStateBool: null,
      },
      menuData: [
        {
          desc: "触发事件描述",
          type: "editDesc",
        },
        {
          desc: "设置触发事件",
          type: "editEvent",
        },
        {
          desc: "插入状态",
          type: "insert",
        },
        {
          desc: "删除",
          type: "delete",
        },
      ],
    };
  },
  methods: {
    addLine2State(startState, newState, endState, lineType) {
      this.$nextTick(function () {
        if (lineType === "startLoop") {
          QBlock.Line.addStartLoopLine2State(
            startState,
            newState,
            this.threadIndex
          );
        } else {
          QBlock.Line.addDefaultLine2State(
            startState,
            newState,
            this.threadIndex
          );
        }
        setTimeout(() => {
          if (lineType === "continueLoop") {
            QBlock.Line.addContinueLoopLine2State(
              newState,
              endState,
              this.threadIndex
            );
          } else if (lineType === "endLoop") {
            QBlock.Line.addEndLoopLine2State(
              newState,
              endState,
              this.threadIndex
            );
          } else {
            QBlock.Line.addDefaultLine2State(
              newState,
              endState,
              this.threadIndex
            );
          }
          store.updatePresentData(this.threadIndex);
        }, 10);
      });
    },
    insertState() {
      let startState = store.getState(
          this.threadIndex,
          this.lineData.startState.stateId
        ),
        endState = store.getState(
          this.threadIndex,
          this.lineData.endState.stateId
        );
      let startStateXY = QBlock.State.getXY2Canvas(
        startState,
        this.threadIndex
      );
      let endStateXY = QBlock.State.getXY2Canvas(endState, this.threadIndex);
      let newStateData = {
        index: this.threadIndex,
        stateType: "stateDiv",
        x: startState.x + (endState.x - startState.x) / 2,
        y: endState.y,
      };
      let newState = store.getDefaultStateCfg(newStateData);
      if (endState.parent === startState.parent && endState.parent === null) {
        store.stateData.threadAry[this.threadIndex].stateAry.push(newState);
      } else {
        let insertStateParentId;
        //TODO：在嵌套状态内也需要正确计算状态的位置
        if (startState.parent === endState.stateId) {
          //此时为在继续连线或结束连线上新增状态
          insertStateParentId = endState.stateId;
          newState.x =
            startState.x +
            (endStateXY.x +
              Util.translatePX2Num(endState.width) -
              startStateXY.x) /
              2;
          newState.y = startState.y;
        } else if (endState.parent === startState.stateId) {
          //此时为在开始连线上新增状态
          insertStateParentId = startState.stateId;
          newState.x = (endStateXY.x - startStateXY.x) / 2;
          newState.y = endState.y;
        } else if (endState.parent === startState.parent) {
          insertStateParentId = endState.parent;
        }
        newState.parent = insertStateParentId;
        let insertState = store.getState(this.threadIndex, insertStateParentId);
        insertState.children.push(newState);
      }
      let prevLineType = this.lineData.type;
      store.deleteLine({
        threadIndex: this.threadIndex,
        lineId: this.lineId,
      });
      let stateData = {
        startState: startState,
        endState: endState,
        newState: newState,
        prevLineType: prevLineType,
      };
      return stateData;
    },
    onItemClick(index) {
      let data = this.menuData[index];
      switch (data.type) {
        case "editDesc":
          this.showMenu = false;
          this.showForm = true;
          break;
        case "delete":
          this.showMenu = false;
          store.updateUndoData(this.threadIndex);
          store.deleteLine({
            lineId: this.lineId,
            threadIndex: this.threadIndex,
          });
          store.updatePresentData(this.threadIndex);
          //通知外层元素修改mustShowMenu为false
          this.$emit("toggleLineContextMenu", false);
          break;
        case "insert":
          this.showMenu = false;
          store.updateUndoData(this.threadIndex);
          let stateData = this.insertState();
          //需要等新增加的状态渲染出来后再添加连线
          this.addLine2State(
            stateData.startState,
            stateData.newState,
            stateData.endState,
            stateData.prevLineType
          );
          this.$emit("toggleLineContextMenu", false);
          break;
        case "editEvent":
          this.showMenu = false;
          this.showEvent = true;
          break;
        default:
        // pass through
      }
      store.focusCurrentThread(this.threadIndex);
      //   this.$emit('selectItem', this.menuData[index])
    },
    onCancelClick() {
      this.showForm = false;
      this.showEvent = false;
      this.$emit("toggleLineContextMenu", false);
    },
    onSubmit() {
      //通知StatePage更新lineAry中对应的line对象的数据
      EventObj.$emit("updateLineDesc", {
        lineId: this.lineId,
        threadIndex: this.threadIndex,
        desc: this.form.desc,
      });
      this.showForm = false;
    },
    onSubmitEvent() {
      let eventIoNum = parseInt(this.event.ioStateNum, 10);
      let eventIoBool = parseInt(this.event.ioStateBool, 10);
      if (this.event.ioStateNum === "" || this.event.ioStateBool === null) {
        this.invalidInput = true;
        return;
      }
      EventObj.$emit("updateLineEvent", {
        lineId: this.lineId,
        threadIndex: this.threadIndex,
        event: {
          ioStateNum: eventIoNum,
          ioStateBool: eventIoBool,
        },
      });
      this.invalidInput = false;
      this.showEvent = false;
    },
    onItemMenu() {
      /**
       * this.$contextmenu({
       *    items:[
       *      {
       *        label: "触发事件描述",
       *        onClick: () => {
       *          this.showMenu = false;
       *          this.showForm = true;
       *        }
       *      }
       *      {
       *        label: "删除",
       *        onClick: () => {
       *          this.showMenu = false;
                  store.deleteLine({
                    lineId: this.lineId,
                    threadIndex: this.threadIndex,
                  });
                  this.$emit("toggleLineContextMenu", false);
       * 
       *        }
       *      }]})
       */
    },
  },
  watch: {
    mustShowMenu: function (v) {
      if (v) {
        this.showMenu = true;
        this.form.desc = this.lineData && this.lineData.desc;
        this.event.ioStateNum = this.lineData && this.lineData.event.ioStateNum;
        this.event.ioStateBool =
          this.lineData && this.lineData.event.ioStateBool;
      }
    },
  },
  created() {
    this.form.desc = this.lineData && this.lineData.desc;
    this.event.ioStateNum = this.lineData && this.lineData.event.ioStateNum;
    this.event.ioStateBool = this.lineData && this.lineData.event.ioStateBool;
  },
};
</script>

<style>
.menu-wrap {
  position: absolute;
  width: 0;
  z-index: 1;
}
.line-context-menu {
  /*  position: absolute;
  top: 0;
  left: 0; */
  width: 120px;
  border-radius: 4px;
  background-color: #ffffff;
}
.line-context-menu li {
  list-style: none;
  padding: 5px 10px;
}
.line-context-menu li:hover {
  background-color: #e6f7ff;
  cursor: pointer;
}
.el-textarea .el-textarea__inner {
  resize: none;
}
.invalid-input {
  font-size: 14px;
  bottom: 10px;
  padding: 0px 17px 15px;
  color: red;
}
</style>