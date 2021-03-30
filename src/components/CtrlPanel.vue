<template>
  <div id="ctrlPanel" :class="isExpanded ? 'is-expanded' : 'is-collapsed'">
    <ul class="inner-shadow">
      <!-- <li v-show="isExpanded" class="power-on" :style="{ backgroundImage: `url(${ powerOnIcon })` }">上电</li> -->
      <!-- <li v-show="isExpanded" class="reset" :style="{ backgroundImage: `url(${ resetIcon })` }">回零</li> -->
      <!-- <li class="emergency-stop" :style="{ backgroundImage: `url(${ emergencyStopIcon })` }">急停</li> -->
      <!--  <li class="emergency-stop" draggable="true">
        <span class="text">急停</span>
      </li> -->
      <li>
        <el-button type="danger">{{ $t("QBLOCK_EMERGENCY_STOP") }}</el-button>
      </li>
    </ul>
    <div class="ctrlpanel-button">
      <!-- <el-button
        type="primary"
        plain
        @click="state2blockly"
        title="生成blockly.xml"
        >生成blockly.xml</el-button
      > -->
      <el-button class="save-btn" type="primary" plain @click="saveAllData">{{
        $t("QBLOCK_SAVE_ALL")
      }}</el-button>
      <el-button
        type="primary"
        plain
        @click="clearBlocklyXmlOfLocalStorage"
        title="清空localStorage中blocklyXml数据"
        >{{ $t("QBLOCK_CLEAR_LOCAL_STORAGE") }}</el-button
      >
      <el-button
        type="primary"
        plain
        @click="setDebuggerModeOfBlockly(true)"
        title="单独调试Blockly"
        >{{ $t("QBLOCK_DEBUGGER_MODE_OF_BLOCKLY") }}</el-button
      >
      <el-button
        type="primary"
        plain
        @click="setDebuggerModeOfBlockly(false)"
        title="取消调试Blockly"
        >{{ $t("QBLOCK_CANCEL_DEBUGGER_MODE_OF_BLOCKLY") }}</el-button
      >
      <el-button
        type="primary"
        plain
        @click="openWebSocket"
        title="建立webSocket连接"
        >{{ $t("QBLOCK_OPEN_WEBSOCKET") }}</el-button
      >
      <el-button
        type="primary"
        plain
        @click="openPallasConnection"
        title="建立pallas连接"
        >建立pallas连接</el-button
      >
      <!--  <el-button
        type="primary"
        plain
        @click="reloadBlocklyXmlOfLocalStorage"
        title="reload localStorage中blocklyXml数据"
        >reload localStorage中blocklyXml数据</el-button
      >
      <el-button
        type="primary"
        plain
        @click="saveQBlock2BlocklyXml"
        title="save qblock2localStorage"
        >save qblock2localStorage</el-button
      > -->
      <el-button type="primary" plain @click="testLayout" title="testLayout">{{
        $t("QBLOCK_AUTO_LAYOUT")
      }}</el-button>
      <el-button type="primary" plain @click="changeLang" title="切换语言">{{
        $t("QBLOCK_CHANGE_LANG")
      }}</el-button>
      <!-- <span class="title">Robot控制</span> -->
      <!-- <div class="line" @mouseenter="expandPanel"></div> -->
      <!-- v-show="isExpanded" -->
    </div>
    <i
      :class="[
        'icon',
        {
          'el-icon-arrow-right': isExpanded,
          'el-icon-arrow-left': !isExpanded,
        },
      ]"
      @click="isExpanded = !isExpanded"
    ></i>
  </div>
