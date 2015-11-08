'''
'''
import json
import threading


USE_SSL = False

PORT=8000

SERVER = None

from pwebsocket_server import WebsocketServer

class WSServer(WebsocketServer):
    def sendMessageToAllClients(self, msg):
        msgBuf = json.dumps(msg)
        self.send_message_to_all(msgBuf)

    def serveforever(self):
        self.run_forever()


# Called for every client connecting (after handshake)
def new_client(client, server):
	print("New client connected and was given id %d" % client['id'])
	server.send_message_to_all("Hey all, a new client has joined us")


# Called for every client disconnecting
def client_left(client, server):
	print("Client(%d) disconnected" % client['id'])


# Called when a client sends a message
def message_received(client, server, message):
	if len(message) > 200:
		message = message[:200]+'..'
	print("Client(%d) said: %s" % (client['id'], message))
        server.send_message_to_all(message)

#def send_msg_to_all(msg):
#    msgBuf = json.dumps(msg)
#    server.send_message_to_all(msgBuf)

def getServer():
#    server = WebsocketServer(PORT)
    server = WSServer(PORT)
    server.set_fn_new_client(new_client)
    server.set_fn_client_left(client_left)
    server.set_fn_message_received(message_received)
    return server

def runServer(server=None):
    if server == None:
        server = getServer()
    server.run_forever()

def runInThread():
    print "*** runServer started in thread"
    server = getServer()
    thread = threading.Thread(target=runServer,args=(server,))
    thread.setDaemon(1)
    thread.start()
    return server
