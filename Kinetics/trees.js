
function report(s)
{
   console.log(s);
}

function getVal(id)
{
   var s = $("#"+id).val();
   report("got "+id+" "+s);
   P[id] = eval(s);
}

function getVals(e)
{
   getVal("v0");
}

function addInput(id)
{
   var pd = $("#params");
   report("add input for "+id);
   pd.append("<br>\n");
   pd.append("&nbsp;"+id+": <input id='"+id+"' value='"+P[id]+"'>\n");
}

function setFun(id)
{
    addInput(id);
    $("#"+id).keypress(function (e) {
       if(e.which == 13)  // the enter key code
           getVals();
    });
}

function toggleParams()
{
    if ($("#showParams").prop("checked"))
        $("#params").show();
    else
        $("#params").hide();
}


function setupGUI()
{
      $("#reset").click(reset);
      $("#showParams").click(toggleParams);
      setFun("v0");
      setFun("xxx");
}

function dist(p1,p2)
{
/*
   var dv = new THREE.Vector3();
   dv.copy(p1);
   dv.subVectors(p2);
   return dv.length();
*/
   var dx = p1.x - p2.x;
   var dy = p1.y - p2.y;
   var dz = p1.z - p2.z;
   return Math.sqrt(dx*dx + dy*dy + dz*dz);
}

function randRotSpeed()
{
   return 10*(Math.random() - 0.5);
}

var leaves = [];
var numLeafs = 0;
//var imageUrl = 'http://www.html5canvastutorials.com/demos/assets/crate.jpg';
var imageUrl = 'images/crate.jpg';

function getLeaf(P)
{
   //var material = new THREE.MeshPhongMaterial( { color: 0x7733dd } );
   //var material = new THREE.MeshPhongMaterial(
   var material = new THREE.MeshLambertMaterial(
      { color: 0xdddddd, map: THREE.ImageUtils.loadTexture(imageUrl) });
   var geometry = new THREE.BoxGeometry( P.leafW, P.leafH, P.leafD );
   var obj = new THREE.Mesh( geometry, material );
   var leaf = new THREE.Object3D();
   leaf.add(obj);
   obj.position.y += 0.5*P.leafH + P.ballR;
   obj.position.x += 0.0*P.leafW;
   obj.position.z += 0.0*P.leafD;
   numLeafs++;
   leaf._w = randRotSpeed();
   leaf.name = "L"+numLeafs;
   leaves.push(leaf);
   return leaf;
}

function getArm(P, p1, p2)
{
   var ballR = P.ballR;
   var d = dist(p1,p2);
   //var n = d/(2*ballR);
   var n = d/(1.8*ballR);
   if (n < 2)
      n = 2;
   var obj = new THREE.Object3D();
   for (var i=0; i<n; i++) {
       var f = i/(n-1.0);
       var material = new THREE.MeshPhongMaterial( { color: 0x552222 } );
       var geometry = new THREE.SphereGeometry( ballR );
       var ball = new THREE.Mesh( geometry, material );
       ball.position.copy(p1);
       ball.position.lerp(p2, f);
       obj.add(ball);
   }
   return obj;
}

