const NAME_SPACE = "https://developers.google.com/blockly/xml";
var Util = {
    createEl(tagName) {
        return document.createElementNS(NAME_SPACE, tagName);
    },
    createFieldDom(field) {
        let container = this.createEl("field");
        container.setAttribute("name", field.name);
        if (field.id){
            container.setAttribute('id', field.id);
        }
        container.textContent = field.value;
        return container;
    },

    createCommentDom(comment) {
        let commentDom = this.createEl('comment');
        commentDom.setAttribute('pinned', comment.pinned || false);
        commentDom.textContent = comment.value;
        return commentDom;
    },

    createStateDefBlock(state) {
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

    createNextStatesDom(state, thread){
        let nextDom, outputDom;

        if (state.outputAry.length) {
            nextDom = this.createEl("next");
            outputDom = this.createEl("block");
            outputDom.setAttribute("type", "controls_if");
            if (state.outputAry.length > 1) {
                let mutation = this.createEl("mutation");
                mutation.setAttribute("elseif", state.outputAry.length - 1);
                outputDom.appendChild(mutation);
            }
            state.outputAry.forEach((outputItem, index) => {
                let outputStateDom;
                outputStateDom = this.createEl("statement");
                outputStateDom.setAttribute("name", `DO${index}`);
                outputStateDom.setAttribute("id", `${outputItem.lineId}`);
                //outputAry里面只存放了lineId 所以我们需要做以下事情：
                //1 根据lineId找到对应的line数据
                //2 根据line里面的endState的stateId找到对应的state数据
                let line = thread.lineAry.find((item) => {
                    return item.lineId === outputItem.lineId;
                });
                if (line) {
                    let state = thread.stateAry.find((item) => {
                        return item.stateId === line.endState.stateId;
                    });
                    if (state) {
                        outputStateDom.appendChild(Util.state2dom(state, thread));
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
    createNextStatesDom2(state, thread) {
        let triggerEventDom;
        let nextStatesDom;
        if (state.outputAry.length) {
            /* if (state.outputAry.length > 1) {
                let mutation = this.createEl("mutation");
                mutation.setAttribute("elseif", state.outputAry.length - 1);
                triggerEventDom.appendChild(mutation);
            } */
            let parentDom;
            
            state.outputAry.forEach((outputItem, index) => {
                let nextDom = this.createEl("next");
                if (!nextStatesDom){
                    nextStatesDom = nextDom;
                }
                triggerEventDom = this.createEl("block");
                triggerEventDom.setAttribute("type", "state_trigger_event");
                triggerEventDom.setAttribute("id", outputItem.lineId);

                let triggerEventStatement;
                triggerEventStatement = this.createEl("statement");
                triggerEventStatement.setAttribute("name", `DO0`);
                // triggerEventStatement.setAttribute("id", `${outputItem.lineId}`);
                //outputAry里面只存放了lineId 所以我们需要做以下事情：
                //1 根据lineId找到对应的line数据
                //2 根据line里面的endState的stateId找到对应的state数据
                let line = thread.lineAry.find((item) => {
                    return item.lineId === outputItem.lineId;
                });
                if (line) {
                    if (line.desc){
                        let commentDom = this.createCommentDom({
                            value: line.desc
                        });
                        triggerEventDom.appendChild(commentDom);
                    }
                    let state = thread.stateAry.find((item) => {
                        return item.stateId === line.endState.stateId;
                    });
                    if (state) {
                        triggerEventStatement.appendChild(Util.state2dom(state, thread));
                    } else {
                        console.error("data error -^- ");
                    }
                }
                if (triggerEventStatement) {
                    triggerEventDom.appendChild(triggerEventStatement);
                }
                nextDom.appendChild(triggerEventDom);
                if (parentDom){
                    parentDom.appendChild(nextDom);
                }
                parentDom = triggerEventDom;
                
            });
        }
        return nextStatesDom;
    },

    genBlockType(type) {
        let ret = "state_opr";
        if (type === "loopDiv") {
            ret = "controls_whileUntil";
        }
        return ret;
    },

    state2dom(rootState, threadData){
        let rootEl = this.createEl("block");
        console.log(
            rootState.stateId +
            " --- " +
            rootState.name +
            " --- " +
            rootState.stateType
        );
        rootEl.setAttribute("id", rootState.stateId);
        // rootEl.setAttribute('type', rootState.type || 'state_run');
        rootEl.setAttribute("type", this.genBlockType(rootState.stateType));
        
        let fieldDom = this.createFieldDom({
            id: rootState.stateId,
            name: "field_state",
            value: rootState.name,
        });
        rootEl.appendChild(fieldDom);

        let nextStatesDom = this.createNextStatesDom2(rootState, threadData);
        if (nextStatesDom) {
            rootEl.appendChild(nextStatesDom);
        }
        return rootEl;
    }
}
export default Util;