</template>
<script>
import Util from "./statepage/util.js";
export default {
  name: "CtrlPanel",
  data() {
    return {
      isExpanded: false,
      powerOnIcon: "../../../static/imgs/ctrl/power_on_x48.png",
      resetIcon: "../../../static/imgs/ctrl/reset1_x48.png",
      emergencyStopIcon: "../../../static/imgs/ctrl/emergency_stop_x64.png",
    };
  },
  methods: {
    handleNodeClick(data) {
      console.log(data);
    },
    expandPanel() {
      if (!this.isExpanded) {
        this.isExpanded = !this.isExpanded;
      }
    },
    state2blockly() {
      EventObj.$emit("state2blockly");
    },
    clearBlocklyXmlOfLocalStorage() {
      EventObj.$emit("clearBlocklyXmlOfLocalStorage");
    },
    reloadBlocklyXmlOfLocalStorage() {
      EventObj.$emit("reloadBlocklyXmlOfLocalStorage");
    },
    saveQBlock2BlocklyXml() {
      EventObj.$emit("saveQBlock2BlocklyXml");
    },
    testLayout() {
      EventObj.$emit("testLayout");
    },
    saveAllData() {
      EventObj.$emit("saveAllData");
    },
    openWebSocket() {
      EventObj.$emit("openWebSocket");
    },
    openPallasConnection() {
      this.axios({
        url: "/service/connectPallas2092",
        method: "post",
      })
        .then((res) => {
          resolve();
        })
        .catch((err) => {
          this.$message.error("创建pallas连接出错");
        });
    },
    setDebuggerModeOfBlockly(bool) {
      let qblock_cfg_custom = window.localStorage.getItem("qblock_cfg_custom");
      if (!qblock_cfg_custom) {
        window.localStorage.setItem("qblock_cfg_custom", JSON.stringify({}));
      }
      qblock_cfg_custom = JSON.parse(qblock_cfg_custom);
      qblock_cfg_custom.debuggerBlockly = bool;
      window.localStorage.setItem(
        "qblock_cfg_custom",
        JSON.stringify(qblock_cfg_custom)
      );
      window.location.reload();
    },
    changeLang() {
      let QBlockCfg = JSON.parse(window.localStorage.getItem("QBlockCfg"));
      let curLang = QBlockCfg.lang;
      QBlockCfg.lang = curLang === "zh" ? "en" : "zh";
      this.$i18n.i18next.changeLanguage(QBlockCfg.lang);
      window.localStorage.setItem("QBlockCfg", JSON.stringify(QBlockCfg));

      let blocklyIframe = document.getElementById("blocklyIframe");
      blocklyIframe.contentWindow.postMessage(
        {
          type: "changeLanguage",
          lang: QBlockCfg.lang,
        },
        "*"
      );
    },
  },
};
</script>
<style lang="less">
@keyframes myease {
  0% {
    width: 0;
  }
  50% {
    width: 380px;
  }
  100% {
    width: 350px;
  }
}
@keyframes anticlockwiseRotate {
  from {
    transform: rotate(0);
  }
  to {
    transform: rotate(-720deg);
  }
}
@keyframes clockwiseRotate {
  from {
    transform: rotate(0);
  }
  to {
    transform: rotate(360deg);
  }
}
@keyframes anticlockwiseRotate360 {
  from {
    transform: rotate(0);
  }
  to {
    transform: rotate(-360deg);
  }
}

@menuHeight: 60px;
@btnHeight: 40px;
// @panelBgColor: #272B42;
// @panelBgColor: #1B2143;
@panelBgColor: #344b89;

#ctrlPanel {
  position: fixed;
  top: @menuHeight;
  right: 0px;
  z-index: 3;
  height: calc(100% - @menuHeight);
  //   background-color: #0a0b44;
  background-color: @panelBgColor;
  border-left: 1px solid #aaa;
  transition: all 0.2s;
  &.is-collapsed {
    width: 0;
    .icon {
      left: -20px;
      &:hover {
        width: 60px;
        left: -48px;
        background-color: #409eff;
        color: #ffffff;
      }
    }
  }
  &.is-expanded {
    width: 350px;
    // border: 1px solid #487afe;
    animation: myease 0.2s;
  }
  .icon {
    position: absolute;
    left: -15px;
    top: 50%;
    width: 30px;
    height: 30px;
    line-height: 30px;
    text-align: center;
    background-color: rgba(255, 255, 255, 0.8);
    cursor: pointer;
    border-radius: 15px;
    transform: translateY(-50%);
    box-shadow: 0 0 5px;
    transition: all 0.3s;
  }
}
.line {
  position: absolute;
  right: 0;
  width: 0px;
  height: 100%;
  /* document.body.clientHeight todo */
  border: 1px solid #aaa;
  //   box-shadow: 0px 0px 10px 5px #7898f9;
}

.inner-shadow {
  position: absolute;
  top: -50px;
  right: 0;
}
.inner-shadow li {
  display: block;
  text-align: center;
  background-repeat: no-repeat;
  background-position: center center;
  cursor: pointer;
}
li.power-on {
  border: 1px solid #00ffff;
  color: #00ffff;
  box-shadow: inset 0 0 25px 0px #00ffff;
}
li.reset {
  border: 1px solid #487afe;
  /* color: #2962FB; */
  color: #487afe;
  box-shadow: inset 0 0 25px 0px #487afe;
}
li.emergency-stop {
  border-radius: 3px;
  background-color: #ff2312;
  .text {
    display: block;
    width: 60px;
    height: @btnHeight;
    line-height: @btnHeight;
    text-align: center;
    font-weight: bold;
    color: #f7e016;
    border: 1px solid #ff2312;
    z-index: 1;
    transition: all 0.3s;
    /*  &:hover {
      box-shadow: 0 0 25px 5px #ff0000;
    } */
  }
}

.el-button--danger {
  padding-left: 30px;
  padding-right: 30px;
  background-color: #ff2312;
  border-color: #ff2312;
  font-size: 16px;
  font-weight: bold;
}
.ctrlpanel-button {
  .el-button--primary {
    display: block;
    margin: 20px;
  }
}
</style>