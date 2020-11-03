<template>
  <div id="Header">
    <el-menu
      :default-active="activeIndex"
      class="el-menu-demo"
      mode="horizontal"
      menu-trigger="click"
      unique-opened="true"
      @select="handleSelect"
      
    >
      <el-submenu v-for="item in menuCfg" :index="item.id" :key="item.id">
        <template slot="title">{{ item.name }}</template>
        <el-menu-item v-for="subItem in item.children" :index="subItem.id" :key="subItem.id">
          <template>{{ subItem.name }}</template>
          <el-submenu v-for="thirdLevelItem in subItem.children" :index="thirdLevelItem.id" :key="thirdLevelItem.id">
            <template>{{ thirdLevelItem.name }}</template>
          </el-submenu>
        </el-menu-item>
      </el-submenu>

      <el-submenu index="11">
        <template slot="title">plugins</template>
        <el-menu-item index="11.1">
          <!--  router-link { name: '路由名称', params: { name: '插件名称'}}    -->
          <router-link :to="{ name: 'plugin', params: { name: 'plugin_a'}}">打开插件a</router-link>
        </el-menu-item>
      </el-submenu>
    </el-menu>

    <img :src="logoPath"/>
    
  </div>
</template>

<script>
import Tools from "@/Tools.js";

export default {
  name: "Header",
  // props: ['menuCfg'],
  data() {
    return {
      logoPath: '',
      activeIndex: "1",
      activeIndex2: "1",

      menuCfg: [
        {
          id: '0',
          name: '主页',
          callback: null,
          router: null,
          children: []
        },{
          id: '1',
          name: '工程管理',
          callback: null,
          router: null,
          children: [{
            id: '1-0',
            name: '新建工程',
            callback: null,
            router: null,
            children: []
          },{
            id: '1-1',
            name: '打开工程',
            callback: null,
            router: null,
            children: []
          },{
            id: '1-2',
            name: '保存工程',
            callback: null,
            router: null,
            children: []
          }]
        }

      ]
    };
  },
  methods: {
    handleSelect(key, keyPath) {
      console.log(key, keyPath);
    },

    showCode(){
        debugger;
    },

    run(){
      this.axios({
        url: '/service/run',
        method: 'post',
        data: {
          path: ''
        }
      })
    },
    connDebugger(){
      this.axios({
        url: '/service/connDebugger',
        method: 'post',
        data: {
          path: ''
        }
      })
      .then((res)=>{
        console.log('连接至QRL-Debugger成功！');
      })
    },

    saveProject(){
      // save stateData
      let stateData = Tools.deepCopy(statePageVue.threadAry);
     
      // save blockly xml
      let blocklyWindow = document.getElementsByTagName('iframe')[0].contentWindow;
      let blocklyData = blocklyWindow.Blockly.Xml.workspaceToDom(blocklyWindow.Code.workspace);
     
       // save qrl
       let code = blocklyWindow.Blockly.Lua.workspaceToCode(blocklyWindow.Code.workspace);
       debugger;
     this.axios({
        url: '/service/saveProject',
        method: 'post',
        data: {
          stateData: stateData,
          blocklyData: blocklyData, //blocklyData,
          code: code
        }
      }).then((res)=>{
        // debugger;
      })



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

