using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using CommLib;
using System.Threading;
using System.Windows.Forms;
using System.Collections;
using Cognex.VisionPro;
using Cognex.VisionPro.ImageFile;
using Cognex.VisionPro.ToolBlock;

namespace QKMGui
{
    public class cRun
    {
        int iRbtID;

        private enum RET
        {
            OK = 1,
            NEXT = -1,
            STOP = 0,
        }
        private enum LIGHT
        {
            Green = 1,
            Yellow = 2,
            YellowVoice = 3,
            Red = 4,
            RedVoice = 5,
        }


        public Thread Thd_GetSixRbtCmd = null;
        public Thread Thd_GetFiveRbtCmd = null;
        public Thread Thd_RbtSixRun = null;
        public Thread Thd_RbtFiveRun = null;
        public Thread Thd_CySixRun = null;
        public Thread Thd_CyFiveRun = null;

        public Thread Thd_LineMove = null;

        public Thread Thd_RunScanIO = null;
        public Thread Thd_ErrAct1 = null;
        public Thread Thd_ErrAct2 = null;

        public static int iThd_GetSixRbtCmd = 0;
        public static int iThd_GetFiveRbtCmd = 0;
        public static int iThd_RbtSixRun = 0;
        public static int iThd_RbtFiveRun = 0;
        public static int iThd_CySixRun = 0;
        public static int iThd_CyFiveRun = 0;
        public static int iThd_LineMove = 0;
        public static int iThd_RunScanIO = 0;
        public static int iThd_ErrAct1 = 0;
        public static int iThd_ErrAct2 = 0;

        public enum MSGNO
        {
            SixRbt = 0,
            SixCy = 1,
            FiveRbt = 2,
            FiveCy = 3,
            Line = 4
        }

        /*
        网络队列消息：
        传送带通知六边形拍照
        六边形点胶机通知机器人取放料
        五边形点胶机通知机器人取放料
        
        自定义队列消息：
        0-六边形机器人动作
        1-六边形汽缸动作
        2-五边形机器人动作
        3-五边形汽缸动作
        4-流水线启停(五边形)
        */
        public ArrayList[] ArrCmd = new ArrayList[5];

