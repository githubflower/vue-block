<template>
  <div id="ControlsIfForm" class="setting-form">
    <el-tabs v-model="activeName" @tab-click="handleClick">
      <el-tab-pane label="分支1" name="first">
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
      <el-tab-pane label="分支2" name="second">
        <p>a > b</p>
        <el-form ref="form" :model="form" label-width="110px">
          <el-form-item label="a : " prop="resource">
            <el-radio-group v-model="form.resource">
              <el-radio label="已存在的变量"></el-radio>
              <el-radio label="手动输入值"></el-radio>
            </el-radio-group>
            
          </el-form-item>
          <el-form-item label="操作符:" prop="region">
            <el-select v-model="form.region" placeholder="请选择活动区域">
              <el-option label=">" value="shanghai"></el-option>
              <el-option label="<" value="beijing"></el-option>
              <el-option label="=" value="asdfbeijing"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="b : " prop="resource">
            <el-radio-group v-model="form.resource2">
              <el-radio label="已存在的变量"></el-radio>
              <el-radio label="手动输入值"></el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
export default {
  name: "ControlsIfForm",
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