/*
getTree is called with either an integer n, in which case either
n branches to leaves are created, or with a list of children which
are previously created trees.
Note that getTree is not itself recursive.
*/
function getTree(P, args)
{
    var r = 1;
    var h = 0.5;
    n = args.n;
    children = args.children;
    if (children) {
        maxChildR = 0
        n = children.length;
        for (var i=0; i<n; i++) {
            c = children[i];
            if (c.r && c.r > maxChildR)
                maxChildR = c.r;
        }
        r = maxChildR;
    }
    
    var obj = new THREE.Object3D();
    var material = new THREE.MeshPhongMaterial( { color: 0x222222 } );
    var geometry = new THREE.SphereGeometry( P.hubR );
    var root = new THREE.Mesh( geometry, material );
    var lmat = new THREE.LineBasicMaterial( { color: 0xffffff, opacity: 1.0 } );
    lmat.linewidth = 1;
    root.position.x = 0;
    root.position.y = 0;
    root.position.z = 0;
    obj.add(root)
    var child;
    var nodes = [];
    for (var i=0; i<n; i++) {
       if (children)
           child = children[i];
       else
           child = getLeaf(P);
       var theta = 2*Math.PI*i / n;
       child.position.y = root.position.y+h;
       child.position.x = r*Math.cos(theta);
       child.position.z = r*Math.sin(theta);
       obj.add( child );
       nodes.push(child);
       var lgeom = new THREE.Geometry();
       lgeom.vertices.push(root.position);
       lgeom.vertices.push(child.position);
       var line = new THREE.Line( lgeom, lmat);
       obj.add(line);
       var arm = getArm(P, root.position, child.position);
       obj.add(arm);
    }
    obj._branches = nodes;
    //obj.r = 2*r;
    obj.r = 1.4*r;
    return obj;
}

function reset()
{
   getVals();
}

/*
buildTree is a recursive routine which takes arg that may be
a nested list of specs, for building a tree.
*/
function buildTree(P, arg, path)
{
    if (!path)
        path = "/";
    report("buildTree "+arg);
    if (Number.isInteger(arg)) {
       report("atomic case "+arg);
       var tree = getTree(P, {n: arg});
       tree.name = path+"A";
       return tree;
    }
    else {
       report("list case case "+arg);
       path = path+"H";
       var children = arg;
       var nodes = [];
       for (var i=0; i<children.length; i++) {
           nodes.push(buildTree(P, children[i], path+"/"+i));
       }
       var tree = getTree(P, {children: nodes});
       tree.name = path;
       return tree;
    }
}

function setupWorld()
{
      container = document.createElement( 'div');
      document.body.appendChild(container);

      P = {};
      P.isMobile = true;
      //P.isMobile = false;
      P.ballR = 0.03;
      P.hubR = 0.1;
      P.ncubes = 24;
      P.leafW = 0.8;
      P.leafH = 1.5;
      P.leafD = 0.1;
      P.gap = .4;
      P.v0 = 0.0002;
      var controls = null;

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera( 75,
                             window.innerWidth/window.innerHeight, 0.1, 1000 );
      P.camera = camera;
      P.scene = scene;

      trackball = 1;
      if (trackball) {
          controls = new THREE.TrackballControls( camera );
          //controls = new THREE.TrackballControls( camera, container );
          controls.rotateSpeed = 2.0;
          controls.zoomSpeed = 1.2;
          controls.panSpeed = 0.8;

          controls.noZoom = false;
          controls.noPan = false;

          controls.staticMoving = true;
          controls.dynamicDampingFactor = 0.3;

          controls.keys = [ 65, 83, 68 ];
          //controls.addEventListener( 'change', render );
      }

      renderer = new THREE.WebGLRenderer();
      renderer.setSize( window.innerWidth, window.innerHeight );
      //document.body.appendChild( renderer.domElement );
      container.appendChild( renderer.domElement );

      //var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
      //var material = new THREE.MeshPhongMaterial( { color: 0xdddddd } );

      P.cubes = {};
      P.speeds = {};
      var cube = null;

/*
      c1 = getTree(P, {n: 3})
      c2 = getTree(P, {n: 4})
      c3 = getTree(P, {children: [c1,c2]});
      c4 = getTree(P, {n: 2})
      c5 = getTree(P, {n: 5})
*/
      //P.root = getTree(P, {children: [c3, c4,c5]})
      //P.root = buildTree(P, [[3, 4], 2, 5])
      //P.root = buildTree(P, [2, 3, 2, 2])
      P.root = buildTree(P, [[3, 4], [2, [3,3]], 5])
      //P.root = buildTree(P, [[[2]]])
      //P.root = buildTree(P, [2])
      if (P.isMobile)
          P.root.rotation.x = Math.PI;
      scene.add(P.root)

      // LIGHT
      var light;
      light = new THREE.PointLight(0xeeeeff);
      light.position.set(0,150,100);
      scene.add(light);
      light = new THREE.PointLight(0xeeffee);
      light.position.set(100,50,150);
      scene.add(light);
      light = new THREE.PointLight(0xffeeee);
      light.position.set(-150,50,150);
      scene.add(light);
      // FLOOR
      var floorTexture = new THREE.ImageUtils.loadTexture( 'images/floor.jpg' );
      floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping; 
      floorTexture.repeat.set( 10, 10 );
      var floorMaterial = new THREE.MeshBasicMaterial( { map: floorTexture, side: THREE.DoubleSide } );
      var floorGeometry = new THREE.PlaneGeometry(1000, 1000, 10, 10);
      var floor = new THREE.Mesh(floorGeometry, floorMaterial);
      floor.position.y = -100.0;
      floor.rotation.x = Math.PI / 2;
      scene.add(floor);
      // SKYBOX/FOG
      var skyBoxGeometry = new THREE.BoxGeometry( 10000, 10000, 10000 );
      var skyBoxMaterial = new THREE.MeshBasicMaterial( { color: 0x9999ff, side: THREE.BackSide } );
      var skyBox = new THREE.Mesh( skyBoxGeometry, skyBoxMaterial );
      scene.add(skyBox);
      scene.fog = new THREE.FogExp2( 0x9999ff, 0.00025 );

//      P.root.position.y = floor.position.y + 10;

      camera.position.z = 5;
      var steps = 0;

      dumpTree(P, P.root);

      var render = function () {
          //report("------------------------------\nrender n: "+steps);
	  requestAnimationFrame( render );
          steps += 1;
          adjust = 1;
          if (adjust) {
              adjustChildren(P, P.root, 0)
          }
          renderer.render(scene, camera);

          if (controls) {
             controls.update();
          }
      };
      setupGUI();
      render();
}

