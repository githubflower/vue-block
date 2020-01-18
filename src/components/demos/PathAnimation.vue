<template>
  <div id="PathAnimation">
    <svg xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
      <path class="test" d="m 100.5 100.5 l 200 0  v 50 l 200 0 m 0 0 z " stroke="#ff55cc" />
    </svg>
  </div>
</template>

<script>
export default {
  name: "PathAnimation",
  data() {
    return {};
  }
};
</script>

<style>
.svg {
  width: 100%;
  height: 800px;
  border: 1px solid #909399;
}


path.test{
  fill: none;
  stroke-width: 3;
  stroke-dasharray: 10 10;
  
  animation: run-right 8s linear forwards infinite normal;
  animation-fill-mode: none;
}
@keyframes run-right{
  0%{
    stroke-dashoffset: 650;
  }
  100%{
    stroke-dashoffset: 0;
    /* stroke-dasharray: 650px 0px; */
  }
}
</style>
