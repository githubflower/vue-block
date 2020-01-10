<template>
  <div id="formdiv">
    <svg xmlns="http://www.w3.org/2000/svg">
        <g>
            <path class="fill-to-change" d=" m 200,0  v 50 m 0 0 m 0 -8l -5 0 l 5 8 l 5 -8 l -5 0 z " />
            <path class="stroke-to-change" d="m 20 0 h 60 a 20 20 0 1 1 0 40 h -60 a 20 20 0 1 1 0 -40 z  " :fill="fillData"/>
        </g>
        <RectComp/>
    </svg>
  </div>
</template>

<script>
import RectComp from './RectComp'
export default {
  name: "FlowCanvas",
  components: {
      RectComp
  },
  data() {
    return {
      fillData: '#ff00cc'
    };
  },
  created(){
      window.aa = this;
  }
};
</script>

<style scoped>
#formdiv{
    position: absolute;
    top: 0;
    left: 0;
    padding: 10px;
    border: 1px solid #666;
}
#formDivInput{
  width: 100px;
}
</style>
