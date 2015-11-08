/*
To use this, do one of

var ws = GetWebSock();
var ws = GetWebSock(handlers);
var ws = GetWebSock(handlers, url);

where handlers is a dictionary of functions that get called
by type, where type is either 'onopen' which gets called
when the socket had connected to server, or where type
matches the 'msgType' field of an incoming JSON msg.

After the ws has been connected, messages may be sent
by

ws.sendMessage(msg)

where msg is a JSON dictionary.
*/

WS = {};
WS.defaultPort = 8100;
WS.ws = null;
WS.numMsgs = 0;

function report(str)
{
    console.log(str);
}

if ('WebSocket' in window){
   report("have websockets");
   /* WebSocket is supported. You can proceed with your code*/
} else {
   report("no websockets api");
   /*WebSockets are not supported. Try a fallback method like long-polling etc*/
}

var ws = null;
var numMsgs = 0;

//
// Don't call this directly... use GetWebSock
//
function GetWebsocket_(handlers, url)
{
   report("GetWebSocket url: "+url);
   if (url === undefined ) {
       report("setting default websocket url");
       domain = document.domain;
       if (!domain) {
	   domain = "platonia";
	   domain = "192.168.21.153";
	   console.log("Cannot get domain - using "+domain);
       }
       url = "ws://"+domain+":"+WS.defaultPort+"/";
   }
   console.log("GetWebsocket "+url);
   WS.ws = new WebSocket(url);
   //WS.ws = new WebSocket('ws://localhost:8000/');

   WS.ws.onopen = function(){
      /*Send a small message to the console once the connection is established */
      report('Ws open!');
      if (handlers.onopen)
	  handlers.onopen();
   };

   WS.ws.onclose = function(){
      report('Connection closed');
      WS.ws = null;
   };

   WS.ws.onerror = function(){
      report('Had connection error');
      WS.ws = null;
   };

   WS.ws.onmessage = function(e){
      //report("onmessage "+e.data);
      //var smsg = e.data;
      //var smsg = eval(e.data);
       var smgs = null;
       try {
	   var smsg = JSON.parse(e.data);
       }
       catch (e) {
	   report("error: "+e);
	   report("ignoring non-JSON message");
	   return;
       }
      var msg = smsg;
      WS.numMsgs += 1;
      //report("got msg "+WS.numMsgs);
      //report("server_message: "+JSON.stringify(smsg));
      var msgType = msg.msgType;
      if (handlers[msgType]) {
	  handlers[msgType](msg);
      }
      else {
	  report("unhandled msgType: "+msgType);
      }
   };

   WS.sendMessage = function(msg) {
       if (WS.ws == null || WS.ws.readyState != WS.ws.OPEN) {
	   report("socket not open");
	   return;
       }
       report("sendingMessage: "+JSON.stringify(msg));
       WS.ws.send(JSON.stringify(msg));
   };
}

function tryConnect(handlers, url)
{
    if (WS.ws == null) {
	console.log("*** tick - get web socket ***");
	GetWebsocket_(handlers, url);
    }
    else {
        console.log("*** tick - nothing to do ***");
    }
}


function GetWebSock(handlers, url)
{
    tryConnect(handlers, url);
    setInterval(function() { tryConnect(handlers, url); }, 2000);
    return WS;
}

