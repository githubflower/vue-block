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
              <div
                class="el-menu-item"
                draggable="true"
                @dragstart="dragStart"
                @dragend="dragEnd"
                type="block-red"
              >红外传感器</div>
              

              <el-menu-item
                index="1-1"
                draggable="true"
                @dragstart="dragStart"
                @dragend="dragEnd"
              >触碰传感器</el-menu-item>
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
                <span>执行器</span>
              </template>
              <div
                class="el-menu-item"
                draggable="true"
                @dragstart="dragStart"
                @dragend="dragEnd"
                type="setIO"
              >传送带</div>
              <el-menu-item index="2-2">灯光</el-menu-item>
            </el-submenu>
            <el-submenu index="3">
              <template slot="title">
                <i class="el-icon-menu"></i>
                <span slot="title">机器人运动</span>
              </template>
              <div
                class="el-menu-item"
                draggable="true"
                @dragstart="dragStart"
                @dragend="dragEnd"
                type="motion"
              >直线运动</div>
              <el-menu-item index="3-2">圆弧运动</el-menu-item>
            </el-submenu>
             <el-submenu index="4">
              <template slot="title">
                <i class="el-icon-location"></i>
                <span>控制</span>
              </template>
              <div
                class="el-menu-item"
                draggable="true"
                @dragstart="dragStart"
                @dragend="dragEnd"
                type="loop"
              >循环</div>
              <div
                class="el-menu-item"
                draggable="true"
                @dragstart="dragStart"
                @dragend="dragEnd"
                type="condition"
              >条件判断</div>
            </el-submenu>
          </el-menu>
        </div>
      </el-col>
      <el-col :span="22">
        <div class="svg" @drop.prevent="drop" @dragover.prevent>
          <svg xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
            <block
              v-for="(item, index) in blocks"
              :key="index"
              :blockData="item.blockData"
              :formData="item.formData"
              :editIndex="index"
              @openSetting="openSetting"
            />
          </svg>
          <setting-form v-show="showSettingForm" :block="curBlock" @onClose="onClose" @onSubmit="onSubmit"></setting-form>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import Block from "@/components/Block";
import SettingForm from "@/components/form/SettingForm";

const defaultCfg = {
  x: 0.5,
  y: 0.5,
  width: 180,
  height: 70
};
export default {
  name: "Demo",
  components: {
    Block,
    SettingForm
  },
  data() {
    return {
      showSettingForm: false,
      curBlock: null,
      blocks: [
        {
          blockData: Object.assign(
            {
              blockType: "setIO"
            },
            defaultCfg
          ),
          formData: {}
        }
      ]
    };
  },
  methods: {
    expandMenu() {},
    collapseMenu() {},

    dragStart(e) {
      let sourceBlockInfo = {
        type: e.target.getAttribute("type")
        // isDrop: true
      };
      e.dataTransfer.setData(
        "dragData",
        JSON.stringify({
          blockType: sourceBlockInfo.type,
          offsetX: e.offsetX,
          offsetY: e.offsetY
        })
      );
    },
    dragEnd(e) {
      console.log(e.offsetX, e.offsetY);
    },

    drop(e) {
      let dragData = JSON.parse(e.dataTransfer.getData("dragData"));
      this.blocks.push({
        blockData: Object.assign({
          blockType: dragData.blockType,
          x: e.offsetX - dragData.offsetX + 0.5, // +0.5解决设置1px实际显示的效果是2px的bug   元素本身bug
          y: e.offsetY - dragData.offsetY + 0.5,
          width: defaultCfg.width,
          height: defaultCfg.height
        }),
        formData: {}
      });
    },

    /**
     * 打开属性面板
     * data中参数包括：
     * blockType: block类型
     * editIndex: block的索引
     */
    openSetting(data) {
      this.showSettingForm = true;
      this.curBlock = this.blocks[data.editIndex];
    //   this.curBlock.formData = data;
    },

    onClose() {
      this.showSettingForm = false;
    },

    onSubmit(data) {
        this.curBlock.formData = data;
        
    }
  },
  created(){
      window.blocks = this.blocks;
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
  border: 1px solid #909399;
}
</style>
