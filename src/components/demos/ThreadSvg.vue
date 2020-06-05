<template>
    <svg xmlns="http://www.w3.org/2000/svg" :height="thread.height" :id="thread.id" class="thread-svg">
        <!-- <g class="thread-wrap" v-for="(thread, i) in threadAry" :key="i"> -->
            <foreignObject y="0" width="100%" :height="thread.height" @mousemove="onConnecting" @mouseup="onMouseup" >
                <h4 class="title">{{ thread.name }}</h4>
                <div class="thread-body">
                    <state-div v-for="(stateItem, index) in thread.stateAry" :key="index" :stateData="stateItem"></state-div>
                </div>
            </foreignObject>
            <g v-show="showTempLine">
                <path d="" class="templine"></path>
            </g>
        <!-- </g> -->
    </svg>
</template>

<script>
// import MyPlainDraggable from 'plain-draggable'
// import MyPlainDraggable from 'plain-draggable/plain-draggable.esm.js'
import StateDiv from './StateDiv'
export default {
    name: 'ThreadSvg',
    props: ['thread'],
    components: {
        StateDiv
    },
    data(){
        return {
            showTempLine: false,
            threadCount: 1,
            threadAry: [
                {
                    name: '线程名称1',
                    height: 300,
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
                },
                {
                    name: '线程名称2',
                    height: 500,
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
            ],
        }
    },
    methods: {
      
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
            if(stateManage.isConnecting){
                //检测鼠标左键是否仍是按下状态    ===1 说明鼠标左键被按下后未松开
                if(e.buttons === 1){
                    //绘制临时的连接线
                    stateManage.isConnecting = true;
                    this.showTempLine = true;
                    let curSvg = e.target.closest('svg');
                    let curSvgRect = curSvg.getBoundingClientRect();
                    stateManage.curPoint = {
                        x: e.clientX - curSvgRect.left - 2 , //e.target.offsetLeft + e.offsetX, // e.clientX,
                        y: e.clientY - curSvgRect.top - 2//e.target.offsetTop + e.offsetY // e.clientY
                    };
                    console.log('curPoint: ' + JSON.stringify(stateManage.curPoint) + ' ' + e.target.offsetLeft + '---' + e.offsetX + e.pageX);
                    this.drawTempLine();
                }else{
                    stateManage.isConnecting = false;
                    return;
                }
            }
        },
        drawTempLine(){
            let templine = this.$el.getElementsByClassName('templine')[0];
            // var templine = document.getElementsByClassName('templine')[1];
            templine.setAttribute('d', `M ${stateManage.startPoint.x} ${stateManage.startPoint.y} L ${stateManage.curPoint.x} ${stateManage.curPoint.y}`);
        },
        drawConnectLine(){

        },
        onMouseup(e){
            if(stateManage.isConnecting = true){
                let target_class = e.target.getAttribute('class');
                let regIsConnectPoint = /connect-point/;
                if(regIsConnectPoint.test(target_class)){
                    //绘制连接线
                    this.drawConnectLine();
                }else{
                    this.showTempLine = false;
                }
                stateManage.isConnecting = false;
            }
        }
    },
  
    mounted(){
        let el = this.$el;
        var elm = el.querySelector('#test');
        if(elm){
            this.stateBlock = new PlainDraggable(elm);
        }
      
        /* var states = el.getElementsByClassName('state-div');
        var lineOption = {
            color: '#aaaaaa',
            size: 2,
            startSocket: 'right',
            endSocket: 'left',
            path: 'grid'
        }
        this.line = new LeaderLine(states[0], states[1], lineOption);
        this.line2 =  new LeaderLine(states[0], states[2], lineOption); */
    },
   
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
    line-height: 35px;
    color: #ffffff;
    background-color: rgba(0,219,255,.42);
}
.thread-body{
    /* height: calc(100% -35px); */
    height: 265px;
}
svg.thread-svg{
    margin-top: 30px;
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

.templine{
    stroke: #ff0000;
    stroke-width: 1px;
}
.templine:hover{
    stroke:yellow;
}

</style>    