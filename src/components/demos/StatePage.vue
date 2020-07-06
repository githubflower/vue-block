<template>
    <div class="main">
        <div class="toolbox">
            <el-button type="primary" plain @click="addThread">线程</el-button>
            <el-button type="primary" plain @click="addState">状态</el-button>
        </div>
        <div class="content">
            <thread-svg v-for="(thread, i) in threadAry" :key="i" :thread="thread">
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
                /* {
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
                    }],
                    lineAry: []
                }, */
            ],
        }
    },
    methods: {
        addThread(){
            console.log('---add thread---');
            this.threadAry.push({
                name: '线程名称' + (this.threadAry.length + 1),
                height: 300,
                stateAry: [{
                    name: '开始',
                    inCount: 0,
                    outCount: 0
                },{
                    name: '结束',
                    inCount: 0,
                    outCount: 0
                },]
            });
        },
        addState(){},
        generateDefaultPos(index){
            const gap = 35;
            return `translate(50, ${(300 + gap) * (index - 1)})`;
        },
        generateStatePos(index){
            const gapX = 60;
            return `translate(${(90 + gapX) * (index - 1)}, 40)`;
        },
    
    },
    computed: {
        sumHeight: function(i){
            return 0;
        }
    },
    mounted(){
        window.statePageVue = this;
    },
   
}
</script>

<style>
html{
    background-color: #001F3A;
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
    margin-top: 61px;
    height: 800px;
}
.content > svg{
 width: 100%; 
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