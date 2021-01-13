<template>
  <div id="blocklyPage">
    <iframe
      id="blocklyIframe"
      src="./static/blockly/demos/code/index.html"
      frameborder="0"
      width="100%"
      height="100%"
    ></iframe>
    <SwitchBtn/>
  </div>
</template>
<script>
import SwitchBtn from "@/components/SwitchBtn"
export default {
  name: "BlocklyPage",
  components: {
    SwitchBtn
  },
  data() {
    return {};
  },
  activated(){
    //刷新iframe内容，从localstorage中读取blockly.xml,  
    // 考虑到后续有可能会引入多个Blockly界面，所以暂时不这么做，而是采用mounted
    // debugger;
  },
  deactivated(){
    //将Blockly图面数据更新到localstorage的blockly.xml ---暂时用beforeDestroy代替
  },
  mounted(){
    //刷新iframe内容，从localstorage中读取blockly.xml,
    var blocklyXml = window.localStorage.getItem('blocklyXml');
    var blocklyIframe = this.$el.querySelector('#blocklyIframe');
    blocklyIframe.onload = function(e){
      e.target.contentWindow.Code.workspace.clear();
      e.target.contentWindow.Code.loadBlocks(blocklyXml)
    }
    blocklyIframe.onunload = function(e){
      var win = e.target.contentWindow;
      var xmlDom = win.Blockly.Xml.workspaceToDom(win.Code.workspace);
      var xmlText = win.Blockly.Xml.domToPrettyText(xmlDom);
      window.localStorage.setItem('blocklyXml', xmlText);
    }
  },
  beforeDestroy(){
    //将Blockly图面数据更新到localstorage的blockly.xml
   /*  var blocklyIframe = this.$el.querySelector('#blocklyIframe');
    var win = blocklyIframe.contentWindow;
    var xmlDom = win.Blockly.Xml.workspaceToDom(win.Code.workspace);
    var xmlText = win.Blockly.Xml.domToPrettyText(xmlDom);
    window.localStorage.setItem('blocklyXml', xmlText); */
  }
};
</script>

<style lang="less" scoped>
@topMenuHeight: 60px;
#blocklyPage {
  height: 100%;
  .switch-btn{
    top: 70px;
  }
}
</style>