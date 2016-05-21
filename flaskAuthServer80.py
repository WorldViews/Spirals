
import json, time, traceback
import flask

from flask.ext.sqlalchemy import SQLAlchemy
from flask.ext.security import Security, SQLAlchemyUserDatastore, \
    UserMixin, RoleMixin, login_required

from flask import Flask, render_template, send_file, \
                  jsonify, send_from_directory, request
from flask_socketio import SocketIO, emit

TABLE_NAMES = ["chat", "notes", "periscope"]

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
#app.debug = False
app.config['SECRET_KEY'] = 'secret!'
app.config['DEBUG'] = True
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite://'

socketio = SocketIO(app)

# Create database connection object
db = SQLAlchemy(app)

# Define models
roles_users = db.Table('roles_users',
        db.Column('user_id', db.Integer(), db.ForeignKey('user.id')),
        db.Column('role_id', db.Integer(), db.ForeignKey('role.id')))

class Role(db.Model, RoleMixin):
    id = db.Column(db.Integer(), primary_key=True)
    name = db.Column(db.String(80), unique=True)
    description = db.Column(db.String(255))

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True)
    name = db.Column(db.String(255))
    password = db.Column(db.String(255))
    active = db.Column(db.Boolean())
    confirmed_at = db.Column(db.DateTime())
    roles = db.relationship('Role', secondary=roles_users,
                            backref=db.backref('users', lazy='dynamic'))

# Setup Flask-Security
user_datastore = SQLAlchemyUserDatastore(db, User, Role)
security = Security(app, user_datastore)

# Create a user to test with
@app.before_first_request
def create_user():
    db.create_all()
    user_datastore.create_user(email='matt@nobien.net', password='password')
    user_datastore.create_user(email='donkimber@gmail.com', password='xxx', name="Don")
    db.session.commit()


def getObj(id, tname):
    print "getObj", id, tname
    recs = rdb.table(tname).filter({'id': id}).run(conn)
    return recs.next()
    
def getNote(id):
    return getObj(id, 'notes')
    
@app.route('/')
def index():
    return send_file('index.html')

"""
This is used by SharedCam to make itself known.
"""
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
    sessionId = request.args.get('sessionId')
    sessionId = sessionId.replace(':', '_')
    sessionId = sessionId.replace('-', '_')
    obj = {'t': t, 'name': name, 'tagStr': tagStr,
           'lon': lon, 'lat': lat, 'room': room,
           'sessionId': sessionId,
           'numUsers': numUsers, 'clientType': clientType}
    print obj
    jstr = json.dumps(obj)
    print "jstr:", jstr
    if socketio:
        print "send to socketio"
        emit('sharecam', jstr, broadcast=True, namespace='/')
    return "Ok"
#    return flask.jsonify({'val': 'ok'})

@app.route('/Viewer/TV')
def viewerTV():
    print "viewerTV"
#    return send_from_directory('Viewer', "TV.html")
    return render_template("TV.html")

@app.route('/Viewer/<path:path>')
def send(path):
    print "send_page", path
    return send_from_directory('Viewer', path)

@app.route('/images/<path:path>')
def send_image(path):
    print "send_image", path
    return send_from_directory('images', path)

@app.route('/Cesium/<path:path>')
def send_page(path):
    print "send_page", path
    return send_from_directory('Cesium', path)

@app.route('/log')
@login_required
def log_on():
    print "log_on"
    render_template('TV.html')

"""
This URL is a gateway for posting to SIO
"""
@app.route('/sioput/<path:etype>', methods=['POST','GET'])
def sioput(etype):
    req = {}
    args = request.args
    if request.data:
        req = json.loads(request.data)
    for key in args:
        req[key] = args[key][0]
    print "req:", req
    etype0 = req['etype']
    if etype0 != etype:
        print "mismatch etype:", etype
    obj = req['obj']
    jObj = json.dumps(obj)
    print "etype:", etype
    print "jObj:", jObj
    if socketio:
        print "send to socketio"
        emit(etype, jObj, broadcast=True, namespace='/')
    print "**** addToDB"
    addObjToDB(obj, etype)
    print
    return "OK"

