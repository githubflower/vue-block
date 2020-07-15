<template>
    <g
        @contextmenu.prevent="onContextMenu"
        @click="activeLine"
        @mouseenter="activeLine"
        @mouseleave="disActiveLine"
        :class="{active: isActive}"
    >
        <path 
            :id="line.lineId"
            :lineId="line.lineId"
            :d="line.d" 
            :class="genClass()"></path>
        <text
            v-if="line.desc"
            x="10"
            y="0"
            style="fill: red;"
        >
            <textPath
                :xlink:href="'#' + line.lineId"
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
        genId(){
            return window.genId('line');
        },
        onContextMenu(e){
            EventObj.$emit('updateContextMenu', {
                lineId: this.line.lineId,
                threadIndex: this.threadIndex,
                lineData: this.line,
                position: {
                    x: e.x,
                    y: e.y
                }
            });
        },
        activeLine(){
            this.isActive = true;
        },
        disActiveLine(){
            this.isActive = false;
        }
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
    stroke-width: 1px;
    fill: transparent;
}
.connect-line:hover{
    stroke:yellow;
}
.active .connect-line{
    stroke:yellow;
}
text{
    display: none;
}
.active text{
    display: block;
}
</style>    