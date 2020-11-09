<template>
  <div id="app">
    <TopMenu/>
    <ProjectManagementPanel/>
    <keep-alive include="StatePage">
      <router-view/>
    </keep-alive>
    <CtrlPanel/>
  </div>
</template>

<script>
import TopMenu from '@/components/Header'
import ProjectManagementPanel from '@/components/ProjectManagementPanel'
import CtrlPanel from '@/components/CtrlPanel'
export default {
  name: 'App',
  components: {
    TopMenu,
    ProjectManagementPanel,
    CtrlPanel
  }
}
</script>

<style lang="less">
html{
  height: 100%;
  body{
    height: 100%;
    margin: 0;
    padding: 0;
    #app {
      padding-top: 60px;
      height: calc(100% - 60px);
      font-family: 'Avenir', Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      /* text-align: center; */
      color: #2c3e50;
      background-color: #192a49;
    }
  }
}
</style>
