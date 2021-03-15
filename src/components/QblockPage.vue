<template>
    <div id="qblockPage">
        <el-row>
             <el-col :span="4">
                <el-input v-model="searchValue" placeholder="请输入图块描述"></el-input>
             </el-col>
             <el-col :span="1">
                <el-button icon="el-icon-search" circle @click="onSearch"></el-button>
             </el-col>
             <el-col :span="2" style="color: #ffffff;">
                <span>{{curMatch}}</span>
                <span class="separate">/</span>
                <span>{{matchedLength}}</span>
             </el-col>
        </el-row>
        <el-tabs v-model="activeName" @tab-click="handleClick" :before-leave="beforeLeave">
            <el-tab-pane name="StatePage" label="状态图">
                <StatePage ref="statePage"/>
            </el-tab-pane>
            <el-tab-pane name="BlocklyPage" label="Blockly" class="blockly-panel">
                <BlocklyPage ref="blocklyPage"/>
            </el-tab-pane>
        </el-tabs>
    </div>
</template>
<script>
import StatePage from '@/components/statepage/StatePage'
import BlocklyPage from '@/components/BlocklyPage'
import Util from "@/components/statepage/util.js";

export default {
    name: 'QblockPage',
    components: {
        StatePage,
        BlocklyPage
    },
    data(){
        return {
            activeName: 'BlocklyPage',
            searchValue: '',
            curMatch: 0,
            matchedLength: 0
        }
    },
    methods: {
        handleClick(tab, event){
            var index = this.$refs.statePage.activeThreadIndex;
            if(tab.name === 'BlocklyPage'){
                this.$refs.blocklyPage.activeThreadIndex = index;
                // var blocklyXml = window.localStorage.getItem('blocklyXml');
                var threadsData = window.localStorage.getItem('threadsData');
                if(threadsData){
                    threadsData = JSON.parse(threadsData);
                }
                let blocklyXml = threadsData[this.$refs.blocklyPage.activeThreadIndex].graphicData;
                this.$refs.blocklyPage.loadData(blocklyXml);
            }else if(tab.name === 'StatePage'){
                var threadsData = window.localStorage.getItem('threadsData');
                if(threadsData){
                    threadsData = JSON.parse(threadsData);
                    if(threadsData[index]){
                        let blocklyXml = threadsData[index].graphicData;
                        if(blocklyXml){
                            var threadData = Util.blockly2state(blocklyXml);
                            threadData.basicData = {};
                            Util.apply(threadData.basicData, threadsData[index].basicData);
                            this.$refs.statePage.loadData(threadData, index);
                        }
                    }
                }
                
            }
            if(this.loading){
                this.loading.close();
            }
        },
        beforeLeave(activeName, oldName){
            this.loading = this.$loading({
                lock: true,
                text: 'Loading',
                spinner: 'el-icon-loading',
                background: 'rgba(0, 0, 0, 0.7)'
            });
            
            //如果当前是状态图界面
            if(oldName === 'StatePage'){
                this.saveAllData();
                return true;
                /* var curThreadData = this.$refs.statePage.threadAry[this.$refs.statePage.activeThreadIndex];
                return new Promise(function(resolve, reject){
                    try{
                        //将当前操作的线程数据存储为xml格式  // saveCurThreadData();
                        let blocklyXml = Util.thread2blockly(null, curThreadData);
                        window.localStorage.setItem("blocklyXml", blocklyXml.outerHTML);
                        resolve(true);
                    }catch(error){
                        console.error('存储当前操作的线程数据时出错！');
                        reject(false);
                    }
                }) */
            }else if(oldName === 'BlocklyPage'){
                this.$refs.blocklyPage.saveData();
            }

            
        },
        saveAllData(){
            var threadsData = window.localStorage.getItem("threadsData");
            if (threadsData) {
                threadsData = JSON.parse(threadsData);
            }else{
                threadsData = []; 
            }
            if(this.activeName === 'StatePage'){
                //todo
                this.$refs.statePage.threadAry.forEach((item, index) => {
                    let stateXml = Util.thread2blockly(item, index); // 描述状态图的xml
                    let blocklyXml; // 描述Blockly的xml
                    if(!threadsData[index]){
                        threadsData[index] = {
                            basicData: {}
                        };
                        // Util.apply(threadsData[index].basicData, item, ['lineAry', 'stateAry']);
                    }
                    if(!threadsData[index].graphicData){
                        blocklyXml = stateXml;
                    }else{
                        blocklyXml = new DOMParser().parseFromString(threadsData[index].graphicData, 'text/xml');
                        this.syncStateXml2BlocklyXml(stateXml, blocklyXml);
                    }
                    threadsData[index].graphicData = this.$refs.blocklyPage.dom2text(blocklyXml);
                    //保存thread的basicData(包括线程的名称、宽高等信息)
                    Util.apply(threadsData[index].basicData, item, ['lineAry', 'stateAry']);
                })
                debugger;
                window.localStorage.setItem("threadsData", JSON.stringify(threadsData));
            }
        },
        //将状态图数据同步到blocklyXml中，作为整个线程的详细数据
        syncStateXml2BlocklyXml(stateXml, blocklyXml){
            //debugger;
            //1.从stateXml中提取lists_state节点和第一个state_opr节点
            let s_lists_state_dom = Util.findChildByAttribute(stateXml, 'type', 'lists_state', true);
            let b_lists_state_dom = Util.findChildByAttribute(blocklyXml, 'type', 'lists_state', true);
            let s_state_logic_dom = Util.findChildByAttribute(stateXml, 'type', 'procedures_defnoreturn', true);
            let b_state_logic_dom = Util.findChildByAttribute(blocklyXml, 'type', 'procedures_defnoreturn', true);
            
            //2.将与状态图的图面信息有关的节点完全覆盖blocklyXml中与状态图的图面信息有关的节点
            let bAry = Util.toArray(b_state_logic_dom.children);
            let sAry = Util.toArray(s_state_logic_dom.children);
            bAry.forEach(node => {
                b_state_logic_dom.removeChild(node);
            })
            sAry.forEach(node => {
                b_state_logic_dom.appendChild(node);
            })
            
            //3.遍历lists_state节点，如果某个子节点a在blocklyXml中存在，则将blocklyXml中对这个节点的定义复制到子节点a，最后将lists_state节点覆盖blocklyXml中的lists_state节点
            let s_state_ary = Util.toArray(s_lists_state_dom.children);
            s_state_ary.forEach((item, i) => {
                //debugger;
                if(item.tagName === 'value'){
                    let id = item.firstElementChild.getAttribute('id');
                    let b_state = Util.findChildByAttribute(b_lists_state_dom, 'id', id, true);
                    if(b_state){
                        let state_entity = Util.findChildByAttribute(b_state, 'name', "STACK", true);
                        if(state_entity){
                            let state_entity_type = state_entity.children[0].getAttribute("type")
                            let graphic_state_entity
                            //TODO：在状态图部分对嵌套状态内状态进行新操作后，需要将blockly内原有的内置状态与状态图部分操作后的状态的块拼接起来
                            Util.toArray(s_state_ary[i].children).forEach((blockDom) => {
                                //debugger;
                                Util.toArray(blockDom.children).forEach(node => {
                                    //debugger;
                                    if(node.tagName === 'field' || node.tagName === 'comment'){
                                        // do none
                                    } else if(state_entity_type === "state_opr" || state_entity_type === "controls_whileUntil"){
                                        // 此时为嵌套状态，保留状态图部分对嵌套状态的修改
                                        graphic_state_entity = Util.findChildByAttribute(item, 'name', "STACK", true)
                                        node.remove();
                                    }
                                    else{
                                        node.remove();
                                    }
                                })
                            })
                            if(graphic_state_entity){
                                s_state_ary[i].firstElementChild.appendChild(graphic_state_entity)
                            }
                            else {
                                s_state_ary[i].firstElementChild.appendChild(state_entity);
                            }
                        }
                    }
                }
            })

            let aa = Util.findChildByAttribute(blocklyXml, 'type', 'lists_state', true)
            let b_lists_state_ary = Util.toArray(b_lists_state_dom.children);
            b_lists_state_ary.forEach(node => {
                b_lists_state_dom.removeChild(node);
            })
            s_state_ary.forEach(node => {
                b_lists_state_dom.appendChild(node);
            })
        },
        onSearch(){
            let searchValue = this.searchValue;
            //1.如果当前是Blockly界面则在页面中blockDB_中寻找包含searchValue的图形块，然后将找到的结果显示出来，并高亮第一个匹配项，将第一个匹配项移至画布正中间
            if(this.activeName === 'BlocklyPage'){
                let win = this.$refs.blocklyPage.$refs.blocklyIframe.contentWindow;
                let blockDB = win.Code.workspace.blockDB_;
                /*let result = [];
                for(let k in blockDB){
                  let blockSvg = blockDB[k];
                  let flag = this.findBlockByDesc(searchValue, blockSvg);
                  if(flag){
                    result.push(blockSvg);
                  }
                }*/
                let result = this.findBlockByDesc(searchValue);
                //2.渲染搜索结果
                if(result.length){
                  this.curMatch = 1;
                  this.matchedLength = result.length;
                  //3.聚焦到第一个匹配项
                  this.centerByDom(result[0]);
                }else{
                  this.curMatch = 0;
                  this.matchedLength = 0;
                }
            }
        },
        /**
         * [centerByDom 将指定的dom元素移至画布中央]
         * @param  {[type]} targetDom [description]
         * @return {[type]}           [description]
         */
        centerByDom(targetDom){
          let doc = this.$refs.blocklyPage.$refs.blocklyIframe.contentDocument,
            blocklyWorkspace = jQuery(doc).find('.blocklySvg g.blocklyWorkspace'),
            blocklyWorkspaceRect = blocklyWorkspace[0].getBoundingClientRect(),
            blocklyBlockDragSurface = jQuery(doc).find('#content_blocks .blocklyBlockDragSurface > g')[0],

            allBlocksGroup = jQuery(doc).find('.blocklySvg g.blocklyBlockCanvas')[0],
            targetDomRect = targetDom.getBoundingClientRect();

          let distanceX = targetDomRect.left + (targetDomRect.width / 2) - (blocklyWorkspaceRect.width / 2),
              distanceY = targetDomRect.top + (targetDomRect.height / 2) - (blocklyWorkspaceRect.height / 2);
          //移动allBlocksGroup
          let transformStr = allBlocksGroup.getAttribute('transform'),
            matchResult = transformStr.match(/translate\((.*),\s*(.*?)\)(.*)/),//"translate(113.99999999999989,-5.684341886080802e-14) scale(1)" 这里正则要小心对数字的处理
            transformValue;
            

          if(matchResult){
            transformValue = {
              x: parseInt(matchResult[1], 10),
              y: parseInt(matchResult[2], 10),
              other: matchResult[3]
            }
            //注意：这里不能擅自修改transform的值，必须通过workspace提供的方法去移动画布，否则会出现拖动时跳动的情况
            this.$refs.blocklyPage.$refs.blocklyIframe.contentWindow.Code.workspace.scroll(transformValue.x - distanceX, transformValue.y - distanceY, 1);
            // allBlocksGroup.setAttribute('transform', `translate(${transformValue.x - distanceX},${transformValue.y - distanceY})${transformValue.other}`);
            // blocklyBlockDragSurface.setAttribute('transform', `translate(${transformValue.x - distanceX},${transformValue.y - distanceY})${transformValue.other}`);
          }


        },
        /**
         * [findBlockByDescWithParent 在blockSvg的svgGroup_中深度遍历寻找.blocklyText的子节点，如果这个子节点的innerText === v就返回true]
         * 这个方法有一个特点：比如B块是A块的参数项，B块的描述中包含关键字v，那么A块和B块都会返回
         * @param  {[type]} v        [description]
         * @param  {[type]} blockSvg [description]
         * @return {[Boolean]}          [description]
         */
        findBlockByDescWithParent(v, blockSvg){
          let dom = blockSvg.svgGroup_;
          let blocklyTextNodes = jQuery(dom).find('.blocklyText');
          let ary = Array.prototype.slice.call(blocklyTextNodes);
          let reg = new RegExp(v);
          for(let i = 0; i < ary.length; i++){
            if(reg.test(jQuery(ary[i]).text())){
              return true;
            }
          }
          return false;
        },
        /**
         * [findBlockByDesc 在整个workspace中寻找]
         * * 和findBlockByDescWithParent方法不同，这个方法只会返回当前节点描述包含关键字v的块，子节点包含v不会被返回
         * @param  {[type]} v [description]
         * @return {[blockSvg]}   [description]
         */
        findBlockByDesc(v){
          let result = [];
          let doc = this.$refs.blocklyPage.$refs.blocklyIframe.contentDocument;
          let blocklyTextNodes = jQuery(doc).find('.blocklySvg .blocklyText');
          let ary = Array.prototype.slice.call(blocklyTextNodes);
          let reg = new RegExp(v);
          for(let i = 0; i < ary.length; i++){
            if(reg.test(jQuery(ary[i]).text())){
              let blockSvg = jQuery(ary[i]).closest('[data-id]');
              result.push(blockSvg[0]);
            }
          }
          return result;
        }
    },
    created(){
        EventObj.$on("saveAllData", this.saveAllData, this);
    }
}
</script>
<style lang="less">
    .el-tabs__item{
        color: #ffffff;
    }
#qblockPage{
    position: relative;
    height: 100%;
    z-index: 2;
    .save-btn{
        position: absolute;
        top: 5px;
        right: 10px;
        z-index: 2;
    }
    .el-tabs{
        height: 100%;
        .el-tab-pane{
            height: 100%;
            overflow: auto;
        }
        .el-tabs__header.is-top{
            position: absolute;
            left: 50%;
            z-index: 10;
        }
        .el-tabs__content{
            height: calc(100% );
        }
        .blockly-panel{
            /* height: calc(100% - 61 -40 - 15) */
            height: 100%;
        }
    }
}

.el-loading-mask.is-fullscreen{
    background-color: rgba(0, 0, 0, 0.2) !important;
}
</style>