<template>
  <div id="IOPage">
    <span>IO 20103状态：</span>
    <el-switch v-model="status" active-color="#13ce66" inactive-color="#DCDFE6"></el-switch>

    <el-button type="primary" @click="refresh" style="display: block; margin-left: 100px;margin-top:50px;">刷新</el-button>
    <el-button type="primary" @click="setBp" >设置断点</el-button>
  </div>
</template>

<script>
export default {
  name: "IOPage",

  data() {
    return {
      status: false,
    };
  },

  methods: {
    getStatus() {
      this.axios({
        url: "/service/getStatus",
        method: "post",
        data: {
          port: "20103",
        },
      }).then((res) => {
        this.status = !!res.data.data;
      });
    },
    refresh(){
        this.getStatus();
    },
    setBp(){
      this.axios({
        url: "/service/setBreakpoint",
        method: "post",
        data: {
          port: "20103",
          line: 23
        },
      }).then((res) => {
        console.log(res);
      });
    }
  },
  created(){
    //   this.getStatus();
  }
};
</script>

<style scoped>
#IOPage{
    margin-top: 100px;
}
span{
    margin-left: 100px;
    position: relative;
    top: 1px;
}
</style>
