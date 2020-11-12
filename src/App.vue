<template>
  <div id="app">
    <TopMenu />
    <ProjectManagementPanel />
    <keep-alive include="StatePage">
      <router-view />
    </keep-alive>
    <CtrlPanel />
    <!-- <div class="bg">
      <div></div>
    </div> -->
  </div>
</template>

<script>
import TopMenu from "@/components/Header";
import ProjectManagementPanel from "@/components/ProjectManagementPanel";
import CtrlPanel from "@/components/CtrlPanel";
export default {
  name: "App",
  components: {
    TopMenu,
    ProjectManagementPanel,
    CtrlPanel,
  },
};
</script>

<style lang="less" scoped>
@menuHeight: 60px;
@deepBlue1: #090723;
@deepBlue2: #192a49;
@deepBlue3: #0A0B44;
@white: #ffffff;

#app {
  padding-top: @menuHeight;
  height: calc(100% - @menuHeight);
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /* text-align: center; */
  color: #2c3e50;
  background-color: @deepBlue3;
}
</style>
<style lang="less">
html {
  height: 100%;
  body {
    height: 100%;
    margin: 0;
    padding: 0;
  }
}

.bg {
  top: 0;
  left: 0;
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: -1;
  > div {
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    &::after {
      content: "";
      display: block;
      top: 0;
      left: 0;
      position: absolute;
      width: 100%;
      height: 100%;
      // filter: blur(10px);

      background-color: #344b89;
      // background: url(/static/imgs/tmp2.png) center center no-repeat;
      // background: url(/static/imgs/bg_blue.jpg) center center no-repeat;
      background-size: cover;
    }
  }
}
</style>