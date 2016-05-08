
function report(str) { console.log(str); }

report("Starting");

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

r = require('rethinkdb')

var connection = null;
r.connect( {host: 'localhost', port: 28015}, function(err, conn) {
    if (err) throw err;
    connection = conn;
    loadTable();
    setupWatch();
})

function loadTable()
{
    r.table('chat').run(connection, loadCallback);
}

function addMsg(text)
{
    report("addMsg");
    var msg = {'user':'Unknown', text: text};
    r.table('chat').insert(msg).run(connection, function(err, res) {
       if(err) throw err;
       console.log(res);
    });
}

var loadCallback = function(err, cursor) {
     if (err) throw err;
     // returns an array of all documents (fruit in this case) in the cursor
     cursor.toArray(function(err, fruit) {
	 if (err) throw err;
         console.log("got: "+fruit);
         //socket.emit('load_fruit', fruit);
     });
}

function setupWatch()
{
    r.table('chat').changes().run(connection, watchCallback);
}

var watchCallback = function(err, cursor) {
     if (err) throw err;
     // returns an array of all documents (fruit in this case) in the cursor
     cursor.each(function(err, fruit) {
	 if (err) throw err;
         console.log("got: "+fruit);
         //socket.emit('load_fruit', fruit);
     });
}

app.get('/', function(req, res){
  res.sendFile(__dirname + '/rethinkChat1.html');
});

app.get('/oldMsgs', function(req, res){
	//  res.sendFile(__dirname + '/package.json');
	setTimeout(function() {
		res.sendFile(__dirname + '/package.json');
	    }, 2000);
});

io.on('connection', function(socket){
   socket.on('chat message', function(msg){
      io.emit('chat message', msg);
      addMsg(msg);
   });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

