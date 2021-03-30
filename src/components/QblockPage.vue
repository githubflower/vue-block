<template>
  <div id="qblockPage">
    <el-row v-show="activeName === 'BlocklyPage'" >
      <el-col :span="4" style="position: relative;">
        <el-input v-model="searchValue" :placeholder='$t("QBLOCK_SEARCH_PLACEHOLDER")'></el-input>
        <div style="display: inline-block;position: absolute;top: 0px;right: 15px;height: 32px;line-height: 32px;">
          <span>{{searchResult.length ? focusIndex + 1: 0}}</span>
          <span class="separate">/</span>
          <span>{{searchResult.length}}</span>
        </div>
      </el-col>
      <el-col :span="1" style="text-align: center;">
        <el-button icon="el-icon-search" circle @click="onSearch"></el-button>
      </el-col>
      <el-col :span="1" v-show="searchResult.length > 1">
        <el-button icon="el-icon-arrow-up" circle @click="findPrev"></el-button>
        <el-button icon="el-icon-arrow-down" circle @click="findNext"></el-button>
      </el-col>
    </el-row>
    <el-tabs v-model="activeName" @tab-click="handleClick" :before-leave="beforeLeave">
      <el-tab-pane name="StatePage" :label='$t("QBLOCK_STATE_PAGE")'>
        <StatePage ref="statePage" />
      </el-tab-pane>
      <el-tab-pane name="BlocklyPage" label="Blockly" class="blockly-panel">
        <BlocklyPage ref="blocklyPage" />
      </el-tab-pane>
    </el-tabs>
    <el-dialog title="请选择路径" :visible.sync="dialogVisible" :close-on-click-modal="modal" :modal-append-to-body="modal" width="30%" :before-close="handleClose">
      <el-tree v-loading="treeData.loading" :data="treeData.projectData" :props="treeData.defaultProps" :expand-on-click-node="treeData.expandOnClickNode" :highlight-current="treeData.highlightCurrent" @node-click="handleNodeClick" :lazy="treeData.lazy" :load="treeData.load"></el-tree>
      <span slot="footer" class="dialog-footer">
        <el-button @click="onCancel">取 消</el-button>
        <el-button type="primary" @click="onConfirm">确 定</el-button>
      </span>
    </el-dialog>
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
  data() {
    return {
      activeName: 'BlocklyPage',
      searchValue: '',
      focusIndex: 0,
      searchResult: [],
      dialogVisible: false,
      modal: false,
      treeData: {
        projectData: [{
            label: "一级 1",
            children: [{
              label: "二级 1-1",
              children: [{
                label: "三级 1-1-1",
              }, ],
            }, ],
          },
          {
            label: "一级 2",
            children: [{
                label: "二级 2-1",
                children: [{
                  label: "三级 2-1-1",
                }, ],
              },
              {
                label: "二级 2-2",
                children: [{
                  label: "三级 2-2-1",
                }, ],
              },
            ],
          },
        ],
        defaultProps: {
          children: "children",
          label: "label",
        },
        expandOnClickNode: false,
        highlightCurrent: true,
        loading: true,
        selectedPath: '',
        lazy: true,
        load: (node, resolve) => {
          if(!this.count){
            this.count = 0;
          }
          this.count++;
          this.axios({
            url: "/service/loadProject",
            method: "post",
            data: {
              path: node.label,
            },
          }).then((res) => {
            resolve(res.data);
          })
          .catch(err => {
            this.$message.error('读取工程列表出错！');
            this.treeData.loading = false;
            if(this.count % 2 === 0){
              resolve([]);
            }else{
              resolve([
                {
                  label: 'lazy_node_1' 
                },
                {
                  label: 'lazy_node_2',
                  isLeaf: true
                }
              ]);
            }
          })
        }
      }
    }
  },
  methods: {
    handleNodeClick(data, node, comp) {
      let result = [node.label];
      while (node.parent && node.parent.parent) {
        result.unshift(node.parent.label);
        node = node.parent;
      }
      this.selectedPath = result.join('/');
      console.log('selectedPath: ' + this.selectedPath);
    },
    onCancel(){
      this.dialogVisible = false;
      this.treeData.loading = true;
    },
    onConfirm() {
      this.dialogVisible = false;
      // this.treeData.loading = true;
      this.$refs.blocklyPage.$refs.blocklyIframe.contentWindow.postMessage(Object.assign(this.messageData, {
        value: this.selectedPath
      }), '*')
    },
    handleClick(tab, event) {
      var index = this.$refs.statePage.activeThreadIndex;
      if (tab.name === 'BlocklyPage') {
        this.$refs.blocklyPage.activeThreadIndex = index;
        // var blocklyXml = window.localStorage.getItem('blocklyXml');
        var threadsData = window.localStorage.getItem('threadsData');
        if (threadsData) {
          threadsData = JSON.parse(threadsData);
        }
        let blocklyXml = threadsData[this.$refs.blocklyPage.activeThreadIndex].graphicData;
        this.$refs.blocklyPage.loadData(blocklyXml);
      } else if (tab.name === 'StatePage') {
        var threadsData = window.localStorage.getItem('threadsData');
        if (threadsData) {
          threadsData = JSON.parse(threadsData);
          if (threadsData[index]) {
            let blocklyXml = threadsData[index].graphicData;
            if (blocklyXml) {
              var threadData = Util.blockly2state(blocklyXml);
              threadData.basicData = {};
              Util.apply(threadData.basicData, threadsData[index].basicData);
              this.$refs.statePage.loadData(threadData, index);
            }
          }
        }

      }
      if (this.loading) {
        this.loading.close();
      }
    },
    beforeLeave(activeName, oldName) {
      this.loading = this.$loading({
        lock: true,
        text: 'Loading',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      });

      //如果当前是状态图界面
      if (oldName === 'StatePage') {
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
      } else if (oldName === 'BlocklyPage') {
        this.$refs.blocklyPage.saveData();
      }


    },
    saveAllData() {
      var threadsData = window.localStorage.getItem("threadsData");
      if (threadsData) {
        threadsData = JSON.parse(threadsData);
      } else {
        threadsData = [];
      }
      if (this.activeName === 'StatePage') {
        //todo
        this.$refs.statePage.threadAry.forEach((item, index) => {
          let stateXml = Util.thread2blockly(item, index); // 描述状态图的xml
          let blocklyXml; // 描述Blockly的xml
          if (!threadsData[index]) {
            threadsData[index] = {
              basicData: {}
            };
            // Util.apply(threadsData[index].basicData, item, ['lineAry', 'stateAry']);
          }
          if (!threadsData[index].graphicData) {
            blocklyXml = stateXml;
          } else {
            blocklyXml = new DOMParser().parseFromString(threadsData[index].graphicData, 'text/xml');
            this.syncStateXml2BlocklyXml(stateXml, blocklyXml);
          }
          threadsData[index].graphicData = this.$refs.blocklyPage.dom2text(blocklyXml);
          //保存thread的basicData(包括线程的名称、宽高等信息)
          Util.apply(threadsData[index].basicData, item, ['lineAry', 'stateAry']);
        })
        window.localStorage.setItem("threadsData", JSON.stringify(threadsData));
      }
    },
    //将状态图数据同步到blocklyXml中，作为整个线程的详细数据
    syncStateXml2BlocklyXml(stateXml, blocklyXml) {
      //1.从stateXml中提取lists_state节点和第一个state_opr节点
      let s_lists_state_dom = Util.findChildByAttribute(stateXml, 'type', 'lists_state', true);
      let b_lists_state_dom = Util.findChildByAttribute(blocklyXml, 'type', 'lists_state', true);
      let s_state_logic_dom = Util.findChildByAttribute(stateXml, 'type', 'procedures_defnoreturn', true) || Util.findChildByAttribute(stateXml, 'type', 'state_opr');
      let b_state_logic_dom = Util.findChildByAttribute(blocklyXml, 'type', 'procedures_defnoreturn', true) || Util.findChildByAttribute(blocklyXml.children[0], 'type', 'state_opr');

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
        if (item.tagName === 'value') {
          let id = item.firstElementChild.getAttribute('id');
          let b_state = Util.findChildByAttribute(b_lists_state_dom, 'id', id, true);
          if (b_state) {
            let state_entity = Util.findChildByAttribute(b_state, 'name', "STACK", true);
            if (state_entity) {
              let state_entity_type = Util.findChildByAttribute(state_entity, "type", "state_opr", true)
              let loop_entity_type = Util.findChildByAttribute(state_entity, "type", "controls_whileUntil", true)
              let graphic_state_entity
              //TODO：在状态图部分对嵌套状态内状态进行新操作后，需要将blockly内原有的内置状态与状态图部分操作后的状态的块拼接起来
              Util.toArray(s_state_ary[i].children).forEach((blockDom) => {
                Util.toArray(blockDom.children).forEach(node => {
                  if (node.tagName === 'field' || node.tagName === 'comment') {
                    // do none
                  } 
                  else if (state_entity_type || loop_entity_type) {
                    // 此时为嵌套状态，保留状态图部分对嵌套状态的修改
                    graphic_state_entity = Util.findChildByAttribute(item, 'name', "STACK", true)
                    node.remove();
                  } else {
                    node.remove();
                  }
                })
              })
              if (graphic_state_entity) {
                s_state_ary[i].firstElementChild.appendChild(graphic_state_entity)
              } else {
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
    onSearch() {
      let searchValue = this.searchValue;
      //1.如果当前是Blockly界面则在页面中blockDB_中寻找包含searchValue的图形块，然后将找到的结果显示出来，并高亮第一个匹配项，将第一个匹配项移至画布正中间
      if (this.activeName === 'BlocklyPage') {
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
        if (result.length) {
          this.searchResult = result;
          //3.聚焦到第一个匹配项
          this.focusIndex = 0;
          this.centerByDom(result[this.focusIndex]);
          //高亮第一个匹配项
          this.highlightTargetDom(this.focusIndex);
        } else {
          this.focusIndex = 0;
        }
      }
    },
    findPrev() {
      if (this.focusIndex > 0) {
        this.focusIndex--;
      } else {
        this.focusIndex = this.searchResult.length - 1;
      }
      this.centerByDom(this.searchResult[this.focusIndex]);
      this.highlightTargetDom(this.focusIndex);
    },
    findNext() {
      if (this.focusIndex < this.searchResult.length - 1) {
        this.focusIndex++;
      } else {
        this.focusIndex = 0;
      }
      this.centerByDom(this.searchResult[this.focusIndex]);
      this.highlightTargetDom(this.focusIndex);
    },
    highlightTargetDom(index) {
      let doc = this.$refs.blocklyPage.$refs.blocklyIframe.contentDocument;
      //取消掉旧的高亮项
      jQuery(doc).find('.cur-matched').removeClass('cur-matched');
      //设置新的高亮项
      let targetDom = this.searchResult[index];
      jQuery(targetDom).toggleClass('cur-matched');
    },
    /**
     * [centerByDom 将指定的dom元素移至画布中央]
     * @param  {[type]} targetDom [description]
     * @return {[type]}           [description]
     */
    centerByDom(targetDom) {

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
        matchResult = transformStr.match(/translate\((.*),\s*(.*?)\)(.*)/), //"translate(113.99999999999989,-5.684341886080802e-14) scale(1)" 这里正则要小心对数字的处理
        transformValue;


      if (matchResult) {
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
    findBlockByDescWithParent(v, blockSvg) {
      let dom = blockSvg.svgGroup_;
      let blocklyTextNodes = jQuery(dom).find('.blocklyText');
      let ary = Array.prototype.slice.call(blocklyTextNodes);
      let reg = new RegExp(v);
      for (let i = 0; i < ary.length; i++) {
        if (reg.test(jQuery(ary[i]).text())) {
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
    findBlockByDesc(v) {
      let encode = window.encodeURIComponent; //解决中文时创建正则表达式的问题
      let result = [];
      let doc = this.$refs.blocklyPage.$refs.blocklyIframe.contentDocument;
      let blocklyTextNodes = jQuery(doc).find('.blocklySvg .blocklyText');
      let ary = Array.prototype.slice.call(blocklyTextNodes);
      let reg = new RegExp(encode(v));
      for (let i = 0; i < ary.length; i++) {
        if (reg.test(encode(jQuery(ary[i]).text()))) {
          let blockSvg = jQuery(ary[i]).closest('[data-id]');
          result.push(blockSvg[0]);
        }
      }
      return result;
    },
    showProject() {
      this.dialogVisible = true;
      // this.loadProject();
      
      /*this.loadContentByPath()
      .then(res => {
        this.treeData.loading = false;
        this.treeData.projectData = res.data;
      })
      .catch(err => {
        this.$message.error('读取工程列表出错！');
        this.treeData.loading = false;
        this.treeData.projectData = [
          {
            label: 'project1'
          },
          {
            label: 'project2'
          },
        ];
      })*/
    },
    /**
     * [loadProject 加载所有的工程]
     * @return {[type]} [description]
     */
    loadProject() {

    },
    loadContentByPath(path){
      return this.axios({
        url: "/service/loadContent",
        method: "post",
        data: {
          path: path,
        },
      })
    },
    handleClose(done) {
      this.$confirm('确认关闭？')
        .then(_ => {
          done();
        })
        .catch(_ => {});
    }

  },
  created() {
    EventObj.$on("saveAllData", this.saveAllData, this);
    EventObj.$on("showProject", this.showProject, this);
    window.addEventListener('message', (e) => {
      let data = e.data;
      this.messageData = data;
      switch (data.type) {
        case 'select_path':
          EventObj.$emit("showProject", this);
          break;
        default:
      }
    })

  }
}

</script>
<style lang="less">
.el-tabs__item {
  color: #ffffff;
}

#qblockPage {
  position: relative;
  height: 100%;
  z-index: 2;

  .save-btn {
    position: absolute;
    top: 5px;
    right: 10px;
    z-index: 2;
  }

  .el-tabs {
    height: 100%;

    .el-tab-pane {
      height: 100%;
      overflow: auto;
    }

    .el-tabs__header.is-top {
      position: absolute;
      left: 50%;
      z-index: 10;
    }

    .el-tabs__content {
      height: calc(100%);
    }

    .blockly-panel {
      /* height: calc(100% - 61 -40 - 15) */
      height: 100%;
    }
  }
}

.el-loading-mask.is-fullscreen {
  background-color: rgba(0, 0, 0, 0.2) !important;
}

</style>
