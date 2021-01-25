import { lineCfg } from "./graphCfg.js";
import QBlock from "./qblock.js";
const LINE_H = lineCfg.line_h;
const LINE_V = lineCfg.line_v;
const LINE_RADIUS = lineCfg.line_radius
var DrawLine = {
    //-------------------------------------------------------------
    //将绘制连线的方法拆分为以下方法
    moveToStartPoint(lineStartPoint) {
        return `M ${lineStartPoint.x} ${lineStartPoint.y} `;
    },
    //以配置好的连线长度绘制连线
    drawHorizontalSetLine() {
        return `h ${LINE_H} `;
    },
    drawHorizontalLine(lineEndPointX) {
        return `H ${lineEndPointX} `;
    },
    drawVerticalLine(lineEndPointY) {
        return `m 0 0 V ${lineEndPointY} `;
    },
    drawLineToEndPoint(lineEndPoint) {
        return `m 0 0 L ${lineEndPoint.x} ${lineEndPoint.y} `;
    },
    drawArc(radius, xRotation, sweepFlag, lineEndPoint) {
        return `m 0 0 A ${radius} ${radius} ${xRotation} 0 ${sweepFlag} ${lineEndPoint.x} ${lineEndPoint.y} `;
    },
    drawArrow(lineEndPoint) {
        return `m -5 -5 L ${lineEndPoint.x} ${lineEndPoint.y} L ${
            lineEndPoint.x - 5
            } ${lineEndPoint.y + 5} `;
    },

    //绘制直线连线
    drawStraightConnectLine(startPoint, endPoint) {
        let linePath = "";
        linePath += this.moveToStartPoint(startPoint);
        linePath += this.drawHorizontalLine(endPoint.x);
        linePath += this.drawArrow(endPoint);
        return linePath;
    },
    //前向3段，前向5段，以及反向5段式连线通用的绘制连进连入点的直线的方法
    drawLineInputH(endPoint) {
        let tempLinePath = this.drawLineToEndPoint(endPoint);
        return tempLinePath;
    },

    /**
     * 反向5段式连线方法
     */
    //分段处理向后和向前的连线
    drawLineBack5OutputH(startPoint, endPoint) {
        let tempLinePath = "";
        let firstArcEnd = {
            x: 0,
            y: 0,
        };
        tempLinePath += this.moveToStartPoint(startPoint);
        tempLinePath += this.drawHorizontalSetLine();
        //若起始点的y坐标大于结束点的y坐标
        if (startPoint.y > endPoint.y) {
            firstArcEnd.x = startPoint.x + LINE_H + LINE_RADIUS;
            firstArcEnd.y = startPoint.y - LINE_RADIUS;
            tempLinePath += this.drawArc(LINE_RADIUS, 1, 0, firstArcEnd);
        } else {
            firstArcEnd.x = startPoint.x + LINE_H + LINE_RADIUS;
            firstArcEnd.y = startPoint.y + LINE_RADIUS;
            tempLinePath += this.drawArc(LINE_RADIUS, 0, 1, firstArcEnd);
        }
        return tempLinePath;
    },
    //因为连线的坐标是相对于svg元素的，所以需要加上threadTitleHeight以获取连线的准确坐标
    drawLineBack5OutputVUp(startPoint, startStateTop, endStateTop) {
        let tempLinePath = "";
        let secondArcStart;
        let secondArcEnd = {
            x: 0,
            y: 0,
        };
        if (startStateTop < endStateTop) {
            //比较起始状态和结束状态的上边缘的高低，根据上边缘高的状态决定垂直绘制连线的坐标
            secondArcStart =
                startStateTop - LINE_V + LINE_RADIUS + lineCfg.threadTitleHeight;
            tempLinePath += this.drawVerticalLine(secondArcStart);
            secondArcEnd.x = startPoint.x + LINE_H;
            secondArcEnd.y = startStateTop - LINE_V + lineCfg.threadTitleHeight;
            tempLinePath += this.drawArc(LINE_RADIUS, 0, 0, secondArcEnd);
        } else {
            secondArcStart =
                endStateTop - LINE_V + LINE_RADIUS + lineCfg.threadTitleHeight;
            tempLinePath += this.drawVerticalLine(secondArcStart);
            secondArcEnd.x = startPoint.x + LINE_H;
            secondArcEnd.y = endStateTop - LINE_V + lineCfg.threadTitleHeight;
            tempLinePath += this.drawArc(LINE_RADIUS, 0, 0, secondArcEnd);
        }
        return tempLinePath;
    },
    //因为连线的坐标是相对于svg元素的，所以需要加上threadTitleHeight以获取连线的准确坐标
    drawLineBack5OutputVDown(
        startPoint,
        startStateBottom,
        endStateBottom
    ) {
        let tempLinePath = "";
        let secondArcStart;
        let secondArcEnd = {
            x: 0,
            y: 0,
        };
        if (startStateBottom < endStateBottom) {
            //比较起始状态和结束状态的下边缘的高低，根据下边缘低的状态决定垂直绘制连线的坐标
            secondArcStart =
                endStateBottom + LINE_V - LINE_RADIUS + lineCfg.threadTitleHeight;
            tempLinePath += this.drawVerticalLine(secondArcStart);
            secondArcEnd.x = startPoint.x + LINE_H;
            secondArcEnd.y = endStateBottom + LINE_V + lineCfg.threadTitleHeight;
            tempLinePath += this.drawArc(LINE_RADIUS, 0, 1, secondArcEnd);
        } else {
            secondArcStart =
                startStateBottom + LINE_V - LINE_RADIUS + lineCfg.threadTitleHeight;
            tempLinePath += this.drawVerticalLine(secondArcStart);
            secondArcEnd.x = startPoint.x + LINE_H;
            secondArcEnd.y = startStateBottom + LINE_V + lineCfg.threadTitleHeight;
            tempLinePath += this.drawArc(LINE_RADIUS, 0, 1, secondArcEnd);
        }
        return tempLinePath;
    },
    drawLineBack5OutputV(startPoint, endPoint, startState, endState, threadIndex) {
        let startStateHeight,
            endStateHeight,
            startStateTop,
            endStateTop,
            startStateBottom,
            endStateBottom;
        startStateHeight = QBlock.State.getStateHeight(startState);
        endStateHeight = QBlock.State.getStateHeight(endState);

        //计算开始与结束状态的上边缘坐标
        startStateTop = QBlock.State.getXY2Canvas(startState, threadIndex).y;
        endStateTop = QBlock.State.getXY2Canvas(endState, threadIndex).y;
        //计算开始与结束状态的下边缘坐标
        startStateBottom =
            QBlock.State.getXY2Canvas(startState, threadIndex).y +
            startStateHeight;
        endStateBottom =
            QBlock.State.getXY2Canvas(endState, threadIndex).y +
            endStateHeight;
        let tempLinePath = "";

        if (startPoint.y > endPoint.y) {
            tempLinePath += this.drawLineBack5OutputVUp(
                startPoint,
                startStateTop,
                endStateTop
            );
        } else {
            tempLinePath += this.drawLineBack5OutputVDown(
                startPoint,
                startStateBottom,
                endStateBottom
            );
        }
        tempLinePath += " ";
        return tempLinePath;
    },
    //在临时连线未找到结束state时，使用此方法绘制垂直连线
    drawLineBack5OutputVWithoutEndState(startPoint, endPoint) {
        let tempLinePath = "";
        let secondArcStart;
        let secondArcEnd = {
            x: 0,
            y: 0,
        };
        if (startPoint.y > endPoint.y) {
            secondArcStart = endPoint.y - LINE_V + LINE_RADIUS;
            tempLinePath += this.drawVerticalLine(secondArcStart);
            secondArcEnd.x = startPoint.x + LINE_H;
            secondArcEnd.y = endPoint.y - LINE_V;
            tempLinePath += this.drawArc(LINE_RADIUS, 0, 0, secondArcEnd);
        } else {
            secondArcStart = endPoint.y + LINE_V - LINE_RADIUS;
            tempLinePath += this.drawVerticalLine(secondArcStart);
            secondArcEnd.x = startPoint.x + LINE_H;
            secondArcEnd.y = endPoint.y + LINE_V;
            tempLinePath += this.drawArc(LINE_RADIUS, 0, 1, secondArcEnd);
        }
        tempLinePath += " ";
        return tempLinePath;
    },
    //因为连线的坐标是相对于svg元素的，所以需要加上threadTitleHeight以获取连线的准确坐标
    drawLineBack5HUp(endPoint, startStateTop, endStateTop) {
        let tempLinePath = "";
        let thirdArcStart = {
            x: 0,
            y: 0,
        };
        let thirdArcEnd = {
            x: 0,
            y: 0,
        };
        //比较起始状态和结束状态的上边缘的高低，根据上边缘高的状态决定水平绘制连线的坐标
        if (startStateTop < endStateTop) {
            thirdArcStart.x = endPoint.x - LINE_H + LINE_RADIUS;
            thirdArcStart.y = startStateTop - LINE_V + lineCfg.threadTitleHeight;
            tempLinePath += this.drawLineToEndPoint(thirdArcStart);
            thirdArcEnd.x = endPoint.x - LINE_H;
            thirdArcEnd.y =
                startStateTop - LINE_V + LINE_RADIUS + lineCfg.threadTitleHeight;
            tempLinePath += this.drawArc(LINE_RADIUS, 1, 0, thirdArcEnd);
        } else {
            thirdArcStart.x = endPoint.x - LINE_H + LINE_RADIUS;
            thirdArcStart.y = endStateTop - LINE_V + lineCfg.threadTitleHeight;
            tempLinePath += this.drawLineToEndPoint(thirdArcStart);
            thirdArcEnd.x = endPoint.x - LINE_H;
            thirdArcEnd.y =
                endStateTop - LINE_V + LINE_RADIUS + lineCfg.threadTitleHeight;
            tempLinePath += this.drawArc(LINE_RADIUS, 1, 0, thirdArcEnd);
        }
        return tempLinePath;
    },
    //因为连线的坐标是相对于svg元素的，所以需要加上threadTitleHeight以获取连线的准确坐标
    drawLineBack5HDown(endPoint, startStateBottom, endStateBottom) {
        let tempLinePath = "";
        let thirdArcStart = {
            x: 0,
            y: 0,
        };
        let thirdArcEnd = {
            x: 0,
            y: 0,
        };
        //比较起始状态和结束状态的下边缘的高低，根据下边缘低的状态决定水平绘制连线的坐标
        if (startStateBottom < endStateBottom) {
            thirdArcStart.x = endPoint.x - LINE_H + LINE_RADIUS;
            thirdArcStart.y = endStateBottom + LINE_V + lineCfg.threadTitleHeight;
            tempLinePath += this.drawLineToEndPoint(thirdArcStart);
            thirdArcEnd.x = endPoint.x - LINE_H;
            thirdArcEnd.y =
                endStateBottom + LINE_V - LINE_RADIUS + lineCfg.threadTitleHeight;
            tempLinePath += this.drawArc(LINE_RADIUS, 0, 1, thirdArcEnd);
        } else {
            thirdArcStart.x = endPoint.x - LINE_H + LINE_RADIUS;
            thirdArcStart.y = startStateBottom + LINE_V + lineCfg.threadTitleHeight;
            tempLinePath += this.drawLineToEndPoint(thirdArcStart);
            thirdArcEnd.x = endPoint.x - LINE_H;
            thirdArcEnd.y =
                startStateBottom + LINE_V - LINE_RADIUS + lineCfg.threadTitleHeight;
            tempLinePath += this.drawArc(LINE_RADIUS, 0, 1, thirdArcEnd);
        }
        return tempLinePath;
    },
    drawLineBack5H(startPoint, endPoint, startState, endState, threadIndex) {
        let startStateHeight,
            endStateHeight,
            startStateTop,
            endStateTop,
            startStateBottom,
            endStateBottom;
        startStateHeight = QBlock.State.getStateHeight(startState);
        endStateHeight = QBlock.State.getStateHeight(endState);
        //计算开始与结束状态的上边缘
        startStateTop = QBlock.State.getXY2Canvas(startState, threadIndex).y;
        endStateTop = QBlock.State.getXY2Canvas(endState, threadIndex).y;
        //计算开始与结束状态的下边缘
        startStateBottom =
            QBlock.State.getXY2Canvas(startState, threadIndex).y +
            startStateHeight;
        endStateBottom =
            QBlock.State.getXY2Canvas(endState, threadIndex).y +
            endStateHeight;
        let tempLinePath = "";
        if (startPoint.y > endPoint.y) {
            tempLinePath += this.drawLineBack5HUp(
                endPoint,
                startStateTop,
                endStateTop
            );
        } else {
            tempLinePath += this.drawLineBack5HDown(
                endPoint,
                startStateBottom,
                endStateBottom
            );
        }
        tempLinePath += " ";
        return tempLinePath;
    },
    //在临时连线未找到结束state时，使用此方法绘制横向连线
    drawLineBack5HWithoutEndState(startPoint, endPoint) {
        let thirdArcStart = {
            x: 0,
            y: 0,
        };
        let thirdArcEnd = {
            x: 0,
            y: 0,
        };
        let tempLinePath = "";
        if (startPoint.y > endPoint.y) {
            thirdArcStart.x = endPoint.x - LINE_H + LINE_RADIUS;
            thirdArcStart.y = endPoint.y - LINE_V;
            tempLinePath += this.drawLineToEndPoint(thirdArcStart);
            thirdArcEnd.x = endPoint.x - LINE_H;
            thirdArcEnd.y = endPoint.y - LINE_V + LINE_RADIUS;
            tempLinePath += this.drawArc(LINE_RADIUS, 1, 0, thirdArcEnd);
        } else {
            thirdArcStart.x = endPoint.x - LINE_H + LINE_RADIUS;
            thirdArcStart.y = endPoint.y + LINE_V;
            tempLinePath += this.drawLineToEndPoint(thirdArcStart);
            thirdArcEnd.x = endPoint.x - LINE_H;
            thirdArcEnd.y = endPoint.y + LINE_V - LINE_RADIUS;
            tempLinePath += this.drawArc(LINE_RADIUS, 0, 1, thirdArcEnd);
        }
        tempLinePath += " ";
        return tempLinePath;
    },
    //向后绘制连线
    drawLineBack5ByStateAndPoint(startPoint, endPoint, startState, endState, threadIndex) {
        let linePath = "";
        //TODO:添加一种新的情况：当起始状态的x坐标小于结束状态的x坐标加上结束状态的宽度时，向结束状态的最右端绘制反向连线
        let outputH = this.drawLineBack5OutputH(
            startPoint,
            endPoint
        );
        let outputV, output2InputH;
        if (!endState) {
            outputV = this.drawLineBack5OutputVWithoutEndState(
                startPoint,
                endPoint
            );
            output2InputH = this.drawLineBack5HWithoutEndState(
                startPoint,
                endPoint
            );
        } else {
            outputV = this.drawLineBack5OutputV(
                startPoint,
                endPoint,
                startState,
                endState,
                threadIndex
            );
            output2InputH = this.drawLineBack5H(
                startPoint,
                endPoint,
                startState,
                endState,
                threadIndex
            );
        }
        let inputV = this.drawLineBack5InputV(startPoint, endPoint);
        let inputH = this.drawLineInputH(endPoint);
        let arrow = this.drawArrow(endPoint);
        linePath = outputH + outputV + output2InputH + inputV + inputH + arrow;
        return linePath;
    },
    drawLineBack5InputV(startPoint, endPoint) {
        let tempLinePath = "";
        let fourthArcStart;
        let fourthArcEnd = {
            x: 0,
            y: 0,
        };
        if (startPoint.y > endPoint.y) {
            fourthArcStart = endPoint.y - LINE_RADIUS;
            tempLinePath += this.drawVerticalLine(fourthArcStart);
            fourthArcEnd.x = endPoint.x - LINE_H + LINE_RADIUS;
            fourthArcEnd.y = endPoint.y;
            tempLinePath += this.drawArc(LINE_RADIUS, 0, 0, fourthArcEnd);
        } else {
            fourthArcStart = endPoint.y + LINE_RADIUS;
            tempLinePath += this.drawVerticalLine(fourthArcStart);
            fourthArcEnd.x = endPoint.x - LINE_H + LINE_RADIUS;
            fourthArcEnd.y = endPoint.y;
            tempLinePath += this.drawArc(LINE_RADIUS, 0, 1, fourthArcEnd);
        }
        return tempLinePath;
    },
    /**
     * 前向3段式连线相关方法
     *
     */
    drawLine3OutputH(startPoint, endPoint, lineRadius) {
        let tempLinePath = "";
        tempLinePath += this.moveToStartPoint(startPoint);
        tempLinePath += this.drawHorizontalSetLine();
        let firstArcEnd = {
            x: 0,
            y: 0,
        };
        //若起始点的y坐标大于结束点的y坐标
        if (startPoint.y > endPoint.y) {
            firstArcEnd.x = startPoint.x + LINE_H + lineRadius;
            firstArcEnd.y = startPoint.y - lineRadius;
            tempLinePath += this.drawArc(lineRadius, 1, 0, firstArcEnd);
        } else {
            firstArcEnd.x = startPoint.x + LINE_H + lineRadius;
            firstArcEnd.y = startPoint.y + lineRadius;
            tempLinePath += this.drawArc(lineRadius, 0, 1, firstArcEnd);
        }
        return tempLinePath;
    },
    drawLine3SecondArc(startPoint, endPoint, lineRadius, sweepFlag) {
        let tempLinePath = "";
        let secondArcEnd = {
            x: 0,
            y: 0,
        };
        secondArcEnd.x = startPoint.x + LINE_H + 2 * lineRadius;
        secondArcEnd.y = endPoint.y;
        tempLinePath += this.drawArc(lineRadius, 0, sweepFlag, secondArcEnd);
        return tempLinePath;
    },
    drawLine3V(startPoint, endPoint, lineRadius) {
        let tempLinePath = "";
        let secondArcStart;
        let secondArcEnd = {
            x: 0,
            y: 0,
        };
        if (startPoint.y > endPoint.y) {
            secondArcStart = endPoint.y + lineRadius;
            tempLinePath += this.drawVerticalLine(secondArcStart);
            secondArcEnd.x = startPoint.x + LINE_H + 2 * lineRadius;
            secondArcEnd.y = endPoint.y;
            tempLinePath += this.drawArc(lineRadius, 0, 1, secondArcEnd);
        } else {
            secondArcStart = endPoint.y - lineRadius;
            tempLinePath += this.drawVerticalLine(secondArcStart);
            secondArcEnd.x = startPoint.x + LINE_H + 2 * lineRadius;
            secondArcEnd.y = endPoint.y;
            tempLinePath += this.drawArc(lineRadius, 0, 0, secondArcEnd);
        }
        return tempLinePath;
    },
    //向前绘制3段式连线
    drawLine3ByPoint(startPoint, endPoint, lineRadius) {
        let linePath = "";
        let outputH = this.drawLine3OutputH(startPoint, endPoint, lineRadius);
        let output2InputV = this.drawLine3V(startPoint, endPoint, lineRadius);
        let inputH = this.drawLineInputH(endPoint);
        let arrow = this.drawArrow(endPoint);
        linePath = outputH + output2InputV + inputH + arrow;
        return linePath;
    },
    /**
     * 前向5段式连线相关方法
     */
    drawLineForward5OutputHUp(
        startPoint,
        endPoint,
        lineRadius,
        verticalOffset
    ) {
        let tempLinePath = "";
        let firstArcStart;
        let firstArcEnd = {
            x: 0,
            y: 0,
        };
        if (startPoint.y < endPoint.y + verticalOffset) {
            tempLinePath += this.drawHorizontalSetLine();
            firstArcStart = startPoint.x + LINE_H;
            firstArcEnd.x = startPoint.x + LINE_H + lineRadius;
            firstArcEnd.y = startPoint.y + lineRadius;
            tempLinePath += this.drawArc(lineRadius, 0, 1, firstArcEnd);
        } else if (startPoint.y > endPoint.y + verticalOffset) {
            tempLinePath += this.drawHorizontalSetLine();
            firstArcEnd.x = startPoint.x + LINE_H + lineRadius;
            firstArcEnd.y = startPoint.y - lineRadius;
            tempLinePath += this.drawArc(lineRadius, 0, 0, firstArcEnd);
        }
        return tempLinePath;
    },
    drawLineForward5OutputHDown(
        startPoint,
        endPoint,
        lineRadius,
        verticalOffset
    ) {
        let tempLinePath = "";
        let firstArcStart;
        let firstArcEnd = {
            x: 0,
            y: 0,
        };
        if (startPoint.y < endPoint.y + verticalOffset) {
            tempLinePath += this.drawHorizontalSetLine();
            firstArcStart = startPoint.x + LINE_H;
            firstArcEnd.x = startPoint.x + LINE_H + lineRadius;
            firstArcEnd.y = startPoint.y + lineRadius;
            tempLinePath += this.drawArc(lineRadius, 0, 1, firstArcEnd);
        } else if (startPoint.y > endPoint.y + verticalOffset) {
            tempLinePath += this.drawHorizontalSetLine();
            firstArcEnd.x = startPoint.x + LINE_H + lineRadius;
            firstArcEnd.y = startPoint.y - lineRadius;
            tempLinePath += this.drawArc(lineRadius, 0, 0, firstArcEnd);
        }
        return tempLinePath;
    },
    drawLineForward5OutputH(startPoint, endPoint, lineRadius, verticalOffset) {
        let tempLinePath = "";
        if (endPoint.y + verticalOffset < endPoint.y) {
            tempLinePath = this.drawLineForward5OutputHUp(
                startPoint,
                endPoint,
                lineRadius,
                verticalOffset
            );
        } else {
            tempLinePath = this.drawLineForward5OutputHUp(
                startPoint,
                endPoint,
                lineRadius,
                verticalOffset
            );
        }
        return tempLinePath;
    },
    drawLineForward5FirstVUp(startPoint, endPoint, lineRadius, verticalOffset) {
        let tempLinePath = "";
        let secondArcStart;
        let secondArcEnd = {
            x: 0,
            y: 0,
        };
        if (startPoint.y < endPoint.y + verticalOffset) {
            secondArcStart = endPoint.y + verticalOffset - lineRadius;
            tempLinePath += this.drawVerticalLine(secondArcStart);
            secondArcEnd.x = startPoint.x + LINE_H + 2 * lineRadius;
            secondArcEnd.y = endPoint.y + verticalOffset;
            tempLinePath += this.drawArc(lineRadius, 0, 0, secondArcEnd);
        } else if (startPoint.y > endPoint.y + verticalOffset) {
            secondArcStart = endPoint.y + verticalOffset + lineRadius;
            tempLinePath += this.drawVerticalLine(secondArcStart);
            secondArcEnd.x = startPoint.x + LINE_H + 2 * lineRadius;
            secondArcEnd.y = endPoint.y + verticalOffset;
            tempLinePath += this.drawArc(lineRadius, 0, 1, secondArcEnd);
        }
        return tempLinePath;
    },
    drawLineForward5FirstVDown(
        startPoint,
        endPoint,
        lineRadius,
        verticalOffset
    ) {
        let tempLinePath = "";
        let secondArcStart;
        let secondArcEnd = {
            x: 0,
            y: 0,
        };
        if (startPoint.y < endPoint.y + verticalOffset) {
            secondArcStart = endPoint.y + verticalOffset - lineRadius;
            tempLinePath += this.drawVerticalLine(secondArcStart);
            secondArcEnd.x = startPoint.x + LINE_H + 2 * lineRadius;
            secondArcEnd.y = endPoint.y + verticalOffset;
            tempLinePath += this.drawArc(lineRadius, 0, 0, secondArcEnd);
        } else if (startPoint.y > endPoint.y + verticalOffset) {
            secondArcStart = endPoint.y + verticalOffset + lineRadius;
            tempLinePath += this.drawVerticalLine(secondArcStart);
            secondArcEnd.x = startPoint.x + LINE_H + 2 * lineRadius;
            secondArcEnd.y = endPoint.y + verticalOffset;
            tempLinePath += this.drawArc(lineRadius, 0, 1, secondArcEnd);
        }
        return tempLinePath;
    },
    drawLineForward5FirstV(startPoint, endPoint, lineRadius, verticalOffset) {
        let tempLinePath = "";
        if (endPoint.y + verticalOffset < endPoint.y) {
            tempLinePath = this.drawLineForward5FirstVUp(
                startPoint,
                endPoint,
                lineRadius,
                verticalOffset
            );
        } else if (endPoint.y + verticalOffset > endPoint.y) {
            tempLinePath = this.drawLineForward5FirstVDown(
                startPoint,
                endPoint,
                lineRadius,
                verticalOffset
            );
        }
        return tempLinePath;
    },
    drawLineForward5SecondHUp(
        startPoint,
        endPoint,
        lineRadius,
        verticalOffset
    ) {
        let tempLinePath = "";
        let thirdArcStart;
        let thirdArcEnd = {
            x: 0,
            y: 0,
        };
        thirdArcStart = endPoint.x - LINE_H - 2 * lineRadius;
        tempLinePath += this.drawHorizontalLine(thirdArcStart);
        thirdArcEnd.x = endPoint.x - LINE_H - lineRadius;
        thirdArcEnd.y = endPoint.y + verticalOffset + lineRadius;
        tempLinePath += this.drawArc(lineRadius, 0, 1, thirdArcEnd);
        return tempLinePath;
    },
    drawLineForward5SecondHDown(
        startPoint,
        endPoint,
        lineRadius,
        verticalOffset
    ) {
        let tempLinePath = "";
        let thirdArcStart;
        let thirdArcEnd = {
            x: 0,
            y: 0,
        };
        thirdArcStart = endPoint.x - LINE_H - 2 * lineRadius;
        tempLinePath += this.drawHorizontalLine(thirdArcStart);
        thirdArcEnd.x = endPoint.x - LINE_H - lineRadius;
        thirdArcEnd.y = endPoint.y + verticalOffset - lineRadius;
        tempLinePath += this.drawArc(lineRadius, 0, 0, thirdArcEnd);
        return tempLinePath;
    },
    drawLineForward5SecondH(startPoint, endPoint, lineRadius, verticalOffset) {
        let tempLinePath = "";
        if (endPoint.y + verticalOffset < endPoint.y) {
            tempLinePath = this.drawLineForward5SecondHUp(
                startPoint,
                endPoint,
                lineRadius,
                verticalOffset
            );
        } else if (endPoint.y + verticalOffset > endPoint.y) {
            tempLinePath = this.drawLineForward5SecondHDown(
                startPoint,
                endPoint,
                lineRadius,
                verticalOffset
            );
        }
        return tempLinePath;
    },
    drawLineForward5SecondVUp(
        startPoint,
        endPoint,
        lineRadius,
        verticalOffset
    ) {
        let tempLinePath = "";
        let fourthArcStart;
        let fourthArcEnd = {
            x: 0,
            y: 0,
        };
        fourthArcStart = endPoint.y - lineRadius;
        tempLinePath += this.drawVerticalLine(fourthArcStart);
        fourthArcEnd.x = endPoint.x - LINE_H;
        fourthArcEnd.y = endPoint.y;
        tempLinePath += this.drawArc(lineRadius, 0, 0, fourthArcEnd);
        return tempLinePath;
    },
    drawLineForward5SecondVDown(
        startPoint,
        endPoint,
        lineRadius,
        verticalOffset
    ) {
        let tempLinePath = "";
        let fourthArcStart;
        let fourthArcEnd = {
            x: 0,
            y: 0,
        };
        fourthArcStart = endPoint.y + lineRadius;
        tempLinePath += this.drawVerticalLine(fourthArcStart);
        fourthArcEnd.x = endPoint.x - LINE_H;
        fourthArcEnd.y = endPoint.y;
        tempLinePath += this.drawArc(lineRadius, 0, 1, fourthArcEnd);
        return tempLinePath;
    },
    drawLineForward5SecondV(startPoint, endPoint, lineRadius, verticalOffset) {
        let tempLinePath = "";
        if (endPoint.y + verticalOffset < endPoint.y) {
            tempLinePath = this.drawLineForward5SecondVUp(
                startPoint,
                endPoint,
                lineRadius,
                verticalOffset
            );
        } else if (endPoint.y + verticalOffset > endPoint.y) {
            tempLinePath = this.drawLineForward5SecondVDown(
                startPoint,
                endPoint,
                lineRadius,
                verticalOffset
            );
        }
        return tempLinePath;
    },
    //向前绘制5段式连线
    //TODO: 需要多添加一个radius, 用于控制连入状态的连线部分的圆角拐角半径
    drawLineForward5ByPoint(
        startPoint,
        endPoint,
        lineRadius,
        forward5LastTwoRadius,
        verticalOffset
    ) {
        let linePath = "";
        let initStartPoint = this.moveToStartPoint(startPoint);
        let outputH = this.drawLineForward5OutputH(
            startPoint,
            endPoint,
            lineRadius,
            verticalOffset
        );
        let firstOutputV = this.drawLineForward5FirstV(
            startPoint,
            endPoint,
            lineRadius,
            verticalOffset
        );

        let secondOutputH = this.drawLineForward5SecondH(
            startPoint,
            endPoint,
            forward5LastTwoRadius,
            verticalOffset
        );

        let secondOutputV = this.drawLineForward5SecondV(
            startPoint,
            endPoint,
            forward5LastTwoRadius,
            verticalOffset
        );

        let inputH = this.drawLineInputH(endPoint);
        let arrow = this.drawArrow(endPoint);
        linePath =
            initStartPoint +
            outputH +
            firstOutputV +
            secondOutputH +
            secondOutputV +
            inputH +
            arrow;
        return linePath;
    },
    /**
     *
     * 前向直线调节之后的五段式连线
     *
     */
    drawStraightLineForward5secondVDown(
        startPoint,
        endPoint,
        lineRadius,
        verticalOffset
    ) {
        let tempLinePath = "";
        let fourthArcStart;
        let fourthArcEnd = {
            x: 0,
            y: 0,
        };
        fourthArcStart = endPoint.y + lineRadius;
        tempLinePath += this.drawVerticalLine(fourthArcStart);
        fourthArcEnd.x = endPoint.x - LINE_H;
        fourthArcEnd.y = endPoint.y;
        tempLinePath += this.drawArc(lineRadius, 0, 1, fourthArcEnd);
        return tempLinePath;
    },
    drawStraightLineForward5secondVUp(
        startPoint,
        endPoint,
        lineRadius,
        verticalOffset
    ) {
        let tempLinePath = "";
        let fourthArcStart;
        let fourthArcEnd = {
            x: 0,
            y: 0,
        };
        fourthArcStart = endPoint.y - lineRadius;
        tempLinePath += this.drawVerticalLine(fourthArcStart);
        fourthArcEnd.x = endPoint.x - LINE_H;
        fourthArcEnd.y = endPoint.y;
        tempLinePath += this.drawArc(lineRadius, 0, 0, fourthArcEnd);
        return tempLinePath;
    },
    drawStraightLineForward5secondV(
        startPoint,
        endPoint,
        lineRadius,
        verticalOffset
    ) {
        let tempLinePath = "";
        if (endPoint.y + verticalOffset < endPoint.y) {
            tempLinePath = this.drawStraightLineForward5secondVUp(
                startPoint,
                endPoint,
                lineRadius,
                verticalOffset
            );
        } else if (endPoint.y + verticalOffset > endPoint.y) {
            tempLinePath = this.drawStraightLineForward5secondVDown(
                startPoint,
                endPoint,
                lineRadius,
                verticalOffset
            );
        }
        return tempLinePath;
    },
    drawStraightLineForward5secondHDown(
        startPoint,
        endPoint,
        lineRadius,
        verticalOffset
    ) {
        let tempLinePath = "";
        let thirdArcStart;
        let thirdArcEnd = {
            x: 0,
            y: 0,
        };
        thirdArcStart = endPoint.x - LINE_H - 2 * lineRadius;
        tempLinePath += this.drawHorizontalLine(thirdArcStart);
        thirdArcEnd.x = endPoint.x - LINE_H - lineRadius;
        thirdArcEnd.y = endPoint.y + verticalOffset - lineRadius;
        tempLinePath += this.drawArc(lineRadius, 0, 0, thirdArcEnd);
        return tempLinePath;
    },
    drawStraightLineForward5secondHUp(
        startPoint,
        endPoint,
        lineRadius,
        verticalOffset
    ) {
        let tempLinePath = "";
        let thirdArcStart;
        let thirdArcEnd = {
            x: 0,
            y: 0,
        };
        thirdArcStart = endPoint.x - LINE_H - 2 * lineRadius;
        tempLinePath += this.drawHorizontalLine(thirdArcStart);
        thirdArcEnd.x = endPoint.x - LINE_H - lineRadius;
        thirdArcEnd.y = endPoint.y + verticalOffset + lineRadius;
        tempLinePath += this.drawArc(lineRadius, 0, 1, thirdArcEnd);
        return tempLinePath;
    },
    drawStraightLineForward5secondH(
        startPoint,
        endPoint,
        lineRadius,
        verticalOffset
    ) {
        let tempLinePath = "";
        if (endPoint.y + verticalOffset < endPoint.y) {
            tempLinePath = this.drawStraightLineForward5secondHUp(
                startPoint,
                endPoint,
                lineRadius,
                verticalOffset
            );
        } else if (endPoint.y + verticalOffset > endPoint.y) {
            tempLinePath = this.drawStraightLineForward5secondHDown(
                startPoint,
                endPoint,
                lineRadius,
                verticalOffset
            );
        }
        return tempLinePath;
    },
    drawStraightLineForward5FirstVDown(
        startPoint,
        endPoint,
        lineRadius,
        verticalOffset
    ) {
        let tempLinePath = "";
        let secondArcStart;
        let secondArcEnd = {
            x: 0,
            y: 0,
        };
        secondArcStart = endPoint.y + verticalOffset - lineRadius;
        tempLinePath += this.drawVerticalLine(secondArcStart);
        secondArcEnd.x = startPoint.x + LINE_H + 2 * lineRadius;
        secondArcEnd.y = endPoint.y + verticalOffset;
        tempLinePath += this.drawArc(lineRadius, 1, 0, secondArcEnd);
        return tempLinePath;
    },
    drawStraightLineForward5FirstVUp(
        startPoint,
        endPoint,
        lineRadius,
        verticalOffset
    ) {
        let tempLinePath = "";
        let secondArcStart;
        let secondArcEnd = {
            x: 0,
            y: 0,
        };
        secondArcStart = endPoint.y + verticalOffset + lineRadius;
        tempLinePath += this.drawVerticalLine(secondArcStart);
        secondArcEnd.x = startPoint.x + LINE_H + 2 * lineRadius;
        secondArcEnd.y = endPoint.y + verticalOffset;
        tempLinePath += this.drawArc(lineRadius, 0, 1, secondArcEnd);
        return tempLinePath;
    },
    drawStraightLineForward5FirstV(
        startPoint,
        endPoint,
        lineRadius,
        verticalOffset
    ) {
        let tempLinePath = "";
        if (endPoint.y + verticalOffset < endPoint.y) {
            tempLinePath = this.drawStraightLineForward5FirstVUp(
                startPoint,
                endPoint,
                lineRadius,
                verticalOffset
            );
        } else if (endPoint.y + verticalOffset > endPoint.y) {
            tempLinePath = this.drawStraightLineForward5FirstVDown(
                startPoint,
                endPoint,
                lineRadius,
                verticalOffset
            );
        }
        return tempLinePath;
    },
    drawStraightLineForward5OutputHDown(
        startPoint,
        endPoint,
        lineRadius,
        verticalOffset
    ) {
        let tempLinePath = "";
        let firstArcStart;
        let firstArcEnd = {
            x: 0,
            y: 0,
        };
        tempLinePath += this.moveToStartPoint(startPoint);
        tempLinePath += this.drawHorizontalSetLine();
        firstArcStart = startPoint.x + LINE_H;
        firstArcEnd.x = startPoint.x + LINE_H + lineRadius;
        firstArcEnd.y = startPoint.y + lineRadius;
        tempLinePath += this.drawArc(lineRadius, 0, 1, firstArcEnd);
        return tempLinePath;
    },
    drawStraightLineForward5OutputHUp(
        startPoint,
        endPoint,
        lineRadius,
        verticalOffset
    ) {
        let tempLinePath = "";
        let firstArcStart;
        let firstArcEnd = {
            x: 0,
            y: 0,
        };
        tempLinePath += this.moveToStartPoint(startPoint);
        tempLinePath += this.drawHorizontalSetLine();
        firstArcStart = startPoint.x + LINE_H;
        firstArcEnd.x = startPoint.x + LINE_H + lineRadius;
        firstArcEnd.y = startPoint.y - lineRadius;
        tempLinePath += this.drawArc(lineRadius, 0, 0, firstArcEnd);
        return tempLinePath;
    },
    drawStraightLineForward5OutputH(
        startPoint,
        endPoint,
        lineRadius,
        verticalOffset
    ) {
        let tempLinePath = "";
        if (endPoint.y + verticalOffset < endPoint.y) {
            tempLinePath = this.drawStraightLineForward5OutputHUp(
                startPoint,
                endPoint,
                lineRadius,
                verticalOffset
            );
        } else if (endPoint.y + verticalOffset > endPoint.y) {
            tempLinePath = this.drawStraightLineForward5OutputHDown(
                startPoint,
                endPoint,
                lineRadius,
                verticalOffset
            );
        }
        return tempLinePath;
    },
    //向前绘制五段式直线连线
    //TODO
    drawStraightLineForward5ByPoint(
        startPoint,
        endPoint,
        lineRadius,
        forward5LastTwoRadius,
        verticalOffset
    ) {
        let linePath = "";
        let outputH = this.drawStraightLineForward5OutputH(
            startPoint,
            endPoint,
            lineRadius,
            verticalOffset
        );
        let firstOutputV = this.drawStraightLineForward5FirstV(
            startPoint,
            endPoint,
            lineRadius,
            verticalOffset
        );
        let secondOutputH = this.drawStraightLineForward5secondH(
            startPoint,
            endPoint,
            forward5LastTwoRadius,
            verticalOffset
        );
        let secondOutputV = this.drawStraightLineForward5secondV(
            startPoint,
            endPoint,
            forward5LastTwoRadius,
            verticalOffset
        );
        let inputH = this.drawLineInputH(endPoint);
        let arrow = this.drawArrow(endPoint);
        linePath = outputH + firstOutputV + secondOutputH + secondOutputV + inputH + arrow;
        return linePath;
    }
}

export default DrawLine