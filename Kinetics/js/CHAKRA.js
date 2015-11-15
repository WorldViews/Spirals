
CHAKRA = {};
CHAKRA.hues = [ 0, 30, 60, 120, 240, 260, 320 ];

// Requires ISPIRAL
//
CHAKRA.chakras = [];

function Chakra(num, opts)
{
    if (!opts)
        opts = {};
    this.num = num;
    this.name = "Chakra"+num;
    this.spiral = null;
    this.imageSpiral = null;
    this.opts = opts;

    this.init = function() {
	CHAKRA.chakras[this.num] = this;
	this.y = 100 + this.num*50;
        var ballSize = 20;
        var geo = new THREE.SphereGeometry( ballSize, 20, 20 );
	var material = new THREE.MeshPhongMaterial( { color: 0xffaaaa } );
        this.hue = CHAKRA.hues[this.num-1]/360;
        this.material = material;
        material.color.setHSL(this.hue, .9, .5);
        material.transparent = true;
        material.opacity = .8;
        var mesh = new THREE.Mesh( geo, material );
        mesh.position.y = this.y;
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        if (opts.scale) {
            report("Setting chakra scale "+opts.scale);
            mesh.scale.x = opts.scale[0];
            mesh.scale.y = opts.scale[1];
            mesh.scale.z = opts.scale[2];
        }
	this.mesh = mesh;
	this.group = new THREE.Object3D();
	this.group.add(mesh);
	if (opts.spiral) {
	    this.addSpiral();
	}
	if (opts.imageSpiral) {
	    report("Chakra adding imageSpiral");
	    this.addImageSpiral(opts.imageSpiral);
	}
        if (opts.scene)
	    opts.scene.add(this.group);
    }

    this.addSpiral = function(opts) {
	if (this.spiral) {
	    this.spiral.group.visible = true;
	    return;
	}
	this.spiral = new BallSpiral(200, {scale: [4,40,40], position: [0, this.y, 0], hue: this.hue});
	this.spiral.group.rotation.z = Math.PI/2;
	this.group.add(this.spiral.group);
    }

    this.hideSpiral = function(opts) {
	if (this.spiral)
	    this.spiral.group.visible = false;
    }

    this.addImageSpiral = function(opts) {
	if (this.imageSpiral) {
	    this.imageSpiral.images.visible = true;
	    return;
	}
	var imageList = opts.images; // list of paths
	if (imageList) {
	    this.imageSpiral = new ImageSpiral(imageList, {scale: [4,20,20], position: [0,this.y,0]});
	    var images = this.imageSpiral.images;
	    images.rotation.z = Math.PI/2;
	    this.group.add(images);
	}
	else {
	    report("**** no imageList given ****");
	}
    }

    this.hideImageSpiral = function(opts)
    {
	if (this.imageSpiral)
	    this.imageSpiral.images.visible = false;
    }

    this.update = function(t) {
	if (this.spiral)
	    this.spiral.update(t);
	if (this.imageSpiral)
	    this.imageSpiral.update(t);
    }

    this.init();
}


CHAKRA.update = function(t)
{
//  report("CHAKRA.update "+t);
    for (i in CHAKRA.chakras) {
	var chakra = CHAKRA.chakras[i];
	chakra.update(t);
    }
}
