<template>
  <div
    id="projectManagementPanel"
    :class="isCollapsed ? 'is-collapsed' : 'is-expanded'"
    @mouseenter="expandPanel"
  >
    <div class="bg">
      <div></div>
    </div>
    <!-- <el-tree
      v-show="!isCollapsed"
      :data="data"
      :props="defaultProps"
      @node-click="handleNodeClick"
    ></el-tree> -->
    <el-tree v-show="!isCollapsed" v-loading="treeData.loading" :data="treeData.projectData" :props="treeData.defaultProps" :expand-on-click-node="treeData.expandOnClickNode" :highlight-current="treeData.highlightCurrent" @node-click="handleNodeClick" :lazy="treeData.lazy" :load="treeData.load"></el-tree>
    <i
      :class="[
        'icon',
        {
          'el-icon-arrow-right': isCollapsed,
          'el-icon-arrow-left': !isCollapsed,
        },
      ]"
      @click="isCollapsed = !isCollapsed"
    ></i>
  </div>
</template>
<script>
export default {
  name: "ProjectManagementPanel",
  data() {
    return {
      isCollapsed: true,
      treeData: {
        projectData: [],
        defaultProps: {
          children: "children",
          label: "label",
        },
        expandOnClickNode: false,
        highlightCurrent: true,
        loading: true,
        selectedPath: '',
        lazy: false,
      },
      defaultProps: {
        children: "children",
        label: "label",
      },
    };
  },
  methods: {
    handleNodeClick(data) {
      console.log(data);
    },
    expandPanel() {
      return; //开发时暂时屏蔽 TODO
      if (this.isCollapsed) {
        this.isCollapsed = !this.isCollapsed;
      }
    },
    collapse() {
      this.isCollapsed = true;
    },
    loadProject(){
      const PALLAS_PROJECT_DIR = '/media/flash/PallasSolutions/';
      this.axios({
        url: "/service/loadProject",
        method: "post",
        data: {
          path: PALLAS_PROJECT_DIR
        }
      }).then((res) => {
        this.treeData.projectData = res.data.data;
      })
    }
  },
  created(){
    this.loadProject();
  }
};
</script>
<style lang="less" scoped>
@keyframes myease1 {
  0% {
    width: 0;
  }
  50% {
    width: 280px;
  }
  100% {
    width: 250px;
  }
}
@menuHeight: 60px;
#projectManagementPanel {
  /deep/.el-tree {
    color: #ffffff;
    background-color: transparent;
  }
  position: fixed;
  left: 0px;
  height: calc(100% - @menuHeight);
  /* padding: 5px; */
  //   border: 1px solid #487afe;
  border: 1px solid #344b89;
  border-right: 1px solid #aaa;
  z-index: 10;
  background-color: rgba(0, 0, 0, 0.5);
  //   box-shadow: 0px 3px 2px 1px #aaa;
  //   background-color: rgba(109, 252, 255, 0.722);
  // background-color: rgba(25,42, 73, .9);
  transition: all 0.2s;
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
        // filter: blur(5px);

        background-color: #344b89;
        // background: url(/static/imgs/tmp2.png) center center no-repeat;
        // background: url(/static/imgs/bg_blue.jpg) center center no-repeat;
        background-size: cover;
      }
    }
  }

  &.is-collapsed {
    width: 0px;
    .icon {
      right: -20px;
      &:hover{
        width: 60px;
        right: -48px;
        background-color: #409EFF;
        color: #ffffff;
      }
    }
  }
  &.is-expanded {
    width: 250px;
    /* animation: name duration timing-function delay iteration-count direction fill-mode; */
    animation: myease1 0.2s;
    /* animation: myease 1s ease-in 0 1 direction fill-mode; */
  }
  .icon {
    position: absolute;
    right: -15px;
    top: 50%;
    width: 30px;
    height: 30px;
    line-height: 30px;
    text-align: center;
    background-color: rgba(255, 255, 255, .8);
    cursor: pointer;
    border-radius: 15px;
    transform: translateY(-50%);
    box-shadow: 0 0 5px;
    transition: all .3s;
    
  }
  /deep/ .el-tree-node__content:hover {
    background-color: #409eff;
  }
  /deep/ .el-tree--highlight-current .el-tree-node.is-current>.el-tree-node__content{
    background-color: #00bcd4; 
  }
  /deep/ .el-tree-node:focus>.el-tree-node__content {
    background-color: #409eff;
  }
}
</style>