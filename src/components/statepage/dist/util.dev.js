"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var NAME_SPACE = "https://developers.google.com/blockly/xml";
var SOUP = '!#$%()*+,-./:;=?@[]^_`{|}~ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
var Util = {
  isDefined: function isDefined(a) {
    return !(a === '' || a === null || typeof a === 'undefined');
  },
  createEl: function createEl(tagName, attrs) {
    var dom = document.createElementNS(NAME_SPACE, tagName);

    if (_typeof(attrs) === 'object') {
      for (var key in attrs) {
        dom.setAttribute(key, attrs[key]);
      }
    }

    return dom;
  },
  createFieldDom: function createFieldDom(field) {
    var container = this.createEl("field");
    container.setAttribute("name", field.name);

    if (field.id) {
      container.setAttribute('id', field.id);
    }

    container.textContent = field.value;
    return container;
  },

  /**
   * 创建注释块Dom
   * @param {*} comment 
   */
  createCommentDom: function createCommentDom(comment) {
    var commentDom = this.createEl('comment');
    commentDom.setAttribute('pinned', comment.pinned || false);
    commentDom.textContent = comment.value;
    return commentDom;
  },

  /**
   * 创建状态定义块Dom
   * @param {*} state 
   * @param {*} index 
   */
  createStateDefBlock: function createStateDefBlock(state, index) {
    var valueDom = this.createEl('value');
    valueDom.setAttribute('name', 'ADD' + index);
    var stateDom = this.createEl('block');
    stateDom.setAttribute('type', 'state_def');
    stateDom.setAttribute('id', state.stateId);
    var fieldDom = this.createFieldDom({
      name: 'NAME',
      value: state.name
    });
    stateDom.appendChild(fieldDom);
    valueDom.appendChild(stateDom);
    return valueDom;
  },

  /**
   * 创建连线Dom以及其连接的状态块的Dom - 触发事件描述采用通用的if-else结构 controls_if 
   * ！此方法没有用到，代码暂时先放着
   * @param {*} state 
   * @param {*} thread 
   */
  createNextStatesDom: function createNextStatesDom(state, thread) {
    var _this = this;

    var nextDom, outputDom;

    if (state.outputAry.length) {
      nextDom = this.createEl("next");
      outputDom = this.createEl("block");
      outputDom.setAttribute("type", "controls_if");

      if (state.outputAry.length > 1) {
        var mutation = this.createEl("mutation");
        mutation.setAttribute("elseif", state.outputAry.length - 1);
        outputDom.appendChild(mutation);
      }

      state.outputAry.forEach(function (outputItem, index) {
        var outputStateDom;
        outputStateDom = _this.createEl("statement");
        outputStateDom.setAttribute("name", "DO".concat(index));
        outputStateDom.setAttribute("id", "".concat(outputItem.lineId)); //outputAry里面只存放了lineId 所以我们需要做以下事情：
        //1 根据lineId找到对应的line数据
        //2 根据line里面的endState的stateId找到对应的state数据

        var line = thread.lineAry.find(function (item) {
          return item.lineId === outputItem.lineId;
        });

        if (line) {
          var _state = thread.stateAry.find(function (item) {
            return item.stateId === line.endState.stateId;
          });

          if (_state) {
            outputStateDom.appendChild(Util.state2dom(_state, thread));
          } else {
            console.error("data error -^- ");
          }
        }

        if (outputStateDom) {
          outputDom.appendChild(outputStateDom);
        }
      });
      nextDom.appendChild(outputDom);
    }

    return nextDom;
  },

  /**
   * 创建连线Dom以及其连接的状态块的Dom - 触发事件描述采用独立的结构 state_trigger_event
   * @param {*} state 
   * @param {*} thread 
   */
  createNextStatesDom2: function createNextStatesDom2(state, thread) {
    var _this2 = this;

    var triggerEventDom;
    var nextStatesDom;

    if (state.outputAry.length) {
      /* if (state.outputAry.length > 1) {
          let mutation = this.createEl("mutation");
          mutation.setAttribute("elseif", state.outputAry.length - 1);
          triggerEventDom.appendChild(mutation);
      } */
      var parentDom;
      state.outputAry.forEach(function (outputItem, index) {
        var nextDom = _this2.createEl("next");

        if (!nextStatesDom) {
          nextStatesDom = nextDom;
        }

        triggerEventDom = _this2.createEl("block");
        triggerEventDom.setAttribute("type", "state_trigger_event");
        triggerEventDom.setAttribute("id", outputItem.lineId);
        triggerEventDom.setAttribute("start_state", JSON.stringify(state)); // TODO 按需简化存储的start_state数据

        var triggerEventStatement;
        triggerEventStatement = _this2.createEl("statement");
        triggerEventStatement.setAttribute("name", "DO0"); // triggerEventStatement.setAttribute("id", `${outputItem.lineId}`);
        //outputAry里面只存放了lineId 所以我们需要做以下事情：
        //1 根据lineId找到对应的line数据
        //2 根据line里面的endState的stateId找到对应的state数据

        var line = thread.lineAry.find(function (item) {
          return item.lineId === outputItem.lineId;
        });

        if (line) {
          triggerEventDom.setAttribute("d", line.d);

          if (line.desc) {
            var commentDom = _this2.createCommentDom({
              value: line.desc
            });

            triggerEventDom.appendChild(commentDom);
          }

          var _state2 = thread.stateAry.find(function (item) {
            return item.stateId === line.endState.stateId;
          });

          if (_state2) {
            triggerEventDom.setAttribute("end_state", JSON.stringify(_state2)); // TODO 按需简化存储的end_state数据

            triggerEventStatement.appendChild(Util.state2dom(_state2, thread));
          } else {
            console.error("data error -^- ");
          }
        }

        if (triggerEventStatement) {
          triggerEventDom.appendChild(triggerEventStatement);
        }

        nextDom.appendChild(triggerEventDom);

        if (parentDom) {
          parentDom.appendChild(nextDom);
        }

        parentDom = triggerEventDom;
      });
    }

    return nextStatesDom;
  },
  genBlockType: function genBlockType(type) {
    var ret = "state_opr";

    if (type === "loopDiv") {
      ret = "controls_whileUntil";
    }

    return ret;
  },

  /**
   * 保存状态块的位置信息到Dom中
   * @param {*} el 新建的和状态对应的Dom节点
   * @param {*} state 当前操作的状态
   */
  saveStateXY: function saveStateXY(el, state) {
    el.setAttribute("sx", state.x);
    el.setAttribute("sy", state.y);
  },

  /**
   * 保存状态块的数据到Dom中
   * @param {*} el 新建的和状态对应的Dom节点
   * @param {*} state 当前操作的状态
   */
  saveStateBlockDataInDom: function saveStateBlockDataInDom(el, state) {
    switch (state.stateType) {
      case 'stateDiv':
        //状态执行
        this.saveStateXY(el, state);
        break;

      case 'state_trigger_event':
        //连线
        this.saveLineData(el, state);

      default:
        break;
    }
  },

  /**
   * 保存连线数据到Dom
   * @param {*} el 新建的和状态对应的Dom节点
   * @param {*} state 当前操作的状态
   */
  saveLineData: function saveLineData(el, state) {
    el.setAttribute("d", state.d);
    el.setAttribute("start_state", JSON.stringify(state.startState));
    el.setAttribute("end_state", JSON.stringify(state.startState));
  },

  /**
   * 将一个状态块转为Dom节点
   * @param {*} rootState 
   * @param {*} threadData 
   */
  state2dom: function state2dom(rootState, threadData) {
    var rootEl = this.createEl("block");
    console.log(rootState.stateId + " --- " + rootState.name + " --- " + rootState.stateType);
    rootEl.setAttribute("id", rootState.stateId); // rootEl.setAttribute('type', rootState.type || 'state_run');

    rootEl.setAttribute("type", this.genBlockType(rootState.stateType));
    this.saveStateBlockDataInDom(rootEl, rootState);
    var fieldDom = this.createFieldDom({
      id: rootState.stateId,
      name: "field_state",
      value: rootState.name
    });
    rootEl.appendChild(fieldDom);
    var fieldX = this.createFieldDom({
      id: rootState.stateId,
      name: "SX_FIELD",
      value: 8888 //rootState.x,

    });
    rootEl.appendChild(fieldX);
    var nextStatesDom = this.createNextStatesDom2(rootState, threadData);

    if (nextStatesDom) {
      rootEl.appendChild(nextStatesDom);
    }

    return rootEl;
  },

  /**
   * 创建线程定义块的Dom
   * @param {*} thread 
   * @param {*} threadProcedureId 线程的函数id
   */
  createThreadDefDom: function createThreadDefDom(thread, threadProcedureId) {
    /* <block type="thread_def" id="ISJ:}kp8l):hy~wr5{x5" x="-187" y="-87">
        <field name="NAME">thread</field>
        <statement name="CALLBACK">
            <block type="procedure_select" id="IK`|)2n6nVKsvFJ4VlXC">
                <field name="field_procedure" id="aewyJ+/)D`VHlrJ$BgFT">thread_p</field>
            </block>
        </statement>
    </block> */
    // const procedureDefId = this.genUid();
    var threadDefDom = this.createEl('block', {
      type: "thread_def"
    });
    var fieldDom = this.createEl('field', {
      name: 'NAME',
      textContent: thread.name
    });
    fieldDom.textContent = thread.name;
    var statementDom = this.createEl('statement', {
      name: 'CALLBACK'
    });
    var procedureSelectBlockDom = this.createEl('block', {
      type: 'procedure_select'
    });
    var fieldProcedureDom = this.createEl('field', {
      name: 'field_procedure',
      id: threadProcedureId
    });
    fieldProcedureDom.textContent = thread.name + "_function";
    procedureSelectBlockDom.appendChild(fieldProcedureDom);
    statementDom.appendChild(procedureSelectBlockDom);
    threadDefDom.appendChild(fieldDom);
    threadDefDom.appendChild(statementDom);
    return threadDefDom;
  },

  /**
   * 创建线程函数定义块的Dom
   * @param {*} thread 
   * @param {*} threadProcedureId 
   * @param {*} statesDom 所有连接的状态
   */
  createThreadProcedureDom: function createThreadProcedureDom(thread, threadProcedureId, statesDom) {
    console.log('---thread.name---' + thread.name);
    /* <block type="procedures_defnoreturn" id="aewyJ+/)D`VHlrJ$BgFT" x="463" y="-113">
        <field name="NAME">thread_p</field>
        <comment pinned="false" h="80" w="160">Describe this function...</comment>
        <statement name="STACK">
        </statement>
    </block> */

    var threadProcedureDom = this.createEl('block', {
      type: 'procedures_defnoreturn',
      id: threadProcedureId
    });
    var fieldDom = this.createEl('field', {
      name: 'NAME'
    });
    fieldDom.textContent = thread.name + "_function";
    var statementDom = this.createEl('statement', {
      name: 'STACK'
    });
    statementDom.appendChild(statesDom);
    threadProcedureDom.appendChild(fieldDom);
    threadProcedureDom.appendChild(statementDom);
    return threadProcedureDom;
  },

  /**
   * 获取唯一id，同google blockly产生唯一id的方法
   */
  genUid: function genUid() {
    var length = 20;
    var soupLength = SOUP.length;
    var id = [];

    for (var i = 0; i < length; i++) {
      id[i] = SOUP.charAt(Math.random() * soupLength);
    }

    return id.join('');
  },

  /**
   * 将所有线程的数据（包括了状态和连线）转为Blockly可识别的xml数据
   * @param {*} threadAry 线程数据
   */
  state2blockly: function state2blockly(threadAry) {
    /**
     * 1.找到线程中有开始标记的根状态
     * 2.遍历根状态的output，生成特殊的if-else if 结构，注意：默认不采用else
     *
     */
    var statePageData = threadAry;
    var blocklyXml = Util.createEl("xml");
    blocklyXml.setAttribute("xmlns", "https://developers.google.com/blockly/xml");
    statePageData.forEach(function (thread, index) {
      var firstState = thread.stateAry[0];
      var listsDom = Util.createEl('block');
      listsDom.setAttribute('type', 'lists_state');
      listsDom.setAttribute('x', 300 + 700 * index);
      listsDom.setAttribute('y', 150);
      var mutationDom = Util.createEl('mutation');
      mutationDom.setAttribute('items', thread.stateAry.length);
      listsDom.appendChild(mutationDom);
      thread.stateAry.forEach(function (state, i) {
        var stateDefBlock = Util.createStateDefBlock(state, i);
        listsDom.appendChild(stateDefBlock); // blocklyXml.appendChild(stateDefBlock);
      });
      var statesDom = Util.state2dom(firstState, thread);
      var procedureDefId = Util.genUid();
      var threadDefDom = Util.createThreadDefDom(thread, procedureDefId);
      var threadProcedureDom = Util.createThreadProcedureDom(thread, procedureDefId, statesDom);

      if (Util.isDefined(thread.x)) {
        threadDefDom.setAttribute('x', thread.x);
      } else {
        threadDefDom.setAttribute('x', index * 700);
      }

      if (Util.isDefined(thread.y)) {
        threadDefDom.setAttribute('y', thread.y);
      } else {
        threadDefDom.setAttribute('y', 10);
      }

      threadProcedureDom.setAttribute('x', index * 700);
      threadProcedureDom.setAttribute('y', 200); //这个添加的顺序很重要！！！

      blocklyXml.appendChild(listsDom);
      blocklyXml.appendChild(threadProcedureDom);
      blocklyXml.appendChild(threadDefDom);
    });
    return blocklyXml.outerHTML;
  },

  /**
   * 将Blockly数据转为状态图可识别的数据
   */
  blockly2state: function blockly2state() {},

  /**
   * 将Blockly数据复制到剪切板 - 调试时用
   * @param {*} blocklyXml 
   */
  copyBlocklyXml2Clipboard: function copyBlocklyXml2Clipboard(blocklyXml) {
    // window.stateDataXml = blocklyXml.outerHTML;
    var hiddenInput = document.createElement("input");
    hiddenInput.setAttribute("type", "text");
    hiddenInput.setAttribute("value", blocklyXml);
    hiddenInput.setAttribute("style", "height: 0; overflow: hidden;");
    document.body.appendChild(hiddenInput);
    hiddenInput.focus();
    hiddenInput.select();
    document.execCommand("copy");
    document.body.removeChild(hiddenInput);
  }
};
var _default = Util;
exports["default"] = _default;
//# sourceMappingURL=util.dev.js.map
