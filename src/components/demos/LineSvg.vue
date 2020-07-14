<template>
    <g
        @contextmenu.prevent="onContextMenu"
    >
        <path 
            :lineId="line.lineId ? line.lineId : genId()"
            :d="line.d" 
            :class="genClass()"></path>
    </g>
</template>

<script>
export default {
    name: 'LineSvg',
    props: ['line', 'threadIndex', 'lineClass'],
    data(){
        return {
           
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
                position: {
                    x: e.x,
                    y: e.y
                }
            });
        }
    },
  
    mounted(){
        
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

</style>    