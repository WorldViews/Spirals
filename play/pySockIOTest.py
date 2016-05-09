
from socketIO_client import SocketIO, BaseNamespace

class ChatNamespace(BaseNamespace):
    def on_chat_response(self, *args):
        print 'on_chat_response', args


sio = SocketIO("localhost", 80)
chat_namespace = sio.define(ChatNamespace, 'chat')

sio.wait()
