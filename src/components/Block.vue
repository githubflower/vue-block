<template>
  <!-- <g :blockType="blockData.blockType" class="block" > -->
  <g
    :blockType="blockData.blockType"
    :class="['block', {'is-dragging': isDragging}]"
    :transform="transform"
    draggable="true"
    @mousedown="dragStart"
    @mousemove="drag"
    @mouseup="dragEnd"
    @dblclick="openSetting"
  >
    <!-- <path class="icon setting" :d="iconType"/> -->
    <g v-if="isProcessBlock">
      <rect class="wrap" :width="blockData.width" :height="blockData.height" rx="5" filter="url(#shadow-offset-grey)"/>
      <rect class="block-title" x="0" y="0" :width="blockData.width" height="25" rx="5"/>
      <g v-if="isSetIO">
        <image :xlink:href="startIcon" x="8" y="30" height="16" width="16" @click="openSetting" @mouseenter="changeIcon(true)" @mouseleave="changeIcon(false)"/>
      </g>
      <image :xlink:href="imgPath" x="158" y="4" height="16" width="16" @click="openSetting"/>
      <image :xlink:href="blockIcon" x="8" y="4" height="16" width="16"/>
      <text v-if="formData.name" x="30" y="16">{{ formData.name | ellipsis }}</text>
    </g>

    <path v-if="isControlsIf" :d="conditionPath" filter="url(#shadow-offset-grey)"/>
    <path v-if="isControlsLoop" :d="loopPath"/>
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
      isDragging: false,
      dragData: {},
      iconType: icons.setting,
      imgPath: '../../static/imgs/setting.png',
      startIcon: '../../static/imgs/startNormal.png',
      conditionPath: 'm 0 0 M 80 0  l 80 35 l -80 35 l -80 -35 l 80 -35  m 0 115  a 5 5 0 1 1 0 10  a 5 5 0 1 1 0 -10 z  m 0 -115 m 0 70 v 114 l 0 20  m 0 0 l 4 -8 m -8 0 l 4 8 m 0 -20m 0 0 l 8 -4 m 0 8 l -8 -4 m 0 0 h 115 m -115 0 m 80 -149 h 35 m 0 0 v 149 ',
      loopPath: 'M 95 0  l 80 35 l -80 35 l -80 -35 l 80 -35  m 0 70 v 114 m 0 0 l -95 0 m 0 0 l 0 -149 m 0 0 l 15 0  m 0 0 l -8 -4 m 0 8 l 8 -4  m 160 0 h 15 m 0 0 v 164 m 0 0 h -96 m 0 0 v 30  m 0 0 l 4 -8 m -8 0 l 4 8 M 95 110  a 5 5 0 1 1 0 10  a 5 5 0 1 1 0 -10 z '
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
      
      this.isDragging = true;
      this.blockData.x = this.originX + (e.clientX - this.dragData.startX);
      this.blockData.y = this.originY + (e.clientY - this.dragData.startY);
    },
    dragEnd() {
      this.startDrag = false;
      this.isDragging = false;
      this.take2Front(this.editIndex);
    },


    openSetting(){
      this.$emit('openSetting', {
        type: 'setting',
        editIndex: this.editIndex
      })
    },

    take2Front(index){
      this.$emit('take2Front', index);
    },

    changeIcon(bool){
      if(bool){
        this.startIcon = '../../static/imgs/startActive.png';

      }else{
        this.startIcon = '../../static/imgs/startNormal.png';
      }
    }
  },
  computed: {
    transform: function() {
      return `translate(${this.blockData.x}, ${this.blockData.y})`;
    },
    blockIcon: function(){
      return `../../static/imgs/${this.blockData.blockType}.png`;
    },
    isControlsIf: function(){
      return /controlsIf/.test(this.blockData.blockType); 
    },
    isControlsLoop: function(){
      return /controlsLoop/.test(this.blockData.blockType); 
    },
    isProcessBlock: function(){
      return !/controls/.test(this.blockData.blockType);
    },
    isSetIO: function(){
      return /setIO/.test(this.blockData.blockType)
    }
  },
  filters: {
    ellipsis: function(v){
      if(v.length > 10){
        return v.slice(0, 10) + '...'
      }else{
        return v;
      }
    }
  }
};
</script>

<style scoped>
.block {
  fill: none;
}
.block.is-dragging{
  cursor: move;
}
.block rect{
  stroke: #999;
  stroke-width: 1;
}
.block .wrap{
  fill: #ffffff;
  stroke: #238efe;
  stroke-width: 2;
}
.block text{
  fill: #ffffff;
}
.block-title{
  fill: #238efe;
  /* fill: #fff; */
  stroke: #ddd;
}
path {
  stroke:#238efe;
    fill: #238efe;
}

.block .icon:hover{
    cursor: pointer;
    fill:aquamarine;
}

.block image:hover{
    cursor: pointer;
}
</style>
