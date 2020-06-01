<template>
    <g :transform="transformValue">
        <rect class="state" width="90" height="40" ></rect>
        <text x="5" y="16">状态</text>
            <!--text在垂直方向默认是以文字中间对齐的 -->
    </g>
</template>

<script>
// import MyPlainDraggable from 'plain-draggable'
// import MyPlainDraggable from 'plain-draggable/plain-draggable.esm.js'

export default {
    name: 'StateBlock',
    props: ['transformValue'],
    data(){
        return {
        }
    },
    methods: {
     
    },
    mounted(){
        var elm = this.$el;
        var draggable = new PlainDraggable(elm);
        draggable.snap = {
            x: {
                step: 40 //90 + 60
            },
            y: {
                step: 40 //40 + 40
            }
        };
    }
}
</script>

<style>
text{
    fill: #FFFFFF;
}

.state{
    stroke: #AAAAAA;
    stroke-width: 1;
    fill: #00DBFF;
    fill-opacity: .1;
}
</style>    