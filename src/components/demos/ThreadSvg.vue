<template>
    <svg xmlns="http://www.w3.org/2000/svg" :width="thread.width" :height="computedH" :id="thread.id" class="thread-svg"   @drop.prevent="drop" @dragover.prevent>
        <!-- <g class="thread-wrap" v-for="(thread, i) in threadAry" :key="i"> -->
            <foreignObject y="0" width="100%" :height="computedH" @mousemove="onConnecting" @mouseup="onMouseup">
                <h4 class="title" contenteditable="true" :style="titleStyle">{{ thread.name }}</h4>
                <div class="thread-body">
                    <state-div v-for="(stateItem, index) in thread.stateAry" :key="index" :stateData="stateItem" :index="index" :threadIndex="threadIndex" @updateStateData=updateStateData></state-div>
                </div>
            </foreignObject>
            <g v-show="showTempLine">
                <path d="" class="templine"></path>
            </g>
            <line-svg v-for="(line, index2) in thread.lineAry" :key="index2" :line="line"></line-svg>
        <!-- </g> -->
    </svg>
</template>

<script>
import StateDiv from './StateDiv'
import LineSvg from './LineSvg'
export default {
    name: 'ThreadSvg',
    props: ['thread', 'threadIndex'],
    components: {
        StateDiv,
        LineSvg
    },
    data(){
        return {
            showTempLine: false,
            threadCount: 1,
            titleHeight: 35
        }
    },
    methods: {
        titleStyle(){
            return `height: ${this.titleHeight}px;`;
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
            if(stateManage.isConnecting){
                //检测鼠标左键是否仍是按下状态    ===1 说明鼠标左键被按下后未松开
                if(e.buttons === 1){
                    //绘制临时的连接线
                    stateManage.isConnecting = true;
                    this.showTempLine = true;
                    let curSvg = e.target.closest('svg');
                    let curSvgRect = curSvg.getBoundingClientRect();

                    let target_class = e.target.getAttribute('class');
                    let regIsConnectPoint = /connect-point/;
                    if(regIsConnectPoint.test(target_class)){
                        // debugger;
                        stateManage.curPoint = {
                            x: e.target.getBoundingClientRect().left - curSvgRect.left - 2 + (e.target.getBoundingClientRect().width / 2) , //e.target.offsetLeft + e.offsetX, // e.clientX,
                            y: e.target.getBoundingClientRect().top - curSvgRect.top + (e.target.getBoundingClientRect().height / 2)//e.target.offsetTop + e.offsetY // e.clientY
                        };
                    }else{

                        stateManage.curPoint = {
                            x: e.clientX - curSvgRect.left - 2 , //e.target.offsetLeft + e.offsetX, // e.clientX,
                            y: e.clientY - curSvgRect.top - 2//e.target.offsetTop + e.offsetY // e.clientY
                        };
                    }
                    console.log('curPoint: ' + JSON.stringify(stateManage.curPoint) + ' ' + e.target.offsetLeft + '---' + e.offsetX + e.pageX);
                    this.drawTempLine();
                }else{
                    stateManage.isConnecting = false;
                    return;
                }
            }
        },
        drawTempLine(){
            const MID_POINT_X = 50;
            let templine = this.$el.getElementsByClassName('templine')[0];
            // var templine = document.getElementsByClassName('templine')[1];
            templine.setAttribute('d', `M ${stateManage.startPoint.x} ${stateManage.startPoint.y} h ${MID_POINT_X} v ${stateManage.curPoint.y - stateManage.startPoint.y} L ${stateManage.curPoint.x} ${stateManage.curPoint.y} m 0 0 z`);
        },
        drawConnectLine(){
            const MID_POINT_X = 50;
            this.thread.lineAry.push({
                d: `M ${stateManage.startPoint.x} ${stateManage.startPoint.y} h ${MID_POINT_X} v ${stateManage.curPoint.y - stateManage.startPoint.y} L ${stateManage.curPoint.x} ${stateManage.curPoint.y} m 0 0 z`,
                startPoint: stateManage.startPoint,
                endPoint: stateManage.endPoint,
                startState: {
                    stateId: '',
                },
                endState: {
                    stateId: '',
                }
            });
        },
        onMouseup(e){
            if(stateManage.isConnecting = true){
                let target_class = e.target.getAttribute('class');
                let regIsConnectPoint = /connect-point/;
                if(regIsConnectPoint.test(target_class)){
                    //绘制连接线
                    this.drawConnectLine();
                    this.showTempLine = false;
                }else{
                    this.showTempLine = false;
                }
                stateManage.isConnecting = false;
            }
        },

        drop(){
            console.log('---drop---');
        },

        updateStateData(receiveData){
            this.thread.stateAry[receiveData.index].x = receiveData.transform.x;
            this.thread.stateAry[receiveData.index].y = receiveData.transform.y;
        },

        
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
    computed: {
        computedH: function(){
            let maxY = 0;
            this.thread.stateAry.forEach(state => {
                // 50是状态的高度 TODO  这里还需要根据状态是子状态还是父状态作判断，后续实现状态块时修改
                maxY = Math.max(state.y + this.titleHeight + 60, maxY);
            });
            var ret = Math.max(this.thread.height, maxY)
            console.log('ret: ', ret);
            return ret;
        }
    }
   
}
</script>

<style>
foreignObject {
    border: 1px solid #00cd9a;
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
    position: relative;
    height: calc(100% - 35px);
    border: 1px solid #baed00;
}
svg.thread-svg{
    margin-top: 54px;
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
    fill: #00DBFF;
    fill-opacity: .42;
}

text{
    fill: #FFFFFF;
}

.templine{
    stroke: #ff0000;
    stroke-width: 1px;
    fill: transparent;
}
.templine:hover{
    stroke:yellow;
}

</style>    