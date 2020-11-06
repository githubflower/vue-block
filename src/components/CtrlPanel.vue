<template>
    <div id="ctrlPanel" :class="isExpanded ? 'is-expanded' : 'is-collapsed'">
        <ul class="inner-shadow">
            <!-- <li v-show="isExpanded" class="power-on" :style="{ backgroundImage: `url(${ powerOnIcon })` }">上电</li> -->
            <!-- <li v-show="isExpanded" class="reset" :style="{ backgroundImage: `url(${ resetIcon })` }">回零</li> -->
            <!-- <li class="emergency-stop" :style="{ backgroundImage: `url(${ emergencyStopIcon })` }">急停</li> -->
            <li class="emergency-stop">
                <div class="shadow"></div>
                <span class="text">急停</span>
            </li>
        </ul>
        <!-- <span class="title">Robot控制</span> -->
        <div class="line" @mouseenter="expandPanel"></div>
        <i v-show="isExpanded" :class="['icon', { 'el-icon-arrow-right': isExpanded, 'el-icon-arrow-left': !isExpanded }]" @click="isExpanded = !isExpanded"></i>
    </div>
</template>
<script>
export default{
    name: 'CtrlPanel',
    data(){
        return {
            isExpanded: false,
            powerOnIcon: '../../../static/imgs/ctrl/power_on_x48.png',
            resetIcon: '../../../static/imgs/ctrl/reset1_x48.png',
            emergencyStopIcon: '../../../static/imgs/ctrl/emergency_stop_x64.png',
        }
    },
    methods: {
        handleNodeClick(data) {
        console.log(data);
        },
        expandPanel(){
            if(!this.isExpanded){
                this.isExpanded = !this.isExpanded;
            }
        }
    },
}
</script>
<style>
@keyframes myease{
    0%{
        width: 0;
    }
    50%{
        width: 380px;
    }
    100%{
        width: 350px;
    }
}
@keyframes anticlockwiseRotate{
    from{
        transform: rotate(0);
    }
    to{
        transform: rotate(-720deg);
    }
}
@keyframes clockwiseRotate{
    from{
        transform: rotate(0);
    }
    to{
        transform: rotate(360deg);
    }
}
@keyframes anticlockwiseRotate360{
    from{
        transform: rotate(0);
    }
    to{
        transform: rotate(-360deg);
    }
}

#ctrlPanel{
    position: fixed;
    top: 0;
    right: 0px;
    z-index: 1;
    background-color: #0A0B44;
   
}
#ctrlPanel .title{
    width: auto;
    display: block;
    color: #ffffff;
    transform: rotate(90deg);
    position: absolute;
    bottom: 0;
    right: 0;
}
.line{
    position: absolute;
    right: 0;
    width: 0px;
    height: 1080px;
    /* document.body.clientHeight todo */
    border: 1px solid #4DD0FC;
    box-shadow: 0px 0px 10px 5px #7898F9;
}
#ctrlPanel.is-collapsed{
    width: 80px;
    /* height: 80px; */
}
#ctrlPanel.is-expanded{
    top: 0;
    width: 350px;
     height: 100%;
     border: 1px solid #487AFE;
      animation: myease .2s ;
}
.inner-shadow{
      position: absolute;
      top: 462px;
      right: 0;
}
.inner-shadow li{
  
    display: block;
    width: 60px;
    height: 60px;
    line-height: 60px;
    text-align: center;
    border-radius: 30px;;
   /*  border: 1px solid #00FFFF;
    color: #00FFFF;
    box-shadow: inset 0 0 25px 0px #00FFFF; */
    background-repeat: no-repeat;
    background-position: center center;
    cursor: pointer;
}
li.power-on{
    border: 1px solid #00FFFF;
    color: #00FFFF;
    box-shadow: inset 0 0 25px 0px #00FFFF;
}
li.reset{
    border: 1px solid #487AFE;
    /* color: #2962FB; */
    color: #487AFE;
    box-shadow: inset 0 0 25px 0px #487AFE;
}
li.emergency-stop{
    /* border-radius: 10px; */
    position: relative;
    padding: 10px;
    border: 2px dashed #ff0000;
    border-radius: 42px;
    /* animation: clockwiseRotate 8s linear infinite; */
    /* box-shadow: inset 0 0 25px 0px #00FFFF; */
}
li.emergency-stop .shadow{
    position: absolute;
    width: 60px;
    height: 60px;
    top: 10px;
    left: 10px;
    line-height: 60px;
    text-align: center;
    border-radius: 30px;;
    border: 0px dashed #ff0000;
    color: #FF2312;
    /* box-shadow: inset 0 0 25px 0px #ff0000; */
    box-shadow: 0 0 25px 0px #ff0000;
    background-position: center center;
    animation: anticlockwiseRotate 20s linear infinite;
}
li.emergency-stop .text{
    width: 60px;
    height: 60px;
    text-align: center;
    display: block;
    position: absolute;
    font-weight: bold;
    top: 10px;
    left: 10px;
    /* transform: translate(-50%, -50%); */
    color: #FFFFFF;
    background-color: #FF2312;
    border-radius: 60px;
    /* animation: anticlockwiseRotate360 8s linear infinite; */
    z-index: 1;
    
}
#ctrlPanel .icon{
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
</style>