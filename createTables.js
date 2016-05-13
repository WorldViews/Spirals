
function report(str) { console.log(str); }

r = require('rethinkdb');

r.connect({ host: 'localhost', port: 28015 }, function(err, conn) {
    if(err) throw err;
    r.db('test').tableCreate('chat').run(conn, function(err, res) {
	if(err) {
	    //throw err;
	    report("err: "+err);
	    report("Cannot create table chat");
	}
	else {
	    console.log(res);
	    report("Created table chat");
	}
	});
    r.db('test').tableCreate('notes').run(conn, function(err, res) {
	if(err) {
	    //throw err;
	    report("err: "+err);
	    report("Cannot create table notes");
	}
	else {
	    console.log(res);
	    report("Created table notes");
	}
	});
});

