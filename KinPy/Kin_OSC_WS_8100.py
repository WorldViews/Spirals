'''
'''
import KinOSCWatcher
#import WSServer as WS
import PWSServer as WS

WS.ECHO_TO_ALL_SOCKETS = True
WS.ECHO_TO_SOCKET = False
WS.USE_SSL = False
WS.USE_INFO_SERVER = True
WS.INFO_SERVER_PORT = 8130
WS.WS_PORT = 8100
WS.PORT = WS.WS_PORT
#SSL_PORT = 8000


def handleMsg(s, msg):
    #print msg
    s.sendMessageToAllClients(msg)

if __name__ == "__main__":
   server = WS.getServer()
   KinOSCWatcher.startOSC(
       kinSkelHandler=lambda msg,s=server: handleMsg(s, msg),
       kinJointHandler=lambda msg, s=server: handleMsg(s, msg))
   server.serveforever()
