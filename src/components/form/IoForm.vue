<template>
  <div id="IoForm">
        <el-form ref="form" :model="formData" label-width="110px">
          <el-form-item label="模块名称">
            <el-input type="text" v-model="formData.name"></el-input>
          </el-form-item>
          <el-form-item label="机器人IO">
            <el-select v-model="formData.ioKey" placeholder="请选择IO">
              <el-option label="1001" value="1001"></el-option>
              <el-option label="1002" value="1002"></el-option>
              <el-option label="1003" value="1003"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="设置状态">
            <el-switch v-model="formData.ioValue"></el-switch>
          </el-form-item>
          <el-form-item label="备注">
            <el-input type="textarea" v-model="formData.desc"></el-input>
          </el-form-item>
        </el-form>

    <div style="text-align: center;">
      <el-button type="primary" @click="onSubmit">确定</el-button>
      <el-button>取消</el-button>
    </div>
  </div>
</template>

<script>
export default {
  name: "IoForm",
  data() {
    return {
        formData: {

        },
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
        desc: ""
      }
    };
  },
  methods: {
    onSubmit() {
      this.$emit('onSubmit', this.formData);
      console.log("submit!");
    },
    handleClick(){}
  }
};
</script>

<style scoped>
#IoForm{
    width: 300px;
}
</style>
