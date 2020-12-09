<template>
    <g
        @contextmenu.prevent="onContextMenu"
        @click="activeLineChange"
        :class="[{showdesc: line.showdesc}, {active: line.active}, line.type]"
    >
        <path 
            :id="line.lineId"
            :lineId="line.lineId"
            :d="line.d" 
            :class="genClass()"
            :style="{strokeWidth: strokeWidth}">
        </path>
        <path
            :d="getTextPath(line)"
            :id="line.lineId + '-textpath'"></path>
        <text
            v-if="line.desc"
            x="15"
            y="0"
        >
            <title>{{line.desc}}</title>
            <textPath
                :xlink:href="'#' + line.lineId + '-textpath'"
                :id="line.lineId + '-text'"
            >{{line.desc.length > descLimit ? line.desc.slice(0,8) + '...' : line.desc}}</textPath>
        </text>
        
    </g>
</template>

<script>
import {lineCfg} from './graphCfg.js'

const line_h = lineCfg.line_h
const stroke_width = lineCfg.stroke_width
const desc_limit = lineCfg.desc_limit
export default {
    name: 'LineSvg',
    props: ['line', 'threadIndex', 'lineClass'],
    data(){
        return {
            isActive: false,
            isShowDesc: false,
            strokeWidth: stroke_width,
            descLimit: desc_limit,
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
        /*
        * 获取连线中点，然后以这个中点为起点绘制文字的路径
        *
        */
        getTextPath(line){
            let startX, startY, endY, midPointPath, midPoint
            startX = line.startPoint.x;
            startY = line.startPoint.y;
            endY = line.endPoint.y;
            midPointPath = `M ${startX + line_h} ${((startY + endY) / 2)} h 300`;
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
            this.line.active = !this.line.active
        },
    },
    created(){
        this.$set(this.line, 'active', false);
        this.$set(this.line, 'showdesc', false);
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
        },
        'line.type': function(v){
            if(v){
                this.isShowDesc = true;
            }
            else{
                this.isShowDesc = false;
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

<style lang="less">
@qkmGrey: #aaaaaa;
@qkmLightBlue: #70ffff;
@qkmOrange:#ffaf3d;
@qkmRed:#e83e3e;
@qkmYellow: #f8f837;
.connect-line{
    stroke: @qkmGrey;
    fill: none;
}
.connect-line:hover{
    stroke:@qkmLightBlue;
    fill: none;
    cursor:pointer;
}
.active .connect-line{
    stroke:@qkmLightBlue;
    fill: none;
}
.warning .connect-line{
    stroke: @qkmOrange;
    fill:none;
}
.error .connect-line{
    stroke:@qkmRed;
    fill:none;
}
.showdesc .connect-line{
    stroke:@qkmYellow;
    fill:none;
}
text{
    display: none;
    fill: yellow;
}
.active text, .showdesc text{
    display: block;
    overflow: hidden; 
    text-overflow:ellipsis; 
    white-space: nowrap;
}
</style>    