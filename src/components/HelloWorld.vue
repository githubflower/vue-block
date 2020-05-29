<template>
  <div class="hello">
    <div class="block" style="display: none;">
      变量 age
      <div id="set" class="set" @click="showForm = !showForm">赋值</div>
      
      <div class="form" v-if="showForm">
        <label for="dataType">数据类型</label>
        <select name="dataType">
          <option>Number</option>
          <option>String</option>
          <option>Boolean</option>
        </select>
        <br/>
        <label for="inputType">赋值方式</label>
        <select name="inputType">
          <option value="1" selected>自定义输入</option>
          <option value="2" >选择变量</option>
        </select>
        <input type="text" name="dataValue" id=""/>
        <label for="vars">变量</label>
        <select name="vars">
          <option value="1" selected>18</option>
          <option value="2" >19</option>
          <option value="3" >20</option>
        </select>
      </div>
    </div>
    <el-tabs v-model="activeName"  type="card" @tab-click="handleClick">
        <el-tab-pane label="运行状态" name="first">
         
        </el-tab-pane>
        <el-tab-pane label="代码编辑" name="second"></el-tab-pane>
      </el-tabs>
  </div>
</template>

<script>
export default {
  name: "HelloWorld",
  data() {
    return {
      activeName: 'first',
      showForm: false
    };
  },
  methods: {
    handleClick() {}
  }
};
</script>

<style scoped>
.hello div {
  /* border: 1px solid #222; */
}
.block {
  width: 200px;
  height: 80px;
  text-align: center;
  line-height: 80px;
  border: 1px solid #222;
  position: relative;
}
.set {
  position: absolute;
  top: 5px;
  right: 5px;
  height: 20px;
  line-height: 20px;
}
.form {
  position: absolute;
  top: 25px;
  right: 5px;
  z-index: 2;
  background-color: bisque;
  text-align: left;
  line-height: 30px;
}
.show {
  display: block;
}
.hide {
  display: none;
}
</style>
