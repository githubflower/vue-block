<template>
  <div id="projectManagementPanel" :class="isCollapsed ? 'is-collapsed' : 'is-expanded'" @mouseenter="expandPanel">
    <el-tree
      v-show="!isCollapsed"
      :data="data"
      :props="defaultProps"
      @node-click="handleNodeClick"
    ></el-tree>
    <i :class="['icon', { 'el-icon-arrow-right': isCollapsed, 'el-icon-arrow-left': !isCollapsed }]" @click="isCollapsed = !isCollapsed"></i>
  </div>
</template>
<script>
export default {
  name: "ProjectManagementPanel",
  data() {
    return {
      isCollapsed: true,
      data: [
        {
          label: "一级 1",
          children: [
            {
              label: "二级 1-1",
              children: [
                {
                  label: "三级 1-1-1",
                },
              ],
            },
          ],
        },
        {
          label: "一级 2",
          children: [
            {
              label: "二级 2-1",
              children: [
                {
                  label: "三级 2-1-1",
                },
              ],
            },
            {
              label: "二级 2-2",
              children: [
                {
                  label: "三级 2-2-1",
                },
              ],
            },
          ],
        },
        {
          label: "一级 3",
          children: [
            {
              label: "二级 3-1",
              children: [
                {
                  label: "三级 3-1-1",
                },
              ],
            },
            {
              label: "二级 3-2",
              children: [
                {
                  label: "三级 3-2-1",
                },
              ],
            },
          ],
        },
      ],
      defaultProps: {
        children: "children",
        label: "label",
      },
    };
  },
  methods: {
    handleNodeClick(data) {
      console.log(data);
    },
    expandPanel(){
        if(this.isCollapsed){
            this.isCollapsed = !this.isCollapsed;
        }
    }
  },
};
</script>
<style scoped>
@keyframes myease1{
    0%{
        width: 0;
    }
    50%{
        width: 280px;
    }
    100%{
        width: 250px;
    }
}


#projectManagementPanel {
  position: fixed;
  left: 0px;
  height: 100%;
  /* padding: 5px; */
  border: 1px solid #487afe;
  z-index: 10;
  background-color: #ffffff;
}
#projectManagementPanel.is-collapsed{
    width: 0px;
}
#projectManagementPanel.is-expanded{
    width: 250px;
    /* animation: name duration timing-function delay iteration-count direction fill-mode; */
    animation: myease1 .2s ;
    /* animation: myease 1s ease-in 0 1 direction fill-mode; */
}
#projectManagementPanel .icon{
    position: absolute;
    right: -15px;
    top: 50%;
    width: 30px;
    height: 30px;
    line-height: 30px;
    text-align: center;
    background-color: #fff;
    cursor: pointer;
    border-radius: 15px;
}
</style>