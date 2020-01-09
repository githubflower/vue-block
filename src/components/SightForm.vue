<template>
  <div id="SightForm" class="setting-form">
    <el-tabs v-model="activeName" @tab-click="handleClick">
        <p>纠偏参考信息设置</p>
        <el-form ref="form" :model="form" label-width="110px">
          <el-form-item label="关节1坐标">
            <el-input type="text" v-model="form.desc"></el-input>
          </el-form-item>
          <el-form-item label="关节2坐标">
            <el-input type="text" v-model="form.desc2"></el-input>
          </el-form-item>
          <el-form-item label="关节3坐标">
            <el-input type="text" v-model="form.desc3"></el-input>
          </el-form-item>
          <el-form-item label="关节4坐标">
            <el-input type="text" v-model="form.desc4"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="onSubmit">确定</el-button>
            <el-button>取消</el-button>
          </el-form-item>
        </el-form>
     
    </el-tabs>
  </div>
</template>

<script>
export default {
  name: "SightForm",
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
.setting-form {
  width: 400px;
  padding: 20px;
  padding-top: 0;
  border: 1px solid #666;
  border-radius: 5px;
  box-shadow: 3px 3px 5px #666;
}
/* .el-select{
    display: block
} */
</style>
