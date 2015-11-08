/*
<script src="http://127.0.0.1:8081/socket.io/socket.io.js"></script>
<script src="JointWatcher.js"></script>
*/


function JointWatcher(onJointFun, pattern)
{
   socket = io.connect('http://127.0.0.1', { port: 8081, rememberTransport: false});
   console.log('oi');
   socket.on('connect', function() {
        // sends to socket.io server the host/port of oscServer
        // and oscClient
        socket.emit('config',
            {
                server: {
                    port: 3333,
                    host: '127.0.0.1'
                },
                client: {
                    port: 3334,
                    host: '127.0.0.1'
                }
            }
        );
    });

    socket.on('message', function(obj) {
        var status = document.getElementById("status");
        //onJointMessage(obj);
        var jointStr = obj[0];
        var parts = jointStr.split("/");
        var bodyId = parts[1];
        var jointId = parts[4];
        var x = obj[1];
        var y = obj[2];
        var z = obj[3];
        var state = obj[4];
        if (jointId.search(pattern) >= 0)
            onJointFun(bodyId, jointId, x, y, z, state);
        //status.innerHTML = obj[0]+obj[1];
        //console.log(obj);
    });
}

