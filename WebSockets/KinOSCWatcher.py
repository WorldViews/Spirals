
import os, socket, time
import threading
#import MessageBoard
import traceback
import OSC

OSC_SERVER = None

ALL_JOINTS = {
   'HandRight': 'RIGHT_HAND',
   'HandLeft': 'LEFT_HAND',
   'WristRight': 'RIGHT_WRIST',
   'WristLeft': 'LEFT_WRIST',
   'ElbowRight': 'RIGHT_ELBOW',
   'ElbowLeft': 'LEFT_ELBOW',
   'ShoulderRight': 'RIGHT_SHOULDER',
   'ShoulderLeft': 'LEFT_SHOULDER',
   'Neck': 'NECK',
   'Head': 'HEAD',
   'SpineMid': 'MID_SPINE',
   'SpineBase': 'BASE_SPINE',
   'HipRight': 'RIGHT_HIP',
   'HipLeft': 'LEFT_HIP',
   'KneeRight': 'RIGHT_KNEE',
   'KneeLeft': 'LEFT_KNEE',
   'AnkleRight': 'RIGHT_ANKLE',
   'AnkleLeft': 'LEFT_ANKLE',
   'FootRight': 'RIGHT_FOOT',
   'FootLeft': 'LEFT_FOOT'
}

JOINTS = {
     'HandRight': 'RIGHT_HAND',
     'HandLeft': 'LEFT_HAND',
     'ElbowRight': 'RIGHT_ELBOW',
     'ElbowLeft': 'LEFT_ELBOW',
     'Head': 'HEAD'
  }
KINECT_CONTROL = None

"""
This is a simple class for holding the message associate
with a body, and some other information such as body num
or timing.
"""
class Body:
    numBodies = 0
    bodyById = {}

    @staticmethod
    def getBody(bodyId):
        if bodyId in Body.bodyById:
            return Body.bodyById[bodyId]
#        MyOSCHandler.numPeople += 1
#        personNum = MyOSCHandler.numPeople
        body = Body(bodyId)
        Body.bodyById[bodyId] = body
        return body

    def __init__(self, id):
        Body.numBodies += 1
        self.bodyId = id
        self.personNum = Body.numBodies
        self.msg = None

    def setJoint(self, joint, xyz, trackState):
        """
        This gets called with a joint position and acculumates
        the joint information in a message.   When this gets called
        with a joint that is already in the message, it is assumed
        the message is "complete" (i.e. has a complete set of
        the joints being watched) and a single message is sent
        with all those joints.
        """
        global OSC_SERVER
        #print "buildMessage", bodyId, joint, xyz
        if JOINTS != None:
            jname = JOINTS[joint]
        else:
            jname = joint
        msg = self.msg
        if msg != None and jname in msg:
            #print "sending message!!!!", msg
            if OSC_SERVER.kinSkelHandler:
                OSC_SERVER.kinSkelHandler(msg)
            msg = None
        if msg == None:
            msg = {'msgType':'kinect.skeleton.pose',
                   'personNum': self.personNum}
        msg[jname] = xyz
        c = .2
        if trackState == 'Tracked':
            c = 1.0
        msg["%s_c" % jname] = c
        self.msg = msg



class MyOSCHandler(OSC.OSCRequestHandler):
    def dispatchMessage(self, pattern, tags, data):
        parts = pattern.split("/")
        if len(parts) != 5:
            print "Unexpected number of parts"
            return []
        bodyId = parts[2]
        if parts[3] == "hands":
           if tags != "ss":
              print "Unexpected format", tags
              print "pattern:", pattern
           return []
        elif parts[3] == "joints":
           joint = parts[4]
           if tags != "fffs":
              print "Unexpected format", tags
              print "pattern:", pattern
              return []
           if JOINTS and joint not in JOINTS:
              return []
           #print "data: %s\n" % (data,)
           x,y,z,trackState = data
           pos = 1000.0*x, 1000.0*y, 1000.0*z
           body = Body.getBody(bodyId)
           body.setJoint(joint, pos, trackState)
        else:
           print "Unexpected pattern", pattern
           return []
        if self.server.kinJointHandler:
          body = Body.getBody(bodyId)
          msg = {'msgType': 'joint', 'personNum': body.personNum, 'joint': joint,
                 'bodyId': bodyId, 'pos': [x,y,z]}
          self.server.kinJointHandler(msg)
#        if SERVER:
#           SERVER.sendMessageToAllClients(msg)
        return []


#class MyOSCServer(OSC.ThreadingOSCServer):
class MyOSCServer(OSC.OSCServer):
    RequestHandlerClass = MyOSCHandler

def bodyMsgHandler(msg):
    print msg

OSC_HOST_ADDR = None
OSC_PORT = 12345

def getOSC_ADDR():
    global OSC_HOST_ADDR
    if not OSC_HOST_ADDR:
        host = socket.gethostname()
        OSC_HOST_ADDR = socket.gethostbyname(host)
    """
    path = "%s.OSC_PARAMS.json"
    if os.path.exists(path):
        try:
            params = json.load(file(path))
            return tuple(params['OSC_ADDR'])
        except:
            traceback.print_exc()
    return OSC_ADDR
    """
    return OSC_HOST_ADDR, OSC_PORT

def startOSC(kinSkelHandler=None, kinJointHandler=None):
    global OSC_SERVER
    addr = getOSC_ADDR()
    print "Using addr:", addr
    s = MyOSCServer(addr)
    OSC_SERVER = s
    s.kinSkelHandler = kinSkelHandler
    s.kinJointHandler = kinJointHandler
    #s.app = app
    s.addMsgHandler("/bodies", bodyMsgHandler)
    t = threading.Thread(target=s.serve_forever)
    t.start()
    #t.setDaemon(True)
    #s.serve_forever()

def kinSkelHandler(msg):
     if 0:
         print msg

def kinJointHandler(msg):
    if 0:
        print msg

def run(setupServer=True):
     startOSC(kinSkelHandler, kinJointHandler)
     while 1:
          time.sleep(1)


if __name__ == '__main__':
     run()

