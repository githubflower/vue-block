<template>
    <div class="state-div" :transform="generateStatePos(stateData)" :stateId="stateData.stateId ? stateData.stateId : genId()">
        <p x="5" y="16">{{stateData.name}}</p>
        <div v-show="stateData.inCount > 1" class="in event-count" >{{stateData.inCount}}</div>
        <div v-show="stateData.outCount > 1" class="out event-count">{{stateData.outCount}}</div>
        <div class="connect-point in"></div>
        <div class="connect-point out" @mousedown="onConnectPointMousedown" @mouseup="onMouseup"></div>
    </div>
</template>

<script>
// import MyPlainDraggable from 'plain-draggable'
// import MyPlainDraggable from 'plain-draggable/plain-draggable.esm.js'

export default {
    name: 'StateDiv',
    props: ['stateData'],
    data(){
        return {
        }
    },
    methods: {
        genId(){
            return window.genId();
        },
        generateStatePos(stateData){
            return (stateData.x && stateData.y) ? `translate(${stateData.x}, ${stateData.y})` : 'translate(0, 0)';
        },
        /**
         * 鼠标在连接点按下
         */
        onConnectPointMousedown(e){
            window.stateManage.isConnecting = true;
            let boundingRect = e.target.getBoundingClientRect();
            let curSvg = e.target.closest('svg');
            let curSvgRect = curSvg.getBoundingClientRect();
            window.stateManage.startPoint = {
                x: boundingRect.left - curSvgRect.left + boundingRect.width / 2,
                y: boundingRect.top - curSvgRect.top + boundingRect.height / 2
            };
        },
        onMouseup(){
            stateManage.isConnecting = false;
        }
    },
    mounted(){
        var elm = this.$el;
        window.testVueObj = this;
        window.draggableDiv = new PlainDraggable(elm);
        draggableDiv.onDragStart = function(pointerXY) {
            let connectPointReg = /connect-point/;
            let classStr = pointerXY.target.getAttribute('class');
            if(connectPointReg.test(classStr)){
                // window.statePageVue.isConnecting = true;
                return false;
            }
            return true;
        };
        draggableDiv.onMove = function(params) {
            console.log('move');
            window.line.position();
            window.line2.position();
        }
        draggableDiv.onDragEnd = function(params) {
            console.log('drag-end');
            // window.line.position();

        // this.$nextTick(function(){
            // window.line = new LeaderLine(states[0], states[1], );
        }
        /* draggable.snap = {
            x: {
                step: 40 //90 + 60
            },
            y: {
                step: 40 //40 + 40
            }
        }; */
    }
}
</script>

<style>
.state-div{
    float: left;
    /* display: table; */
    margin-left: 50px;
    max-width: 150px;
    padding: 5px 20px;
    /* width: 98px; */
    height: 40px;
    border: 1px solid #aaaaaa;
    border-radius: 5px;
    color: #aaaaaa;
}
.state-div:hover{
    color: #ffffff;
    border-color: #ffffff;
}
.state-div > p{
    display: -webkit-box;
    position: relative;
    top: 50%;
    transform: translateY(-50%);
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    text-overflow: ellipsis;
    overflow: hidden;
    font-size: 14px;
}
.event-count{
    width: 20px;
    height: 20px;
    border-radius: 10px;
    background-color: rgba(0,157,218, .33);
    color: #ffffff;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    text-align: center;
    line-height: 20px;
    font-size: 14px;
}
.event-count:hover{
    background-color: rgba(0,157,218, 1);
    cursor: pointer;
}
.in{
    left: 0;
}
.out{
    right: 0;
}
.connect-point{
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 10px;
    height: 10px;
    border-radius: 10px;
}
.connect-point:hover{
    border: 2px solid #ff0000 !important;
    cursor: default;
}
.state-div:hover .connect-point{
    border: 2px solid blue;
    cursor: default;
}
.connect-point.in{
    transform: translate(-50%, -50%);
}
.connect-point.out{
    transform: translate(50%, -50%);
}
</style>    