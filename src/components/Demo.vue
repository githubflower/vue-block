<template>
  <div id="Demo">
    <el-row>
      <el-col :span="2">
        <div class="block-menu">
          <el-menu
            default-active="2"
            class="el-menu-vertical-demo"
            @open="expandMenu"
            @close="collapseMenu"
          >
            <el-submenu index="1">
              <template slot="title">
                <i class="el-icon-location"></i>
                <span>传感器</span>
              </template>
              <div class="el-menu-item" draggable="true" @dragstart="dragStart" @dragend="dragEnd" type="block-red">红外传感器</div>
              <el-menu-item index="1-1" draggable="true" @dragstart="dragStart" @dragend="dragEnd">触碰传感器</el-menu-item>
              <el-menu-item index="1-2">温度传感器</el-menu-item>
              <!-- <el-menu-item-group>
                <template slot="title">分组一</template>
                <el-menu-item index="1-1">选项1</el-menu-item>
                <el-menu-item index="1-2">选项2</el-menu-item>
              </el-menu-item-group>-->

              <!--  <el-submenu index="1-4">
                <template slot="title">触碰传感器</template>
                <el-menu-item index="1-4-1">选项1</el-menu-item>
              </el-submenu>-->
            </el-submenu>
            <el-submenu index="2">
              <template slot="title">
                <i class="el-icon-location"></i>
                <span>控制器</span>
              </template>
              <el-menu-item index="2-1">传送带</el-menu-item>
              <el-menu-item index="2-2">灯光</el-menu-item>
            </el-submenu>
            <el-submenu index="3">
                <template slot="title">
                    <i class="el-icon-menu"></i>
                    <span slot="title">机器人运动</span>
                </template>
              <el-menu-item index="3-1">直线运动</el-menu-item>
              <el-menu-item index="3-2">圆弧运动</el-menu-item>
            </el-submenu>
          </el-menu>
        </div>
      </el-col>
      <el-col :span="22">
        <div class="svg" @drop.prevent="drop" @dragover.prevent></div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
export default {
  name: "Demo",
  data() {
    return {};
  },
  methods: {
    expandMenu() {},
    collapseMenu() {},

    dragStart(e){
        let sourceBlockInfo = {
            type: e.target.getAttribute('type'),
            // isDrop: true
        }
        e.dataTransfer.setData('blockType', sourceBlockInfo.type);
        debugger;
    },
    dragEnd(e){
        debugger;
    },

    drop(e){
        
        debugger;
    }
  }
};
</script>

<style scoped>
.el-submenu .el-menu-item {
  min-width: auto;
  padding-left: 40px;
}

.block-menu {
  /* border: 1px solid #666; */
  width: 100%;
  user-select: none;
}
.svg {
  width: 100%;
  height: 800px;
  border: 1px solid #666;
}
</style>
