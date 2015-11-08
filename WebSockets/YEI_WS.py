'''
'''
import json, traceback
import PWSServer as WS
import YEIWatcher as YW

WS.ECHO_TO_ALL_SOCKETS = True
WS.ECHO_TO_SOCKET = False
WS.USE_SSL = False
WS.USE_INFO_SERVER = True
WS.INFO_SERVER_PORT = 8130
WS.WS_PORT = 8100
WS.PORT = WS.WS_PORT

def sendAngles_(server, angles):
    msg = {'msgType': 'YEI', 'angles': angles}
    server.sendMessageToAllClients(msg)

def sendAngles(server, angles):
    try:
        sendAngles_(server, angles)
    except:
        traceback.print_exc()

if __name__ == "__main__":
#   server = WS.getServer()
   server = WS.runInThread()
   YW.watchAngles(lambda angles,s=server: sendAngles(s,angles))
