<template>
    <div id="ctrlPanel">
        <ul class="inner-shadow">
            <li v-show="isExpanded" class="power-on" :style="{ backgroundImage: `url(${ powerOnIcon })` }"><!-- 上电 --></li>
            <li v-show="isExpanded" class="reset" :style="{ backgroundImage: `url(${ resetIcon })` }"><!-- 回零 --></li>
            <li class="emergency-stop" :style="{ backgroundImage: `url(${ emergencyStopIcon })` }"><!-- 急停 --></li>
        </ul>
    </div>
</template>
<script>
export default{
    name: 'CtrlPanel',
    data(){
        return {
            // isCollapsed: true,
            isExpanded: false,
            powerOnIcon: '../../../static/imgs/ctrl/power_on_x48.png',
            resetIcon: '../../../static/imgs/ctrl/reset1_x48.png',
            emergencyStopIcon: '../../../static/imgs/ctrl/emergency_stop_x64.png',
        }
    }
}
</script>
<style>
#ctrlPanel{
    position: fixed;
    right: 5px;
    /* width: 800px; */
    height: 100px;
    padding: 10px;
    border: 1px solid #487AFE;
}
.inner-shadow li{
    display: block;
    width: 60px;
    height: 60px;
    line-height: 60px;
    text-align: center;
    border-radius: 30px;;
    border: 1px solid #00FFFF;
    color: #00FFFF;
    box-shadow: inset 0 0 25px 0px #00FFFF;
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
    border: 1px solid #FF2312;
    color: #FF2312;
    box-shadow: inset 0 0 25px 0px #FF2312;
    background-position: center center;
}

</style>