function dumpTree(P, v, indent)
{
   if (!indent)
      indent = ".";
   report(indent+v.name);
   if (v._branches) {
       for (var i=0; i<v._branches.length; i++) {
           dumpTree(P, v._branches[i], indent+"..");
       }
   }
}

function adjustChildren(P, v)
{
    rotateChildren(P, v, 0);
    //pointChildren(P, v, 0);
    //pointLeaves();
}

function rotateChildren(P, v, depth)
{
   //report("rotateChildren "+v.name);
   if (depth > 10)
      return;
   if (v._branches) {
       v.rotation.y += P.v0*(2*depth*depth+1);
       for (var i=0; i<v._branches.length; i++) {
           rotateChildren(P, v._branches[i], depth+1);
       }
   }
   else {
       var w = 2*depth*depth*depth+1
       if (v._w) {
          w = v._w*2*depth*depth;
          //report("have _w "+w);
       }
       v.rotation.y += P.v0*w;
   }
}

function pointAt(P, v, target)
{
   //v.lookAt(P.camera.position);
   //v.quaternion.copy(P.camera.quaternion);
   var parent = v.parent;
   //report("parent: "+ parent);
   THREE.SceneUtils.detach(v, parent, P.scene);
   v.lookAt(target);
   v.updateMatrix();
   THREE.SceneUtils.attach(v, P.scene, parent);
}

function pointChildren(P, v, depth)
{
   //report("pointChildren "+v.name);
   if (v._branches) {
       for (var i=0; i<v._branches.length; i++) {
           pointChildren(P, v._branches[i], depth+1);
       }
   }
   else {
      var target = P.camera.position;
      //report("pointAt "+v.name+" camera");
      pointAt(P, v, target);
   }
}

function pointLeaves()
{
   var target = P.camera.position;
   for (var i=0; i<leaves.length; i++) {
       pointAt(P, leaves[i], target);
   }
}


//setupWorld();