        public cRun(int itID)
        {
            iRbtID = itID;
            for (int i = 0; i < ArrCmd.Length; i++)
            {
                ArrCmd[i] = new ArrayList();
            }
        }
        public bool RunErr()
        {
            if (!InitThread()) return false;
            return true;
        }
        public bool Init()
        {
            if (!InitThread()) return false;

            Tools.ClearAllCmd();
            ClearAllCmd();

            if (!SendAllPara()) return false;

            LightControl(LIGHT.Red);
            if (!cBase.cAct[0].Init())
            {
                cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "六边形初始化失败.");
                return false;
            }
            else
            {
                cBase.bSixFirstPut[0] = true;
                cBase.bSixFirstPut[1] = true;
                cBase.cAct[(int)cBase.RBT.SIX].rbt.iPrdCnt = 0;
                cBase.cAct[(int)cBase.RBT.SIX].rbt.bIsNewPrd = false;
                cBase.cAct[(int)cBase.RBT.SIX].rbt.iCurrPos = (int)cMotion.RbtPos.LineWaitePos;
                cBase.cAct[(int)cBase.RBT.SIX].dj[0].bExistPrd = false;
                cBase.cAct[(int)cBase.RBT.SIX].dj[1].bExistPrd = false;
                cBase.cAct[(int)cBase.RBT.SIX].qg.bExistPrd = false;
                AddMsg(MSGNO.SixRbt, "PUT_BUF_PRD_6");
                //cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "六边形初始化成功.");
            }
            if (!cBase.cAct[1].Init())
            {
                cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "五边形初始化失败.");
                return false;
            }
            else
            {
                cBase.bFiveFirstPut[0] = true;
                cBase.bFiveFirstPut[1] = true;
                cBase.cAct[(int)cBase.RBT.FIVE].rbt.iPrdCnt = 0;
                cBase.cAct[(int)cBase.RBT.FIVE].rbt.bIsNewPrd = false;
                cBase.cAct[(int)cBase.RBT.FIVE].rbt.iCurrPos = (int)cMotion.RbtPos.LineWaitePos;
                cBase.cAct[(int)cBase.RBT.FIVE].dj[0].bExistPrd = false;
                cBase.cAct[(int)cBase.RBT.FIVE].dj[1].bExistPrd = false;
                cBase.cAct[(int)cBase.RBT.FIVE].qg.bExistPrd = false;
                AddMsg(MSGNO.FiveRbt, "PUT_BUF_PRD_5");
                //cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "五边形初始化成功.");
            }
            LightControl(LIGHT.Yellow);
            //Tools.SendTCPCmd(1, "THREE_LIGHT;2");
            //cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "系统初始化成功.");
            cBase.bInited = true;
            return true;
        }
        public bool Start()
        {
            //cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "系统通知运行中.");
            if (!cBase.cAct[0].Start()) return false;
            //cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "六边形运行中.");
            if (!cBase.cAct[1].Start()) return false;
            //cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "五边形运行中.");
            if (!StartThread()) return false;
            LightControl(LIGHT.Green);
            //Tools.SendTCPCmd(1, "THREE_LIGHT;1");
            //cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "系统运行中.");
            cBase.bIsRunning = true;
            return true;
        }
        public bool Pause()
        {
            if (!cBase.cAct[0].Pause()) return false;
            if (!cBase.cAct[1].Pause()) return false;
            cBase.bSysIsWarning = true;
            cBase.bPaused = true;
            LightControl(LIGHT.Yellow);
            return true;
        }
        public bool Resume()
        {
            if (!cBase.cAct[0].Resume()) return false;
            if (!cBase.cAct[1].Resume()) return false;
            cBase.bSysIsWarning = false;
            cBase.bPaused = false;
            LightControl(LIGHT.Green);

            return true;
        }
        public bool Stop()
        {
            if (!cBase.cAct[0].Stop()) return false;
            if (!cBase.cAct[1].Stop()) return false;
            cBase.bInited = false;
            cBase.bIsRunning = false;
            cBase.bStopFlag = true;
            LightControl(LIGHT.Red);

            return true;
        }
        private bool SendAllPara()
        {
            int id = 0;
            int i = 0;
            for (id = 0; id < cBase.GetRobotCnt(); id++)
            {
                for (i = 0; i < cBase.cPara[id].ParaSet.Count(); i++)
                {
                    Thread.Sleep(30);
                    string strPara = cBase.cPara[id].ParaSet[i].Name.Trim().ToUpper();
                    string strValue = cBase.cPara[id].ParaSet[i].Value.Trim().ToUpper();
                    if (cBase.IsRbtCmd(strPara))
                    {
                        if (!cBase.cAct[id].SetPara(strPara, strValue))
                        {
                            return false;
                        }
                    }
                }
            }
            return true;
        }
        private bool InitThread()
        {
            Thd_ErrAct1 = new Thread(ErrAct1);
            this.Thd_ErrAct1.Start();

            Thd_ErrAct2 = new Thread(ErrAct2);
            this.Thd_ErrAct2.Start();
            return true;
        }
        private bool StartThread()
        {
            Thd_GetSixRbtCmd = new Thread(GetSixRbtCmd);
            this.Thd_GetSixRbtCmd.Start();

            Thd_GetFiveRbtCmd = new Thread(GetFiveRbtCmd);
            this.Thd_GetFiveRbtCmd.Start();

            Thd_RbtSixRun = new Thread(RbtSixRun);
            this.Thd_RbtSixRun.Start();

            Thd_RbtFiveRun = new Thread(RbtFiveRun);
            this.Thd_RbtFiveRun.Start();

            Thd_CySixRun = new Thread(CylinderSixRun);
            this.Thd_CySixRun.Start();

            Thd_CyFiveRun = new Thread(CylinderFiveRun);
            this.Thd_CyFiveRun.Start();

            Thd_LineMove = new Thread(LineMove);
            this.Thd_LineMove.Start();
            return true;
        }

        private void LineMove()
        {
            cRun.iThd_LineMove++;
            if(cRun.iThd_LineMove>1)
            {
                cBase.ShowNormalMessage((int)cBase.MsgType.EXCEPTION, "同一线程 LineMove 多次开启,请关闭程序重新启动!");
                cBase.bInited = false;
                cBase.bIsRunning = false;
                cBase.UpdateMsg(0, (int)cBase.GuiItem.ControlBtn, cBase.GUISTATUS.Unitinalization);
                cBase.bStopFlag = true;
                return;
            }
            MSGNO iNo = MSGNO.Line;
            cBase.SaveLog("Monitor", "Thread LineMove Started.");
            while (!cBase.bStopFlag)
            {
                Thread.Sleep(20);
                Application.DoEvents();
                if (this.ExistCommand(iNo))
                {
                    if (!bPaused()) break;

                    string str = GetFirstMsg(iNo);
                    switch (str.ToUpper())
                    {
                        case "LINE_MOVE":
                            //cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "LINE_MOVE-传送带开启");
                            if (!cBase.cAct[(int)cBase.RBT.FIVE].LineMove())
                            {
                                SysStop("LINE_MOVE");
                            }
                            Thread.Sleep(cBase.iLineWaitTime);
                            if (!cBase.cAct[(int)cBase.RBT.FIVE].StartLineScan())
                            {
                                SysStop("StartLineScan");
                            }
                            this.RmvMsg(iNo, str);
                            break;
                        default:
                            this.RmvMsg(iNo, str);
                            this.AddMsg(iNo, str);
                            break;
                    }
                }
            }
            cRun.iThd_LineMove--;
            Tools.ClearAllCmd(); ClearAllCmd();
            cBase.bStopFlag = true;
            cBase.SaveLog("Monitor", "Thread LineMove Finished");
        }

        private bool bPaused()
        {
            while (cBase.bPaused)
            {
                Application.DoEvents();
                Thread.Sleep(10);
                if (cBase.bStopFlag) return false;
            }
            return true;
        }

        private void GetSixRbtCmd()
        {
            cRun.iThd_GetSixRbtCmd++;
            if (cRun.iThd_GetSixRbtCmd > 1)
            {
                cBase.ShowNormalMessage((int)cBase.MsgType.EXCEPTION, "同一线程 GetSixRbtCmd 多次开启,请关闭程序重新启动!");
                cBase.bInited = false;
                cBase.bIsRunning = false;
                cBase.UpdateMsg(0, (int)cBase.GuiItem.ControlBtn, cBase.GUISTATUS.Unitinalization);
                cBase.bStopFlag = true;
                return;
            }

            int itID = (int)cBase.RBT.SIX;
            int iMsgNo = 4;
            cBase.SaveLog("Monitor", "Thread GetSixRbtCmd Started.");
            while (!cBase.bStopFlag)
            {
                Thread.Sleep(10);
                Application.DoEvents();
                if (Tools.ExistReceiveTCPMsg(itID, iMsgNo))
                {
                    if (!bPaused()) break;

                    string strMsg = Tools.GetFirstTCPMsg(itID, iMsgNo);
                    switch (strMsg.ToUpper())
                    {
                        //6边形前点胶机通知机器人上下料
                        case "PICK_FRONT_DJ_6":
                            cBase.b_Six_Front_Start = false;
                            AddMsg(MSGNO.SixRbt, "PICK_FRONT_DJ_6");
                            Tools.RemoveTCPMsg(itID, iMsgNo, strMsg);
                            if (!cBase.bSixFirstPut[0])
                            {
                                cBase.cAct[itID].dj[0].bOldPrd = true;
                            }
                            break;
                        //6边形后点胶机通知机器人上下料
                        case "PICK_BACK_DJ_6":
                            cBase.b_Six_Back_Start = false;
                            AddMsg(MSGNO.SixRbt, "PICK_BACK_DJ_6");
                            Tools.RemoveTCPMsg(itID, iMsgNo, strMsg);
                            if (!cBase.bSixFirstPut[1])
                            {
                                cBase.cAct[itID].dj[1].bOldPrd = true;
                            }
                            break;
                        default:
                            Tools.RemoveTCPMsg(itID, iMsgNo, strMsg);
                            Tools.AddTCPMsg(itID, iMsgNo, strMsg);
                            break;
                    }
                    if (cBase.b_Six_Front_Start && cBase.TimeDifferent(cBase.t_Six_Front) > cBase.iDJStartTimeOut)
                    {
                        int iRet = 0;
                        LightControl(LIGHT.YellowVoice);
                        iRet = cBase.ShowMessage(itID, -10057, (int)cBase.MsgType.EXCEPTION);
                        LightControl(LIGHT.Green);
                        cBase.t_Six_Front = DateTime.Now;
                    }
                    if (cBase.b_Six_Back_Start && cBase.TimeDifferent(cBase.t_Six_Back) > cBase.iDJStartTimeOut)
                    {
                        int iRet = 0;
                        LightControl(LIGHT.YellowVoice);
                        iRet = cBase.ShowMessage(itID, -10058, (int)cBase.MsgType.EXCEPTION);
                        LightControl(LIGHT.Green);
                        cBase.t_Six_Back = DateTime.Now;
                    }
                }
            }
            cRun.iThd_GetSixRbtCmd--;
            Tools.ClearAllCmd(); ClearAllCmd();
            cBase.bStopFlag = true;
            cBase.SaveLog("Monitor", "Thread GetSixRbtCmd Finished.");
        }

        private void GetFiveRbtCmd()
        {
            cRun.iThd_GetFiveRbtCmd++;
            if (cRun.iThd_GetFiveRbtCmd > 1)
            {
                cBase.ShowNormalMessage((int)cBase.MsgType.EXCEPTION, "同一线程 GetFiveRbtCmd 多次开启,请关闭程序重新启动!");
                cBase.bInited = false;
                cBase.bIsRunning = false;
                cBase.UpdateMsg(0, (int)cBase.GuiItem.ControlBtn, cBase.GUISTATUS.Unitinalization);
                cBase.bStopFlag = true;
                return;
            }

            int itID = (int)cBase.RBT.FIVE;
            int iMsgNo = 3;
            cBase.SaveLog("Monitor", "Thread GetFiveRbtCmd Started.");
            while (!cBase.bStopFlag)
            {
                Thread.Sleep(10);
                Application.DoEvents();
                if (Tools.ExistReceiveTCPMsg(itID, iMsgNo))
                {
                    if (!bPaused()) break;

                    string strMsg = Tools.GetFirstTCPMsg(itID, iMsgNo);
                    switch (strMsg.ToUpper())
                    {
                        //传送带停止，通知六边形取料
                        case "CNV_STOP":
                            AddMsg(MSGNO.SixRbt, "RBT_PICK_LINE_6");
                            Tools.RemoveTCPMsg(itID, iMsgNo, strMsg);
                            break;
                        //5边形前点胶机通知机器人上下料
                        case "PICK_FRONT_DJ_5":
                            cBase.b_Five_Front_Start = false;
                            AddMsg(MSGNO.FiveRbt, "PICK_FRONT_DJ_5");
                            Tools.RemoveTCPMsg(itID, iMsgNo, strMsg);
                            if (!cBase.bFiveFirstPut[0])
                            {
                                cBase.cAct[itID].dj[0].bOldPrd = true;
                            }
                            break;
                        //5边形后点胶机通知机器人上下料
                        case "PICK_BACK_DJ_5":
                            cBase.b_Five_Back_Start = false;
                            AddMsg(MSGNO.FiveRbt, "PICK_BACK_DJ_5");
                            Tools.RemoveTCPMsg(itID, iMsgNo, strMsg);
                            if (!cBase.bFiveFirstPut[1])
                            {
                                cBase.cAct[itID].dj[1].bOldPrd = true;
                            }
                            break;
                        default:
                            Tools.RemoveTCPMsg(itID, iMsgNo, strMsg);
                            Tools.AddTCPMsg(itID, iMsgNo, strMsg);
                            break;
                    }
                }
                if (cBase.b_Five_Front_Start && cBase.TimeDifferent(cBase.t_Five_Front) > cBase.iDJStartTimeOut)
                {
                    int iRet = 0;
                    LightControl(LIGHT.YellowVoice);
                    iRet = cBase.ShowMessage(itID, -10033, (int)cBase.MsgType.OK);
                    LightControl(LIGHT.Green);
                    cBase.t_Five_Front = DateTime.Now;
                }
                if (cBase.b_Five_Back_Start && cBase.TimeDifferent(cBase.t_Five_Back) > cBase.iDJStartTimeOut)
                {
                    int iRet = 0;
                    LightControl(LIGHT.YellowVoice);
                    iRet = cBase.ShowMessage(itID, -10034, (int)cBase.MsgType.OK);
                    LightControl(LIGHT.Green);
                    cBase.t_Five_Back = DateTime.Now;
                }
            }
            cRun.iThd_GetFiveRbtCmd--;
            Tools.ClearAllCmd(); ClearAllCmd();
            cBase.bStopFlag = true;
            cBase.SaveLog("Monitor", "Thread GetFiveRbtCmd Finished.");
        }

        private void SysStop(string strExitLog)
        {
            cBase.cAct[(int)cBase.RBT.FIVE].Stop();
            cBase.cAct[(int)cBase.RBT.SIX].Stop();
            LightControl(LIGHT.Red);

            cBase.SaveLog("Monitor", "System Stop:" + strExitLog);

            cBase.bInited = false;
            cBase.bIsRunning = false;
            cBase.UpdateMsg(0, (int)cBase.GuiItem.ControlBtn, cBase.GUISTATUS.Unitinalization);
            cBase.bStopFlag = true;
        }

        #region 6边形机器人逻辑
        private void RbtSixRun()
        {
            cRun.iThd_RbtSixRun++;
            if (cRun.iThd_RbtSixRun > 1)
            {
                cBase.ShowNormalMessage((int)cBase.MsgType.EXCEPTION, "同一线程 RbtSixRun 多次开启,请关闭程序重新启动!");
                cBase.bInited = false;
                cBase.bIsRunning = false;
                cBase.UpdateMsg(0, (int)cBase.GuiItem.ControlBtn, cBase.GUISTATUS.Unitinalization);
                cBase.bStopFlag = true;
                return;
            }

            MSGNO iNo = MSGNO.SixRbt;
            int iRet = 0;
            int iStopFlag = 0;
            cBase.SaveLog("Monitor", "Thread RbtSixRun Started.");
            while (!cBase.bStopFlag)
            {
                Thread.Sleep(20);
                Application.DoEvents();

                iStopFlag = IsNormalStopSix();
                if (iStopFlag == 0)
                {
                    SysStop("Six Side Normal Stop Fail");
                }
                else if (iStopFlag == 1)
                {
                    cBase.SaveLog("Monitor", "Six Side Normal Stop Finish!");
                    cBase.cAct[(int)cBase.RBT.SIX].Stop();
                    break;
                }
                if (!bPaused()) break;

                if (this.ExistCommand(iNo))
                {
                    string str = GetFirstMsg(iNo);
                    switch (str.ToUpper())
                    {
                        case "RBT_PICK_LINE_6":
                            #region
                            iRet = RobotPickSixLinePrd();
                            if (iRet == 1)
                                this.RmvMsg(iNo, str);
                            else if (iRet == -1)
                            {
                                this.RmvMsg(iNo, str); this.AddMsg(iNo, str);
                            }
                            else if (iRet == 0)
                            {
                                SysStop("RBT_PICK_LINE_6");
                            }
                            break;
                        #endregion
                        case "PICK_FRONT_DJ_6":
                            #region
                            if (cBase.bSixFirstPut[0])
                            {
                                iRet = RobotPutSixFrontDJPrd();
                            }
                            else
                            {
                                iRet = RobotPickSixFrontPrd();
                            }
                            if (iRet == 1)
                            {
                                this.RmvMsg(iNo, str);
                                cBase.bSixFirstPut[0] = false;
                            }
                            else if (iRet == -1)
                            {
                                this.RmvMsg(iNo, str); this.AddMsg(iNo, str);
                            }
                            else if (iRet == 0)
                            {
                                SysStop("PICK_FRONT_DJ_6");
                            }
                            break;
                        #endregion
                        case "PUT_FRONT_DJ_6":
                            #region
                            iRet = RobotPutSixFrontDJPrd();
                            if (iRet == 1)
                            {
                                this.RmvMsg(iNo, str);
                            }
                            else if (iRet == -1)
                            {
                                this.RmvMsg(iNo, str); this.AddMsg(iNo, str);
                            }
                            else if (iRet == 0)
                            {
                                SysStop("PUT_FRONT_DJ_6");
                            }
                            break;
                        #endregion
                        case "PICK_BACK_DJ_6":
                            #region
                            if (cBase.bSixFirstPut[1])
                            {
                                iRet = RobotPutSixBackDJPrd();
                            }
                            else
                            {
                                iRet = RobotPickSixBackPrd();
                            }
                            if (iRet == 1)
                            {
                                this.RmvMsg(iNo, str);
                                cBase.bSixFirstPut[1] = false;
                            }
                            else if (iRet == -1)
                            {
                                this.RmvMsg(iNo, str); this.AddMsg(iNo, str);
                            }
                            else if (iRet == 0)
                            {
                                SysStop("PICK_BACK_DJ_6");
                            }
                            break;
                        #endregion
                        case "PUT_BACK_DJ_6":
                            #region
                            iRet = RobotPutSixBackDJPrd();
                            if (iRet == 1)
                            {
                                this.RmvMsg(iNo, str);
                            }
                            else if (iRet == -1)
                            {
                                this.RmvMsg(iNo, str); this.AddMsg(iNo, str);
                            }
                            else if (iRet == 0)
                            {
                                SysStop("PUT_BACK_DJ_6");
                            }
                            break;
                        #endregion
                        case "PUT_BUF_PRD_6":
                            #region
                            iRet = RobotPutSixBufPrd();
                            if (iRet == 1)
                                this.RmvMsg(iNo, str);
                            else if (iRet == -1)
                            {
                                this.RmvMsg(iNo, str); this.AddMsg(iNo, str);
                            }
                            else if (iRet == 0)
                            {
                                SysStop("PUT_BUF_PRD_6");
                            }
                            break;
                        #endregion
                        default:
                            this.RmvMsg(iNo, str);
                            this.AddMsg(iNo, str);
                            break;
                    }
                }
            }
            cRun.iThd_RbtSixRun--;
            Tools.ClearAllCmd(); ClearAllCmd();
            cBase.bStopFlag = true;
            cBase.SaveLog("Monitor", "Thread RbtSixRun Finished.");
            cBase.UpdateMsg(0, (int)cBase.GuiItem.ControlBtn, cBase.GUISTATUS.Unitinalization);
        }
        private int IsNormalStopSix()
        {
            int itID = (int)cBase.RBT.SIX;
            if (!cBase.bNormalStop) return -1;

            //检查到五边形，六边形是否全部做完，防止未开始抓料就点击了清料
            if (AllIsFinish()) return 1;

            //前点胶机有旧料，后点胶机无料
            bool bDJFront = cBase.cAct[itID].dj[0].bExistPrd && cBase.cAct[itID].dj[0].bOldPrd && !cBase.cAct[itID].dj[1].bExistPrd;
            //后点胶机有旧料，前点胶机无料
            bool bDJBack = !cBase.cAct[itID].dj[0].bExistPrd && cBase.cAct[itID].dj[1].bOldPrd && cBase.cAct[itID].dj[1].bExistPrd;

            //机器人在流水线等待位置，机器人无料，前点胶机或后点胶机只有一个有旧料，缓冲位无料，缓冲上下料汽缸无料。
            bool bOK = (cBase.cAct[itID].rbt.iCurrPos == (int)cMotion.RbtPos.LineWaitePos && cBase.cAct[itID].rbt.iPrdCnt == 0
                && (bDJFront || bDJBack) && !cBase.cAct[itID].buf.bExistPrd && !cBase.cAct[itID].qg.bExistPrd);
            if (bOK)
            {
                //前点胶机有料
                if (bDJFront)
                {
                    if (!cBase.cAct[itID].MoveToBotVisPos()) return 0;
                    if (!cBase.cAct[itID].PickPrdFromFrontWorkPos()) return 0;
                    cBase.cAct[itID].rbt.iPrdCnt = 3;
                    cBase.cAct[itID].dj[0].bExistPrd = false;
                    if (!cBase.cAct[itID].PutPrdToBufPos()) return 0;
                }
                else if (bDJBack)
                {
                    if (!cBase.cAct[itID].MoveToBotVisPos()) return 0;
                    if (!cBase.cAct[itID].MoveToFrontDJUPPos()) return 0;
                    if (!cBase.cAct[itID].PickPrdFromBackWorkPos()) return 0;
                    cBase.cAct[itID].rbt.iPrdCnt = 3;
                    cBase.cAct[itID].dj[1].bExistPrd = false;
                    if (!cBase.cAct[itID].PutPrdToBufPos()) return 0;
                }
                cBase.cAct[itID].buf.bExistPrd = true;
                cBase.cAct[itID].rbt.iPrdCnt = 0;
                cBase.cAct[itID].rbt.iCurrPos = (int)cMotion.RbtPos.LineWaitePos;
                AddMsg(MSGNO.SixCy, "CY_PICK_BUF_6");


                //检查五边形，六边形是否全部做完
                while (true)
                {
                    Thread.Sleep(100);
                    if (AllIsFinish()) return 1;
                    if (cBase.bStopFlag) return 0;
                }
            }
            else
            {
                return -1;
            }
        }
        //取流水线6边形料
        private int RobotPickSixLinePrd()
        {
            //机器人在流水线等待位置，机器人无料，前点胶机或后点胶机无料
            int itID = (int)cBase.RBT.SIX;
            bool bOK = cBase.cAct[itID].rbt.iCurrPos == (int)cMotion.RbtPos.LineWaitePos
                && cBase.cAct[itID].rbt.iPrdCnt == 0
                && (!cBase.cAct[itID].dj[0].bExistPrd || !cBase.cAct[itID].dj[1].bExistPrd);
            if (!bOK) return -1;

            double[] x, y, u;
            int icnt = 0;
            int iPickCnt = 0;
            //TopSixRun失败直接通知Pick5


            int iGrab = 0;
            Vision:
            if (cBase.cVis.RunLineSixImage(out x, out y, out u, ref icnt) != (int)cVision.RET.OK)
            {
                iGrab++;
                if (iGrab < cBase.iGrabTimes)
                {
                    Thread.Sleep(50);
                    Application.DoEvents();
                    cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "六边形顶部相机拍照重试第 " + iGrab.ToString() + " 次!");
                    goto Vision;
                }
                else
                {
                    cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "顶部相机六边形视觉定位失败!");
                    cBase.SaveLog("Error", "顶部相机六边形视觉定位失败!");
                    AddMsg(MSGNO.FiveRbt, "RBT_PICK_LINE_5");
                    return (int)RET.OK;
                }
            }
            else
            {
                //cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "六边形视觉定位成功!");
            }
            //cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "通知机器人抓取传送带六边形!");
            if (!cBase.cAct[itID].PickLinePrd(icnt, x[0], y[0], u[0], x[1], y[1], u[1], x[2], y[2], u[2], ref iPickCnt)) return 0;
            //cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "机器人抓取传送带六边形完成!");
            cBase.cAct[itID].rbt.iPrdCnt = icnt;
            cBase.cAct[itID].rbt.bIsNewPrd = true;

            cBase.cAct[itID].rbt.iCurrPos = (int)cMotion.RbtPos.BotVisPos;
            AddMsg(MSGNO.FiveRbt, "RBT_PICK_LINE_5");

            if (iPickCnt >= 0 && iPickCnt < 3)
            {
                cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "六边形从流水线抓取真空异常");
                cBase.SaveLog("Error", "六边形从流水线抓取真空异常");
            }
            else if(iPickCnt == -1)
            {
                cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "六边形从流水线抓取超限");
                cBase.SaveLog("Error", "六边形从流水线抓取超限");
            }
            return 1;
        }
        //放6边形料到前点胶机
        private int RobotPutSixFrontDJPrd()
        {
            //机器人在底部相机位置，机器人有3个料，前点胶机无料
            int itID = (int)cBase.RBT.SIX;
            bool bOK = cBase.cAct[itID].rbt.iCurrPos == (int)cMotion.RbtPos.BotVisPos
                && (cBase.cAct[itID].rbt.iPrdCnt == 3
                && cBase.cAct[itID].rbt.bIsNewPrd)
                && (!cBase.cAct[itID].dj[0].bExistPrd);
            if (!bOK) return -1;

            double[] x, y, u;
            int icnt = 0;

            int iGrab = 0;
            Vision:
            if (cBase.cVis.RunBotSixImage(out x, out y, out u, ref icnt) != (int)cVision.RET.OK)
            {
                iGrab++;
                if (iGrab < cBase.iGrabTimes)
                {
                    Thread.Sleep(50);
                    Application.DoEvents();
                    cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "六边形底部相机拍照重试第 " + iGrab.ToString() + " 次!");
                    goto Vision;
                }
                else
                {
                    cBase.SaveLog("Error", "六边形底部相机视觉识别失败！");
                    icnt = 0;
                }
            }

            if (icnt == 3)
            {
                //cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "六边形底部相机定位成功!");
                if (!cBase.cAct[itID].PutPrdToFrontWorkPos(x[0], y[0], u[0], x[1], y[1], u[1], x[2], y[2], u[2])) return 0;
                //cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "放置六边形到前工位成功!");
                cBase.cAct[itID].dj[0].bExistPrd = true;
                cBase.cAct[itID].dj[0].bOldPrd = false;
                cBase.cAct[itID].rbt.iPrdCnt = 0;
                cBase.cAct[itID].rbt.iCurrPos = (int)cMotion.RbtPos.AboveFrontDJPos;

                if (!cBase.cAct[itID].SixFrontDJRun()) return 0;
                cBase.b_Six_Front_Start = true;
                cBase.t_Six_Front = DateTime.Now;

                if (!cBase.cAct[itID].dj[1].bExistPrd)
                {
                    if (!cBase.cAct[itID].MoveToLinePickWaitPos()) return 0;
                    cBase.cAct[itID].rbt.iCurrPos = (int)cMotion.RbtPos.LineWaitePos;
                }
                return 1;
            }
            else
            {
                //cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "六边形底部相机定位失败!");
                if (!cBase.cAct[itID].PutNGPrd()) return 0;
                //cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "放置六边形到NG位成功!");
                cBase.cAct[itID].rbt.iPrdCnt = 0;
                cBase.cAct[itID].rbt.bIsNewPrd = false;
                cBase.cAct[itID].rbt.iCurrPos = (int)cMotion.RbtPos.LineWaitePos;
                return -1;
            }
        }
        //放6边形料到后点胶机
        private int RobotPutSixBackDJPrd()
        {
            //机器人在底部相机位置，机器人有3个料，后点胶机无料
            int itID = (int)cBase.RBT.SIX;
            bool bOK = cBase.cAct[itID].rbt.iCurrPos == (int)cMotion.RbtPos.BotVisPos && (cBase.cAct[itID].rbt.iPrdCnt == 3 && cBase.cAct[itID].rbt.bIsNewPrd) && (!cBase.cAct[itID].dj[1].bExistPrd);
            if (!bOK) return -1;

            double[] x, y, u;
            int icnt = 0;

            int iGrab = 0;
            Vision:
            if (cBase.cVis.RunBotSixImage(out x, out y, out u, ref icnt) != (int)cVision.RET.OK)
            {
                iGrab++;
                if (iGrab < cBase.iGrabTimes)
                {
                    Thread.Sleep(50);
                    Application.DoEvents();
                    cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "六边形底部相机拍照重试第 " + iGrab.ToString() + " 次!");
                    goto Vision;
                }
                else
                {
                    cBase.SaveLog("Error", "六边形底部相机视觉识别失败！");
                    icnt = 0;
                }
            }

            if (icnt == 3)
            {
                //cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "六边形底部相机定位成功!");
                if (!cBase.cAct[itID].PutPrdToBackWorkPos(x[0], y[0], u[0], x[1], y[1], u[1], x[2], y[2], u[2])) return 0;
                //cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "放置六边形到后工位成功!");
                cBase.cAct[itID].dj[1].bExistPrd = true;
                cBase.cAct[itID].dj[1].bOldPrd = false;
                cBase.cAct[itID].rbt.iPrdCnt = 0;
                cBase.cAct[itID].rbt.iCurrPos = (int)cMotion.RbtPos.AboveBackDJPos;

                if (!cBase.cAct[itID].SixBackDJRun()) return 0;
                cBase.b_Six_Back_Start = true;
                cBase.t_Six_Back = DateTime.Now;

                if (!cBase.cAct[itID].dj[0].bExistPrd)
                {
                    if (!cBase.cAct[itID].MoveToFrontDJUPPos()) return 0;
                    cBase.cAct[itID].rbt.iCurrPos = (int)cMotion.RbtPos.AboveBackDJPos;
                    if (!cBase.cAct[itID].MoveToLinePickWaitPos()) return 0;
                    cBase.cAct[itID].rbt.iCurrPos = (int)cMotion.RbtPos.LineWaitePos;
                }
                return 1;
            }
            else
            {
                //cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "六边形底部相机定位失败!");
                if (!cBase.cAct[itID].PutNGPrd()) return 0;
                //cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "放置六边形到NG位成功!");
                cBase.cAct[itID].rbt.iPrdCnt = 0;
                cBase.cAct[itID].rbt.bIsNewPrd = false;
                cBase.cAct[itID].rbt.iCurrPos = (int)cMotion.RbtPos.LineWaitePos;
                return -1;
            }
        }
        //取6边形前点胶机料
        private int RobotPickSixFrontPrd()
        {
            //机器人在后点胶机位置，前点胶机有料，后点胶机有料，机器人无料
            int itID = (int)cBase.RBT.SIX;
            bool bOK = cBase.cAct[itID].rbt.iCurrPos == (int)cMotion.RbtPos.AboveBackDJPos && cBase.cAct[itID].dj[0].bExistPrd && cBase.cAct[itID].dj[1].bExistPrd && cBase.cAct[itID].rbt.iPrdCnt == 0;

            if (!bOK) return -1;
            if (!cBase.cAct[itID].PickPrdFromFrontWorkPos()) return 0;
            cBase.cAct[itID].dj[0].bExistPrd = false;
            cBase.cAct[itID].rbt.iPrdCnt = 3;
            cBase.cAct[itID].rbt.bIsNewPrd = false;

            //cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "抓取前工位六边形成功!");
            cBase.cAct[itID].rbt.iCurrPos = (int)cMotion.RbtPos.AboveFrontDJPos;

            AddMsg(MSGNO.SixRbt, "PUT_FRONT_DJ_6");

            return 1;
        }
        //取6边形后点胶机料
        private int RobotPickSixBackPrd()
        {
            //机器人在前点胶机位置，前点胶机有料，后点胶机有料，机器人无料
            int itID = (int)cBase.RBT.SIX;
            bool bOK = cBase.cAct[itID].rbt.iCurrPos == (int)cMotion.RbtPos.AboveFrontDJPos && cBase.cAct[itID].dj[0].bExistPrd && cBase.cAct[itID].dj[1].bExistPrd && cBase.cAct[itID].rbt.iPrdCnt == 0;
            if (!bOK) return -1;

            if (!cBase.cAct[itID].PickPrdFromBackWorkPos()) return 0;
            cBase.cAct[itID].dj[1].bExistPrd = false;
            cBase.cAct[itID].rbt.iPrdCnt = 3;
            cBase.cAct[itID].rbt.bIsNewPrd = false;

            //cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "抓取后工位六边形成功!");
            cBase.cAct[itID].rbt.iCurrPos = (int)cMotion.RbtPos.AboveBackDJPos;

            AddMsg(MSGNO.SixRbt, "PUT_BACK_DJ_6");
            return 1;
        }
        //放6边形料到缓冲位
        private int RobotPutSixBufPrd()
        {
            //机器人在前点胶机或后点胶机位置，机器人有旧料
            int itID = (int)cBase.RBT.SIX;
            bool bOK = (cBase.cAct[itID].rbt.iCurrPos == (int)cMotion.RbtPos.AboveFrontDJPos || cBase.cAct[itID].rbt.iCurrPos == (int)cMotion.RbtPos.AboveBackDJPos) && cBase.cAct[itID].rbt.iPrdCnt == 3 && !cBase.cAct[itID].rbt.bIsNewPrd;
            if (!bOK) return -1;

            if (!cBase.cAct[itID].PutPrdToBufPos()) return 0;
            //cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "放置六边形到缓存位成功!");
            cBase.cAct[itID].rbt.iCurrPos = (int)cMotion.RbtPos.LineWaitePos;
            cBase.cAct[itID].rbt.iPrdCnt = 0;
            cBase.cAct[itID].rbt.bIsNewPrd = false;
            cBase.cAct[itID].buf.bExistPrd = true;
            AddMsg(MSGNO.SixCy, "CY_PICK_BUF_6");
            return 1;
        }
        #endregion

        #region 6边形汽缸逻辑
        private void CylinderSixRun()
        {
            cRun.iThd_CySixRun++;
            if (cRun.iThd_CySixRun > 1)
            {
                cBase.ShowNormalMessage((int)cBase.MsgType.EXCEPTION, "同一线程 CylinderSixRun 多次开启,请关闭程序重新启动!");
                cBase.bInited = false;
                cBase.bIsRunning = false;
                cBase.UpdateMsg(0, (int)cBase.GuiItem.ControlBtn, cBase.GUISTATUS.Unitinalization);
                cBase.bStopFlag = true;
                return;
            }

            MSGNO iNo = MSGNO.SixCy;
            int iRet = 0;
            cBase.SaveLog("Monitor", "Thread CylinderSixRun Started.");
            while (!cBase.bStopFlag)
            {
                Thread.Sleep(20);
                Application.DoEvents();
                if (this.ExistCommand(iNo))
                {
                    if (!bPaused()) break;

                    string str = GetFirstMsg(iNo);
                    switch (str.ToUpper())
                    {
                        case "CY_PICK_BUF_6":
                            iRet = CylinderSixPickBuf();
                            if (iRet == 1)
                                this.RmvMsg(iNo, str);
                            else if (iRet == -1)
                            {
                                this.RmvMsg(iNo, str); this.AddMsg(iNo, str);
                            }
                            else if (iRet == 0)
                            {
                                SysStop("CY_PICK_BUF_6");
                            }
                            break;
                        default:
                            this.RmvMsg(iNo, str);
                            this.AddMsg(iNo, str);
                            break;
                    }
                }
            }
            cRun.iThd_CySixRun--;
            Tools.ClearAllCmd(); ClearAllCmd();
            cBase.bStopFlag = true;
            cBase.SaveLog("Monitor", "Thread CylinderSixRun Finished.");
        }
        //六边形汽缸从缓冲位取料放到传送带
        private int CylinderSixPickBuf()
        {
            //汽缸无料
            int itID = (int)cBase.RBT.SIX;
            bool bOK = !cBase.cAct[itID].qg.bExistPrd;
            if (!bOK) return -1;

            if (!cBase.cAct[itID].CyPickBufPrd()) return 0;
            cBase.cAct[itID].qg.bExistPrd = true;
            cBase.cAct[itID].buf.bExistPrd = false;
            //cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "气缸抓取缓存位六边形成功!");
            AddMsg(MSGNO.SixRbt, "PUT_BUF_PRD_6");
            if (!cBase.cAct[itID].CyPutPrdToLine()) return 0;
            //cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "气缸放置六边形到传送带成功!");
            cBase.cAct[itID].qg.bExistPrd = false;
            return 1;
        }
        #endregion

        #region 5边形机器人逻辑
        private void RbtFiveRun()
        {
            cRun.iThd_RbtFiveRun++;
            if (cRun.iThd_RbtFiveRun > 1)
            {
                cBase.ShowNormalMessage((int)cBase.MsgType.EXCEPTION, "同一线程 RbtFiveRun 多次开启,请关闭程序重新启动!");
                cBase.bInited = false;
                cBase.bIsRunning = false;
                cBase.UpdateMsg(0, (int)cBase.GuiItem.ControlBtn, cBase.GUISTATUS.Unitinalization);
                cBase.bStopFlag = true;
                return;
            }

            MSGNO iNo = MSGNO.FiveRbt;
            int iRet = 0;
            int iStopFlag = 0;
            cBase.SaveLog("Monitor", "Thread RbtFiveRun Started.");
            while (!cBase.bStopFlag)
            {
                Thread.Sleep(20);
                Application.DoEvents();

                if (!bPaused()) break;

                iStopFlag = IsNormalStopFive();
                if (iStopFlag == 0)
                {
                    SysStop("Five Side Normal Stop Fail");
                }
                else if (iStopFlag == 1)
                {
                    cBase.cAct[(int)cBase.RBT.FIVE].Stop();
                    cBase.SaveLog("Monitor", "Five Side Normal Stop Finish!");
                    break;
                }

                if (this.ExistCommand(iNo))
                {
                    string str = GetFirstMsg(iNo);
                    switch (str.ToUpper())
                    {
                        case "RBT_PICK_LINE_5":
                            #region
                            iRet = RobotPickFiveLinePrd();
                            if (iRet == 1)
                                this.RmvMsg(iNo, str);
                            else if (iRet == -1)
                            {
                                this.RmvMsg(iNo, str); this.AddMsg(iNo, str);
                            }
                            else if (iRet == 0)
                            {
                                SysStop("RBT_PICK_LINE_5");
                            }
                            break;
                        #endregion
                        case "PICK_FRONT_DJ_5":
                            #region
                            if (cBase.bFiveFirstPut[0])
                            {
                                iRet = RobotPutFiveFrontDJPrd();
                            }
                            else
                            {
                                iRet = RobotPickFiveFrontPrd();
                            }
                            if (iRet == 1)
                            {
                                this.RmvMsg(iNo, str);
                                cBase.bFiveFirstPut[0] = false;
                            }
                            else if (iRet == -1)
                            {
                                this.RmvMsg(iNo, str); this.AddMsg(iNo, str);
                            }
                            else if (iRet == 0)
                            {
                                SysStop("PICK_FRONT_DJ_5");
                            }
                            break;
                        #endregion
                        case "PUT_FRONT_DJ_5":
                            #region
                            iRet = RobotPutFiveFrontDJPrd();
                            if (iRet == 1)
                                this.RmvMsg(iNo, str);
                            else if (iRet == -1)
                            {
                                this.RmvMsg(iNo, str); this.AddMsg(iNo, str);
                            }
                            else if (iRet == 0)
                            {
                                SysStop("PUT_FRONT_DJ_5");
                            }
                            break;
                        #endregion
                        case "PICK_BACK_DJ_5":
                            #region
                            if (cBase.bFiveFirstPut[1])
                            {
                                iRet = RobotPutFiveBackDJPrd();
                            }
                            else
                            {
                                iRet = RobotPickFiveBackPrd();
                            }
                            if (iRet == 1)
                            {
                                this.RmvMsg(iNo, str);
                                cBase.bFiveFirstPut[1] = false;
                            }
                            else if (iRet == -1)
                            {
                                this.RmvMsg(iNo, str); this.AddMsg(iNo, str);
                            }
                            else if (iRet == 0)
                            {
                                SysStop("PICK_BACK_DJ_5");
                            }
                            break;
                        #endregion
                        case "PUT_BACK_DJ_5":
                            #region
                            iRet = RobotPutFiveBackDJPrd();
                            if (iRet == 1)
                                this.RmvMsg(iNo, str);
                            else if (iRet == -1)
                            {
                                this.RmvMsg(iNo, str); this.AddMsg(iNo, str);
                            }
                            else if (iRet == 0)
                            {
                                SysStop("PUT_BACK_DJ_5");
                            }
                            break;
                        #endregion
                        case "PUT_BUF_PRD_5":
                            #region
                            iRet = RobotPutFiveBufPrd();
                            if (iRet == 1)
                                this.RmvMsg(iNo, str);
                            else if (iRet == -1)
                            {
                                this.RmvMsg(iNo, str); this.AddMsg(iNo, str);
                            }
                            else if (iRet == 0)
                            {
                                SysStop("PUT_BUF_PRD_5");
                            }
                            break;
                        #endregion
                        default:
                            this.RmvMsg(iNo, str);
                            this.AddMsg(iNo, str);
                            break;
                    }
                }
            }
            cRun.iThd_RbtFiveRun--;
            Tools.ClearAllCmd(); ClearAllCmd();
            cBase.bStopFlag = true;
            cBase.SaveLog("Monitor", "Thread RbtFiveRun Finished.");
            cBase.UpdateMsg(0, (int)cBase.GuiItem.ControlBtn, cBase.GUISTATUS.Unitinalization);
        }
        private int IsNormalStopFive()
        {
            int itID = (int)cBase.RBT.FIVE;
            if (!cBase.bNormalStop) return -1;

            //检查到五边形，六边形是否全部做完，防止未开始抓料就点击了清料
            if (AllIsFinish()) return 1;

            //前点胶机有旧料，后点胶机无料
            bool bDJFront = cBase.cAct[itID].dj[0].bExistPrd && cBase.cAct[itID].dj[0].bOldPrd && !cBase.cAct[itID].dj[1].bExistPrd;
            //后点胶机有旧料，前点胶机无料
            bool bDJBack = !cBase.cAct[itID].dj[0].bExistPrd && cBase.cAct[itID].dj[1].bOldPrd && cBase.cAct[itID].dj[1].bExistPrd;

            //机器人在流水线等待位置，机器人无料，前点胶机或后点胶机只有一个有旧料，缓冲位无料，缓冲上下料汽缸无料。
            bool bOK = (cBase.cAct[itID].rbt.iCurrPos == (int)cMotion.RbtPos.LineWaitePos && cBase.cAct[itID].rbt.iPrdCnt == 0
                && (bDJFront || bDJBack) && !cBase.cAct[itID].buf.bExistPrd && !cBase.cAct[itID].qg.bExistPrd);
            if (bOK)
            {
                //前点胶机有料,后点胶机无料
                if (bDJFront)
                {
                    if (!cBase.cAct[itID].MoveToBotVisPos()) return 0;
                    if (!cBase.cAct[itID].PickPrdFromFrontWorkPos()) return 0;
                    cBase.cAct[itID].rbt.iPrdCnt = 2;
                    cBase.cAct[itID].dj[0].bExistPrd = false;
                    if (!cBase.cAct[itID].PutPrdToBufPos()) return 0;
                }
                else if (bDJBack) //后点胶机有料,前点胶机无料
                {
                    if (!cBase.cAct[itID].MoveToBotVisPos()) return 0;
                    if (!cBase.cAct[itID].MoveToFrontDJUPPos()) return 0;
                    if (!cBase.cAct[itID].PickPrdFromBackWorkPos()) return 0;
                    cBase.cAct[itID].rbt.iPrdCnt = 2;
                    cBase.cAct[itID].dj[1].bExistPrd = false;
                    if (!cBase.cAct[itID].PutPrdToBufPos()) return 0;
                }
                cBase.cAct[itID].buf.bExistPrd = true;
                cBase.cAct[itID].rbt.iPrdCnt = 0;
                cBase.cAct[itID].rbt.iCurrPos = (int)cMotion.RbtPos.LineWaitePos;
                AddMsg(MSGNO.FiveCy, "CY_PICK_BUF_5");

                //等待直到五边形，六边形全部做完
                while (true)
                {
                    Thread.Sleep(100);
                    if (AllIsFinish()) return 1;
                    if (cBase.bStopFlag) return 0;
                }
            }
            else
            {
                return -1;
            }
        }
        private bool AllIsFinish()
        {
            int tidS = (int)cBase.RBT.SIX;
            int tidF = (int)cBase.RBT.FIVE;
            bool bSixFinish = cBase.cAct[tidS].rbt.iCurrPos == (int)cMotion.RbtPos.LineWaitePos && cBase.cAct[tidS].rbt.iPrdCnt == 0
                             && !cBase.cAct[tidS].dj[0].bExistPrd && !cBase.cAct[tidS].dj[1].bExistPrd
                             && !cBase.cAct[tidS].buf.bExistPrd && !cBase.cAct[tidS].qg.bExistPrd;

            bool bFiveFinish = cBase.cAct[tidF].rbt.iCurrPos == (int)cMotion.RbtPos.LineWaitePos && cBase.cAct[tidF].rbt.iPrdCnt == 0
                             && !cBase.cAct[tidF].dj[0].bExistPrd && !cBase.cAct[tidF].dj[1].bExistPrd
                             && !cBase.cAct[tidF].buf.bExistPrd && !cBase.cAct[tidF].qg.bExistPrd;

            if (bSixFinish && bFiveFinish)
                return true;
            else
                return false;
        }
        private int RobotPickFiveLinePrd()
        {
            //机器人在流水线等待位置，机器人无料，前点胶机或后点胶机无料
            int itID = (int)cBase.RBT.FIVE;
            bool bOK = cBase.cAct[itID].rbt.iCurrPos == (int)cMotion.RbtPos.LineWaitePos && cBase.cAct[itID].rbt.iPrdCnt == 0 && (!cBase.cAct[itID].dj[0].bExistPrd || !cBase.cAct[itID].dj[1].bExistPrd);
            if (!bOK) return -1;

            double[] x, y, u;
            int icnt = 0;
            int iPickCnt = 0;


            int iGrab = 0;
            Vision:
            if (cBase.cVis.RunLineFiveImage(out x, out y, out u, ref icnt) != (int)cVision.RET.OK)
            {
                iGrab++;
                if (iGrab < cBase.iGrabTimes)
                {
                    Thread.Sleep(50);
                    Application.DoEvents();
                    cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "五边形顶部相机拍照重试第 " + iGrab.ToString() + " 次!");
                    goto Vision;
                }
                else
                {
                    cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "顶部相机五边形定位失败!");
                    cBase.SaveLog("Error", "顶部相机五边形视觉定位失败!");
                    AddMsg(MSGNO.Line, "LINE_MOVE");
                    return 1;
                }
            }

            //cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "五边形定位成功!");
            //cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "通知机器人抓取传送带五边形!");
            if (!cBase.cAct[itID].PickLinePrdFive(icnt, x[0], y[0], u[0], x[1], y[1], u[1], ref iPickCnt)) return 0;
            //cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "机器人抓取传送带五边形完成!");
            //通知传送带运动
            AddMsg(MSGNO.Line, "LINE_MOVE");

            cBase.cAct[itID].rbt.iPrdCnt = icnt;
            cBase.cAct[itID].rbt.bIsNewPrd = true;
            cBase.cAct[itID].rbt.iCurrPos = (int)cMotion.RbtPos.BotVisPos;

            if (iPickCnt >= 0 && iPickCnt < 2)
            {
                cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "五边形从流水线抓取真空异常");
                cBase.SaveLog("Error", "五边形从流水线抓取真空异常");
            }
            else if (iPickCnt == -1)
            {
                cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "五边形从流水线抓取超限");
                cBase.SaveLog("Error", "五边形从流水线抓取超限");
            }
            return 1;
        }
        //放5边形料到前点胶机
        private int RobotPutFiveFrontDJPrd()
        {
            //机器人在底部相机位置，机器人有3个料，前点胶机无料
            int itID = (int)cBase.RBT.FIVE;
            bool bOK = cBase.cAct[itID].rbt.iCurrPos == (int)cMotion.RbtPos.BotVisPos && (cBase.cAct[itID].rbt.iPrdCnt == 2 && cBase.cAct[itID].rbt.bIsNewPrd) && (!cBase.cAct[itID].dj[0].bExistPrd);
            if (!bOK) return -1;

            double[] x, y, u;
            int icnt = 0;

            int iGrab = 0;
            Vision:
            if (cBase.cVis.RunBotFiveImage(out x, out y, out u, ref icnt) != (int)cVision.RET.OK)
            {
                iGrab++;
                if (iGrab < cBase.iGrabTimes)
                {
                    Thread.Sleep(50);
                    Application.DoEvents();
                    cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "五边形底部相机拍照重试第 " + iGrab.ToString() + " 次!");
                    goto Vision;
                }
                else
                {
                    cBase.SaveLog("Error", "五边形底部相机视觉识别失败！");
                    icnt = 0;
                }
            }

            if (icnt == 2)
            {
                //cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "五边形底部相机定位成功!");
                if (!cBase.cAct[itID].PutPrdToFrontWorkPosFive(x[0], y[0], u[0], x[1], y[1], u[1])) return 0;
                //cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "放置五边形到前工位成功!");
                cBase.cAct[itID].dj[0].bExistPrd = true;
                cBase.cAct[itID].dj[0].bOldPrd = false;
                cBase.cAct[itID].rbt.iPrdCnt = 0;
                cBase.cAct[itID].rbt.iCurrPos = (int)cMotion.RbtPos.AboveFrontDJPos;

                if (!cBase.cAct[itID].FiveFrontDJRun()) return 0;
                cBase.b_Five_Front_Start = true;
                cBase.t_Five_Front = DateTime.Now;

                if (!cBase.cAct[itID].dj[1].bExistPrd)
                {
                    if (!cBase.cAct[itID].MoveToLinePickWaitPos()) return 0;
                    cBase.cAct[itID].rbt.iCurrPos = (int)cMotion.RbtPos.LineWaitePos;
                }
                return 1;
            }
            else
            {
                cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "五边形底部相机定位失败!");
                if (!cBase.cAct[itID].PutNGPrd()) return 0;
                //cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "放置五边形到NG位成功!");
                cBase.cAct[itID].rbt.iPrdCnt = 0;
                cBase.cAct[itID].rbt.bIsNewPrd = false;
                cBase.cAct[itID].rbt.iCurrPos = (int)cMotion.RbtPos.LineWaitePos;
                return -1;
            }
        }
        //放5边形料到后点胶机
        private int RobotPutFiveBackDJPrd()
        {
            //机器人在底部相机位置，机器人有3个料，后点胶机无料
            int itID = (int)cBase.RBT.FIVE;
            bool bOK = cBase.cAct[itID].rbt.iCurrPos == (int)cMotion.RbtPos.BotVisPos && (cBase.cAct[itID].rbt.iPrdCnt == 2 && cBase.cAct[itID].rbt.bIsNewPrd) && (!cBase.cAct[itID].dj[1].bExistPrd);
            if (!bOK) return -1;

            double[] x, y, u;
            int icnt = 0;

            int iGrab = 0;
            Vision:
            if (cBase.cVis.RunBotFiveImage(out x, out y, out u, ref icnt) != (int)cVision.RET.OK)
            {
                iGrab++;
                if (iGrab < cBase.iGrabTimes)
                {
                    Thread.Sleep(50);
                    Application.DoEvents();
                    cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "五边形底部相机拍照重试第 " + iGrab.ToString() + " 次!");
                    goto Vision;
                }
                else
                {
                    cBase.SaveLog("Error", "五边形底部相机视觉识别失败！");
                    icnt = 0;
                }
            }

            if (icnt == 2)
            {
                //cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "五边形底部相机定位成功!");
                if (!cBase.cAct[itID].PutPrdToBackWorkPosFive(x[0], y[0], u[0], x[1], y[1], u[1])) return 0;
                //cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "放置五边形到后工位成功!");
                cBase.cAct[itID].dj[1].bExistPrd = true;
                cBase.cAct[itID].dj[1].bOldPrd = false;
                cBase.cAct[itID].rbt.iPrdCnt = 0;
                cBase.cAct[itID].rbt.iCurrPos = (int)cMotion.RbtPos.AboveBackDJPos;

                if (!cBase.cAct[itID].FiveBackDJRun()) return 0;
                cBase.b_Five_Back_Start = true;
                cBase.t_Five_Back = DateTime.Now;

                if (!cBase.cAct[itID].dj[0].bExistPrd)
                {
                    if (!cBase.cAct[itID].MoveToFrontDJUPPos()) return 0;
                    cBase.cAct[itID].rbt.iCurrPos = (int)cMotion.RbtPos.AboveBackDJPos;
                    if (!cBase.cAct[itID].MoveToLinePickWaitPos()) return 0;
                    cBase.cAct[itID].rbt.iCurrPos = (int)cMotion.RbtPos.LineWaitePos;
                }
                return 1;
            }
            else
            {
                cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "五边形底部相机定位失败!");
                if (!cBase.cAct[itID].PutNGPrd()) return 0;
                //cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "放置五边形到NG位成功!");
                cBase.cAct[itID].rbt.iPrdCnt = 0;
                cBase.cAct[itID].rbt.bIsNewPrd = false;
                cBase.cAct[itID].rbt.iCurrPos = (int)cMotion.RbtPos.LineWaitePos;
                return -1;
            }
        }
        //取5边形前点胶机料
        private int RobotPickFiveFrontPrd()
        {
            //机器人在后点胶机位置，前点胶机有料，后点胶机有料，机器人无料
            int itID = (int)cBase.RBT.FIVE;
            bool bOK = cBase.cAct[itID].rbt.iCurrPos == (int)cMotion.RbtPos.AboveBackDJPos && cBase.cAct[itID].dj[0].bExistPrd && cBase.cAct[itID].dj[1].bExistPrd && cBase.cAct[itID].rbt.iPrdCnt == 0;

            if (!bOK) return -1;
            if (!cBase.cAct[itID].PickPrdFromFrontWorkPos()) return 0;
            cBase.cAct[itID].dj[0].bExistPrd = false;
            cBase.cAct[itID].rbt.iPrdCnt = 2;
            cBase.cAct[itID].rbt.bIsNewPrd = false;

            //cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "抓取前工位五边形成功!");
            cBase.cAct[itID].rbt.iCurrPos = (int)cMotion.RbtPos.AboveFrontDJPos;

            AddMsg(MSGNO.FiveRbt, "PUT_FRONT_DJ_5");

            return 1;
        }
        //取5边形后点胶机料
        private int RobotPickFiveBackPrd()
        {
            //机器人在前点胶机位置，前点胶机有料，后点胶机有料，机器人无料
            int itID = (int)cBase.RBT.FIVE;
            bool bOK = cBase.cAct[itID].rbt.iCurrPos == (int)cMotion.RbtPos.AboveFrontDJPos && cBase.cAct[itID].dj[0].bExistPrd && cBase.cAct[itID].dj[1].bExistPrd && cBase.cAct[itID].rbt.iPrdCnt == 0;
            if (!bOK) return -1;

            if (!cBase.cAct[itID].PickPrdFromBackWorkPos()) return 0;
            cBase.cAct[itID].dj[1].bExistPrd = false;
            cBase.cAct[itID].rbt.iPrdCnt = 2;
            cBase.cAct[itID].rbt.bIsNewPrd = false;

            //cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "抓取后工位五边形成功!");
            cBase.cAct[itID].rbt.iCurrPos = (int)cMotion.RbtPos.AboveFrontDJPos;

            AddMsg(MSGNO.FiveRbt, "PUT_BACK_DJ_5");
            return 1;
        }
        //放5边形料到缓冲位
        private int RobotPutFiveBufPrd()
        {
            //机器人在前点胶机或后点胶机位置，机器人有旧料
            int itID = (int)cBase.RBT.FIVE;
            bool bOK = (cBase.cAct[itID].rbt.iCurrPos == (int)cMotion.RbtPos.AboveFrontDJPos || cBase.cAct[itID].rbt.iCurrPos == (int)cMotion.RbtPos.AboveBackDJPos) && cBase.cAct[itID].rbt.iPrdCnt == 2 && !cBase.cAct[itID].rbt.bIsNewPrd;
            if (!bOK) return -1;

            if (!cBase.cAct[itID].PutPrdToBufPos()) return 0;
            //cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "放置五边形到缓存位成功!");

            cBase.cAct[itID].rbt.iCurrPos = (int)cMotion.RbtPos.LineWaitePos;
            cBase.cAct[itID].rbt.iPrdCnt = 0;
            cBase.cAct[itID].rbt.bIsNewPrd = false;

            AddMsg(MSGNO.FiveCy, "CY_PICK_BUF_5");
            return 1;
        }
        #endregion

        #region 5边形汽缸逻辑
        private void CylinderFiveRun()
        {
            cRun.iThd_CyFiveRun++;
            if (cRun.iThd_CyFiveRun > 1)
            {
                cBase.ShowNormalMessage((int)cBase.MsgType.EXCEPTION, "同一线程 CylinderFiveRun 多次开启,请关闭程序重新启动!");
                cBase.bInited = false;
                cBase.bIsRunning = false;
                cBase.UpdateMsg(0, (int)cBase.GuiItem.ControlBtn, cBase.GUISTATUS.Unitinalization);
                cBase.bStopFlag = true;
                return;
            }

            MSGNO iNo = MSGNO.FiveCy;
            int iRet = 0;
            cBase.SaveLog("Monitor", "Thread CylinderFiveRun Started.");
            while (!cBase.bStopFlag)
            {
                Thread.Sleep(20);
                Application.DoEvents();
                if (this.ExistCommand(iNo))
                {
                    if (!bPaused()) break;

                    string str = GetFirstMsg(iNo);
                    switch (str.ToUpper())
                    {
                        case "CY_PICK_BUF_5":
                            iRet = CylinderPickFiveBuf();
                            if (iRet == 1)
                                this.RmvMsg(iNo, str);
                            else if (iRet == -1)
                            {
                                this.RmvMsg(iNo, str); this.AddMsg(iNo, str);
                            }
                            else if (iRet == 0)
                            {
                                SysStop("CY_PICK_BUF_5");
                            }
                            break;
                        default:
                            this.RmvMsg(iNo, str);
                            this.AddMsg(iNo, str);
                            break;
                    }
                }
            }
            cRun.iThd_CyFiveRun--;
            Tools.ClearAllCmd(); ClearAllCmd();
            cBase.bStopFlag = true;
            cBase.SaveLog("Monitor", "Thread CylinderFiveRun Finished.");
        }
        //六边形汽缸从缓冲位取料放到传送带
        private int CylinderPickFiveBuf()
        {
            //汽缸无料
            int itID = (int)cBase.RBT.FIVE;
            bool bOK = !cBase.cAct[itID].qg.bExistPrd;
            if (!bOK) return -1;

            if (!cBase.cAct[itID].CyPickBufPrd()) return 0;
            cBase.cAct[itID].qg.bExistPrd = true;
            cBase.cAct[itID].buf.bExistPrd = false;
            //cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "气缸抓取缓存位五边形成功!");
            AddMsg(MSGNO.FiveRbt, "PUT_BUF_PRD_5");
            if (!cBase.cAct[itID].CyPutPrdToLine()) return 0;
            //cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, "气缸放置五边形到传送带成功!");
            cBase.cAct[itID].qg.bExistPrd = false;
            return 1;
        }
        #endregion

        #region 命令队列处理
        public bool ExistCommand(MSGNO iNo)
        {
            if (ArrCmd[(int)iNo] == null)
                return false;

            return ArrCmd[(int)iNo].Count > 0 ? true : false;
        }
        public string GetFirstMsg(MSGNO iNo)
        {
            string strRcv = string.Empty;
            if (ArrCmd[(int)iNo] == null)
                return string.Empty;

            lock (ArrCmd[(int)iNo])
                if (ArrCmd[(int)iNo].Count > 0)
                {
                    strRcv = ArrCmd[(int)iNo][0].ToString();
                }
            return strRcv;
        }
        public void AddMsg(MSGNO iNo, string str)
        {
            if (ArrCmd[(int)iNo] == null) return;

            lock (ArrCmd[(int)iNo])
                if (!str.Equals(string.Empty))
                {
                    ArrCmd[(int)iNo].Add(str);
                }
        }
        public void RmvMsg(MSGNO iNo, string str)
        {
            int tcnt = ArrCmd[(int)iNo].Count;
            lock (ArrCmd[(int)iNo])
                for (int i = 0; i < tcnt; i++)
                {
                    ArrCmd[(int)iNo].Remove(str);
                }
        }
        #endregion

        private void RunScanIO()
        {
            cRun.iThd_RunScanIO++;
            if (cRun.iThd_RunScanIO > 1)
            {
                cBase.ShowNormalMessage((int)cBase.MsgType.EXCEPTION, "同一线程 RunScanIO 多次开启,请关闭程序重新启动!");
                cBase.bInited = false;
                cBase.bIsRunning = false;
                cBase.UpdateMsg(0, (int)cBase.GuiItem.ControlBtn, cBase.GUISTATUS.Unitinalization);
                cBase.bStopFlag = true;
                return;
            }

            int itID = 0;
            int iMsgNo = 3;
            cBase.SaveLog("Monitor", "Thread RunScanIO Started.");
            while (!cBase.bStopFlag)
            {
                Thread.Sleep(10);
                Application.DoEvents();
                if (Tools.ExistReceiveTCPMsg(itID, iMsgNo))
                {
                    if (!bPaused()) break;

                    string strMsg = Tools.GetFirstTCPMsg(itID, iMsgNo);
                    switch (strMsg.ToUpper())
                    {
                        case "R_START":
                            //if(!cBase.bIsRunning[itID])
                            //{
                            //    this.StartThread(itID);
                            //    cBase.bIsRunning[itID] = true;
                            //    cBase.UpdateMsg(itID, (int)cBase.GuiItem.ControlBtn, cBase.GUISTATUS.Running);
                            //    cBase.UpdateMsg(itID, (int)cBase.GuiItem.Grid, strMsg);
                            //}
                            Tools.RemoveTCPMsg(itID, iMsgNo, strMsg);
                            break;
                        case "R_PAUSE":
                            //if (cBase.bIsRunning[itID])
                            {
                                cBase.UpdateMsg(itID, (int)cBase.GuiItem.ControlBtn, cBase.GUISTATUS.Paused);
                                cBase.UpdateMsg(itID, (int)cBase.GuiItem.Grid, strMsg);
                            }
                            Tools.RemoveTCPMsg(itID, iMsgNo, strMsg);
                            break;
                        case "R_RESUME":
                            //if (cBase.bIsRunning[itID])
                            {
                                cBase.UpdateMsg(itID, (int)cBase.GuiItem.ControlBtn, cBase.GUISTATUS.Paused);
                                cBase.UpdateMsg(itID, (int)cBase.GuiItem.Grid, strMsg);
                            }
                            Tools.RemoveTCPMsg(itID, iMsgNo, strMsg);
                            break;
                        case "R_STOP":
                            //if (cBase.bIsRunning[itID])
                            {
                                //cBase.bStopFlag[itID] = true;
                                //cBase.bInited[itID] = false;
                                //cBase.bIsRunning[itID] = false;
                                //cBase.UpdateMsg(itID, (int)cBase.GuiItem.ControlBtn, cBase.GUISTATUS.Unitinalization);
                                //cBase.UpdateMsg(itID, (int)cBase.GuiItem.Grid, strMsg);
                            }
                            Tools.RemoveTCPMsg(itID, iMsgNo, strMsg);
                            break;
                        default:
                            Tools.RemoveTCPMsg(itID, iMsgNo, strMsg);
                            Tools.AddTCPMsg(itID, iMsgNo, strMsg);
                            break;
                    }
                }
            }
            cRun.iThd_RunScanIO--;
            Tools.ClearAllCmd(); ClearAllCmd();
            cBase.bStopFlag = true;
            cBase.SaveLog("Monitor", "Thread RunScanIO1 Finished.");
        }

        private void ErrAct1()
        {
            cRun.iThd_ErrAct1++;
            if (cRun.iThd_ErrAct1 > 1)
            {
                cBase.ShowNormalMessage((int)cBase.MsgType.EXCEPTION, "同一线程 ErrAct1 多次开启,请关闭程序重新启动!");
                cBase.bInited = false;
                cBase.bIsRunning = false;
                cBase.UpdateMsg(0, (int)cBase.GuiItem.ControlBtn, cBase.GUISTATUS.Unitinalization);
                cBase.bStopFlag = true;
                return;
            }

            //ERRACT;TYPE(0-CY/1-RBT);0/1(0-RESUME/1-STOP);ERRORCODE
            int itID = (int)cBase.RBT.SIX;
            int iMsgNo = 1;
            cBase.SaveLog("Monitor", "Thread Thd_ErrAct1 Started.");
            while (!cBase.bStopFlag)
            {
                Thread.Sleep(10);
                Application.DoEvents();
                if (Tools.ExistReceiveTCPMsg(itID, iMsgNo))
                {
                    string strMsg = Tools.GetFirstTCPMsg(itID, iMsgNo);
                    string[] strArr = strMsg.Split(';');
                    int iRet = 0;
                    switch (strArr[0].ToUpper())
                    {
                        case "RBTERR":
                            cBase.UpdateMsg(itID, (int)cBase.GuiItem.Grid, strMsg);
                            cBase.SaveLog("Error", strMsg);
                            Tools.RemoveTCPMsg(itID, iMsgNo, strMsg);
                            break;
                        case "ERRACT":
                            cBase.bSysIsWarning = true;
                            cBase.UpdateMsg(itID, (int)cBase.GuiItem.Grid, strMsg);
                            cBase.SaveLog("Error", strMsg);
                            if (strArr[2] == "1")
                            {
                                LightControl(LIGHT.Red);
                            }
                            else
                            {
                                LightControl(LIGHT.YellowVoice);
                            }
                            iRet = cBase.ShowMessage(itID, int.Parse(strArr[3]), (int)cBase.MsgType.OKCANCEL);
                            cBase.bSysIsWarning = false;
                            if (strArr[2] == "1")
                            {
                                SysStop(strMsg + " 1-Stop");
                                cBase.bStopFlag = true;
                                cBase.bInited = false;
                                cBase.bIsRunning = false;
                                cBase.UpdateMsg(itID, (int)cBase.GuiItem.ControlBtn, cBase.GUISTATUS.Unitinalization);
                                cBase.UpdateMsg(itID, (int)cBase.GuiItem.Grid, strMsg);
                            }
                            else
                            {
                                Tools.SendTCPCmd(itID, strMsg + ";" + iRet.ToString());
                                LightControl(LIGHT.Green);
                            }
                            if (iRet == (int)cBase.ERRMSGRET.NO || iRet == (int)cBase.ERRMSGRET.CANCEL)
                            {
                                SysStop(strMsg + " NO/Cancel");
                                cBase.bStopFlag = true;
                                cBase.bInited = false;
                                cBase.bIsRunning = false;
                                cBase.UpdateMsg(itID, (int)cBase.GuiItem.ControlBtn, cBase.GUISTATUS.Unitinalization);
                                cBase.UpdateMsg(itID, (int)cBase.GuiItem.Grid, strMsg);
                            }
                            Tools.RemoveTCPMsg(itID, iMsgNo, strMsg);
                            break;
                        default:
                            Tools.RemoveTCPMsg(itID, iMsgNo, strMsg);
                            Tools.AddTCPMsg(itID, iMsgNo, strMsg);
                            break;
                    }
                }
            }
            cRun.iThd_ErrAct1--;
            Tools.ClearAllCmd(); ClearAllCmd();
            cBase.bStopFlag = true;
            cBase.SaveLog("Monitor", "Thread Thd_ErrAct1 Finished.");
        }
        private void ErrAct2()
        {
            cRun.iThd_ErrAct2++;
            if (cRun.iThd_ErrAct2 > 1)
            {
                cBase.ShowNormalMessage((int)cBase.MsgType.EXCEPTION, "同一线程 ErrAct2 多次开启,请关闭程序重新启动!");
                cBase.bInited = false;
                cBase.bIsRunning = false;
                cBase.UpdateMsg(0, (int)cBase.GuiItem.ControlBtn, cBase.GUISTATUS.Unitinalization);
                cBase.bStopFlag = true;
                return;
            }

            int itID = (int)cBase.RBT.FIVE;
            int iMsgNo = 1;
            cBase.SaveLog("Monitor", "Thread Thd_ErrAct2 Started.");
            while (!cBase.bStopFlag)
            {
                Thread.Sleep(10);
                Application.DoEvents();
                if (Tools.ExistReceiveTCPMsg(itID, iMsgNo))
                {
                    string strMsg = Tools.GetFirstTCPMsg(itID, iMsgNo);
                    string[] strArr = strMsg.Split(';');
                    int iRet = 0;
                    switch (strArr[0].ToUpper())
                    {
                        case "RBTERR":
                            cBase.UpdateMsg(itID, (int)cBase.GuiItem.Grid, strMsg);
                            cBase.SaveLog("Error", strMsg);
                            Tools.RemoveTCPMsg(itID, iMsgNo, strMsg);
                            break;
                        case "ERRACT":
                            cBase.UpdateMsg(itID, (int)cBase.GuiItem.Grid, strMsg);
                            cBase.SaveLog("Error", strMsg);
                            cBase.bSysIsWarning = true;
                            if (strArr[2] == "1")
                            {
                                LightControl(LIGHT.Red);
                            }
                            else
                            {
                                LightControl(LIGHT.YellowVoice);
                            }
                            cBase.UpdateMsg(itID, (int)cBase.GuiItem.Grid, strMsg);
                            iRet = cBase.ShowMessage(itID, int.Parse(strArr[3]), (int)cBase.MsgType.OKCANCEL);
                            cBase.bSysIsWarning = false;
                            if (strArr[2] == "1")
                            {
                                SysStop(strMsg + " 1-Stop");
                                cBase.bStopFlag = true;
                                cBase.bInited = false;
                                cBase.bIsRunning = false;
                                cBase.UpdateMsg(itID, (int)cBase.GuiItem.ControlBtn, cBase.GUISTATUS.Unitinalization);
                                cBase.UpdateMsg(itID, (int)cBase.GuiItem.Grid, strMsg);
                            }
                            else
                            {
                                Tools.SendTCPCmd(itID, strMsg + ";" + iRet.ToString());
                                LightControl(LIGHT.Green);
                            }
                            if (iRet == (int)cBase.ERRMSGRET.NO || iRet == (int)cBase.ERRMSGRET.CANCEL)
                            {
                                SysStop(strMsg + " NO/Cancel");
                                cBase.bStopFlag = true;
                                cBase.bInited = false;
                                cBase.bIsRunning = false;
                                cBase.UpdateMsg(itID, (int)cBase.GuiItem.ControlBtn, cBase.GUISTATUS.Unitinalization);
                                cBase.UpdateMsg(itID, (int)cBase.GuiItem.Grid, strMsg);
                            }
                            Tools.RemoveTCPMsg(itID, iMsgNo, strMsg);
                            break;
                        default:
                            Tools.RemoveTCPMsg(itID, iMsgNo, strMsg);
                            Tools.AddTCPMsg(itID, iMsgNo, strMsg);
                            break;
                    }
                }
            }
            cRun.iThd_ErrAct2--;
            Tools.ClearAllCmd(); ClearAllCmd();
            cBase.bStopFlag = true;
            cBase.SaveLog("Monitor", "Thread Thd_ErrAct2 Finished.");
        }
        private void ClearAllCmd()
        {
            for (int i = 0; i < ArrCmd.Length; i++)
            {
                ArrCmd[i].Clear();
            }
        }
        private void LightControl(LIGHT light)
        {
            cBase.cAct[(int)cBase.RBT.FIVE].LightControl((int)light);
        }
    }
}
