const lineCfg = {
    line_h: 20, //连线水平方向的长度
    line_v: 15, //连线垂直方向的长度
    line_radius: 5, //连线拐角的半径
    stroke_width: 2, //连线的粗细
    desc_limit: 8, //显示在描述上的字数限制
    rectCount: 3, //在连线运行动画中显示的动画元素个数
    dur: 1200, //一次完整的连线运行动画持续的时间 毫秒
    interval: 100, // 连线动画中矩形物块开始动画的时间差 毫秒
    highlight_limit: 1, //高亮状态块的最大个数
    threadTitleHeight: 35, //线程框标题的高度
    threadToolBoxHeight: 35, //线程框工具栏的高度
    rankSep: 70, //自动布局时不同rank状态之间相隔的距离
}

export {
    lineCfg
}
