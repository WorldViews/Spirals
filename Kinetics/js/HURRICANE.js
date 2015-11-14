
HURRICANE = {};

HURRICANE.Hurricane = function(scene, pos, spread)
{
    pos = pos || new THREE.Vector3();
    spread = spread || 60;
    this.rotSpeed = 0.1;
    this.spread1 = 1.0*spread;
    this.spread0 = 1.5*spread;
    this.rMin = 120;
    this.rMax = 1000;
    this.narms = 8;
    this.spriteSize = 2000;
    this.nparts = 300;
    this.turnsPerArm = 1;

    this.init = function() {
	//color  = [1.0, 0.2, 0.5];
	color  = [1.0, 0.0, 0.2];

	this.loader = new THREE.TextureLoader();
	//var sprite = THREE.ImageUtils.loadTexture( "textures/sprites/clouds.png" );
	var sprite = this.loader.load( "textures/sprites/clouds.png" );
	material = new THREE.PointsMaterial(
				 { size: this.spriteSize,
				   map: sprite,
				   blending: THREE.AdditiveBlending,
                                   depthTest: false,
                                   transparent : true } );
	material.color.setHSL( color[0], color[1], color[2] );
	material.opacity = 0.02;
	this.material = material;

        /*
        for ( var i = 0; i < nparts; i ++ ) {
	*/
	this.group = new THREE.Object3D();
	this.group.scale.y = 0.2;
	this.group.scale.x = 4;
	this.group.scale.z = 4;
	this.group.position.copy(pos);

	for (var i=0; i<this.narms; i++) {
	    var a0 = 2*Math.PI*i/this.narms;
	    arm = this.genArm(a0);
	    var particles = new THREE.Points( arm, material );
	    this.group.add(particles);
	}
    }

    this.genArm = function(a0) {
	var arm = new THREE.Geometry();
	var w = this.turnsPerArm*2*Math.PI;
	for ( var i = 0; i < this.nparts; i ++ ) {
	    var t = i/this.nparts;
	    //t = t*t;            // Doing this puts more clouds towards outside.
	    //t = Math.sqrt(t); // Doing this puts more clouds towards center.
	    var a = -w*t;
	    var r = this.rMin*(t) + this.rMax*(1-t);
	    var spread = this.spread0*(1-t) + this.spread1*t;
	    var x0 = r*Math.cos(a0+a);
	    var z0 = r*Math.sin(a0+a);
	    //report("t: "+t+"  a: "+a+"  r: "+r);
	    var vertex = new THREE.Vector3();
	    vertex.x = x0 + Math.random() * spread - spread/2;
	    vertex.y =      Math.random() * spread - spread/2;
	    vertex.z = z0 + Math.random() * spread - spread/2;
	    //report("v "+JSON.stringify(vertex));
	    arm.vertices.push( vertex );
	}
	return arm;
    };

    this.update = function() {
	var t = Date.now()/1000;
	if (!this.prevT)
	    this.prevT = t;
	var dt = t - this.prevT;
	this.prevT = t;
	var da = -this.rotSpeed*dt;
	//report("dt: "+dt+"  da: "+da);
        this.group.rotation.y -= da;
	da = dt;
	/*
	var children = this.group.children;
	for ( i = 0; i < children.length; i ++ ) {
	    var object = children[ i ];
	    if ( object instanceof THREE.PointCloud ) {
		//object.rotation.y = time * ( i < 4 ? i + 1 : - ( i + 1 ) );
		object.rotation.z = da * ( i < 4 ? i + 1 : - ( i + 1 ) );
	    }
	}
	*/
    };

    this.init();
}
