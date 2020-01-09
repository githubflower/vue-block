<template>
  <div id="formdiv">
    <label for="inputType">赋值方式</label>
    <select name="inputType">
        <option value="1" selected>自定义输入</option>
        <option value="2" >已存在的变量</option>
    </select>
    <input type="text" name="dataValue" id="formDivInput"/>
    <br/>
    <input type="button" value="确定" id="confirmBtn">
    <input type="button" value="取消" id="cancelBtn">
  </div>
</template>

<script>
export default {
  name: "HelloWorld",
  data() {
    return {
      showForm: false
    };
  }
};
</script>

<style scoped>
#formdiv{
    position: absolute;
    top: 0;
    left: 0;
    padding: 10px;
    border: 1px solid #ff0000;
}
#formDivInput{
  width: 100px;
}
</style>
