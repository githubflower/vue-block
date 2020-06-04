<template>
    <div class="main">
        <div class="toolbox">
            <el-button type="primary" plain @click="addThread">线程</el-button>
            <el-button type="primary" plain @click="addState">状态</el-button>
        </div>
        <div class="content">
            <svg xmlns="http://www.w3.org/2000/svg">
                <g>
                   
                    <foreignObject y="0" width="100%" height="300" @mousemove="onConnecting">
                        <h4 class="title">线程名称</h4>
                        <div class="thread-body">
                            <state-div v-for="(stateItem, index) in stateAry" :key="index" :stateData="stateItem"></state-div>
                        </div>
                    </foreignObject>
                    <g>
                        <path d="" class="templine"></path>
                    </g>
                    <!-- <path d="m 150.5 50.5 l 50 0 z" stroke="#00ffff"></path> -->
                    <g v-if="false" v-for="(index) in threadCount" :key="index" class="thread-grp" :transform="generateDefaultPos(index)">
                        <rect class="thread"></rect>
                        <rect class="title"></rect>
                        <text x="15" y="23">{{ '线程名称' + index }}</text>
                        <state-block v-for="(index2) in stateCount" :key="index2"  :transformValue="generateStatePos(index2)">
                            <rect class="state" width="90" height="40" ></rect>
                            <text x="5" y="16">开始</text>
                            <!--text在垂直方向默认是以文字中间对齐的 -->
                        </state-block>
                    </g>
                </g>
            </svg>
        </div>
    </div>
</template>

<script>
// import MyPlainDraggable from 'plain-draggable'
// import MyPlainDraggable from 'plain-draggable/plain-draggable.esm.js'
import StateBlock from './StateBlock'
import StateDiv from './StateDiv'
export default {
    name: 'StatePage',
    components: {
        StateBlock,
        StateDiv
    },
    data(){
        return {
            threadCount: 1,
            stateAry: [{
                name: '流水线视觉定位',
                inCount: 1,
                outCount: 2
            },{
                name: '取料',
                inCount: 2,
                outCount: 2
            },{
                name: '状态名称很长的时候会显示省略号鼠标放上去显示详细描述',
                inCount: 3,
                outCount: 1
            }]
        }
    },
    methods: {
        addThread(){
            console.log('---add thread---');
            this.threadCount++;
        },
        addState(){
            this.stateAry.push({
                name: '状态',
                inCount: 0,
                outCount: 0
            });
        },
        generateDefaultPos(index){
            const gap = 35;
            return `translate(50, ${(300 + gap) * (index - 1)})`;
        },
        generateStatePos(index){
            const gapX = 60;
            return `translate(${(90 + gapX) * (index - 1)}, 40)`;
        },
        onConnecting(e){
            console.log(e.button, e.buttons);
            // if(stateManage.isConnecting){
                //检测鼠标左键是否仍是按下状态    ===1 说明鼠标左键被按下后未松开
                if(e.buttons === 1){
                    //绘制临时的连接线
                    stateManage.isConnecting = true;
                    stateManage.curPoint = {
                        x: e.target.offsetLeft + e.offsetX, // e.clientX,
                        y: e.target.offsetTop + e.offsetY // e.clientY
                    };
                    console.log(stateManage.curPoint);
                    this.drawTempLine();
                }else{
                    stateManage.isConnecting = false;
                    return;
                }
            // }
        },
        drawTempLine(){
            var templine = document.getElementsByClassName('templine')[0];
            templine.setAttribute('d', `M ${stateManage.startPoint.x} ${stateManage.startPoint.y} L ${stateManage.curPoint.x} ${stateManage.curPoint.y}`);
        }
    },
    mounted(){
        var elm = document.querySelector('#test');
        if(elm){
            window.stateBlock = new PlainDraggable(elm);
        }
      
        window.statePageVue = this;

        var states = document.getElementsByClassName('state-div');
        // this.$nextTick(function(){
            var lineOption = {
                color: '#aaaaaa',
                size: 2,
                startSocket: 'right',
                endSocket: 'left',
                path: 'grid'
            }
            window.line = new LeaderLine(states[0], states[1], lineOption);

            window.line2 =  new LeaderLine(states[0], states[2], lineOption);
        // })
    },
    computed: {
        showTempLine: function(){
console.log( window.stateManage.isConnecting);
            return window.stateManage.isConnecting;
        }
    }
}
</script>

<style>
foreignObject{
    border: 1px solid rgba(0,219,255,.42);
}
h4.title {
    margin: 0;
    width: 100%;
    height: 35px;
    color: #ffffff;
    background-color: rgba(0,219,255,.42);
}
.thread-body{
    /* height: calc(100% -35px); */
    height: 265px;
}

.toolbox{
    padding: 10px;
    border: 1px solid #ebebeb;
    border-radius: 3px;
}
.content{
    height: 800px;
}
.content > svg{
 width: 100%; 
 height: calc(100%);
 border: 1px solid blueviolet;
 background-color: #001F3A;
}

.thread{
    width: 800px;
    height: 300px;
    stroke: #00DBFF;
    stroke-width: 1;
    fill: none;
}
.title{
    width: 800px;
    height: 35px;
    fill: #00DBFF;
    fill-opacity: .42;
}

text{
    fill: #FFFFFF;
}

.state{
    stroke: #AAAAAA;
    stroke-width: 1;
    fill: #00DBFF;
}
.templine{
    stroke: #ff0000;
    stroke-width: 1px;
}

</style>    