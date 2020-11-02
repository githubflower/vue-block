<template>
    <g
        @contextmenu.prevent="onContextMenu"
        @click="activeLineChange"
        :class="{active: isActive}"
    >
        <path 
            :id="line.lineId"
            :lineId="line.lineId"
            :d="line.d" 
            :class="genClass()"></path>
        <path
            :d="getLineMidPoint(line)"
            :id="line.lineId + '-textpath'"></path>
        <text
            v-if="line.desc"
            x="10"
            y="0"
            style="fill: red;"
        >
            <textPath
                :xlink:href="'#' + line.lineId + '-textpath'"
            >{{line.desc}}</textPath>
        </text>
    </g>
</template>

<script>
export default {
    name: 'LineSvg',
    props: ['line', 'threadIndex', 'lineClass'],
    data(){
        return {
            isActive: false,
            //TODO: 运行时动画
            isRunning: false,
        }
    },
    methods: {
        genClass(type){
            return this.lineClass ? this.lineClass : 'connect-line';
        },
        generatePath(line){
            if(line && line.d){
                return line.d;
            }else{
                return 'M 0 0 L 50 0'; //test
            }
        },
        generateByPoint(){

        },
        generateByState(){

        },
        getLineMidPoint(line){
            let startX, startY, endY, midPointPath
            startX = line.startPoint.x;
            startY = line.startPoint.y;
            endY = line.endPoint.y;
            midPointPath = `M ${startX + 55} ${(startY + endY) / 2} h 150`;
            return midPointPath
    },
        genId(){
            return window.genId('line');
        },
        onContextMenu(e){
            EventObj.$emit('updateContextMenu', {
                lineId: this.line.lineId,
                threadIndex: this.threadIndex,
                lineData: this.line,
                position: {
                    x: e.pageX,
                    y: e.pageY
                }
            });
        },
        activeLineChange(){
            if(this.isActive){
                this.isActive = false;
            }
            else{
                this.isActive = true;
            }
        },
    },
    created(){
        this.$set(this.line, 'active', false);
        if(!this.line.lineId){
            this.line.lineId = this.genId();
        }
    },
    mounted(){
        
    },
    watch: {
        'line.active': function(v){
            if(v){
                this.isActive = true;
            }else{
                this.isActive = false;
            }
        }
    },
    computed: {
        linePath: function(){
            return this.generatePath(this.line);
        }
    }
   
}
</script>

<style>
.connect-line{
    stroke: #aaaaaa;
    stroke-width: 2px;
    fill: #aaaaaa;
}
.connect-line:hover{
    stroke:yellow;
    fill: yellow;
}
.active .connect-line{
    stroke:rgb(112, 255, 255);
    fill: rgb(112, 255, 255);
}
text{
    display: none;
}
.active text{
    display: block;
}
</style>    