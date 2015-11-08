
KS = {}
KS.tgain = 0.3;
KS.xgain = 0.01;
KS.hvars = {}


KS.setTheta0 = function(angle)
{
    report("set theta0 "+angle);
    P.theta0 = angle;
}

KS.handleKinSkelPose = function(msg)
{
    KS.handleHand(msg, "RIGHT_HAND");
    KS.handleHand(msg, "LEFT_HAND");
}

KS.handleHand = function(msg, hand)
{
    //report("handleHand: "+JSON.stringify(msg));
    var pid = msg.personNum;
    var hid = hand+"_"+pid;
    //report("hid:"+hid);
    var vars = KS.hvars[hid];
    if (!vars) {
	vars = {};
	KS.hvars[hid] = vars;
	vars.xbias_0 = 0;
        vars.tracking = false;
	vars.a_0 = 0;
	vars.theta0_0 = 0;
	vars.hx_0 = 0;
	vars.hy_0 = 0;
    }

    var handPos= msg[hand];
    var head = msg.HEAD;
    if (!handPos || !head) {
        vars.tracking = false;
        return 0;
    }
    var x0 = head[0];
    var y0 = head[1];
    var z0 = head[2];
    var x1 = handPos[0];
    var y1 = handPos[1];
    var z1 = handPos[2];
    var dz = z0-z1;
    //report("dz: "+dz);
    if (dz < 500) {
	if (vars.tracking) {
	    report("<<<< tracking OFF "+hand);
        }
        vars.tracking = false;
        return 0;
    }
    P.lastTrackedTime = new Date().getTime() / 1000;
    if (!vars.tracking) {
        vars.tracking = true;
        report(">>>> tracking ON "+hand+ "  dz: "+dz);
        vars.theta0_0 = P.theta0;
        report("theta0_0: "+vars.theta0_0);
        vars.xbias_0 = P.xbias;
        vars.theta0_0 = vars.theta0_0 % (2*Math.PI);
        vars.hx_0 = x1;
        vars.hy_0 = y1;
        report("a_0: "+vars.a_0+"   theta0_0: "+vars.theta0_0);
    }
    var deltaY = y1 - vars.hy_0;
    var a = vars.theta0_0 - KS.tgain*deltaY*Math.PI/180;
    KS.setTheta0(a);
    var deltaX = x1 - vars.hx_0;
    P.xbias = vars.xbias_0 + KS.xgain*deltaX;
    return 1;
}

