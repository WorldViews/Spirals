# WorldViews Spirals Repo

This has been a play repo for doing various experiments for the WorldViews
organization.

TeleViewer
==========

Setting up Cesium
-----------------
To run TeleViewer, you need to first install Cesium.  We are currently
using Cesium 1.21.1.  Install Cesium on your system, and then copy
the Build/Cesium directory to Spirals/Cesium/Cesium.

Setting up the Database
-----------------------

To run TeleViewer, you should first install RethinkDB.  For windows this
is a single executable rethinkdb.exe that can be put in the top directly
and run there.  After running this to start the server, you sould make
sure it has the initial tables required.  This can be done using node by

   npm install                   # this will install required packages

   node createTables.js          # create a few requred tables

The rethinkdb server makes a admin interface available at localhost:8080

Using flask servers
-------------------

We have several versions of flask server.  To use these, first install
necessary flask packages, which include:
Flask
Flask-Login
Flask-Mail
Flask-OAuth
Flask-Principal
Flask-SQLAlchemy
Flask-Security
Flask-SocketIO
Flask-WTF
Jinja2

(you could do pip install with the requirements.txt but that probably
has more packages than you need.)

Then run one of the servers.  The simplest one is:

    flaskServer80.py

This version has no user accounts.  With this verions, use the URL
http://server (where probably server is localhost for you.)
And you will get an index page with a link to TeleViewer near the
top.

Or to run one with user accounts:

    flaskAuthServer80.py

This version has some simple authentication and users.   For it
use the URL http://server/Viewer/TV.  There should be a link at
the top of the layers tab for logging in.


Using node server
-----------------

We have a node server with some functionality.  To try it use
runServer80.bat or runServer3000.bat, or make your own configuration.

Using Python server:
--------------------

This is the simplest and most limited version, so many features
are not supported, and may not fail gracefully.  To use it run:

    PhysVizServer80.py

and try http://localhost

You should get a page with a link to TeleViewer.


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


Setting up Windows 10 machine
=============================
Step 1 install Anaconda 
Step 2 pip install Flask-socketio
Step 3 pip install flask-mail
Now you should be able to run flaskServer80.py
but it won't be using the rethinkdb
Step 4 pip install rethinkdb
Step 5 install rethinkdb.executable
Step 6 run RDB_Admin.py
Now check localhost:8080 for rethinkdb admin page
Step 7 re-run flaskServer80.py

Note: We tried using the virtualenv with anaconda to create a clean environment but pip install flask failed. We also did a pip install basemap to get filterLayer.py to work.
