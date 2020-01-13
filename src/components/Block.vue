<template>
  <!-- <g :blockType="blockData.blockType" class="block" > -->
  <g
    :blockType="blockData.blockType"
    class="block"
    :transform="transform"
    draggable="true"
    @mousedown="dragStart"
    @mousemove="drag"
    @mouseup="dragEnd"
  >
    <rect :width="blockData.width" :height="blockData.height" rx="5"/>
    <rect class="block-title" x="0" y="0" :width="blockData.width" height="25" rx="5"/>
    <!-- <path class="icon setting" :d="iconType"/> -->
    
    <image :xlink:href="imgPath" x="158" y="4" height="16" width="16" @click="openSetting"/>

    <image :xlink:href="blockIcon" x="8" y="4" height="16" width="16"/>
    <text v-if="formData.name" x="30" y="16">{{ formData.name }}</text>
  </g>
</template>

<script>
import icons from 'static/icon.js'
export default {
  name: "Block",
  props: {
    blockData: {
      type: Object
    },
    editIndex: {
      type: Number
    },
    formData: {
      type: Object
    }
  },
  data() {
    return {
      dragData: {},
      iconType: icons.setting,
      imgPath: '../../static/imgs/setting.png',
    };
  },
  methods: {
    dragStart(e) {
      this.startDrag = true;
      this.dragData.startX = e.clientX;
      this.dragData.startY = e.clientY;

      this.originX = this.blockData.x;
      this.originY = this.blockData.y;
    },
    drag(e) {
      if (!this.startDrag) {
        return;
      }
      this.blockData.x = this.originX + (e.clientX - this.dragData.startX);
      this.blockData.y = this.originY + (e.clientY - this.dragData.startY);
    },
    dragEnd() {
      this.startDrag = false;
    },


    openSetting(){
      this.$emit('openSetting', {
        type: 'setting',
        editIndex: this.editIndex
      })
    }
  },
  computed: {
    transform: function() {
      return `translate(${this.blockData.x}, ${this.blockData.y})`;
    },
    blockIcon: function(){
      return `../../static/imgs/${this.blockData.blockType}.png`;
    }
  }
};
</script>

<style scoped>
.block {
  fill: none;
}
.block rect{
  stroke: #999;
  stroke-width: 1;
}
.block text{
  fill: #ffffff;
}
.block-title {
  fill: #238efe;
  /* fill: #fff; */
  stroke: #ddd;
}

.block .icon:hover{
    cursor: pointer;
    fill:aquamarine;
}

.block image:hover{
    cursor: pointer;
}
</style>