@app.route('/comment/<path:etype>', methods=['POST','GET'])
def addComment(etype):
    print "addComment", etype
    req = {}
    args = request.args
    print "args:", args
    if request.data:
        req = json.loads(request.data)
    for key in args:
        #req[key] = args[key][0]
        req[key] = args[key]
    print "req:", req
    parentId = req['parent']
    comment = req['comment']
    print "parentId:", parentId
    print "comment:", comment
    note = getNote(parentId)
    print "note:", note
    comments = note.get("comments", [])
    comments.append(comment)
    print "comments:", comments
    note['comments'] = comments
    #q = rdb.table("notes").filter({"id":id})
    #q = q.update({"comments": comments})
    #q.run(conn)
    jObj = json.dumps(note)
    print "etype:", etype
    print "jObj:", jObj
    if socketio:
        print "send to socketio"
        emit(etype, jObj, broadcast=True, namespace='/')
    print "**** addToDB"
    replaceObjToDB(note, etype)
    print
    return "OK"

@app.route('/db/<path:etype>')
def query(etype):
    print "query", etype
    t = time.time()
    if rdb == None:
        return flask.jsonify({'error': 'No DB', 't': t, 'records': []})
    args = request.args
    id = args.get("id", None)
    #if id != None:
    #    recs = rdb.table(etype).filter({'id': id}).run(conn)
    #    obj = recs.next()
    #    return flask.jsonify(obj)
    tMin = args.get("tMin", None)
    limit = args.get("limit", None)
    if limit != None:
        limit = int(limit)
    if tMin != None:
        tMin = float(tMin)
    try:
        q = rdb.table(etype)
        if id != None:
            q = q.filter({'id': id})
        if tMin != None:
            q = q.filter(rdb.row["t"].gt(tMin))
        q = q.order_by(rdb.desc('t'))
        if limit != None:
            q = q.limit(limit)
        print q
        recs = q.run(conn)
    except:
        traceback.print_exc()
        return
    """
    try:
        if tMin != None:
            if limit == None:
                recs = rdb.table(etype).filter(rdb.row["t"].gt(tMin)).order_by(
                                         rdb.desc('t')).run(conn)
            else:
                recs = rdb.table(etype).filter(rdb.row["t"].gt(tMin)).order_by(
                                         rdb.desc('t')).limit(limit).run(conn)
        else:
            if limit == None:
                recs = rdb.table(etype).order_by(rdb.desc('t')).run(conn)
            else:
                recs = rdb.table(etype).order_by(rdb.desc('t')).limit(limit).run(conn)
    except:
        traceback.print_exc()
        return
    """
    #print "recs:", recs
    #items = [x for x in recs]
    items = list(recs)
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
    addMsgStrToDB(msg, 'chat')

@socketio.on('notes')
def handle_notes(msg):
    print "handle_notes:", msg
    emit('notes', msg, broadcast=True)
    addMsgStrToDB(msg, 'notes')

@socketio.on('people')
def handle_people(msg):
    #print "handle_people:", msg
    emit('people', msg, broadcast=True)

@socketio.on('sharecam')
def handle_sharecam(msg):
    #print "handle_people:", msg
    emit('sharecam', msg, broadcast=True)

def addMsgStrToDB(msgStr, etype):
    print "add Msg to DB:", etype
    if etype not in TABLE_NAMES:
        print "**** addMsgStrToDB unknown table:", etype
        return
    obj = json.loads(msgStr)
    rdb.table(etype).insert(obj).run(conn)

def addObjToDB(obj, etype):
    print "add Obj to DB:", etype
    print "obj:", obj
    if etype not in TABLE_NAMES:
        print "**** addObjToDB: unknown table:", etype
        return
    rc = rdb.table(etype).insert(obj).run(conn)
    print "Completed insert", rc

def replaceObjToDB(obj, etype):
    print "add Obj to DB:", etype
    print "obj:", obj
    if etype not in TABLE_NAMES:
        print "**** addObjToDB: unknown table:", etype
        return
    rc = rdb.table(etype).replace(obj).run(conn)
    print "Completed insert", rc

def run():
    print "Running flask server"
    socketio.run(app, host="0.0.0.0", port=80)
    #socketio.run(app, port=80)

if __name__ == '__main__':
    run()

