<template>
  <g id="ConditionBlock">
      <path :d="conditionPath"/>
  </g>
</template>

<script>
const a = 90;
const b = 35;
export default {
  name: "ConditionBlock",
  data() {
    return {
      
    };
  },
  methods: {
      drawDiamond(){
        return ` l ${a} ${b} l -${a} ${b} l -${a} -${b} l ${a} -${b} `;
      },
      drawBranch(){

      }
  },
  computed: {
      conditionPath: function(){
          let path = '';
          return path;
      }
  }
};
</script>

<style scoped>

</style>
