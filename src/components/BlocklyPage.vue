<template>
  <div id="blocklyPage">
    <iframe
      :src="`/static/blockly/demos/code/index.html`"
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
  beforeRouteUpdate(to, from, next){
    alert(to + '\n' + from);
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