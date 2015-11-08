
import SimpleHTTPServer
import SocketServer
import WebSockets.PWSServer as PWS

PWS.PORT = 8100
PORT = 8000

Handler = SimpleHTTPServer.SimpleHTTPRequestHandler

httpd = SocketServer.TCPServer(("", PORT), Handler)

PWS.runInThread()

print "serving HTTP at port", PORT
httpd.serve_forever()
