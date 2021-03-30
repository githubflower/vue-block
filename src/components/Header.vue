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
        <template slot="title">{{ $t(item.name) }}</template>
        <el-menu-item
          v-for="subItem in item.children"
          :index="subItem.id"
          :key="subItem.id"
        >
          <template>{{ $t(subItem.name) }}</template>
          <el-submenu
            v-for="thirdLevelItem in subItem.children"
            :index="thirdLevelItem.id"
            :key="thirdLevelItem.id"
          >
            <template>{{ $t(thirdLevelItem.name) }}</template>
          </el-submenu>
        </el-menu-item>
      </el-submenu>

      <el-submenu index="11">
        <template slot="title">{{ $t('QBLOCK_PLUGIN') }}</template>
        <el-menu-item index="11.1">
          <!--  router-link { name: '路由名称', params: { name: '插件名称'}}    -->
          <router-link
            :to="{ name: 'plugin', params: { name: 'plugin_a' } }"
            tag="div"
            >{{$t('QBLOCK_OPEN_PLUGIN')}}</router-link
          >
        </el-menu-item>
      </el-submenu>
    </el-menu>

    <img :src="logoPath" />
  </div>
</template>

<script>
import { qblockCfg } from "@/qblockCfg.js";
import Tools from "@/Tools.js";
import Util from '@/components/statepage/util'
import menuCfg from '@/assets/menuCfg'
// import extenedMenu from '/static/plugins/cfg.json'

