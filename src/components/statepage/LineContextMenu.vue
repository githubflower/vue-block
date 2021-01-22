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
    >
      <el-form-item label="事件描述" style="padding: 5px">
        <el-input type="textarea" v-model="form.desc"></el-input>
      </el-form-item>
      <el-form-item style="padding: 5px">
        <el-button type="primary" @click="onSubmit">确定</el-button>
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
      form: {
        desc: "",
      },
      menuData: [
        {
          desc: "触发事件描述",
          type: "editDesc",
        },
        {
          desc: "删除",
          type: "delete",
        },
        {
          desc: "插入状态",
          type: "insert",
        },
      ],
    };
  },
  methods: {
    addLine2State(startState, endState) {
      let lineData = {
        d: "",
        startPoint: {
          x: startState.x + Util.translatePX2Num(startState.width),
          y: startState.y + Util.translatePX2Num(startState.height) / 2,
        },
        endPoint: {
          x: endState.x,
          y: endState.y + Util.translatePX2Num(endState.height) / 2,
        },
        startState: {
          stateId: startState.stateId,
        },
        endState: {
          stateId: endState.stateId,
        },
        lineId: window.genId("line"),
        type: "default",
        verticalOffset: 0,
      };
      store.addLine({
        threadIndex: this.threadIndex,
        lineData: lineData,
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
      let newStateData = {
        index: this.threadIndex,
        stateType: "stateDiv",
        x: startState.x + (endState.x - startState.x) / 2,
        y: startState.y,
      };
      let newState = store.getDefaultStateCfg(newStateData);
      store.stateData.threadAry[this.threadIndex].stateAry.push(newState);
      store.deleteLine({
        threadIndex: this.threadIndex,
        lineId: this.lineId,
      });
      let stateData = {
        startState: startState,
        endState: endState,
        newState: newState,
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
          store.updateUndoData(this.threadIndex);
          this.showMenu = false;
          store.deleteLine({
            lineId: this.lineId,
            threadIndex: this.threadIndex,
          });
          store.updatePresentData(this.threadIndex);
          //通知外层元素修改mustShowMenu为false
          this.$emit("toggleLineContextMenu", false);
          break;
        case "insert":
          store.updateUndoData(this.threadIndex);
          this.showMenu = false;
          let stateData = this.insertState();
          //需要等新增加的状态渲染出来后再添加连线
          this.$nextTick(function () {
            this.addLine2State(stateData.startState, stateData.newState);
            setTimeout(() => {
              this.addLine2State(stateData.newState, stateData.endState);
              store.updatePresentData(this.threadIndex);
            }, 10);
          });
          this.$emit("toggleLineContextMenu", false);
        default:

        // pass through
      }
      store.focusCurrentThread(this.threadIndex);
      //   this.$emit('selectItem', this.menuData[index])
    },
    onCancelClick() {
      this.showForm = false;
      this.$emit("toggleLineContextMenu", false);
    },
    onSubmit() {
      //通知StatePage更新lineAry中对应的line对象的数据
      EventObj.$emit("updateLineData", {
        lineId: this.lineId,
        threadIndex: this.threadIndex,
        desc: this.form.desc,
      });
      this.showForm = false;
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
      }
    },
  },
  created() {
    this.form.desc = this.lineData && this.lineData.desc;
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
</style>