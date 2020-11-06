<template>
  <div id="Header">
    <el-menu
      :default-active="activeIndex"
      class="el-menu-demo"
      mode="horizontal"
      menu-trigger="click"
      :unique-opened="true"
      @select="handleSelect"
    >
      <el-submenu v-for="item in menuCfg" :index="item.id" :key="item.id">
        <template slot="title">{{ item.name }}</template>
        <el-menu-item
          v-for="subItem in item.children"
          :index="subItem.id"
          :key="subItem.id"
        >
          <template>{{ subItem.name }}</template>
          <el-submenu
            v-for="thirdLevelItem in subItem.children"
            :index="thirdLevelItem.id"
            :key="thirdLevelItem.id"
          >
            <template>{{ thirdLevelItem.name }}</template>
          </el-submenu>
        </el-menu-item>
      </el-submenu>

      <el-submenu index="11">
        <template slot="title">plugins</template>
        <el-menu-item index="11.1">
          <!--  router-link { name: '路由名称', params: { name: '插件名称'}}    -->
          <router-link :to="{ name: 'plugin', params: { name: 'plugin_a' } }"
            >打开插件a</router-link
          >
        </el-menu-item>
      </el-submenu>
    </el-menu>

    <img :src="logoPath" />
  </div>
</template>

<script>
import {qblockCfg} from '@/qblockCfg.js'
import Tools from "@/Tools.js";
// import extenedMenu from '/static/plugins/cfg.json'


export default {
  name: "Header",
  // props: ['menuCfg'],
  data() {
    return {
      logoPath: "",
      activeIndex: "1",
      activeIndex2: "1",

      menuCfg: [
        {
          id: "0",
          name: "主页",
          callback: null,
          router: null,
          children: [],
        },
        {
          id: "1",
          name: "工程管理",
          callback: null,
          router: null,
          children: [
            {
              id: "1-0",
              name: "新建工程",
              callback: null,
              router: null,
              children: [],
            },
            {
              id: "1-1",
              name: "打开工程",
              callback: null,
              router: null,
              children: [],
            },
            {
              id: "1-2",
              name: "保存工程",
              callback: null,
              router: null,
              children: [],
            },
          ],
        },
      ],
    };
  },
  methods: {
    handleSelect(key, keyPath) {
      console.log(key, keyPath);
    },

    showCode() {
      debugger;
    },

    run() {
      this.axios({
        url: "/service/run",
        method: "post",
        data: {
          path: "",
        },
      });
    },
    connDebugger() {
      this.axios({
        url: "/service/connDebugger",
        method: "post",
        data: {
          path: "",
        },
      }).then((res) => {
        console.log("连接至QRL-Debugger成功！");
      });
    },

    saveProject() {
      // save stateData
      let stateData = Tools.deepCopy(statePageVue.threadAry);

      // save blockly xml
      let blocklyWindow = document.getElementsByTagName("iframe")[0]
        .contentWindow;
      let blocklyData = blocklyWindow.Blockly.Xml.workspaceToDom(
        blocklyWindow.Code.workspace
      );

      // save qrl
      let code = blocklyWindow.Blockly.Lua.workspaceToCode(
        blocklyWindow.Code.workspace
      );
      this.axios({
        url: "/service/saveProject",
        method: "post",
        data: {
          stateData: stateData,
          blocklyData: blocklyData, //blocklyData,
          code: code,
        },
      }).then((res) => {
        // debugger;
      });
    },
    /**
     * 获取所有插件菜单并入到内置菜单
     */
    getExtendedMenu(){
      this.axios({
        // url: "/static/getExtendedMenu",
        url: "/static/plugins/cfg.json",
        method: "get",
        data: {},
      }).then((res) => {
        res.data.plugins.forEach(item => {
          let menuGrp = this.findMenuGrp(item.menuGroupId, this.menuCfg);
          if(menuGrp){
            menuGrp.children.push(item);
          }else{
            console.log('请检查导入插件时设置的菜单类别id是否有误！');
          }
        });
      });
    },
    /**
     * 根据给定的菜单组id查找这个菜单
     */
    findMenuGrp(grpId, menuAry){
      let item, ret;
      for(let i = 0; i < menuAry.length; i++){
        item = menuAry[i];
        if(item.id === grpId){
          return item;
        }else if(item.children.length){
          ret = this.findMenuGrp(grpId, item.children);
          if(ret){
            return ret;
          }
        }
      }
      return false;
    }
  },
  created() {
    //获取扩展菜单
    if(qblockCfg.enableCustomMenu){
      this.getExtendedMenu();
    }
  },
};
</script>

<style  >
.el-menu--horizontal > .el-menu-item,
.el-menu--horizontal > .el-submenu .el-submenu__title {
  height: 60px;
  line-height: 60px;
  padding: 0 10px;
}
#Header {
  position: fixed;
  top: 0;
  width: 100%;
  height: 61px;
  z-index: 1;
  background-color: #272B42;
}
li.menuitem {
  height: 61px;
}
li.el-submenu {
  height: 61px;
}

</style>

