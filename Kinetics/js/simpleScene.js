

function report(str) {
   console.log(str);
}


function vec3(x,y,z) { return new THREE.Vector3(x,y,z); }

SCENE = {};

SCENE.getCard = function(boxW, boxH, rotZ)
{
   boxD = 0.1;
   if (!rotZ)
       rotZ = 0;
   //report("getImageCard "+imageUrl);
   var material = new THREE.MeshLambertMaterial(
      { color: 0xdddddd,
	//map: THREE.ImageUtils.loadTexture(imageUrl)
	//transparent: true
      });
   material.side = THREE.DoubleSide;
   material.transparency = 0.5;
   var geometry = new THREE.PlaneGeometry( boxW, boxH );
   var obj = new THREE.Mesh( geometry, material );
   var card = new THREE.Object3D();
   card.add(obj);
   obj.rotation.z = rotZ;
   obj.position.y += 0.5*boxH + boxD;
   obj.position.x += 0.0*boxW;
   obj.position.z += 0.0*boxD;
   card.obj = obj;
   card.material = material;
   return card;
}

var scene;
SCENE.scene = scene;

if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var container, stats;
var camera, renderer;

var object, arrow;

var useFog = true;
var useGround = true;

function start() {
    init();
    animate();
}

function init() {
    P = {};

    P.v0 = 0.04;
    P.theta0 = 0;
    P.xbias = 0;
    P.lastTrackedTime = 0;
    P.pauseTime = 5;
	             
    container = document.createElement( 'div' );
    document.body.appendChild( container );

    // scene

    scene = new THREE.Scene();

    clearColor = 0xcce0ff;
    if (useFog)
	//scene.fog = new THREE.Fog( 0xcce0ff, 500, 10000 ); //NOFOG
	scene.fog = new THREE.Fog( clearColor, 500, 10000 ); //NOFOG
    //scene.fog = new THREE.Fog( 0xcce0ff, 500, 50000 ); //NOFOG

    // camera

    //camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 1, 10000 );
    camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 1, 30000 );
    camera.position.y = 50;
    camera.position.z = 1500;
    scene.add( camera );
    P.camera = camera;

    // lights

    var light, materials;

    scene.add( new THREE.AmbientLight( 0x666666 ) );

    var group = new THREE.Scene();
    scene.add(group);

    light = new THREE.DirectionalLight( 0xdfebff, 1.75 );
    light.position.set( 50, 200, 100 );
    light.position.multiplyScalar( 1.3 );

    light.castShadow = true;
    //light.shadowCameraVisible = true;

    light.shadowMapWidth = 1024;
    light.shadowMapHeight = 1024;

    //var d = 300;
    var d = 1200;

    light.shadowCameraLeft = -d;
    light.shadowCameraRight = d;
    light.shadowCameraTop = d;
    light.shadowCameraBottom = -d;

    light.shadowCameraFar = 1000;
    light.shadowDarkness = 0.5;

    scene.add( light );

    // ground

    if (useGround) {
	var texLoader = new THREE.TextureLoader();
	//var groundTexture = texLoader.load( "textures/terrain/grasslight-big.jpg" );
	//groundTexture.repeat.set( 25, 25 );
	//var groundTexture = texLoader.load( "textures/terrain/dark_grass.png" );
	//groundTexture.repeat.set( 15, 15 );
	var groundTexture = texLoader.load( "textures/terrain/red_earth.png" );
	groundTexture.repeat.set( 15, 15 );
	//var groundTexture = texLoader.load( "textures/terrain/BrownLeaves.jpg" );
	groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
	//groundTexture.repeat.set( 5, 5 );
	groundTexture.anisotropy = 16;
				
	var groundMaterial = new THREE.MeshPhongMaterial( {
		color: 0x664444,
		specular: 0x111111,
		map: groundTexture } );

	var mesh = new THREE.Mesh( new THREE.PlaneBufferGeometry( 20000, 20000 ), groundMaterial );
	mesh.position.y = -250;
	mesh.rotation.x = - Math.PI / 2;
	mesh.receiveShadow = true;
	scene.add( mesh );
    }

    //

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor( clearColor ); //NOFOG

    container.appendChild( renderer.domElement );

    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    //renderer.shadowMapEnabled = true;
    renderer.shadowMap.enabled = true;

    //

    stats = new Stats();
    container.appendChild( stats.domElement );

    //

    window.addEventListener( 'resize', onWindowResize, false );

    trackball = 1;
    if (trackball) {
	//controls = new THREE.TrackballControls( camera, container );
	//controls = new THREE.EditorControls( camera, container );
	//controls = new THREE.OrthographicTrackballControls( camera, container );
	//controls = new THREE.OrbitControls( camera, container );
	controls = new THREE.PVControls( camera, container, scene );
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
}


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

			//

function animate() {
    requestAnimationFrame( animate );
    render();
    var time = Date.now();
    //arrow.setLength( windMag );
    //arrow.setDirection( SKIRT.windForce );
    var ct = new Date().getTime() / 1000;
    // Adjust
    renderer.render( scene, camera );
    stats.update();
}


function render() {
    var timer = Date.now() * 0.0002;
    //sphere.position.copy( ballPosition );
    //camera.lookAt( scene.position );
}

