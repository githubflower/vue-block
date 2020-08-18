<template>
  <div id="formdiv">
    <loop-div :stateData="stateData" :index="index" :threadIndex="threadIndex"></loop-div>
  </div>
</template>

<script>
import LoopDiv from "@/components/demos/LoopDiv";
export default {
  name: "HelloWorld",
  components: {
    LoopDiv
  },
  data() {
    return {
      stateData: {
        stateId: "custom-state-id",
        name: "流水线视觉定位",
        inputAry: [],
        outputAry: [],
        x: 5,
        y: 0
      },
      index: 0,
      threadIndex: 0
    };
  }
};
</script>

<style scoped>
#formdiv{
  position: relative;
  top:100px;
}
</style>
