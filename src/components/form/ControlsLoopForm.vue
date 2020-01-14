<template>
  <div id="ControlsLoopForm" class="setting-form">
    <el-tabs v-model="activeName" @tab-click="handleClick">
      <el-tab-pane label="条件" name="first">
        <el-form ref="form" :model="form" label-width="110px">
          <el-form-item label="边缘检测传感器">
            <el-switch v-model="form.delivery"></el-switch>
          </el-form-item>
          <el-form-item label="备注">
            <el-input type="textarea" v-model="form.desc"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="onSubmit">确定</el-button>
            <el-button>取消</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>
     
    </el-tabs>
  </div>
</template>

<script>
export default {
  name: "ControlsLoopForm",
  data() {
    return {
        activeName: 'first',
      form: {
        name1: "",
        name2: "",
        name3: "",
        region: "",
        date1: "",
        date2: "",
        delivery: false,
        type: [],
        resource: "",
        resource2: "",
        desc: "条件1：当检测足球片到达边缘的传感器有信号输入时"
      }
    };
  },
  methods: {
    onSubmit() {
      console.log("submit!");
    },
    handleClick(){}
  }
};
</script>

<style scoped>

</style>
