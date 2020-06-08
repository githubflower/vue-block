<template>
    <g>
        <path :d="line.d" class="connect-line"></path>
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
}
.connect-line:hover{
    stroke:yellow;
}

</style>    