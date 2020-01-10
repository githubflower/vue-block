<template>
  <!-- <div id="formdiv"> -->
      <!-- <svg xmlns="http://www.w3.org/2000/svg"> -->
        <rect class="connectGuideSvg" x="0" y="100"  width="100" height="40" :stroke="rectData" ></rect>
      <!-- </svg> -->
  <!-- </div> -->
</template>

<script>
export default {
  name: "RectComp",
  data() {
    return {
      rectData: '#666'
    };
  },
  created(){
    window.bb = this;
  }
};
</script>

<style scoped>

</style>
