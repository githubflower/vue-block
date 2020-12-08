<template>
  <div id="ctrlPanel" :class="isExpanded ? 'is-expanded' : 'is-collapsed'">
    <ul class="inner-shadow">
      <!-- <li v-show="isExpanded" class="power-on" :style="{ backgroundImage: `url(${ powerOnIcon })` }">上电</li> -->
      <!-- <li v-show="isExpanded" class="reset" :style="{ backgroundImage: `url(${ resetIcon })` }">回零</li> -->
      <!-- <li class="emergency-stop" :style="{ backgroundImage: `url(${ emergencyStopIcon })` }">急停</li> -->
     <!--  <li class="emergency-stop" draggable="true">
        <span class="text">急停</span>
      </li> -->
      <li>
         <el-button type="danger">急 停</el-button>
      </li>
    </ul>
    <!-- <span class="title">Robot控制</span> -->
    <!-- <div class="line" @mouseenter="expandPanel"></div> -->
    <!-- v-show="isExpanded" -->
    <i
      :class="[
        'icon',
        {
          'el-icon-arrow-right': isExpanded,
          'el-icon-arrow-left': !isExpanded,
        },
      ]"
      @click="isExpanded = !isExpanded"
    ></i>
  </div>
</template>
<script>
export default {
  name: "CtrlPanel",
  data() {
    return {
      isExpanded: false,
      powerOnIcon: "../../../static/imgs/ctrl/power_on_x48.png",
      resetIcon: "../../../static/imgs/ctrl/reset1_x48.png",
      emergencyStopIcon: "../../../static/imgs/ctrl/emergency_stop_x64.png",
    };
  },
  methods: {
    handleNodeClick(data) {
      console.log(data);
    },
    expandPanel() {
      if (!this.isExpanded) {
        this.isExpanded = !this.isExpanded;
      }
    },
  },
};
</script>
<style lang="less">
@keyframes myease {
  0% {
    width: 0;
  }
  50% {
    width: 380px;
  }
  100% {
    width: 350px;
  }
}
@keyframes anticlockwiseRotate {
  from {
    transform: rotate(0);
  }
  to {
    transform: rotate(-720deg);
  }
}
@keyframes clockwiseRotate {
  from {
    transform: rotate(0);
  }
  to {
    transform: rotate(360deg);
  }
}
@keyframes anticlockwiseRotate360 {
  from {
    transform: rotate(0);
  }
  to {
    transform: rotate(-360deg);
  }
}

@menuHeight: 60px;
@btnHeight: 40px;
// @panelBgColor: #272B42;
// @panelBgColor: #1B2143;
@panelBgColor: #344b89;
#ctrlPanel {
  position: fixed;
  top: @menuHeight;
  right: 0px;
  z-index: 1;
  //   background-color: #0a0b44;
  background-color: @panelBgColor;
  border-left: 1px solid #aaa;
  transition: all 0.2s;
  .title {
    width: auto;
    display: block;
    color: #ffffff;
    transform: rotate(90deg);
    position: absolute;
    bottom: 0;
    right: 0;
  }
  &.is-collapsed {
    width: 0;
    height: calc(100% - @menuHeight);
    .icon {
      left: -20px;
    }
  }
  &.is-expanded {
    top: @menuHeight;
    width: 350px;
    height: calc(100% - @menuHeight);
    // border: 1px solid #487afe;
    animation: myease 0.2s;
    .icon {
      left: -15px;
    }
  }
  .icon {
    position: absolute;
    left: -10px;
    top: 50%;
    width: 30px;
    height: 30px;
    line-height: 30px;
    text-align: center;
    background-color: #fff;
    cursor: pointer;
    border-radius: 15px;
    transform: translateY(-50%);
  }
}
.line {
  position: absolute;
  right: 0;
  width: 0px;
  height: 100%;
  /* document.body.clientHeight todo */
  border: 1px solid #aaa;
  //   box-shadow: 0px 0px 10px 5px #7898f9;
}

.inner-shadow {
  position: absolute;
  top: -50px;
  right: 0;
}
.inner-shadow li {
  display: block;
  text-align: center;
  background-repeat: no-repeat;
  background-position: center center;
  cursor: pointer;
}
li.power-on {
  border: 1px solid #00ffff;
  color: #00ffff;
  box-shadow: inset 0 0 25px 0px #00ffff;
}
li.reset {
  border: 1px solid #487afe;
  /* color: #2962FB; */
  color: #487afe;
  box-shadow: inset 0 0 25px 0px #487afe;
}
li.emergency-stop {
  border-radius: 3px;
  background-color: #ff2312;
  .text {
    display: block;
    width: 60px;
    height: @btnHeight;
    line-height: @btnHeight;
    text-align: center;
    font-weight: bold;
    color: #f7e016;
    border: 1px solid #ff2312;
    z-index: 1;
    transition: all 0.3s;
   /*  &:hover {
      box-shadow: 0 0 25px 5px #ff0000;
    } */
  }
}
.el-button--danger{
  padding-left: 30px;
  padding-right: 30px;
  background-color: #ff2312;
  border-color: #ff2312;
  font-size: 16px;
  font-weight: bold;
}
</style>