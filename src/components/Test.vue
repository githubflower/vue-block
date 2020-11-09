<template>
  <div class="outer">
    <div class="inner"></div>
  </div>
</template>

<script>
export default {
  name: "Test",
  data() {
    return {
    };
  }
};
</script>

<style lang="less" rel="stylesheet/less">
.outer{
  margin-top: 62px;
  margin-left: 20px;
  width: 400px;
  height: 400px;
  border: 1px solid aquamarine;
  .inner{
    width: 200px;
    height: 200px;
    border: 1px solid red;
  }
}
</style>

