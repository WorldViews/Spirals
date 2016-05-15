
import json, time
import flask
from flask import Flask, render_template, send_file, \
                  jsonify, send_from_directory, request
from flask_socketio import SocketIO, emit

rdb = None
try:
    import rethinkdb as rdb
    #rdb.connect('localhost', 28015).repl()
    conn = rdb.connect(db='test')
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

@app.route('/regp/', methods=['POST','GET'])
def reg():
    print "reg path:", request.path
    print "reg args", request.args
    t = time.time()
    name = request.args.get('name')
    tagStr = request.args.get('tagStr')
    clientType = request.args.get('clientType')
    lon = float(request.args.get('longitude'))
    lat = float(request.args.get('latitude'))
    room = request.args.get('room')
    numUsers = int(request.args.get('numUsers'))
    obj = {'t': t, 'name': name, 'tagStr': tagStr,
           'lon': lon, 'lat': lat, 'room': room,
           'numUsers': numUsers, 'clientType': clientType}
    print obj
    return "ok"

@app.route('/Viewer/<path:path>')
def send(path):
    print "send_page", path
    return send_from_directory('Viewer', path)

@app.route('/Cesium/<path:path>')
def send_page(path):
    print "send_page", path
    return send_from_directory('Cesium', path)

@app.route('/db/<path:etype>')
def query(etype):
    #print "query", etype
    t = time.time()
    if rdb == None:
        return flask.jsonify({'error': 'No DB', 't': t, 'records': []})
    recs = rdb.table(etype).run(conn)
    items = [x for x in recs]
    obj = {'type': etype,
           't' : t,
           'records': items}
    return flask.jsonify(obj)

@socketio.on('my event')
def test_message(message):
    emit('my response', {'data': 'got it!'})

@socketio.on('chat')
def handle_chat(msg):
    print "handle_chat:", msg
    emit('chat', msg, broadcast=True)
    addMsg(msg, 'chat')

@socketio.on('notes')
def handle_notes(msg):
    print "handle_notes:", msg
    emit('notes', msg, broadcast=True)
    addMsg(msg, 'notes')

@socketio.on('people')
def handle_people(msg):
    #print "handle_people:", msg
    emit('people', msg, broadcast=True)

def addMsg(msgStr, etype):
    obj = json.loads(msgStr)
    rdb.table(etype).insert(obj).run(conn)

if __name__ == '__main__':
    #socketio.run(app, port=80)
    socketio.run(app, host="0.0.0.0", port=80)

