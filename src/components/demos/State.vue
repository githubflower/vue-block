<template>
    <div class="main">
        <div class="toolbox">
            <el-button type="primary" plain @click="addThread">线程</el-button>
        </div>
        <div class="content">
            <svg xmlns="http://www.w3.org/2000/svg">
                <g v-for="(index) in threadCount" :key="index">
                    <rect class="thread"></rect>
                    <rect class="title"></rect>
                    <text x="20" y="20">线程名称</text>
                </g>
            </svg>
        </div>
    </div>
</template>

<script>
export default {
    name: 'State',
    data(){
        return {
            threadCount: 0
        }
    },
    methods: {
        addThread(){
            console.log('---add thread---');
            this.threadCount++;
        }
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
    x: 20;
    y: 20;
    width: 800px;
    height: 300px;
    stroke: #00DBFF;
    stroke-width: 1;
    fill: none;
}
.title{
    x: 20;
    y: 20;
    width: 800px;
    height: 35px;
    fill: #00DBFF;
    fill-opacity: .42;
}

text{
    x: 20;
    y: 20;
    fill: #ffffff;
}
</style>    