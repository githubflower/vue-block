<template>
    <div class="main">
        <div class="toolbox">
            <el-button type="primary" plain @click="addThread">线程</el-button>
            <el-button type="primary" plain @click="addState">状态</el-button>
        </div>
        <div class="content">
            <svg xmlns="http://www.w3.org/2000/svg">
                <g v-for="(index) in threadCount" :key="index" class="thread-grp" :transform="generateDefaultPos(index)">
                    <rect class="thread"></rect>
                    <rect class="title"></rect>
                    <text x="15" y="23">{{ '线程名称' + index }}</text>
                    <state-block v-for="(index2) in stateCount" :key="index2"  :transformValue="generateStatePos(index2)">
                        <rect class="state" width="90" height="40" ></rect>
                        <text x="5" y="16">开始</text>
                         <!--text在垂直方向默认是以文字中间对齐的 -->
                    </state-block>
                </g>
            </svg>
        </div>
    </div>
</template>

<script>
// import MyPlainDraggable from 'plain-draggable'
// import MyPlainDraggable from 'plain-draggable/plain-draggable.esm.js'
import StateBlock from './StateBlock'
export default {
    name: 'StatePage',
    components: {
        StateBlock
    },
    data(){
        return {
            threadCount: 1,
            stateCount: 1
        }
    },
    methods: {
        addThread(){
            console.log('---add thread---');
            this.threadCount++;
        },
        addState(){
            this.stateCount++;
        },
        generateDefaultPos(index){
            const gap = 35;
            return `translate(50, ${(300 + gap) * (index - 1)})`;
        },
        generateStatePos(index){
            const gapX = 60;
            return `translate(${(90 + gapX) * (index - 1)}, 40)`;
        },
    },
    mounted(){
        var elm = document.querySelector('#test');
        debugger;
        window.stateBlock = new PlainDraggable(elm);
    }
}
</script>

<style>
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
</style>    