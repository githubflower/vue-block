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
    <rect :width="blockData.width" :height="blockData.height" stroke="#666" />
    <rect class="block-title" x="0" y="0" :width="blockData.width" height="30" />
    <!-- <path class="icon setting" :d="iconType"/> -->
    
    <image :xlink:href="imgPath" x="172" y="2" height="24" width="24" />
  </g>
</template>

<script>
import icons from 'static/icon.js'
export default {
  name: "Block",
  props: {
    blockData: {
      type: Object
    }
  },
  data() {
    return {
      dragData: {},
      iconType: icons.setting,
      imgPath: '../../static/imgs/setting.png'
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
    }
  },
  computed: {
    transform: function() {
      return `translate(${this.blockData.x}, ${this.blockData.y})`;
    }
  }
};
</script>

<style scoped>
.block {
  fill: none;
}
.block-title {
  fill: pink;
  stroke: #ddd;
}
.block .icon{
    fill: #ff0000;
    transform: scale(0.02)
}
.block .icon:hover{
    cursor: pointer;
    fill:aquamarine;
}
.block image:hover{
    cursor: pointer;
}
</style>
