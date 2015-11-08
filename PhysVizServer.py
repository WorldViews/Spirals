"""
This is basically a simple HTTP server that can handle a few
upload requests from PhysViz apps.  Particularly, saving bookmarks.
"""
import SimpleHTTPServer
import SocketServer
import shutil
import json

PORT = 8001

bases = {"images", "C:"}
class MyHandler(SimpleHTTPServer.SimpleHTTPRequestHandler):
    def do_POST(self):
        print "POST path:", self.path
        if self.path.startswith("/update/"):
            return self.handleUpdate()
        SimpleHTTPServer.SimpleHTTPRequestHandler.do_POST(self)

    def handleUpdate(self):
        print "POST headers:", self.headers
        content_len = int(self.headers.getheader('content-length', 0))
        body = self.rfile.read(content_len)
        obj = json.loads(body)
        print obj
        path = "Kinetics/bookmarks.json"
        shutil.copyfile(path, path+".bak")
        json.dump(obj, file(path, "w"), indent=3)

httpd = SocketServer.TCPServer(("", PORT), MyHandler)

def run():
    print "serving HTTP at port", PORT
    httpd.serve_forever()

if __name__ == '__main__':
    run()
