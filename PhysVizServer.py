"""
This is basically a simple HTTP server that can handle a few
upload requests from PhysViz apps.  Particularly, saving bookmarks.
"""
import SimpleHTTPServer
import SocketServer
import shutil
import json
import sys, time
sys.path.append("scripts")
import ImageTweets
ImageTweets.IMAGE_DIR = "images/twitter_images"

PORT = 8001

class MyHandler(SimpleHTTPServer.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith("/imageTweets"):
            return self.handleGetImageTweets()
        SimpleHTTPServer.SimpleHTTPRequestHandler.do_GET(self)

    def do_POST(self):
        print "POST path:", self.path
        if self.path.startswith("/update/"):
            return self.handleUpdate()
        SimpleHTTPServer.SimpleHTTPRequestHandler.do_POST(self)

    def handleGetImageTweets(self):
        it = ImageTweets.ImageTweets()
        images = it.get()
        obj = {'images': images}
        jObj = json.dumps(obj, sort_keys=True, indent=4)
        #print jObj
        self.send_data(jObj, "application/json")

    def send_data(self, str, ctype):
        self.send_response(200)
        self.send_header("Content-type", ctype)
        self.send_header("Content-Length", len(str))
        self.end_headers()
        self.wfile.write(str)
        
    def handleUpdate(self):
        print "POST headers:", self.headers
        content_len = int(self.headers.getheader('content-length', 0))
        body = self.rfile.read(content_len)
        obj = json.loads(body)
        print obj
        path = self.path[len("/update/"):]
        print "path", path
        try:
            shutil.copyfile(path, path+".bak")
        except:
            pass
        json.dump(obj, file(path, "w"), indent=3)



def run(port=PORT):
    print "PhysVizServer HTTP on port", port
    time.sleep(0.5)
    httpd = SocketServer.TCPServer(("", port), MyHandler)
    httpd.serve_forever()

if __name__ == '__main__':
    run()
