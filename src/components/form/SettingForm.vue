<template>
  <div id="SettingForm">
    <el-row class="toolbar">
      <el-col :span="22">
        <span style="font-weight: bold;">参数设置</span>
      </el-col>
      <el-col :span="2">
        <el-button icon="el-icon-close" @click="onClose"></el-button>
      </el-col>
    </el-row>
    <component :is="activeForm" @onSubmit="onSubmit"></component>
  </div>
</template>

<script>
import IoForm from "./IoForm";
export default {
  name: "SettingForm",
  components: {
    IoForm
  },
  data() {
    return {
      activeForm: "IoForm"
    };
  },
  methods: {
    onClose() {
      this.$emit("onClose");
    },

    onSubmit(data){
        this.$emit('onSubmit', data);
        this.$emit("onClose");
    }
  }
};
</script>

<style scoped>
.el-button--small,
.el-button--small.is-round {
  padding: 5px 5px;
}
#SettingForm {
  position: absolute;
  top: 0px;
  right: 0px;
  padding: 20px;
  /* padding-top: 10px; */
  border: 1px solid #999;
  border-radius: 5px;
  box-shadow: 3px 3px 3px #999;
}
.toolbar button {
  float: right;
  margin-bottom: 15px;
}
</style>
