
from flask import Flask, render_template, send_file, send_from_directory
from flask_socketio import SocketIO, emit
import rethinkdb as rdb

try:
    rdb.connect('localhost', 28015).repl()
except:
    print "*** Running without DB ***"
    rdb = None

app = Flask(__name__, static_url_path='')
app.debug = True
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

@app.route('/')
def index():
    return send_file('index.html')

@app.route('/Viewer/<path:path>')
def send(path):
    print "send_page", path
    return send_from_directory('Viewer', path)

@app.route('/Cesium/<path:path>')
def send_page(path):
    print "send_page", path
    return send_from_directory('Cesium', path)

@app.route('/db/<path:path>')
def send_query(path):
    if rdb == None:
        return "No DB"
    recs = rdb.db('test').table('chat').run()
    print recs
    return "Won't work"

@socketio.on('my event')
def test_message(message):
    emit('my response', {'data': 'got it!'})

@socketio.on('chat')
def test_message(msg):
    print "message:", msg
    #emit('chat', {'data': 'got it!'})
    emit('chat', msg)

if __name__ == '__main__':
    socketio.run(app, port=80)

