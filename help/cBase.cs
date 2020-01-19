using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.Xml.Serialization;
using System.Collections;
using Framework.Infrastructure.Serialization;
using System.Threading;
using System.IO;
using PLCLib;
using Cognex.VisionPro;
using Cognex.VisionPro.ImageFile;
using Cognex.VisionPro.ToolBlock;
using System.Runtime.InteropServices;

namespace QKMGui
{
    public class cBase
    {
        #region DllImport Win32
        [DllImport("kernel32")]
        public static extern uint GetPrivateProfileString(string lpApplicationName, string lpKeyName, string lpDefault, StringBuilder lpReturnedString, int nSize, string lpFileName);
        [DllImport("kernel32")]
        public static extern bool WritePrivateProfileString(string lpApplicationName, string lpKeyName, string lpString, string lpFileName);
        #endregion

        private const int iCliCnt = 2;
        public enum MsgType
        {
            OK,
            OKCANCEL,
            YESNO,
            EXCEPTION,
        }
        public enum ERRMSGRET
        {
            OK = 1,
            CANCEL = 2,
            YES = 3,
            NO = 4,
        }
        public enum GuiItem
        {
            Grid,
            ControlBtn,
            ShowImage,
            ShowRunImage,
        }
        public enum GUISTATUS
        {
            Unitinalization,
            Initializing,
            Initialized,
            Running,
            Paused,
        }
        public enum Vis
        {
            LSix=0,
            LFiv=1,
            BSix=2,
            BFiv=3,
            Cali=4,
        }
        public enum Cam
        {
            Top = 0,
            SixBot = 1,
            FiveBot = 2,
        }
        public enum RBT
        {
            SIX=0,
            FIVE=1,
        }
        public enum LOCPARA
        {
            LINE_WAIT,
        }
        public static bool bDebug = false;

        public static bool bInited = false;
        public static bool bIsRunning =false;
        public static bool bPaused = false;
        public static bool bStopFlag= false;
        public static bool bNormalStop = false;
        public static bool[] bNormalStopFinish = new bool[2];

        public static bool[] bFiveFirstPut = new bool[2];
        public static bool[] bSixFirstPut = new bool[2];
        public static int iLineWaitTime = 0;
        public static int iDJStartTimeOut = 20*1000;
        public static DateTime t_Six_Front = DateTime.Now;
        public static DateTime t_Six_Back = DateTime.Now;
        public static DateTime t_Five_Front = DateTime.Now;
        public static DateTime t_Five_Back = DateTime.Now;
        public static bool b_Six_Front_Start = false;
        public static bool b_Six_Back_Start = false;
        public static bool b_Five_Front_Start = false;
        public static bool b_Five_Back_Start = false;


        public static int iGrabTimes = 3;
        public static bool bSysIsWarning = false;


        public delegate void dUpdateMsg(int itID,int type, object obj);
        public static dUpdateMsg UpdateMsg = null;

        public delegate void dShowDebugImage(int itID, int type, object obj);
        public static dShowDebugImage ShowDebugImg = null;

        public static cMotion[] cAct = new cMotion[iCliCnt];
        public static cRun[] cPrd = new cRun[iCliCnt];
        public static PLC cPlc = new PLC("127.0.0.1", 2323, 3);
        public static cVision cVis = new cVision();

        public static DIOItem[] cDIO = new DIOItem[iCliCnt];
        public static ParaItem[] cPara = new ParaItem[iCliCnt];
        public static ErrMsgItem[] cErrMsg = new ErrMsgItem[iCliCnt];
        public static PointItem[] cPoint = new PointItem[iCliCnt];
        public static ProfileItem[] cProfile = new ProfileItem[iCliCnt];
        public static RegItem cReg = new RegItem();

        //For vision only
        public static CogToolBlock[] m_blk = new CogToolBlock[5];
        public static CogAcqFifoTool[] m_acq=new CogAcqFifoTool[3];
        public static CogImageFile m_image;

