
SCRIPT = {}
SCRIPT.scripts = {}
SCRIPT.currentScript = null;
SCRIPT.SCRIPT_URL = "spiralDanceScripts.js";

SCRIPT.stopAll = function()
{
    report("Stop all");
    for (var key in SCRIPT.scripts) {
	report("stopping "+key)
	var script = SCRIPT.scripts[key];
	script.stop();
    }
    $("#scriptButton").text("Run");
}

SCRIPT.setCurrentScript = function(script)
{
    SCRIPT.currentScript = script;
    $("#scriptSelect").val(script.name);
}

SCRIPT.Script = function(name, steps)
{
    this.name = name;
    this.steps = steps;
    this.stepNo = 0;
    this.t = 0;
    this.running = false;
    SCRIPT.scripts[name] = this;

    // This makes sure each step has an assigned time.
    // It may be given as either absolute, or relative
    // to previous step.
    this.prepare = function() {
	var t = 0;
	for (var i=0; i<this.steps.length; i++) {
	    var step = this.steps[i];
	    report("prepare "+i+" "+JSON.stringify(step));
	    if (step.t) {
		if (step.delay) {
		    report("**** Bad script step - has both t and delay");
		}
		if (step.t < t) {
		    report("**** Warning steps out of order.");
		}
		t = step.t;
		continue;
	    }
	    if (step.delay) {
		t += step.delay;
	    }
	    step.t = t;
	}
	// We could sort steps by t.  Is that a good idea?
	// It would allow more flexibility in scripting but might
	// be confusing.
    }

    this.run = function() {
	report("run "+this.name);
	SCRIPT.stopAll(); // Stop all other scripts
	SCRIPT.setCurrentScript(this);
	$("#scriptButton").text("Stop");
	this.stepNo = 0;
	this.t = 0;	
	this.ct0 = Date.now()/1000;
	this.running = true;
	if (this.steps.length == 0) {
	    report("*** no steps in script "+this.name);
	    this.stop();
	    return;
	}
	this.scheduleNextStep(this);
	SCRIPT.scripts
    }

    this.scheduleNextStep = function(scope) {
	if (scope.stepNo >= scope.steps.length) {
	    scope.stop();
	    return;
	}
	var step = scope.steps[scope.stepNo];
	report("schedule step: "+JSON.stringify(step));
	var dt = step.t - scope.t;
	if (dt < 0) {
	    report("**** out of order in steps...");
	    dt = 0;
	}
	//setTimeout(scope.runStep, dt*1000);
	//var fun = scope.runStep;
	this.timer = setTimeout(function() {
		scope.runStep(scope);
	    }, dt*1000);
    }

    this.runStep = function(scope) {
	if (!this.running) {
	    report("ignoring step for stopped script");
	    return;
	}
	report("runStep: "+scope.stepNo);
	var step = scope.steps[scope.stepNo];
	report(" step "+scope.stepNo+" "+step);
	if (step.action)
	    step.action();
	scope.t = step.t;
	scope.stepNo++;
	scope.scheduleNextStep(scope);
    }

    this.stop = function() {
	report("stop");
	this.running = false;
	if (this.timer) {
	    report("cancelling timer");
	    clearTimeout(this.timer);
	    this.timer = null;
	}
	$("#scriptButton").text("Run");
    }
    this.prepare();
}

SCRIPT.scriptSelectionChanged = function()
{
    var name = $("#scriptSelect").val();
    report("script: "+name);
    SCRIPT.run();
}

SCRIPT.run = function(name)
{
    if (!name) {
	name = $("#scriptSelect").val();
    }
    var script = SCRIPT.scripts[name];
    if (script) {
	script.run();
	$("#scriptButton").text("Stop");
    }
    else {
	report("NO script "+name);
    }
}

SCRIPT.toggleScript = function()
{
    report("toggleScript");
    if ($("#scriptButton").text() == "Run") {
	SCRIPT.run();
    }
    else {
	SCRIPT.stopAll();
	$("#scriptButton").text("Run");
    }
}

SCRIPT.reloadScript = function()
{
    report("reloadScripts "+SCRIPT.SCRIPT_URL);
    $.getScript(SCRIPT.SCRIPT_URL);
}

SCRIPT.setupButtons = function()
{
    hstr = '&nbsp;&nbsp;Script ';
    hstr += '<select id="scriptSelect"></select>';
    hstr += '&nbsp;';
    hstr += '<button id="scriptButton" style="width:50px;">Run</button>\n';
    hstr += '<button id="scriptReload">Reload</button>\n';
    $("#scriptControls").html(hstr);
    $("#scriptButton").click(SCRIPT.toggleScript);
    $("#scriptReload").click(SCRIPT.reloadScript);
    $("#scriptSelect").change(SCRIPT.scriptSelectionChanged);
}

SCRIPT.updateSelect = function()
{
    $("#scriptSelect").html("");
    //for (var name in ANIM.views) {
    var names = Object.keys(SCRIPT.scripts);
    names.sort();
    $("#scriptSelect").append($('<option>', { value: null, text: "None"}));
    for (var i=0; i<names.length; i++) {
	var name = names[i];
        $("#scriptSelect").append($('<option>', { value: name, text: name}));
    }
}

SCRIPT.setupHTML = function()
{
    SCRIPT.setupButtons();
    SCRIPT.updateSelect();
}

SCRIPT.runTest = function() {
    var testScript = new SCRIPT.Script("script1", [
        {t: 0, foo: "bar"},
        {t: 5, foo: "bar"},
        {t: 10, foo: "bar", action: function() {
	     report("In script");
	}},
        {t: 15, foo: "bar", action: function() {
	     report("last step of script");
	    }}]);
    testScript.run();
}

$(document).ready(function(e) {
	SCRIPT.setupHTML();
});



