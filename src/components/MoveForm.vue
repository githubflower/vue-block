<template>
  <div id="moveForm">
    <el-tabs v-model="activeName" @tab-click="handleClick">
      <!-- <el-tab-pane label="位置1" name="first">
        <el-form ref="form" :model="form" label-width="110px">
          <el-form-item label="点位信息来源">
            <el-select v-model="form.region" placeholder="请选择点位信息来源">
              <el-option label="手动输入" value="shanghai"></el-option>
              <el-option label="从已存在的点位导入" value="beijing"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="X">
            <el-input v-model="form.name1" style="width: 150px;"></el-input>
          </el-form-item>
          <el-form-item label="Y">
            <el-input v-model="form.name2" style="width: 150px;"></el-input>
          </el-form-item>
          <el-form-item label="Z">
            <el-input v-model="form.name3" style="width: 150px;"></el-input>
          </el-form-item>
        
          <el-form-item label="直线运动">
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
      <el-tab-pane label="位置2" name="second">TODO</el-tab-pane> -->
      <el-tab-pane label="变量" name="n1">TODO</el-tab-pane>
      <el-tab-pane label="函数" name="n2">TODO</el-tab-pane>
      <el-tab-pane label="逻辑" name="n3">TODO</el-tab-pane>
      <el-tab-pane label="循环" name="n4">TODO</el-tab-pane>
      <el-tab-pane label="运算" name="n5">TODO</el-tab-pane>
      <el-tab-pane label="线程" name="n6">TODO</el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
export default {
  name: "MoveForm",
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
        desc: ""
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
#moveForm {
  width: 400px;
  padding: 20px;
  border: 1px solid #666;
  border-radius: 5px;
  box-shadow: 3px 3px 5px #666;
}
/* .el-select{
    display: block
} */
</style>
