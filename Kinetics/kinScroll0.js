
KS = {}
KS.right_tracking_on = false;
KS.left_tracking_on = false;
KS.xgain = 0.03;
KS.x_0 = 0;
KS.xbias_0 = 0;

KS.tgain = 1;
KS.a_0 = 0;
KS.theta0_0 = 0;

KS.setTheta0 = function(angle)
{
    //report("setHeading "+angle);
    P.theta0 = angle;
}

KS.handleKinSkelPose = function(msg)
{
   KS.handleRightHand(msg);
   KS.handleLeftHand(msg);
}

KS.handleRightHand = function(msg)
{
    //report("pose: "+JSON.stringify(msg));
    //report("pa0: "+P.theta0);
    var rhand = msg.RIGHT_HAND;
    var head = msg.HEAD;
    if (!rhand || !head) {
        KS.right_tracking_on = false;
        return 0;
    }
    var x0 = head[0];
    var z0 = head[1];
    var y0 = head[2];
    var x1 = rhand[0];
    var z1 = rhand[1];
    var y1 = rhand[2];
    var dx = x1-x0;
    var dy = y1-y0;
    var dz = z1-z0;
    if (dz < 0) {
	if (KS.right_tracking_on) {
	    report("<<<< right_tracking_on "+false);
        }
        KS.right_tracking_on = false;
        return 0;
    }
    var a = - Math.atan2(dx,dy);
    if (!KS.right_tracking_on) {
        KS.right_tracking_on = true;
        report(">>>> right_tracking_on "+KS.right_tracking_on+" dx: "+dx+"   dy: "+dy);
        KS.theta0_0 = P.theta0;
        report("theta0_0: "+KS.theta0_0);
        KS.theta0_0 = KS.theta0_0 % (2*Math.PI);
        KS.a_0 = a;
        report("a0: "+a0+"   theta0_0: "+KS.theta0_0);
    }
    var da = a - KS.a_0;
    a = KS.theta0_0 + KS.tgain*da;
    KS.setTheta0(a);
    return 1;
}

KS.handleLeftHand = function(msg)
{
    //report("pose: "+JSON.stringify(msg));
    //report("pa0: "+P.theta0);
    lhand = msg.LEFT_HAND;
    head = msg.HEAD;
    if (!lhand || !head) {
        KS.left_tracking_on = false;
        return 0;
    }
    var x0 = head[0];
    var z0 = head[1];
    var y0 = head[2];
    var x1 = lhand[0];
    var z1 = lhand[1];
    var y1 = lhand[2];
    var dx = x1-x0;
    var dy = y1-y0;
    var dz = z1-z0;
    if (dz < 0) {
	if (KS.left_tracking_on) {
	    report("<<<< right_tracking_on "+false);
        }
        KS.left_tracking_on = false;
        return 0;
    }
    if (!KS.left_tracking_on) {
        KS.left_tracking_on = true;
        report(">>>> left_tracking_on "+KS.left_tracking_on+" dx: "+dx+"   dy: "+dy);
        KS.x_0 = x1;
        KS.xbias_0 = P.xbias;
    }
    var dx = x1 - KS.x_0;
    P.xbias = KS.xbias_0 + KS.xgain*dx;
    return 1;
}


