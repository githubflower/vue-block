<template>
  <div id="Header">
    <el-menu
      :default-active="activeIndex"
      class="el-menu-demo"
      mode="horizontal"
      @select="handleSelect"
      
    >
      <el-menu-item index="1">主页</el-menu-item>
      <el-submenu index="9">
        <template slot="title">工程管理</template>
        <el-menu-item index="9-1">新建</el-menu-item>
        <el-menu-item index="9-2">打开</el-menu-item>
        <el-menu-item index="9-3">保存</el-menu-item>
      </el-submenu>
      <el-submenu index="2">
        <template slot="title">系统配置</template>
        <el-menu-item index="2-1">点位列表</el-menu-item>
        <el-menu-item index="2-2">速度配置</el-menu-item>
        <el-menu-item index="2-3">机器人示教</el-menu-item>
        <!-- <el-menu-item index="2-4">系统连接</el-menu-item> -->
      </el-submenu>
      <el-menu-item index="3">系统连接</el-menu-item>
      <el-menu-item index="4">
        <div @click="showCode">查看代码</div>
      </el-menu-item>
    </el-menu>
    <img :src="logoPath"/>
  </div>
</template>

<script>
export default {
  name: "Header",
  data() {
    return {
      logoPath: '',
      activeIndex: "1",
      activeIndex2: "1"
    };
  },
  methods: {
    handleSelect(key, keyPath) {
      console.log(key, keyPath);
    },

    showCode(){
        debugger;
    }
  }
};
</script>

<style  >
.el-menu--horizontal>.el-menu-item,
.el-menu--horizontal>.el-submenu .el-submenu__title{
  height: 60px;
  line-height: 60px;
  padding: 0 10px;
}
#Header{
  position: fixed;
  top: 0;
  width: 100%;
  height: 61px;
  z-index: 1;
}
li.menuitem{
  height: 61px;
}
li.el-submenu{
  height: 61px;
}
</style>

