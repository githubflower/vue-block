<template>
  <div id="MotionForm">
    <el-form ref="form" :model="block.formData" label-width="110px">
      <el-form-item label="模块名称">
        <el-input type="text" v-model="block.formData.name"></el-input>
      </el-form-item>
      <el-tabs v-model="activeName" @tab-click="handleClick">
        <el-tab-pane label="位置1" name="first">
          <el-form-item label="点位信息来源">
            <el-select v-model="block.formData.region" placeholder="请选择点位信息来源">
              <el-option label="手动输入" value="shanghai"></el-option>
              <el-option label="从已存在的点位导入" value="beijing"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="X">
            <el-input v-model="block.formData.name1" style="width: 150px;"></el-input>
          </el-form-item>
          <el-form-item label="Y">
            <el-input v-model="block.formData.name2" style="width: 150px;"></el-input>
          </el-form-item>
          <el-form-item label="Z">
            <el-input v-model="block.formData.name3" style="width: 150px;"></el-input>
          </el-form-item>

          <el-form-item label="直线运动">
            <el-switch v-model="block.formData.delivery"></el-switch>
          </el-form-item>
          <el-form-item label="备注">
            <el-input type="textarea" v-model="block.formData.desc"></el-input>
          </el-form-item>
        </el-tab-pane>
        <el-tab-pane label="位置2" name="second">TODO</el-tab-pane>
      </el-tabs>
    </el-form>
    <div style="text-align: center;">
      <el-button type="primary" @click="onSubmit">确定</el-button>
      <el-button @click="onCancel">取消</el-button>
    </div>
  </div>
</template>

<script>
export default {
  name: "MotionForm",
  props: {
    block: {
      type: Object
    }
  },
  data() {
    return {
      activeName: "first",
      formData: {
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
      this.$emit('onSubmit', this.block.formData);
      console.log("submit!");
    },
    onCancel(){
        this.$emit('onClose');
    },
    handleClick() {}
  }
};
</script>

<style scoped>
</style>
