<template>
  <div id="blocklyPage">
    <iframe
      ref="blocklyIframe"
      id="blocklyIframe"
      src="./static/blockly/demos/code/index.html"
      frameborder="0"
      width="100%"
      height="100%"
    ></iframe>
    <!-- <SwitchBtn/> -->
  </div>
</template>
<script>
import SwitchBtn from "@/components/SwitchBtn";
import Util from "@/components/statepage/util.js";
export default {
  name: "BlocklyPage",
  components: {
    SwitchBtn,
  },
  data() {
    return {
      activeThreadIndex: 0,
    };
  },
  methods: {
    dom2text(dom) {
      var blocklyIframe = this.$el.querySelector("#blocklyIframe");
      var win = blocklyIframe.contentWindow;
      var text = win.Blockly.Xml.domToPrettyText(dom);
      return text;
    },
    loadData(blocklyXml) {
      if (this._isMounted) {
        /* if(typeof blocklyXml === 'string'){
          blocklyXml = new DOMParser().parseFromString(blocklyXml, 'text/xml');
        } */
        var blocklyIframe = this.$el.querySelector("#blocklyIframe");
        blocklyIframe.contentWindow.Code.workspace.clear();
        blocklyIframe.contentWindow.Code.loadBlocks(blocklyXml);
      }
    },
    saveData() {
      var blocklyIframe = this.$el.querySelector("#blocklyIframe");
      var win = blocklyIframe.contentWindow;
      var xmlDom = win.Blockly.Xml.workspaceToDom(win.Code.workspace);
      this.formatBlocklyXml(xmlDom);
      var xmlText = win.Blockly.Xml.domToPrettyText(xmlDom);

      //如果localStorage中threadsData不存在，则创建一个
      var threadsData = window.localStorage.getItem("threadsData");
      if (threadsData) {
        threadsData = JSON.parse(threadsData);
      } else {
        threadsData = [];
      }
      if (threadsData[this.activeThreadIndex]) {
        threadsData[this.activeThreadIndex].graphicData = xmlText;
        window.localStorage.setItem("threadsData", JSON.stringify(threadsData));
      }
    },
    formatBlocklyXml(blocklyXml) {
      if (blocklyXml.children.length !== 0) {
        let xmlDomAry = Util.toArray(blocklyXml.children);
        let variableNode;
        let listsStateNode;
        for (let i = 0; i < xmlDomAry.length; i++) {
          if (xmlDomAry[i].tagName === "variables") {
            variableNode = xmlDomAry.splice(i, 1)[0];
          }
          if (xmlDomAry[i].getAttribute("type") === "lists_state") {
            listsStateNode = xmlDomAry.splice(i, 1)[0];
          }
        }
        let arrangedXmlDomAry = [];
        if (variableNode) {
          arrangedXmlDomAry.push(variableNode);
        }
        arrangedXmlDomAry.push(listsStateNode);
        xmlDomAry.forEach((node) => {
          arrangedXmlDomAry.push(node);
        });
        while (blocklyXml.children.length > 0) {
          blocklyXml.removeChild(blocklyXml.children[0]);
        }
        arrangedXmlDomAry.forEach((node) => {
          blocklyXml.appendChild(node);
        });
      }
    },
    getBlocklyXmlFromSingleTestData() {
      let blocklyXml;
      blocklyXml = localStorage.getItem("test_data");
      return blocklyXml;
    },
  },
  activated() {
    //刷新iframe内容，从localstorage中读取blockly.xml,
    // 考虑到后续有可能会引入多个Blockly界面，所以暂时不这么做，而是采用mounted
  },
  deactivated() {
    //将Blockly图面数据更新到localstorage的blockly.xml ---暂时用beforeDestroy代替
  },
  mounted() {
    //刷新iframe内容，从localstorage中读取blockly.xml,
    let threadsData = window.localStorage.getItem("threadsData");
    let blocklyXml;
    if (threadsData) {
      threadsData = JSON.parse(threadsData);
      blocklyXml = threadsData && threadsData[0] && threadsData[0].graphicData;
    }

    //获取qblock_cfg_custom中debuggerBlockly   true:则加载localStorage.getItem('test_data')  false:加载localStorage.getItem('threadsData');
    let qblock_cfg_custom = localStorage.getItem("qblock_cfg_custom");
    if (qblock_cfg_custom) {
      qblock_cfg_custom = JSON.parse(qblock_cfg_custom);
      if (qblock_cfg_custom && qblock_cfg_custom.debuggerBlockly) {
        blocklyXml = this.getBlocklyXmlFromSingleTestData();
      }
    }

    var blocklyIframe = this.$el.querySelector("#blocklyIframe");
    blocklyIframe.onload = function (e) {
      e.target.contentWindow.Code.workspace.clear();
      if (blocklyXml) {
        e.target.contentWindow.Code.loadBlocks(blocklyXml);
      }
    };
    /*blocklyIframe.onunload = function(e){
      var win = e.target.contentWindow;
      var xmlDom = win.Blockly.Xml.workspaceToDom(win.Code.workspace);
      var xmlText = win.Blockly.Xml.domToPrettyText(xmlDom);
      window.localStorage.setItem('blocklyXml', xmlText);
    } */
  },

  beforeDestroy() {
    //将Blockly图面数据更新到localstorage的blockly.xml
    /*  var blocklyIframe = this.$el.querySelector('#blocklyIframe');
    var win = blocklyIframe.contentWindow;
    var xmlDom = win.Blockly.Xml.workspaceToDom(win.Code.workspace);
    var xmlText = win.Blockly.Xml.domToPrettyText(xmlDom);
    window.localStorage.setItem('blocklyXml', xmlText); */
  },
};
</script>

<style lang="less" scoped>
@topMenuHeight: 60px;
#blocklyPage {
  height: 100%;
  .switch-btn {
    top: 70px;
  }
}
</style>