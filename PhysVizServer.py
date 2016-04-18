"""
This is basically a simple HTTP server that can handle a few
upload requests from PhysViz apps.  Particularly, saving bookmarks.
"""
import SimpleHTTPServer
import SocketServer
import urlparse
import shutil
import json
import sys, time
sys.path.append("scripts")
import ImageTweets
ImageTweets.IMAGE_DIR = "images/twitter_images"

PORT = 8001

def getQuery(path):
    i = path.rfind("?")
    if i < 0:
        return {}
    return urlparse.parse_qs(path[i+1:])

class MyHandler(SimpleHTTPServer.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith("/getData"):
            return self.handleGetData()
        if self.path.startswith("/imageTweets"):
            return self.handleGetImageTweets()
        SimpleHTTPServer.SimpleHTTPRequestHandler.do_GET(self)

    def do_POST(self):
        print "POST path:", self.path
        if self.path.startswith("/update/"):
            return self.handleUpdate()
        SimpleHTTPServer.SimpleHTTPRequestHandler.do_POST(self)

    def end_headers(self):
        #print "sending CORS header"
        self.send_header("Access-Control-Allow-Origin", "*")
        SimpleHTTPServer.SimpleHTTPRequestHandler.end_headers(self)

    def send_data(self, str, ctype):
        self.send_response(200)
        #self.send_header("Access-Control-Allow-Origin", "*")
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

    def handleGetImageTweets(self):
        print "path:", self.path
        q = getQuery(self.path)
        print "q:", q
        it = ImageTweets.ImageTweets()
        prevEndNum = None
        if 'prevEndNum' in q:
            prevEndNum = int(q['prevEndNum'][0])
        maxNum = None
        if 'maxNum' in q:
            maxNum = int(q['maxNum'][0])
        images = it.get(maxNum=maxNum, prevEndNum=prevEndNum)
        obj = {'images': images}
        jObj = json.dumps(obj, sort_keys=True, indent=4)
        #print jObj
        self.send_data(jObj, "application/json")

    def getData(self):
        return self.handleGetImageTweets()


def run(port=PORT):
    print "PhysVizServer HTTP on port", port
    time.sleep(0.5)
    httpd = SocketServer.TCPServer(("", port), MyHandler)
    httpd.serve_forever()

if __name__ == '__main__':
    run()
