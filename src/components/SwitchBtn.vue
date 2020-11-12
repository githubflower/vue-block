<template>
  <el-button-group class="switch-btn">
    <el-button type="primary">
      <router-link :to="{ name: 'state' }" tag="span">QBlock</router-link>
    </el-button>

    <el-button type="primary"
      ><router-link :to="{ name: 'blockly' }" tag="span">Blockly</router-link></el-button
    >

    <el-button type="primary" :disabled="false">Code</el-button>

    <!-- <span class="iconfont icon-blockly"></span> -->
  </el-button-group>
</template>

<script>
export default {
  name: "SwitchBtn",
  data() {
    return {};
  },
};
</script>

<style lang="less">
.switch-btn {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
}
</style>