export default {
  name: "Header",
  // props: ['menuCfg'],
  data() {
    return {
      logoPath: "",
      activeIndex: "1",
      activeIndex2: "1",
      menuCfg: menuCfg.menu
    };
  },
  methods: {
    emptyFun(){
      alert('emptyFun');
    },
    handleSelect(key, keyPath) {
      //保存工程
      console.log(key);
      switch(key){
        case 'NEW_PROJECT':
          this.createProject();
          break;
        case '1-2':
          this.saveProject();
          break;
        case '1-3':
          this.run();
          break;
        default: 
          //do none;  
      }
    },

    showCode() {
      
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

    /**
     * [createSubThreadCode 生成 创建子线程并启动 的QRL代码]
     * @param  {[type]} data [description]
     * @return {[type]}      [description]
     */
    createSubThreadCode(data){
      let code = '';
      for(let i = 1; i < data.length; i++){
        let item = data[i];
        let name = encodeURIComponent(item.basicData.name).replace(/%/g, '_');
        code += `function_${name} = require('${name}.ql')\n` +
          `thread_${name} = Thread.New(function_${name})()\n` +
          `thread_${name}:Start()\n`
      }
      return code;
    },

    /**
     * [createProject 新建工程]
     * @param  {[type]} name [工程名称]
     * @return {[type]}      [description]
     */
    createProject(name){
      this.axios({
        url: '/service/newProject',
        method: 'post',
        data: {
          name: 'zjie_create_' + +new Date(),
        }
      }).then((res) => {
        alert('newProject success');
      })
    },

    saveProject() {
        let data = localStorage.getItem('threadsData');
        if(data){
          data = JSON.parse(data);
        }
        let blocklyWindow = document.getElementsByTagName('iframe')[0].contentWindow;
        let codeAry = [];
        data.forEach((item, index) => {
          // item.basicData, item.graphicData
          let xml = blocklyWindow.Blockly.Xml.textToDom(item.graphicData);
          blocklyWindow.Code.hiddenWorkspace.clear();
          blocklyWindow.Blockly.Xml.domToWorkspace(xml, blocklyWindow.Code.hiddenWorkspace);
          let code = blocklyWindow.Blockly.Lua.workspaceToCode(blocklyWindow.Code.hiddenWorkspace);
          if(index === 0){ // 主线程   main.ql
            
          }else{
            // 为什么要将主线程和其他子线程的逻辑分开？  因为子线程的代码还需要在外面包裹一个function
            code = `function ${encodeURIComponent(item.basicData.name).replace(/%/g, '_')}()\n${code}\nend\n`;
          }
          codeAry.push(code);
        })
        codeAry[0] += this.createSubThreadCode(data);

        //将生成的code发送到WebServer端，由WebServer负责生成相应的文件存储到Pallas Flash
        this.sendCode(data, codeAry);

    },
    /**
     * [sendCode 将生成的code发送到WebServer端]
     * @param  {[type]} codeAry [description]
     * @return {[type]}         [description]
     */
    sendCode(data, codeAry){
      this.axios({
        url: '/service/saveProject',
        method: 'post',
        data: {
          threadsData: data,
          codeAry: codeAry
        }
      }).then((res) => {
        alert('upload success');
      })
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

    /**
     * 获取所有插件菜单并入到内置菜单
     */
    getExtendedMenu() {
      this.axios({
        // url: "/static/getExtendedMenu",
        url: "/static/plugins/cfg.json",
        method: "get",
        data: {},
      }).then((res) => {
        res.data.plugins.forEach((item) => {
          let menuGrp = this.findMenuGrp(item.menuGroupId, this.menuCfg);
          if (menuGrp) {
            menuGrp.children.push(item);
          } else {
            console.log("请检查导入插件时设置的菜单类别id是否有误！");
          }
        });
      });
    },
    /**
     * 根据给定的菜单组id查找这个菜单
     */
    findMenuGrp(grpId, menuAry) {
      let item, ret;
      for (let i = 0; i < menuAry.length; i++) {
        item = menuAry[i];
        if (item.id === grpId) {
          return item;
        } else if (item.children.length) {
          ret = this.findMenuGrp(grpId, item.children);
          if (ret) {
            return ret;
          }
        }
      }
      return false;
    },
  },
  created() {
    //获取扩展菜单
    if (qblockCfg.enableCustomMenu) {
      this.getExtendedMenu();
    }

    
  },
};
</script>

<style lang="less" scoped>
#Header {
  position: fixed;
  top: 0;
  width: 100%;
  height: 60px;
  z-index: 1;
  background-color: #242265;
  // background-color: #272b42;
  user-select: none;
  > .el-menu {
    background-color: transparent;
  }

  /deep/ .el-menu--horizontal > .el-menu-item,
  /deep/ .el-menu--horizontal > .el-submenu .el-submenu__title {
    height: 60px;
    line-height: 60px;
    padding: 0 10px;
    color: #7898f9;
    &:hover {
      background-color: transparent;
      &::after {
        width: 100%;
        transition: 0.3s;
        left: 0;
      }
    }
    &::after {
      display: block;
      position: absolute;
      left: 50%;
      bottom: -1px;
      content: "";
      width: 0;
      height: 2px;
      background-color: #7898f9;
    }
    > i {
      display: none;
    }
  }
}

/* /deep/ .el-menu.el-menu--popup{
  background-color: #1D305F;
  > li.el-menu-item{
    background-color: #1D305F;
  }
} */
</style>
<style lang="less">
@menuBgColor: #272b42;
// 1D305F
.el-menu--popup-bottom-start {
  margin-top: 0;
  padding-top: 10px;
}
.el-menu.el-menu--popup {
  background-color: @menuBgColor;
  > li.el-menu-item {
    padding-left: 25px;
    background-color: @menuBgColor;
    transition: border-color 0.2s, background-color 0.2s, color 0.2s;
    &:hover {
      // background-color: #344654;
      background-color: #344b89;
      color: #fff;
    }
  }
}
.el-menu--horizontal .el-menu .el-menu-item,
.el-menu--horizontal .el-menu .el-submenu__title {
  color: #7898f9;
}
.el-menu.el-menu--horizontal {
  border-bottom: solid 1px #344b89;
  // border-bottom: none;
}
.el-menu--horizontal .el-menu .el-menu-item.is-active, .el-menu--horizontal .el-menu .el-submenu.is-active>.el-submenu__title{
  color: #7898f9;
}
</style>