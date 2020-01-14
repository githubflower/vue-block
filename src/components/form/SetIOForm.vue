<template>
  <div id="SetIOForm">
        <el-form ref="form" :model="block.formData" label-width="110px">
          <el-form-item label="模块名称">
            <el-input type="text" v-model="block.formData.name"></el-input>
          </el-form-item>
          <el-form-item label="机器人IO">
            <el-select v-model="block.formData.ioKey" placeholder="请选择IO">
              <el-option label="1001" value="1001"></el-option>
              <el-option label="1002" value="1002"></el-option>
              <el-option label="1003" value="1003"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="设置状态">
            <el-switch v-model="block.formData.ioValue"></el-switch>
          </el-form-item>
          <el-form-item label="备注">
            <el-input type="textarea" v-model="block.formData.desc"></el-input>
          </el-form-item>
        </el-form>

    <div style="text-align: center;">
      <el-button type="primary" @click="onSubmit">确定</el-button>
      <el-button @click="onCancel">取消</el-button>
    </div>
  </div>
</template>

<script>
export default {
  name: "SetIOForm",
  props: {
    block: {
      type: Object
    }
  },
  data() {
    return {
        /* formData: {

        }, */
    }
  },
  methods: {
    onSubmit() {
      this.$emit('onSubmit', this.block.formData);
      console.log("submit!");
    },
    onCancel(){
        this.$emit('onClose');
    },
    handleClick(){}
  }
};
</script>

<style scoped>
#SetIOForm{
    width: 300px;
}
</style>
