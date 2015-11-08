
import sys
sys.path.append("..")

import websocket
import json

if __name__ == "__main__":
    websocket.enableTrace(True)
    ws = websocket.create_connection("ws://localhost:8100/")
    print("Sending 'Hello, World'...")
    ws.send("Hello, World")
    print("Sent")
    print("Receiving...")
    msg = {'msgType': 'test.websockt', 'text': 'Hello World'}
    jstr = json.dumps(msg)
    ws.send(jstr)
    result = ws.recv()
    print("Received '%s'" % result)
    ws.close()
