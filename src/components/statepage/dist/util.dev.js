"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var NAME_SPACE = "https://developers.google.com/blockly/xml";
var Util = {
  createEl: function createEl(tagName) {
    return document.createElementNS(NAME_SPACE, tagName);
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
  createCommentDom: function createCommentDom(comment) {
    var commentDom = this.createEl('comment');
    commentDom.setAttribute('pinned', comment.pinned || false);
    commentDom.textContent = comment.value;
    return commentDom;
  },
  createStateDefBlock: function createStateDefBlock(state) {
    var stateDom = this.createEl('block');
    stateDom.setAttribute('type', 'state_def');
    stateDom.setAttribute('id', state.stateId);
    var fieldDom = this.createFieldDom({
      name: 'NAME',
      value: state.name
    });
    stateDom.appendChild(fieldDom);
    return stateDom;
  },
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
  // 触发事件描述采用独立的结构
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
  state2dom: function state2dom(rootState, threadData) {
    var rootEl = this.createEl("block");
    console.log(rootState.stateId + " --- " + rootState.name + " --- " + rootState.stateType);
    rootEl.setAttribute("id", rootState.stateId); // rootEl.setAttribute('type', rootState.type || 'state_run');

    rootEl.setAttribute("type", this.genBlockType(rootState.stateType));
    var fieldDom = this.createFieldDom({
      id: rootState.stateId,
      name: "field_state",
      value: rootState.name
    });
    rootEl.appendChild(fieldDom);
    var nextStatesDom = this.createNextStatesDom2(rootState, threadData);

    if (nextStatesDom) {
      rootEl.appendChild(nextStatesDom);
    }

    return rootEl;
  }
};
var _default = Util;
exports["default"] = _default;
//# sourceMappingURL=util.dev.js.map
