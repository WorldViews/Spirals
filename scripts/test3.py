from socketIO_client import SocketIO

def on_chat_response(*args):
    print 'on_chat_response', args

print "Getting sio"
socketIO = SocketIO('localhost', 80)
print "Got sio", socketIO
socketIO.on('chat', on_chat_response)
socketIO.emit('chat', "hello")
socketIO.wait(seconds=3)
