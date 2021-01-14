const NAME_SPACE = "https://developers.google.com/blockly/xml";
const SOUP = '!#$%()*+,-./:;=?@[]^_`{|}~ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

import dagre from 'dagre'
import QBlock from './qblock.js'
var Util = {
    isDefined(a) {
        return !((a === '') || (a === null) || (typeof a === 'undefined'));
    },
    createEl(tagName, attrs) {
        var dom = document.createElementNS(NAME_SPACE, tagName);
        if (typeof attrs === 'object') {
            for (var key in attrs) {
                dom.setAttribute(key, attrs[key]);
            }
        }
        return dom;
    },
    createFieldDom(field) {
        let container = this.createEl("field");
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
    createCommentDom(comment) {
        let commentDom = this.createEl('comment');
        commentDom.setAttribute('pinned', comment.pinned || false);
        commentDom.textContent = comment.value;
        return commentDom;
    },

    /**
     * 创建状态定义块Dom
     * @param {*} state 
     * @param {Number} index 
     * @param {*} thread 
     */
    createStateDefBlock(state, index, thread) {
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

        //如果children不为空则说明是嵌套状态，此时需要将子状态逻辑放到“状态定义块”内部
        if (state.children && state.children.length) {
            //找到第一个子状态（inputAry为空）
            var startChild = state.children.find(item => {
                return (!item.inputAry || item.inputAry.length === 0);
            })
            var childrenDom = Util.state2dom(startChild, thread);
            var statementDom = this.createEl("statement");
            statementDom.setAttribute("name", 'STACK');
            statementDom.appendChild(childrenDom);
            stateDom.appendChild(statementDom);

            // valueDom.appendChild(childrenDom);
        }

        valueDom.appendChild(stateDom);

        return valueDom;
    },

    /**
     * 创建连线Dom以及其连接的状态块的Dom - 触发事件描述采用通用的if-else结构 controls_if 
     * ！此方法没有用到，代码暂时先放着
     * @param {*} state 
     * @param {*} thread 
     */
    createNextStatesDom(state, thread) {
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
                    /* let state = thread.stateAry.find((item) => {
                        return item.stateId === line.endState.stateId;
                    }); */
                    let state = store.getStateImplement(line.endState.stateId, thread.stateAry);
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

    /**
     * 创建连线Dom以及其连接的状态块的Dom - 触发事件描述采用独立的结构 state_trigger_event
     * @param {*} state 
     * @param {*} thread 
     */
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
                if (!nextStatesDom) {
                    nextStatesDom = nextDom;
                }
                triggerEventDom = this.createEl("block");
                triggerEventDom.setAttribute("type", "state_trigger_event");
                triggerEventDom.setAttribute("id", outputItem.lineId);
                // triggerEventDom.setAttribute("start_state", JSON.stringify(state)); // TODO 按需简化存储的start_state数据

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
                    Util.saveLineData(triggerEventDom, line);
                    if (line.desc) {
                        let commentDom = this.createCommentDom({
                            value: line.desc
                        });
                        triggerEventDom.appendChild(commentDom);
                    }
                    let state = store.getStateImplement(line.endState.stateId, thread.stateAry);
                    if (state) {
                        // triggerEventDom.setAttribute("end_state", JSON.stringify(state)); // TODO 按需简化存储的end_state数据
                        triggerEventStatement.appendChild(Util.state2dom(state, thread));
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

    genBlockType(type) {
        let ret = "state_opr";
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
    saveStateXY(el, state) {
        el.setAttribute("sx", state.x);
        el.setAttribute("sy", state.y);
    },
    saveStateWidthHeight(el, state) {
        el.setAttribute("s_width", state.width);
        el.setAttribute("s_height", state.height);
    },
    saveStateMode(el, state) {
        el.setAttribute("mode", state.mode);
    },
    /**
     * 保存状态块的数据到Dom中
     * @param {*} el 新建的和状态对应的Dom节点
     * @param {*} state 当前操作的状态
     */
    saveStateBlockDataInDom(el, state) {
        console.log(state);
        switch (state.stateType) {
            case 'stateDiv': //状态执行
                this.saveStateXY(el, state);
                this.saveStateWidthHeight(el, state);
                this.saveStateMode(el, state);
                break;
            default:
                break;
        }
    },
    /**
     * 保存连线数据到Dom
     * @param {*} el 新建的和状态对应的Dom节点
     * @param {*} state 当前操作的状态
     */
    saveLineData(el, line) {
        el.setAttribute("s_type", line.type);
    },
    /**
     * 将一个状态块转为Dom节点
     * @param {*} rootState 
     * @param {*} threadData 
     */
    state2dom(rootState, threadData) {
        let rootEl = this.createEl("block");
        // rootEl.setAttribute("id", rootState.stateId);
        rootEl.setAttribute("type", this.genBlockType(rootState.stateType));
        this.saveStateBlockDataInDom(rootEl, rootState);


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
    },
    /**
     * 创建线程定义块的Dom
     * @param {*} thread 
     * @param {*} threadProcedureId 线程的函数id
     */
    createThreadDefDom(thread, threadProcedureId) {
        /* <block type="thread_def" id="ISJ:}kp8l):hy~wr5{x5" x="-187" y="-87">
            <field name="NAME">thread</field>
            <statement name="CALLBACK">
                <block type="procedure_select" id="IK`|)2n6nVKsvFJ4VlXC">
                    <field name="field_procedure" id="aewyJ+/)D`VHlrJ$BgFT">thread_p</field>
                </block>
            </statement>
        </block> */
        // const procedureDefId = this.genUid();
        let threadDefDom = this.createEl('block', {
            type: "thread_def"
        });
        let fieldDom = this.createEl('field', {
            name: 'NAME',
            textContent: thread.name
        });
        fieldDom.textContent = thread.name;

        let statementDom = this.createEl('statement', {
            name: 'CALLBACK'
        });
        let procedureSelectBlockDom = this.createEl('block', {
            type: 'procedure_select'
        });
        let fieldProcedureDom = this.createEl('field', {
            name: 'field_procedure',
            id: threadProcedureId,
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
    createThreadProcedureDom(thread, threadProcedureId, statesDom) {
        console.log('---thread.name---' + thread.name);
        /* <block type="procedures_defnoreturn" id="aewyJ+/)D`VHlrJ$BgFT" x="463" y="-113">
            <field name="NAME">thread_p</field>
            <comment pinned="false" h="80" w="160">Describe this function...</comment>
            <statement name="STACK">
            </statement>
        </block> */
        let threadProcedureDom = this.createEl('block', {
            type: 'procedures_defnoreturn',
            id: threadProcedureId
        });
        let fieldDom = this.createEl('field', {
            name: 'NAME',

        });
        fieldDom.textContent = thread.name + "_function";
        let statementDom = this.createEl('statement', {
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
    genUid() {
        var length = 20;
        var soupLength = SOUP.length;
        var id = [];
        for (var i = 0; i < length; i++) {
            id[i] = SOUP.charAt(Math.random() * soupLength);
        }
        return id.join('');
    },
    getDomChildren(dom) {
        var ary = [];
        if (dom.children) {
            ary = Array.prototype.slice.call(dom.children);
        }
        return ary;
    },
    toNum(str) {
        return parseInt(str, 10);
    },
    translatePX2Num(str) {
        if (/px/.test(str)) {
            str = str.replace("px", "");
        }
        return +str;
    },
    getPrevStateDom(dom) {
        var parent = dom.parentNode;
        if (parent) {
            if (parent.getAttribute('type') === 'state_opr') {
                return parent;
            } else {
                parent = this.getPrevStateDom(parent);
            }
        }
        return parent;
    },
    getStateXY(stateDom, existStates) {
        /**
         * 1.获取这个Dom节点的sx, sy值，如果存在就使用这个值，如果不存在，则获取上一个状态的sx, sy值，然后查看这个stateDom处于上一个状态的outputAry中的第几个元素，假设是第3个，则
         * XY的值为：  x: targetDom.sx + gap_x(水平方向间隔)  y: targetDom.sx + index * gap_y
         */
        const gap_x = 150;
        const gap_y = 100;
        let x = this.toNum(stateDom.getAttribute('sx'));
        let y = this.toNum(stateDom.getAttribute('sy'));

        function getLineDom(dom) {
            var parent = dom.parentNode;
            if (parent) {
                if (parent.getAttribute && parent.getAttribute('type') === 'state_trigger_event') {
                    return parent;
                } else {
                    parent = getLineDom(parent);
                }
            }
            return parent;
        }

        let prevLineId = getLineDom(stateDom) && getLineDom(stateDom).getAttribute('id');
        // 正常拼接的情况下这个prevLineId是一定存在的
        if (!x || x === 'undefined') { // x是未定义的则 y也是未定义的
            let prevStateDom = Util.getPrevStateDom(stateDom);
            if (!prevStateDom) {
                return {
                    x: 0,
                    y: 0
                }
            }
            let prevX = this.toNum(prevStateDom.getAttribute('sx'));
            let prevY = this.toNum(prevStateDom.getAttribute('sy'));
            if (!prevX || prevX === 'undefined') {
                prevX = 0;
                prevY = 0;
            }
            x = prevX + gap_x;
            var index = 0;
            var prevState = existStates.find(item => {
                return item.stateId === Util.getEntityStateId(prevStateDom);
            })

            prevState.outputAry.forEach((item, i) => {
                if (item.lineId === prevLineId) {
                    index = i;
                    return false; // return false 结束forEach
                }
            })
            y = prevY + index * gap_y;
        }
        return {
            x: x,
            y: y
        }
    },
    getEntityStateId(stateDom) {
        return stateDom.children[0].getAttribute('id');
    },
    /**
     * 将所有线程的数据（包括了状态和连线）转为Blockly可识别的xml数据
     * @param {*} threadAry 线程数据
     */
    state2blockly(threadAry) {
        /**
         * 1.找到线程中有开始标记的根状态
         * 2.遍历根状态的output，生成特殊的if-else if 结构，注意：默认不采用else
         *
         */
        let statePageData = threadAry;

        let blocklyXml = Util.createEl("xml");
        blocklyXml.setAttribute(
            "xmlns",
            "https://developers.google.com/blockly/xml"
        );

        statePageData.forEach((thread, index) => {
            let firstState = thread.stateAry[0];
            let listsDom = Util.createEl('block');
            listsDom.setAttribute('type', 'lists_state');
            listsDom.setAttribute('x', 300 + (700 * index));
            listsDom.setAttribute('y', 150);

            let mutationDom = Util.createEl('mutation');
            mutationDom.setAttribute('items', thread.stateAry.length);
            listsDom.appendChild(mutationDom);

            thread.stateAry.forEach((state, i) => {
                let stateDefBlock = Util.createStateDefBlock(state, i, thread);
                listsDom.appendChild(stateDefBlock);
                // blocklyXml.appendChild(stateDefBlock);
            })
            var statesDom = Util.state2dom(firstState, thread);
            const procedureDefId = Util.genUid();
            let threadDefDom = Util.createThreadDefDom(thread, procedureDefId);
            let threadProcedureDom = Util.createThreadProcedureDom(thread, procedureDefId, statesDom);
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
            threadProcedureDom.setAttribute('y', 200);
            //这个添加的顺序很重要！！！
            blocklyXml.appendChild(listsDom);
            blocklyXml.appendChild(threadProcedureDom);
            blocklyXml.appendChild(threadDefDom);
        });

        return blocklyXml.outerHTML;
    },
    /**
     * 将Blockly数据转为状态图可识别的数据
     */
    blockly2state(xmlDom) {
        if (typeof xmlDom === 'string') {
            xmlDom = new DOMParser().parseFromString(xmlDom, 'text/xml');
        }

        var stateLogicDom = Util.getProceduresDefDom(xmlDom);
        var listStateDom = Util.getListStateDom(xmlDom);

        let stateAry = []; //所有的状态数据集合
        let lineAry = []; //所有的连线数据集合
        Util.extractStateAndLine(stateLogicDom, stateAry, lineAry);

        Util.updateChildrenOfState(stateAry, listStateDom, lineAry);
        return {
            stateAry: stateAry,
            lineAry: lineAry
        }
    },
    extractStateAndLine(stateDom, stateAry, lineAry) {
        /* <block type="state_opr" id="0eRjWo`*LW!O%5)$3!bj" sx="394" sy="201">
            <field name="field_state" id="state-1607658086399">状态描述0</field>
        </block> */
        const STATE_BLOCK = 'state_opr';
        if (stateDom && stateDom.tagName === 'block' && stateDom.getAttribute('type') === STATE_BLOCK) {
            let stateId = Util.getEntityStateId(stateDom);
            // 这个stateId有可能已经存在 看一下xml数据就能明白了
            let stateObj = stateAry.find(item => {
                return item.stateId === stateId;
            });

            if (!stateObj) {
                stateObj = {
                    stateId: Util.getEntityStateId(stateDom), //!!!这里的id不是block.state_opr的 id 哟，而是它下面的field.field_state的id
                    stateType: stateDom.getAttribute('type') === STATE_BLOCK ? 'stateDiv' : 'loopDiv',
                    bx: parseInt(stateDom.getAttribute('x'), 10), // blockly中与此对应的图形块的x
                    by: parseInt(stateDom.getAttribute('y'), 10), // blockly中与此对应的图形块的y
                    x: Util.getStateXY(stateDom, stateAry).x, //stateDom.getAttribute('sx'),
                    y: Util.getStateXY(stateDom, stateAry).y,
                    width: stateDom.getAttribute('s_width') || '76px',
                    height: stateDom.getAttribute('s_height') || '40px',
                    // virtualHeight: Util.getVirtualHeight(outputAry), //TODO 开始状态为这个stateDom的所有状态高度之和
                    name: stateDom.children[0].textContent,
                    mode: stateDom.getAttribute('mode') || 'default',
                    inputAry: [],
                    outputAry: [],
                    children: [],
                    parent: null,
                    nodeHeight: 0 // 如果该节点有2个分支，且分支是叶子节点，则这个节点的nodeHeight = 2; 总之，nodeHeight = 各分支nodeHeight之和 - 这个参数为自动布局所用
                }
            }


            function dom2State(dom) {
                let stateId = dom.getAttribute('id');
                if (dom.getAttribute('type') === STATE_BLOCK) {
                    stateId = Util.getEntityStateId(dom);
                }
                return {
                    stateId: stateId,
                    stateType: STATE_BLOCK
                };
            }

            function findOutputLinesOfStateDom(stateDom, outputLines) {
                // 如果stateDom中有next节点 且 next节点的children中有block.state_trigger_event 则将这个block.state_trigger_event push 到 outputLines
                // 然后将这个block.state_trigger_event作为新的stateDom，查找其包含的block.state_trigger_event 这样遍历查找所有的block.state_trigger_event就找到了outputLines
                let children = Util.getDomChildren(stateDom);
                children.forEach(child => {
                    if (child.tagName === 'next') { //所有next节点的children都只有1个
                        if (child.children && child.children[0] && child.children[0].getAttribute('type') === 'state_trigger_event') {
                            let lineDom = child.children[0];
                            if(!lineDom.getAttribute('id').indexOf('line') === 0){
                                debugger;
                            }
                            let newLine = {
                                lineId: lineDom.getAttribute('id'),
                                d: lineDom.getAttribute('d'),
                                type: lineDom.getAttribute('s_type'),
                                startState: dom2State(Util.getStartStateDomOfLine(lineDom)),
                                endState: dom2State(Util.getEndStateDomOfLine(lineDom)),
                            };

                            let existLineOfOutputLines = outputLines.find(item => {
                                return item.lineId === lineDom.getAttribute('id');
                            })
                            if (!existLineOfOutputLines) {
                                outputLines.push(newLine);
                            }

                            let existLineOfLineAry = lineAry.find(item => {
                                return item.lineId === lineDom.getAttribute('id')
                            })
                            if (!existLineOfLineAry) {
                                lineAry.push(newLine);
                            }
                            findOutputLinesOfStateDom(lineDom, outputLines);
                        }
                    }
                })
                return outputLines;
            }

            function findInputLinesOfStateDom(stateDom, inputLines) {
                //逐级往上寻找type === 'state_opr'的块即inputLines    //  block.state_trigger_event > statement > block.state_opr
                let lineDom = stateDom.parentNode && stateDom.parentNode.parentNode;
                if (lineDom && lineDom.getAttribute('type') === 'state_trigger_event') {
                    let newLine = {
                        lineId: lineDom.getAttribute('id'),
                        d: lineDom.getAttribute('d'),
                        type: lineDom.getAttribute('s_type'),
                        startState: dom2State(Util.getPrevStateDom(lineDom)),
                        endState: dom2State(Util.getEndStateDomOfLine(lineDom))
                    };

                    let existLineOfInputLines = inputLines.find(item => {
                        return item.lineId === newLine.lineId;
                    })
                    if (!existLineOfInputLines) {
                        inputLines.push(newLine);
                    }

                    let existLineOfLineAry = lineAry.find(item => {
                        return item.lineId === newLine.lineId;
                    })
                    if (!existLineOfLineAry) {
                        lineAry.push(newLine);
                    }
                }
                return inputLines;
            }

            findOutputLinesOfStateDom(stateDom, stateObj.outputAry);
            findInputLinesOfStateDom(stateDom, stateObj.inputAry);

            let existStateInStateAry = stateAry.find(state => {
                return state.stateId === stateObj.stateId;
            })
            if (!existStateInStateAry) {
                stateAry.push(stateObj);
            }
        }

        if (stateDom && stateDom.children && stateDom.children.length) {
            for (let j = 0; j < stateDom.children.length; j++) {
                let child = stateDom.children[j];
                Util.extractStateAndLine(child, stateAry, lineAry);
            }
        }
    },
    updateChildrenOfState(stateAry, xmlDom, lineAry) {
        if (xmlDom && xmlDom.tagName === 'block' && xmlDom.getAttribute('type') === 'state_def') {
            if (xmlDom.childNodes) {
                var ary = Array.prototype.slice.call(xmlDom.childNodes);
                var subStatesDom = ary.find(element => {
                    return element.tagName === 'statement'
                });
                if (subStatesDom) {
                    var stateAry2 = [];
                    var childrenData = Util.extractStateAndLine(subStatesDom, stateAry2, lineAry);
                    var state = Util.getStateById(stateAry, xmlDom.getAttribute('id'));
                    if (state) {
                        state.children = stateAry2;
                        stateAry2.forEach(item => {
                            item.parent = state.stateId;
                        })
                    }
                }
            }
        } else {
            if (xmlDom) {
                var ary2 = Array.prototype.slice.call(xmlDom.childNodes);
                ary2.forEach(item => {
                    Util.updateChildrenOfState(stateAry, item, lineAry);
                })
            }

        }

    },
    getProceduresDefDom(dom) {
        var result;
        if (dom.tagName === 'block' && dom.getAttribute('type') === 'procedures_defnoreturn') {
            result = dom;
        } else {
            var children = Array.prototype.slice.call(dom.childNodes);
            for (var i = 0; i < children.length; i++) {
                result = Util.getProceduresDefDom(children[i]);
                if (result) {
                    break;
                }
            }
        }
        return result;
    },
    getListStateDom(dom) {
        var result;
        if (dom && dom.tagName && dom.tagName === 'block' && dom.getAttribute('type') === 'lists_state') {
            result = dom;
        } else {
            var children = Array.prototype.slice.call(dom.childNodes);
            for (var i = 0; i < children.length; i++) {
                result = Util.getListStateDom(children[i]);
                if (result) {
                    break;
                }
            }
        }
        return result;
    },
    getStateById(stateAry, stateId) {
        var item, result;
        for (var i = 0; i < stateAry.length; i++) {
            item = stateAry[i];
            if (item.stateId === stateId) {
                return item;
            } else {
                if (item.children && item.children.length) {
                    result = Util.getStateById(item.children, stateId);
                }
            }
        }
        return result;
    },
    getStartStateDomOfLine(lineDom) {
        return this.getPrevStateDom(lineDom);
    },
    getEndStateDomOfLine(lineDom) {
        let children = Array.prototype.slice.call(lineDom.childNodes);
        let statement = children.find(dom => {
            return dom.nodeName === 'statement'
        })
        let statementChildren = Array.prototype.slice.call(statement.childNodes);
        let endStateDom = statementChildren.find(dom => {
            return dom.nodeName === 'block'
        })
        if (!endStateDom) {
            console.error('数据错误：触发事件连线没有连接正确的状态');
        }
        return endStateDom;
    },
    /**
     * 将Blockly数据复制到剪切板 - 调试时用
     * @param {*} blocklyXml 
     */
    copyBlocklyXml2Clipboard(blocklyXml) {
        // window.stateDataXml = blocklyXml.outerHTML;
        let hiddenInput = document.createElement("input");
        hiddenInput.setAttribute("type", "text");
        hiddenInput.setAttribute("value", blocklyXml);
        hiddenInput.setAttribute("style", "height: 0; overflow: hidden;");
        document.body.appendChild(hiddenInput);
        //hiddenInput.focus();
        hiddenInput.select();
        document.execCommand("copy");
        document.body.removeChild(hiddenInput);
    },
    workspace2dom() {
        var xmlText = '';
        var iframeDom = document.getElementById('blocklyIframe');
        if (iframeDom) {
            var win = iframeDom.contentWindow;
            var xmlDom = win.Blockly.Xml.workspaceToDom(win.Code.workspace);
            xmlText = win.Blockly.Xml.domToPrettyText(xmlDom);

        } else {
            console.error('当前页面没有嵌入blockly');
        }
        return xmlText;
    },
    /**
     * 在自动布局前重置所有状态的x,y坐标
     */
    resetAllStateData(thread) {
        if (thread) {
            thread.stateAry.forEach(state => {
                state.x = 0;
                state.y = 0;
            })
        }
    },
    autoLayout(thread) {
        if (thread) {
            let firstState = Util.findFirstState(thread.stateAry);
            thread.stateAry.forEach(state => {
                let prevState; //TODO 当前状态的前一个兄弟节点
                state.virtualHeight = Util.getVirtualHeight(state);
                state.y = prevState.y + prevState.virtualHeight;
            })
        }
    },
    /**
     * 找到“开始状态”
     */
    findFirstState(stateAry) {
        return stateAry[0]; //TODO 后续根据特定标记查找
    },
    getVirtualHeight(state) {
        let outputStates = [];
        state.outputAry.forEach(line => {
            let lineObj = thread.lineAry.find(item => {
                return item.lineId === line.lineId;
            })
            let endStateOfLine = thread.stateAry.find(item => {
                return item.stateId === lineObj.endState.stateId;
            })
            outputStates.push(endStateOfLine);
        })

        let sum = 0;
        outputStates.forEach(state => {
            if (!state.virtualHeight) {
                state.virtualHeight = Util.getVirtualHeight(state);
                sum += state.virtualHeight;
            }
        })
        return sum;
    },
    getAutoXY(state) {
        //x,y是同时设置的，所以只需判断其中一个即可
        if (state.y) {
            return {
                x: state.x,
                y: state.y
            }
        } else {
            state.y = prevState.y + prevState.virtualHeight;
        }
    },
    getDomByStateId(stateId) {
        let doms = document.getElementsByClassName('state-wrap');
        return Array.prototype.slice.call(doms).find(item => {
            return item.getAttribute('stateid') === stateId;
        })
    },
    /**
     * 根据当前所在的层级生成用于自动布局的graphlib图
     * NOTE: 当前寻找state的代码为hardcode，需要讨论如何在statePage内获取当前线程的Index后修改
     * @param {*} layer 
     * @param {*} lineAry 
     * 
     */
    genGraphByLayer(threadIndex, layer, lineAry) {
        var g = new dagre.graphlib.Graph({
            //multigraph: true,
        });
        g.setGraph({
            rankdir: 'LR',
            align: 'UL',
            edgesep: 0,
            ranksep: 70,
        });
        g.setDefaultEdgeLabel(function () {
            return {};
        });
        let stateInCurrentLayer
        //获取处于当前所在层级内的状态
        if (layer.stateAry) {
            stateInCurrentLayer = layer.stateAry
        } else {
            stateInCurrentLayer = layer.children
        }
        stateInCurrentLayer.forEach(state => {
            g.setNode(state.stateId, {
                label: state.name,
                width: QBlock.State.getStateWidth(state),
                height: QBlock.State.getStateHeight(state)
            });

            state.inputAry.forEach(line => {
                let lineObj = lineAry.find(item => {
                    return item.lineId === line.lineId
                })
                let startState = store.getState(threadIndex, lineObj.startState.stateId)
                //处理可能存在的从循环状态内连接至循环状态外的连线，若存在这种连线，则将连线起始点模拟到与被连入状态处在同一层级的父状态上
                if (startState.parent !== state.parent) {
                    while (startState.parent !== state.parent) {
                        if (startState.parent === null && startState.parent !== state.parent) {
                            return
                        } else {
                            startState = store.getState(threadIndex, startState.parent)
                        }
                    }
                    g.setEdge(startState.stateId, state.stateId, {
                        label: line.lineId
                    })
                }
            })

            state.outputAry.forEach(line => {
                let lineObj = lineAry.find(item => {
                    return item.lineId === line.lineId;
                })
                let endState = store.getState(threadIndex, lineObj.endState.stateId)
                if (endState.parent !== state.parent) {
                    //处理可能存在的从循环状态外连接至循环状态内的连线，若存在这种连线，则将连线结束点模拟到与被连入状态处在同一层级的父状态上
                    while (endState.parent !== state.parent) {
                        if (endState.parent === null && endState.parent !== state.parent) {
                            return
                        } else {
                            endState = store.getState(threadIndex, endState.parent)
                        }
                    }
                }
                // g.setEdge(state.stateId, endState.stateId, line.lineId, lineObj.desc); //这种设置方式会报错 可能是dagre对graphlib的封装接口未同步
                g.setEdge(state.stateId, endState.stateId, {
                    label: line.lineId
                });
            })
        })
        return g
    },
    setStateXYbyNode(state, node) {
        let halfStateWidth = QBlock.State.getStateWidth(state) / 2
        let halfStateHeight = QBlock.State.getStateHeight(state) / 2
        state.x = node.x - halfStateWidth + 20
        state.y = node.y - halfStateHeight + 20
        return
    },
    setStateXYbyLayer(threadIndex, g, layer) {
        let stateInCurrentLayer
        if (layer.stateAry) {
            stateInCurrentLayer = layer.stateAry
        } else {
            stateInCurrentLayer = layer.children
        }
        g.nodes().forEach(function (nodeId) {
            let node = g.node(nodeId);
            let state = store.getState(threadIndex, nodeId)
            if (state) {
                Util.setStateXYbyNode(state, node) //重设状态位置信息
                if (state.inputAry && state.inputAry.length) {
                    state.inputAry.forEach(item => {
                        store.stateData.lineMap[item.lineId].refresh();
                    })
                }
            }
            console.log("Node " + nodeId + ": " + JSON.stringify(g.node(nodeId)));
        });
    },
    testLayout(threadIndex, thread, lineAry) {
        let g = this.genGraphByLayer(threadIndex, thread, lineAry)
        dagre.layout(g); //布局分析
        this.setStateXYbyLayer(threadIndex, g, thread)
    },
}
export default Util;