        public static string VisConfigFile = Application.StartupPath + "\\VisConfig.ini";

        public static string[] m_acqFile =new string[3];
        public static string[] m_blkFile = new string[5];

        public static List<string> lstDIOFile = new List<string>();
        public static List<string> lstParaFile = new List<string>();
        public static List<string> lstErrMsgFile = new List<string>();
        public static List<string> lstPointFile = new List<string>();
        public static List<string> lstProfileFile = new List<string>();
        public static List<string> lstPlcRegFile = new List<string>();

        public static bool IsRbtCmd(string strCmd)
        {
            bool bFlag = true;

            if (strCmd.Trim().ToUpper().Equals(cBase.LOCPARA.LINE_WAIT.ToString()))
                bFlag = false;

            return bFlag;
        }

        public static bool RedConfigFile()
        {
            int i = 0;
            for (i=0;i<iCliCnt;i++)
            {
                cAct[i] = new cMotion(i);
                cPrd[i] = new cRun(i);
            }                        

            try
            {
                #region initialize parameter file name 
                lstDIOFile.Add(Application.StartupPath + "\\Config\\DIO1.xml");
                lstDIOFile.Add(Application.StartupPath + "\\Config\\DIO2.xml");

                lstParaFile.Add(Application.StartupPath + "\\Config\\Para1.xml");
                lstParaFile.Add(Application.StartupPath + "\\Config\\Para2.xml");

                lstErrMsgFile.Add(Application.StartupPath + "\\Config\\ErrMsg1.xml");
                lstErrMsgFile.Add(Application.StartupPath + "\\Config\\ErrMsg2.xml");

                //lstPointFile.Add(Application.StartupPath + "\\Config\\Point1.xml");
                //lstPointFile.Add(Application.StartupPath + "\\Config\\Point2.xml");

               // lstProfileFile.Add(Application.StartupPath + "\\Config\\Profile1.xml");
                //lstProfileFile.Add(Application.StartupPath + "\\Config\\Profile2.xml");

                //lstPlcRegFile.Add(Application.StartupPath + "\\Config\\PlcConfig.xml");
                #endregion

                //CreateIniParaFile();
                #region Read IO config
                for (i = 0; i < iCliCnt; i++)
                {
                    if (System.IO.File.Exists(lstDIOFile[i]))
                    {
                        cDIO[i] = XmlSerialization.DeserializeObjectFromFile<DIOItem>(lstDIOFile[i]);
                        if (cDIO[i] == null)
                        {
                            cBase.ShowNormalMessage((int)cBase.MsgType.EXCEPTION, "读取文件失败：\r\n"+ lstDIOFile[i]);
                            return false;
                        }
                    }
                }
                #endregion
                #region Read Para config
                for (i = 0; i < iCliCnt; i++)
                {
                    if (System.IO.File.Exists(lstParaFile[i]))
                    {
                        cPara[i] = XmlSerialization.DeserializeObjectFromFile<ParaItem>(lstParaFile[i]);
                        if (cPara[i] == null)
                        {
                            cBase.ShowNormalMessage((int)cBase.MsgType.EXCEPTION, "读取文件失败：\r\n" + lstParaFile[i]);
                            return false;
                        }
                        for(int k=0;k<cBase.cPara[i].ParaSet.Count();k++)
                        {
                            if(cBase.cPara[i].ParaSet[k].Name.Trim().ToUpper().Equals(cBase.LOCPARA.LINE_WAIT.ToString()))
                            {
                                cBase.iLineWaitTime = int.Parse(cBase.cPara[i].ParaSet[k].Value);
                                break;
                            }
                        }
                    }
                }
                #endregion
                #region Read ErrMsg config
                for (i = 0; i < iCliCnt; i++)
                {
                    if (System.IO.File.Exists(lstErrMsgFile[i]))
                    {
                        cErrMsg[i] = XmlSerialization.DeserializeObjectFromFile<ErrMsgItem>(lstErrMsgFile[i]);
                        if (cErrMsg[i] == null)
                        {
                            cBase.ShowNormalMessage((int)cBase.MsgType.EXCEPTION, "读取文件失败：\r\n" + lstErrMsgFile[i]);
                            return false;
                        }
                    }
                }
                #endregion

                #region Read Point config
                //for (i = 0; i < iCliCnt; i++)
                //{
                //    if (System.IO.File.Exists(lstPointFile[i]))
                //    {
                //        cPoint[i] = XmlSerialization.DeserializeObjectFromFile<PointItem>(lstPointFile[i]);
                //        if (cPoint[i] == null)
                //        {
                //            cBase.ShowNormalMessage((int)cBase.MsgType.EXCEPTION, "读取文件失败：\r\n" + lstPointFile[i]);
                //            return false;
                //        }
                //    }
                //}
                //for (i = 0; i < iCliCnt; i++)
                //{
                //    if (System.IO.File.Exists(lstProfileFile[i]))
                //    {
                //        cProfile[i] = XmlSerialization.DeserializeObjectFromFile<ProfileItem>(lstProfileFile[i]);
                //        if (cProfile[i] == null)
                //        {
                //            cBase.ShowNormalMessage((int)cBase.MsgType.EXCEPTION, "读取文件失败：\r\n" + lstProfileFile[i]);
                //            return false;
                //        }
                //    }
                //}
                #endregion

                #region Red PLC file
                //if (System.IO.File.Exists(lstPlcRegFile[0]))
                //{
                //    cReg = XmlSerialization.DeserializeObjectFromFile<RegItem>(lstPlcRegFile[0]);
                //    if (cReg == null)
                //    {
                //        cBase.ShowNormalMessage((int)cBase.MsgType.EXCEPTION, "读取文件失败：\r\n" + lstPlcRegFile[0]);
                //        return false;
                //    }
                //}
                #endregion
            }
            catch (Exception ex)
            {
                cBase.ShowNormalMessage((int)cBase.MsgType.EXCEPTION, "RedConfigFile-:"+ex.Message.ToString());
            }
            return true;
        }
        public static bool SaveParaFile(int tID)
        {
            if (!XmlSerialization.SerializeObjectToFile(cPara[tID], lstParaFile[tID]))
            {
                cBase.ShowNormalMessage((int)cBase.MsgType.EXCEPTION, "保存文件失败：" + lstParaFile[tID]);
                return false;
            }
            return true;
        }
        public static bool IsNumeric(string strDesc, string strValue)
        {
            bool flag;
            int dotcnt = 0;
            int dotpos = -1;
            int lastpos = -1;

            if (strValue.Trim().Equals(string.Empty))
            {
                cBase.ShowNormalMessage((int)cBase.MsgType.EXCEPTION, strDesc + " 为空!");
                return false;
            }

            System.Text.RegularExpressions.Regex NumberPattern = new System.Text.RegularExpressions.Regex("[^0-9.-]");
            flag = !NumberPattern.IsMatch(strValue);


            for (int i = 0; i < strValue.Length; i++)
            {
                dotpos = strValue.IndexOf(".", lastpos + 1);
                if (dotpos >= 0)
                {
                    lastpos = dotpos;
                    dotcnt++;
                }
                else
                    break;
            }
            if (dotcnt > 1)
                flag = false;

            if (!flag)
            {
                cBase.ShowNormalMessage((int)cBase.MsgType.EXCEPTION, strDesc + " 不是数字!");
                return false;
            }
            return flag;
        }
        public static int GetRobotCnt()
        {
            return iCliCnt;
        }
        public static int ShowMessage(int itID, int iCode, int iType)
        {
            string strMsg = string.Empty;
            int iret1;
            int iret2;

            while (true)
            {
                strMsg = iCode.ToString() + ":" + GetWaringMsg(itID, iCode);
                cBase.UpdateMsg(0, (int)cBase.GuiItem.Grid, strMsg);
                Form frm = new FrmWarning(iType, strMsg);
                frm.ShowDialog();
                iret1 = FrmWarning.MsgResult;

                if (iret1 == (int)ERRMSGRET.CANCEL || iret1 == (int)ERRMSGRET.NO)
                {
                    ShowNormalMessage((int)MsgType.YESNO, "确信退出吗？");
                    iret2 = FrmWarning.MsgResult;
                    if (iret2 == (int)ERRMSGRET.YES)
                        return iret1;
                }
                else
                {
                    return iret1;
                }
            }
        }
        public static int ShowNormalMessage(int itype, string strMsg)
        {
            Form frm = new FrmWarning(itype, strMsg);
            frm.ShowDialog();
            return FrmWarning.MsgResult;
        }
        private static string GetWaringMsg(int itID, int iCode)
        {
            try
            {
                for (int i = 0; i < cBase.cErrMsg[itID].ErrCode.Count(); i++)
                {
                    if (iCode == cBase.cErrMsg[itID].ErrCode[i].Code)
                    {
                        return cBase.cErrMsg[itID].ErrCode[i].Msg;
                    }
                }
            }
            catch (Exception ex)
            {
                return string.Empty;
            }
            return string.Empty;
        }


