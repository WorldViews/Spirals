# WorldViews Spirals Repo

This has been a play repo for doing various experiments for the WorldViews
organization.

TeleViewer
==========

To run TeleViewer, you need to first install Cesium.  We are currently
using Cesium 1.21.1.  Install Cesium on your system, and then copy
the Build/Cesium directory to Spirals/Cesium/Cesium.

You then need to run a server.  We have been using a python server
but are moving to a node.js server.

Using Python server:
--------------------

run PhysVizServer80.py

and try http://localhost

You should get a page with a link to TeleViewer.

Using node server:
------------------

Now we are moving to a node server, and the use of the RethinkDB.
For configuration install node.js and RethinkDB.  (RethinkDB will
simply be a single .exe that is in this directory.)  Then do

   npm install

to make sure you have the necessary packages, and
then start the RethinkDB by running rethinkdb.exe

Then create a chat table using command

   node createChatTable.js

Now you should be ready to run the server.
Simply run either runServer80.bat or runServer3000.bat
or create a new configuration of your choice.

Note: while the rethinkDB is running you should be able to 
get to its admin interface at http://localhost:8080


PhysViz
=======

Software related to visualizations and physical simulations with music

Some of this requires python, for an HTML server, and for
OSC and WebSocket servers.

After cloning or installing, run runServers.py in top level
(for more specific control of servers, see below)

Then open http://yourhost:8000

This should give you a listing with some demos that can be run.

For additional demos using a Kinect or to have more control over ports
here are some other options:

WSServer will run just the WebSocket server on default port of 8100
httpServer8000.py will just run HTTP serveron on port 8000
httpServer8001.py will just run HTTP serveron on port 8001
WebSockets/Kin_OSC_WS_8100.py will run a WebSocket server on port 8100
that also includes an OSC server that can receive Kinect messages and
forward them to any connected websockets.





