<template>
    <div class="main" @mousemove="onMouseMove">
        <div class="toolbox">
            <el-button type="primary" plain @click="addThread">线程</el-button>
            <!-- dragStart事件只能绑定在html5元素上，绑定el组件无效，所以这里用span包裹一层  -->
            <span
                draggable="true"
                @drag="drag"
                @dragstart="dragStart"
                @dragend="dragEnd">
                <el-button type="primary" plain >状态</el-button>
            </span>
        </div>
        <div class="content">
            <thread-svg v-for="(thread, i) in threadAry" :key="i" :thread="thread" :threadIndex="i">
            </thread-svg>
        </div>
    </div>
</template>

<script>
// import MyPlainDraggable from 'plain-draggable'
// import MyPlainDraggable from 'plain-draggable/plain-draggable.esm.js'
import ThreadSvg from './ThreadSvg'
import StateDiv from './StateDiv'
export default {
    name: 'StatePage',
    components: {
        ThreadSvg,
        StateDiv
    },
    data(){
        return {
            showTempLine: false,
            operate: 'default',
            threadAry: [
                {
                    name: '线程名称1',
                    width: 1000,
                    height: 300,
                    stateAry: [{
                        name: '流水线视觉定位',
                        inCount: 1,
                        outCount: 2,
                        x: 5,
                        y: 0
                    },{
                        name: '取料',
                        inCount: 2,
                        outCount: 2,
                        x: 190,
                        y: 0
                    },{
                        name: '状态名称很长的时候会显示省略号鼠标放上去显示详细描述',
                        inCount: 3,
                        outCount: 1,
                        x: 500,
                        y: 350
                    }],
                    lineAry: [{
                        startPoint: {
                            x: 0,
                            y: 0
                        },
                        endPoint: {
                            x: 0,
                            y: 0
                        },
                        startState: {
                            stateId: '',
                        },
                        endState: {
                            stateId: '',
                        }
                    },{
                        startPoint: {
                            x: 0,
                            y: 0
                        },
                        endPoint: {
                            x: 0,
                            y: 0
                        },
                        startState: {
                            stateId: '',
                        },
                        endState: {
                            stateId: '',
                        }
                    }]
                },
                {
                    name: '线程名称2',
                    width: 1000,
                    height: 500,
                    stateAry: [{
                        name: '流水线视觉定位',
                        inCount: 1,
                        outCount: 2,
                        x: 100,
                        y: 50
                    },{
                        name: '取料',
                        inCount: 2,
                        outCount: 2,
                        x: 300,
                        y: 50
                    },{
                        name: '状态名称很长的时候会显示省略号鼠标放上去显示详细描述',
                        inCount: 3,
                        outCount: 1,
                        x: 500,
                        y: 450
                    }],
                    lineAry: []
                },
            ],
        }
    },
    methods: {
        addThread(){
            console.log('---add thread---');
            this.threadAry.push({
                name: '线程名称' + (this.threadAry.length + 1),
                width: 1000,
                height: 300,
                stateAry: [{
                    name: '开始',
                    inCount: 0,
                    outCount: 0,
                    x: 50,
                    y: 50
                },{
                    name: '结束',
                    inCount: 0,
                    outCount: 0,
                    x: 350,
                    y: 50
                },]
            });
        },
        addState(data){
            this.threadAry[data.index].stateAry.push({
                name: '状态描述',
                inCount: 0,
                outCount: 0,
                x: data.x,
                y: data.y
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
        resizeSvg(resizeInfo){
            if(resizeInfo.dh){
                this.threadAry[resizeInfo.threadIndex].height += resizeInfo.dh;
            }
            if(resizeInfo.dw){
                this.threadAry[resizeInfo.threadIndex].width += resizeInfo.dw;
            }
        },
        drag(){},
        dragStart(e){
            // e.dataTransfer.items.push('aaa');
            // e.dataTransfer.items.add('aaa');
            e.dataTransfer.setData('operate', 'addState');
        },
        dragEnd(){
            console.log('dragend');
        },
        onMouseMove(e){
            if(this.operate === 'resize-thread'){ // default, resize-thread, 
                let dx = e.pageX - this.operateData.startPosition.x,
                    dy = e.pageY - this.operateData.startPosition.y,
                    minH = this.getMinHeightOfThread(this.operateData.index);
                this.threadAry[this.operateData.index].width = this.operateData.originW + dx;
                this.threadAry[this.operateData.index].height = Math.max(minH, this.operateData.originH + dy);
            }
        },
        operateChange(data){
            this.operateData = data;
            this.operate = data.operate;
        },
        getMinHeightOfThread(index){
            let maxY = 0,
                threadDivBorderWidth = 1,
                stateDivBorderWidth = 1,
                stateDivHeight = 50;// 50是状态的高度
            this.threadAry[index].stateAry.forEach(state => {
                // TODO  这里还需要根据状态是子状态还是父状态作判断，后续实现状态块时修改
                // maxY = Math.max(state.y + this.titleHeight + stateDivHeight + 2 * threadDivBorderWidth + 2 * stateDivBorderWidth, maxY);
                maxY = Math.max(state.y + 35 + stateDivHeight + 2 * threadDivBorderWidth + 2 * stateDivBorderWidth, maxY);
            }); 
            return maxY;
        }
    },
    computed: {
        sumHeight: function(i){
            return 0;
        }
    },
    created(){
        EventObj.$on('resizeSvg', this.resizeSvg, this);
        EventObj.$on('addState', this.addState, this);
        EventObj.$on('operateChange', this.operateChange, this);
    },
    mounted(){
        window.statePageVue = this;
    },
   
}
</script>

<style scope>
html{
    background-color: #001F3A;
}
.main{
    margin-top: 61px; /*Header的高度*/
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
    position: fixed;
    width: 100%;
    background-color: #ffffff;
    padding: 10px;
    border: 1px solid #ebebeb;
    border-radius: 3px;
    z-index: 1;
}
.content{
    padding-top: 54px;
}
.content > svg{
 /* width: 100%;  */
 /* height: calc(100%); */
 border: 1px solid rgba(0,219,255,.42);
 background-color: #001F3A;
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
    stroke: rgba(0,219,255,.42);
    stroke-width: 1px;
}
.templine:hover{
    stroke:yellow;
}

</style>    