        private static AutoResetEvent SaveLogEvent = new AutoResetEvent(true);
        private static string strDisk = "D";
        public static bool SaveLog(string titleStr, string msg)
        {
            SaveLogEvent.WaitOne();

            string strLogFile = "";
            string strmsg;

            //titleStr="DebugTiming";

            if (!System.IO.Directory.Exists(strDisk + ":\\DATA"))
                Directory.CreateDirectory(strDisk + ":\\DATA");
            if (!System.IO.Directory.Exists(strDisk + ":\\DATA\\QKMGui"))
                Directory.CreateDirectory(strDisk + ":\\DATA\\QKMGui");

            if (!System.IO.Directory.Exists(strDisk + ":\\DATA\\QKMGui\\Log"))
                Directory.CreateDirectory(strDisk + ":\\DATA\\QKMGui\\Log");

            if (!System.IO.Directory.Exists(strDisk + ":\\DATA\\QKMGui\\Log\\" + DateTime.Now.ToString(DateTime.Now.ToString("yyyyMMdd"))))
            {
                Directory.CreateDirectory(strDisk + ":\\DATA\\QKMGui\\Log\\" + DateTime.Now.ToString(DateTime.Now.ToString("yyyyMMdd")));
            }
            strLogFile = strDisk + ":\\DATA\\QKMGui\\Log\\" + DateTime.Now.ToString(DateTime.Now.ToString("yyyyMMdd"));

            try
            {
                strLogFile = strLogFile + "\\" + titleStr + "_" + DateTime.Now.ToString("yyyyMMdd") + "-" + DateTime.Now.Hour.ToString("00") + ".log";
                StreamWriter sw = new StreamWriter(strLogFile, true, System.Text.Encoding.Unicode);
                strmsg = DateTime.Now.ToString("yyyy/MM/dd HH:mm:ss:fff") + ",";
                msg = strmsg + " " + msg;

                sw.WriteLine(msg);
                sw.Close();

                SaveLogEvent.Set();

                return true;
            }
            catch (Exception ex)
            {
                SaveLogEvent.Set();
                return false;
            }
        }
        public static string GetSetting(string AppName, string KeyName, string DefValue, string strFile)
        {
            StringBuilder sb = new StringBuilder("", 1024);
            if (GetPrivateProfileString(AppName, KeyName, DefValue, sb, 1024, strFile) >= 0)
                return sb.ToString();
            return DefValue;
        }
        public static bool SaveSetting(string AppName, string KeyName, string strValue, string strFile)
        {
            if (!WritePrivateProfileString(AppName, KeyName, strValue, strFile)) return false;
            return true;
        }
        public static long TimeDifferent(DateTime startTime)
        {
            DateTime t = DateTime.Now;
            TimeSpan t2 = t.Subtract(startTime);
            return (long)(t2.TotalMilliseconds + 0.5);
        }
        private static void CreateIniParaFile()
        {
            #region create config file
            //DIO
            DIOItem a1 = new DIOItem();
            a1.DI = new DINum[1];
            a1.DI[0] = new DINum();
            a1.DI[0].No = 10001;
            a1.DI[0].Name = "1#吸嘴真空已开";

            a1.DO = new DONum[1];
            a1.DO[0] = new DONum();
            a1.DO[0].No = 10002;
            a1.DO[0].Name = "1#吸嘴开真空";
            XmlSerialization.SerializeObjectToFile(a1, lstDIOFile[0]);

            //Para
            ParaItem a2 = new ParaItem();
            a2.ParaSet = new Para[2];
            a2.ParaSet[0] = new Para();
            a2.ParaSet[0].Name = "PickOffset";
            a2.ParaSet[0].Desc = "1#吸嘴取料偏差";
            a2.ParaSet[0].Option = false;
            a2.ParaSet[0].Select = "";
            a2.ParaSet[0].Value = "0.5";
            a2.ParaSet[0].MinValue = "-0.5";
            a2.ParaSet[0].MaxValue = "0.5";

            a2.ParaSet[1].Name = "VisionName";
            a2.ParaSet[1].Desc = "顶部相机图像场景";
            a2.ParaSet[1].Option = true;
            a2.ParaSet[1].Select = "Prd1,Prd2,Prd3";
            a2.ParaSet[1].Value = "Prd1";
            a2.ParaSet[1].MinValue = "";
            a2.ParaSet[1].MaxValue = "";
            XmlSerialization.SerializeObjectToFile(a2, lstParaFile[0]);

            //ErrMsg
            ErrMsgItem a3 = new ErrMsgItem();
            a3.ErrCode = new ErrMsg[1];
            a3.ErrCode[0] = new ErrMsg();
            a3.ErrCode[0].Code = 2000;
            a3.ErrCode[0].Msg = "1#吸嘴真空检测超时";
            XmlSerialization.SerializeObjectToFile(a3, lstErrMsgFile[0]);


            //Point
            PointItem a4 = new PointItem();
            a4.Location = new Point[1];
            a4.Location[0] = new Point();
            a4.Location[0].Name = "SafePoint";
            a4.Location[0].X = 1;
            a4.Location[0].Y = 2;
            a4.Location[0].Z = 2;
            a4.Location[0].Yaw = 2;
            a4.Location[0].Pitch = 2;
            a4.Location[0].Roll = 2;
            a4.Location[0].Config = 2;
            XmlSerialization.SerializeObjectToFile(a4, lstPointFile[0]);

            //Profile
            ProfileItem a5 = new ProfileItem();
            a5.MoveProfile = new Profile[1];
            a5.MoveProfile[0] = new Profile();
            a5.MoveProfile[0].Name = "QuickProfile";
            a5.MoveProfile[0].Acc = 1;
            a5.MoveProfile[0].AccR = 2;
            a5.MoveProfile[0].Dec = 2;
            a5.MoveProfile[0].DecR = 2;
            a5.MoveProfile[0].Speed = 2;
            a5.MoveProfile[0].Speed2 = 2;
            a5.MoveProfile[0].InRange = 2;
            a5.MoveProfile[0].Straight = false;
            XmlSerialization.SerializeObjectToFile(a5, lstProfileFile[0]);


            //PLC
            RegItem a6 = new RegItem();
            a6.PLCReg = new RegNum[1];
            a6.PLCReg[0] = new RegNum();
            a6.PLCReg[0].No = "M1";
            a6.PLCReg[0].Name = "PLC 可以取料";
            XmlSerialization.SerializeObjectToFile(a6, lstPlcRegFile[0]);
            #endregion
        }
    }
}
