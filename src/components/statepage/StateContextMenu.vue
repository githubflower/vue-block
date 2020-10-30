<template>
  <div class="menu-wrap" :style="{top: xy.y + 'px', left: xy.x + 'px'}">
    <el-form>
      <el-form-item>
        <el-button type="primary" @click="deleteStateFn">删除</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
export default {
  name: "StateContextMenu",
  props: ['xy'],
  data() {
    return {

    };
  },
  methods: {
    deleteStateFn(index) {
      this.$emit('deleteStateFn')
    },
  
  },
};
</script>

<style>
.menu-wrap {
  position: absolute;
  width: 0;
  z-index: 1;
}
.line-context-menu {
  /*  position: absolute;
  top: 0;
  left: 0; */
  width: 120px;
  border-radius: 4px;
  background-color: #ffffff;
}
.line-context-menu li {
  list-style: none;
  padding: 5px 10px;
}
.line-context-menu li:hover {
  background-color: #e6f7ff;
  cursor: pointer;
}
</style>