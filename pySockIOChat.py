
import json
from socketIO_client import SocketIO

def on_chat_response(*args):
    print "chat:", args

sio = SocketIO("localhost", 80)
msg = {'name': 'anon_chat_watcher',
       'type': 'chat',
       'text': '[watching]'}
msgStr = json.dumps(msg)
sio.on('chat', on_chat_response)
sio.emit('chat', msgStr)
print "Waiting..."
sio.wait()

