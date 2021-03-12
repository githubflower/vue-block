<template>
    <div id="qblockPage">
        
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
            activeName: 'BlocklyPage'
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