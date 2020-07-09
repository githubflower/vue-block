<template>
    <!-- <div class="thread" :style="{width: thread.width + 'px', height: thread.height + 'px' }" @drop.prevent="drop" @dragover.prevent @mouseup="endResize"  -->
    <div class="thread" :style="{width: thread.width + 'px', height: computedH + 'px' }" @drop.prevent="drop" @dragover.prevent @mouseup="endResize" 
        @mousemove="onResize2"
        >
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" :id="thread.id" class="thread-svg" >
            <foreignObject y="0" width="100%" height="100%" @mousemove="onConnecting" @mouseup="onMouseup">
                <h4 class="title" contenteditable="true" :style="titleStyle">{{ thread.name }}</h4>
                <div class="thread-body">
                    <state-div v-for="(stateItem, index) in thread.stateAry" :key="index" :stateData="stateItem" :index="index" :threadIndex="threadIndex" @updateStateData=updateStateData></state-div>
                </div>
            </foreignObject>
            <g v-show="showTempLine">
                <path d="" class="templine"></path>
            </g>
            <line-svg v-for="(line, index2) in thread.lineAry" :key="index2" :line="line"></line-svg>
        </svg>
        <!-- <i class="resize-icon" :style="{ backgroundImage: 'url(' + moveVerticalImg + ')'}"></i> -->
        <i class="resize-icon resizable" :style="{ backgroundImage: 'url(' + resizableImg + ')', backgroundRepeat: 'no-repeat'}"
            @mousedown="startResize"
            @mouseup="endResize"
        ></i>
        <div v-if="showVirtualBox" class="virtual-box"></div>
    </div>
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
            showVirtualBox: false,
            showTempLine: false,
            threadCount: 1,
            titleHeight: 35,
            moveVerticalImg: "../../../static/imgs/move-vertical.png",
            resizableImg: "../../../static/imgs/resizable.png",
        }
    },
    methods: {
        onResize1(){
            console.log('onResize---1---' + +new Date());
        },
        onResize2(){
            console.log('onResize---2---' + +new Date());
        },
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
            console.log('---------118');
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

        drop(e){
            if(e.dataTransfer.getData('operate') === 'addState'){
                let threadPosInfo = e.target.getBoundingClientRect();
                EventObj.$emit('addState', {
                    index: this.threadIndex,
                    x: e.x - threadPosInfo.x,
                    y: e.y - threadPosInfo.y
                });
            }
        },

        updateStateData(receiveData){
            this.thread.stateAry[receiveData.index].x = receiveData.transform.x;
            this.thread.stateAry[receiveData.index].y = receiveData.transform.y;
        },

        startResize(e){
            this.showVirtualBox = true;
            EventObj.$emit('operateChange', {
                operate: 'resize-thread',
                index: this.threadIndex,
                startPosition: {
                    x: e.pageX,
                    y: e.pageY
                },
                originW: this.$el.offsetWidth,
                originH: this.$el.offsetHeight
            });
        },
        endResize(e){
            this.showVirtualBox = false;
            EventObj.$emit('operateChange', {
                operate: 'default'
            })
            this._lastHeight = this.thread.height;
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
    computed: {
        computedH: function(){
            let maxY = 0;
            let threadDivBorderWidth = 1,
                stateDivBorderWidth = 1,
                stateDivHeight = 50;// 50是状态的高度
            if(this.showVirtualBox){
                return Math.max(maxY, this.thread.height);
            }
            this._lastHeight = this._lastHeight || this.thread.height;
            this.thread.stateAry.forEach(state => {
                // TODO  这里还需要根据状态是子状态还是父状态作判断，后续实现状态块时修改
                maxY = Math.max(state.y + this.titleHeight + stateDivHeight + 2 * threadDivBorderWidth + 2 * stateDivBorderWidth, maxY);
            });
            if(maxY > this._lastHeight){
                this._lastHeight = maxY;
            }
            this.thread.height = this._lastHeight;
            return this._lastHeight;
            // return Math.max(this._lastHeight, this.thread.height);
        }
    }
   
}
</script>

<style>
div.thread{
    position: relative;
    /* margin-top: 50px; */
    /* margin-left: 50px; */
    margin: 25px;
}
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
    /* border: 1px solid #baed00; */
}
.resize-icon{
    position: absolute;
    bottom: 0;
    left: 50%;
    width: 14px;
    height: 14px;
}
.resize-icon.resizable{
    right: 1px;
    bottom: 1px;
    left: initial;
    cursor: nwse-resize;
}
.resize-icon.resizable:hover{
    cursor: nwse-resize;
}
/* .thread{
    width: 800px;
    height: 300px;
    stroke: #00DBFF;
    stroke-width: 1;
    fill: none;
} */
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
.virtual-box{
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: 1px dashed #ffffff;
}
</style>    