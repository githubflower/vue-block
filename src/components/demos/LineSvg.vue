<template>
    <g>
        <path 
            :lineId="line.lineId ? line.lineId : genId()"
            :d="line.d" 
            class="connect-line"></path>
    </g>
</template>

<script>
export default {
    name: 'LineSvg',
    props: ['line'],
    data(){
        return {
           
        }
    },
    methods: {
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