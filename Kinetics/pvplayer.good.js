
var PLAYER = {};
PLAYER.ticksPerBeat = 1200;
//PLAYER.delay0 = 1;
PLAYER.delay0 = 0.0;
PLAYER.isPlaying = false;
PLAYER.distPerSec = 0.2;
PLAYER.graphics = null;
PLAYER.scene = null;
PLAYER.graphicsScale = null;
PLAYER.muted = {};
PLAYER.midiObj = null;
PLAYER.loadedInstruments = {};
PLAYER.lastEventPlayTime = 0;
PLAYER.lastEventClockTime = 0;
PLAYER.seqNum = 0;
PLAYER.graphicsX0 = -8;
PLAYER.graphicsSpiral = true;

//PLAYER.tracks = {}

PLAYER.startPlaying = function()
{
    if (PLAYER.midiObj == null) {
	report("No midi loaded");
	return;
    }
    $("#midiTogglePlaying").text("Pause");
    PLAYER.playSync(PLAYER.midiObj);
}

PLAYER.pausePlaying = function()
{
    report("Pause Playing");
    PLAYER.isPlaying = false;
    PLAYER.setPlayTime(PLAYER.getPlayTime());
    $("#midiTogglePlaying").text("Play");
}

PLAYER.stopPlaying = PLAYER.pausePlaying;

PLAYER.rewind = function()
{ 
    report("rewind");
    PLAYER.i = 0;
    PLAYER.setPlayTime(0);
}

PLAYER.togglePlaying = function()
{   if ($("#midiTogglePlaying").text() == "Play") {
	PLAYER.startPlaying();
    }
    else {
	PLAYER.pausePlaying();
    }
}

PLAYER.playMelody = function(name)
{
    var melodyUrl = "midi/"+name+".json";
    PLAYER.stopPlaying();
    $.getJSON(melodyUrl, function(obj) { PLAYER.playMidiObj(obj) });
}

PLAYER.fmt = function(t) { return ""+Math.floor(t*1000)/1000; }

PLAYER.playMidiObj = function(obj)
{
    PLAYER.midiObj = processMidiObj(obj);
    //TODO: make this really wait until instruments are loaded.
    PLAYER.i = 0;
    PLAYER.startPlaying();
    if (PLAYER.scene) {
        report("***** adding Note Graphics ******");
        PLAYER.addNoteGraphics(PLAYER.scene, PLAYER.midiObj);
    }
    else {
        report("***** No registered scene so not adding Note Graphics ******");
    }
}

/*
This takes a midiObj as returned by JSON and figures out what
instruments are requred, and also arranges a sequence of events
grouped by times.
 */
function processMidiObj(midiObj)
{
    report("processMidiObj");
    if (midiObj.type != "MidiObj") {
	report("midiObj has unexpected type "+midiObj.type);
    }
    var tracks = midiObj.tracks;
    var ntracks = tracks.length;
    report("num tracks "+ntracks);
    report("Now merging "+ntracks+" tracks.");
    seqTimes = [];
    seqEvents = {};
    PLAYER.instruments = {};
    PLAYER.trackChannels = {};
    for (var i=0; i<tracks.length; i++) {
	var track = tracks[i];
	PLAYER.trackChannels[i] = i;
	PLAYER.instruments[i] = 0;
	if (track.instrument != undefined)
	    PLAYER.instruments[i] = track.instrument;
	var evGroups = track.seq;
	for (var j=0; j<evGroups.length; j++) {
            var evGroup = evGroups[j];
            var t0 = evGroup[0];
            var evs = evGroup[1];
            for (var k=0; k<evs.length; k++) {
		var ev = evs[k];
		ev.track = i;
		if (seqEvents[t0]) {
		    seqEvents[t0][1].push(ev);
		}
                else {
		    seqEvents[t0] = [t0, [ev]];
		    seqTimes.push(t0);
		}
	    }
        }
    }
    seqTimes.sort(function(a,b) { return a-b; });
    var seq = []
    var maxTime = 0;
    for (var i=0; i<seqTimes.length; i++) {
        var t = seqTimes[i];
	var evGroup = seqEvents[t];
	seq.push([t, evGroup[1]]);
        maxTime = t;//
	//report("t: "+ t+ " nevents: "+evGroup.length);
    }
    midiObj.seq = seq;
    midiObj.duration = maxTime/PLAYER.ticksPerBeat;
    PLAYER.setupChannels();
    try {
	PLAYER.setupTrackInfo();
    }
    catch (e) {
	report("err: "+e);
    }
    return midiObj;
    //    return midiObj.tracks[ntracks-1];
}


/*
  This version starts a series of callbacks for each time
  that events must be started.  There is one callback for
  each time that one or more new notes are played.
 */
PLAYER.playSync = function(obj)
{
   report("playSync");
   PLAYER.seqNum += 1;
   //PLAYER.i = 0;
   PLAYER.delay0 = 0;
   PLAYER.events = obj.seq;
   PLAYER.isPlaying = true;
   PLAYER.lastEventPlayTime = 0;
   PLAYER.lastEventClockTime = Date.now()/1000.0;
   setTimeout(function() {
	   PLAYER.playNextStep(PLAYER.seqNum)}, 0);
}

PLAYER.getPlayTime = function()
{
    if (PLAYER.isPlaying) {
	var ct = Date.now()/1000.0;
	var t = PLAYER.lastEventPlayTime + (ct - PLAYER.lastEventClockTime);
	return t;
    }
    else
	return PLAYER.lastEventPlayTime;
}

PLAYER.setPlayTime = function(t)
{
    report("setPlayTime t: "+t);
    PLAYER.lastEventPlayTime = t;
    PLAYER.lastEventClockTime = Date.now()/1000.0;
    //TODO: should set PLAYER.i to appopriate place...
}

PLAYER.playNextStep = function(seqNum)
{
    //report("playNextStep "+PLAYER.i);
   if (!PLAYER.isPlaying) {
      report("player stopped!");
      return;
   }
   if (seqNum != PLAYER.seqNum) {
       report("***** old sequence detected - dropping it *****");
       return
   }
   var evGroup = PLAYER.events[PLAYER.i];
   var t0 = evGroup[0];
   var pt = t0/PLAYER.ticksPerBeat;
   PLAYER.lastEventPlayTime = pt;
   PLAYER.lastEventClockTime = Date.now()/1000.0;
   PLAYER.handleEventGroup(evGroup);
   PLAYER.i += 1;
   if (PLAYER.i >= PLAYER.events.length) {
      report("FInished playing");
      PLAYER.isPlaying = false;
      PLAYER.stopPlaying();
      return;
   }
   var t1 = PLAYER.events[PLAYER.i][0];
   var dt = (t1-t0)/PLAYER.ticksPerBeat;
   setTimeout(function() {
	   PLAYER.playNextStep(seqNum)}, dt*1000);
}

PLAYER.handleEventGroup = function(eventGroup)
{
    var t0 = eventGroup[0];
    var notes = eventGroup[1];
    for (var k=0; k<notes.length; k++) {
//      if (maxNumNotes && i > maxNumNotes)
//          break;
        var note = notes[k];
	if (PLAYER.muted[note.track])
	    continue;
	var channel = PLAYER.trackChannels[note.track];
        var etype = note[0];
        var t0_ = note[1];
        var pitch = note[2];
	var v = note[3];
        var dur = note[4]/PLAYER.ticksPerBeat;
	var t = 0;
	if (etype == "tempo") {
	    report("tempo");
	    continue;
	}
        if (etype != "note") {
            report("*** unexpected etype: "+etype);
        }
        if (t0_ != t0) {
            report("*** mismatch t0: "+t0+" t0_: "+t0_);
        }
	//report(""+t0+" note channel: "+channel+" pitch: "+pitch+" v:"+v+" dur: "+dur);
        MIDI.noteOn(channel, pitch, v, t+PLAYER.delay0);
        MIDI.noteOff(channel, pitch, v, t+dur+PLAYER.delay0);
    }
}


PLAYER.setupChannels = function(instruments)
{
    if (!instruments)
	instruments = PLAYER.instruments;
    report("setupChannels "+JSON.stringify(instruments));
    for (var chNo in instruments) {
	var inst = instruments[chNo];
	report("ch "+chNo+" instrument: "+inst);
        if (PLAYER.loadedInstruments[inst]) {
	    report("instrument already loaded "+inst);
        }
	PLAYER.setupChannel(chNo, inst);
    }
}

var instMap = {
    0: "acoustic_grand_piano",
    1: "violin",
    2: "harpsichord",
    3: "voice_oohs",
    4: "steel_drun",
    5: "choir_aahs",
    6: "paradiddle",
    7: "pad_3_polysynth",
};
instMap = {};

PLAYER.getInstName = function(inst)
{
    if (typeof inst == typeof "str")
	return inst;
    if (instMap[inst])
	return instMap[inst];
    return inst;
}

PLAYER.setupChannel = function(chNo, inst, successFn)
{
    var instName = PLAYER.getInstName(inst);
    report("setupInstrument chNo: "+chNo+" inst: "+inst+" name: "+instName);
    instrument = instName;
    MIDI.loadPlugin({
        soundfontUrl: "./soundfont/",
	instrument: instName,
        onprogress:function(state,progress){
           MIDI.loader.setValue(progress*100);
        },
        onprogress: function(state,progress)
		{
		     if (MIDI.loader)
                         MIDI.loader.setValue(progress*100);
		},
	onsuccess: function()
		{
		    PLAYER.loadedInstruments[instrument] = true;
		    MIDI.programChange(chNo, instrument);
		    if (successFn)
			successFn();
		}
    });
}

PLAYER.loadInstrument = function(instr, successFn)
{
    report("loadInstrument "+instr);
    PLAYER.setupChannel(0, instr, successFn);
}

function OLDloadInstrument(instr, successFn)
{
    instrument = instr;
    MIDI.loadPlugin({
        soundfontUrl: "./soundfont/",
	instrument: instrument,
        onprogress:function(state,progress){
           MIDI.loader.setValue(progress*100);
        },
        onprogress: function(state,progress)
		{
		     if (MIDI.loader)
                         MIDI.loader.setValue(progress*100);
		},
	onsuccess: function()
		{
		    MIDI.programChange(0, instr);
		    if (successFn)
			successFn();
		}
    });
}


PLAYER.getTimeGraphicR = function()
{
    var y0 = -6;
    var x0 = PLAYER.graphicsX0;
    var z0 = 0;
    var gap = .2;
    var w = .1;
    var material = new THREE.MeshPhongMaterial( { color: 0xff0000 } );
    var geometry = new THREE.BoxGeometry( 0.001, 300, w );
    var g = new THREE.Mesh( geometry, material );
    g._mat = material;
    g.position.x = x0;
    g.position.y = y0;
    g.position.z = z0;
    return g;
}

PLAYER.getNoteGraphicR = function(t, dur, pitch, material)
{
    var y0 = -6;
    var x0 = 0;//PLAYER.graphicsX0;
    var z0 = 0;
    var gap = .2;
    var w = .1;
    var h = PLAYER.distPerSec*dur;
    material.color.setHSL((pitch%12)/12.0, .6, .5);
    var geometry = new THREE.BoxGeometry( h, w, w );
    var ng = new THREE.Mesh( geometry, material );
    ng._mat = material;
    ng.position.x = x0 + PLAYER.distPerSec*t + h/2;
    ng.position.y = y0 + gap * pitch;
    ng.position.z = z0;
    return ng;
}

PLAYER.getTimeGraphicS = function()
{
    var tDur = PLAYER.midiObj.duration;
    var c = tDur*PLAYER.distPerSec;
    var r = c / (2*Math.PI);
    var y0 = 4;
    var x0 = 0;//PLAYER.graphicsX0;
    var z0 = 0;
    var w = 10;
    var material = new THREE.MeshPhongMaterial( { color: 0xff0000 } );
    //var geometry = new THREE.BoxGeometry( 0.001, 300, w );
    var geometry = new THREE.BoxGeometry( 0.01, 300, 2 );
    var g = new THREE.Mesh( geometry, material );
    g._mat = material;
    material.transparent = true;
    material.opacity = .3;
    g.position.x = x0;
    g.position.y = y0;
    g.position.z = z0 + r;
    report("**** getTimeGraphicS "+JSON.stringify(g.position));
    return g;
}

PLAYER.getNoteGraphicS = function(t, dur, pitch, material)
{
    var tDur = PLAYER.midiObj.duration;
    var c = tDur*PLAYER.distPerSec;
    var r = c / (2*Math.PI);
    var y0 = 4;
    var x0 = 0;//PLAYER.graphicsX0;
    var z0 = 0;
    var gap = .2;
    var w = .1;
    var h = PLAYER.distPerSec*dur;
    material.color.setHSL((pitch%12)/12.0, .6, .5);
    var geometry = new THREE.BoxGeometry( h, w, w );
    var ng = new THREE.Mesh( geometry, material );
    ng._mat = material;
    var a = 2*Math.PI*(t+dur/2)/tDur;
    var p = ng.position;
    p.x = x0 + r*Math.sin(a);
    p.z = z0 + r*Math.cos(a);
    p.y = y0 + gap * pitch;
    //report("getNoteGraphicS a: "+a+"  r: "+r+"  x: "+p.x+"  y: "+p.y+"  z: "+p.z);
    ng.rotation.y = a;
    return ng;
}

PLAYER.graphicsHandleEventGroup = function(gObj, eventGroup)
{
    var t0 = eventGroup[0];
    var notes = eventGroup[1];
    for (var k=0; k<notes.length; k++) {
//      if (maxNumNotes && i > maxNumNotes)
//          break;
        var note = notes[k];
        var pitch = note[2];
	var v = note[3];
        var dur = note[4]/PLAYER.ticksPerBeat;
	var t = t0/PLAYER.ticksPerBeat;
	//report(t0+" graphic for note pitch: "+pitch+" v:"+v+" dur: "+dur);
        var material = new THREE.MeshPhongMaterial( { color: 0x00dddd } );
	var noteGraphic;
	if (PLAYER.graphicsSpiral)
           noteGraphic = PLAYER.getNoteGraphicS(t, dur, pitch, material);
        else
           noteGraphic = PLAYER.getNoteGraphicR(t, dur, pitch, material);
        gObj.add( noteGraphic );
    }
}

PLAYER.addNoteGraphics = function(scene, midiTrack)
{
    if (PLAYER.graphics) {
        scene.remove(PLAYER.graphics);
    }

    report("Adding note graphics...");
    var events = midiTrack.seq;
    PLAYER.graphics = new THREE.Object3D();
    PLAYER.notesGraphic = new THREE.Object3D();
    PLAYER.graphics.add(PLAYER.notesGraphic);
    if (PLAYER.graphicsSpiral)
	PLAYER.timeGraphic = PLAYER.getTimeGraphicS();
    else
	PLAYER.timeGraphic = PLAYER.getTimeGraphicR();
    for (var i=0; i<events.length; i++) {
	PLAYER.graphicsHandleEventGroup(PLAYER.notesGraphic, events[i]);
    }
    PLAYER.graphics.add(PLAYER.timeGraphic)
    if (PLAYER.graphicsScale) {
        var s = PLAYER.graphicsScale;
        PLAYER.graphics.scale.x = s[0];
        PLAYER.graphics.scale.y = s[1];
        PLAYER.graphics.scale.z = s[2];
    }
    scene.add(PLAYER.graphics);
    return PLAYER.graphics;
}

PLAYER.prevPt = null;

PLAYER.update = function()
{
    if (!PLAYER.graphics)
	return;
    clockTime = Date.now()/1000;
    var pt = PLAYER.getPlayTime();
    if (PLAYER.prevPt && pt < PLAYER.prevPt) {
        report("**** pt < prevPt ****");
    }
    PLAYER.prevPt = pt;
    $("#midiStatus").html("Time: "+PLAYER.fmt(pt));
    if (PLAYER.graphicsSpiral) {
	var a = 2*Math.PI*pt/PLAYER.midiObj.duration;
	PLAYER.notesGraphic.rotation.y = -a;
    }
    else {
	var x = PLAYER.graphicsX0 - pt*PLAYER.distPerSec;
	PLAYER.notesGraphic.position.x = x;
    }
}

//******************************************************************
// These have to do with the Web GUI for midi control
//
function checkboxChanged(e)
{
    var id = $(this).attr('id');
    var ch = id.slice(4);
    report("id: "+id);
    var val = $(this).is(":checked");
    //var val = $("#"+mute_id).is(":checked");
    val = eval(val);
    report("mute_id: "+id+" ch: "+ch+"  val: "+val);
    PLAYER.muted[ch] = val;
}

function instrumentChanged(e)
{
    var id = $(this).attr('id');
    var ch = id.slice(6);
    var val = $(this).val();
    val = eval(val);
    report("ch: "+ch+"  val: "+val);
    PLAYER.setupChannel(ch, val);
}

PLAYER.compositionChanged = function(e)
{
    var name = $(this).val();
    report("compositionChanged: "+name);
    PLAYER.playMelody(name);
}

PLAYER.setupMidiControlDiv = function()
{
    report("setupMidiControlDiv");
    if ($("#midiControl").length == 0) {
	report("*** no midiControlDiv found ****");
    }
    str = '<div id="midiTrackInfo">\n' +
          'No Tracks Loaded<br>\n' +
          '</div>\n'  +
          '<button onclick="PLAYER.rewind()">|&#60; </button>\n' +
          '<button id="midiTogglePlaying" onclick="PLAYER.togglePlaying()">Play</button>\n' +
          '&nbsp;&nbsp;<select id="midiCompositionSelection"></select>\n' +
          '&nbsp;&nbsp;<span id="midiStatus" style="{width: 300px;}">No Midi Object</span>\n';
    $("#midiControl").html(str);
    //
    report("*** adding compositions ");
    var sel = $("#midiCompositionSelection");
    sel.append($('<option>', { value: "None", text: "(None)"}));
    for (var i=0; i<PLAYER.compositions.length; i++) {
        var compName = PLAYER.compositions[i];
	report("**** adding comp "+compName);
        sel.append($('<option>', { value: compName, text: compName}));
    }
    sel.change(PLAYER.compositionChanged);
}

PLAYER.compositions = [
    "chopin69",
    "wtc0",
    "beethovenSym5m1",
    "shepard",
    "BluesRhythm1",
    "minute_waltz",
    "jukebox",
    "risset0",
];

PLAYER.setupTrackInfo = function()
{
    report("showTrackInfo");
    var d = $("#midiTrackInfo");
    if (d.length == 0) {
	report("**** No track info div found *****");
	PLAYER.setupMidiControlDiv();
    }
    d.html("");
    for (var ch in PLAYER.trackChannels) {
        var mute_id = "mute"+ch;
        var select_id = "select"+ch;
	var s = "track: "+ch+"&nbsp";
	s += 'mute: <input type="checkbox" id="MUTE_ID">\n';
        s += '&nbsp;&nbsp;&nbsp;';
        s += 'instrument: <select id="SELECT_ID"></select>\n'
	s += '<br>\n';
	s = s.replace("MUTE_ID", mute_id);
	s = s.replace("SELECT_ID", select_id);
	d.append(s);
        var cb = $("#"+mute_id);
	cb.change(checkboxChanged)
        var sel = $("#"+select_id);
        for (var i=0; i<128; i++) {
            var instObj = MIDI.GM.byId[i];
	    var instName = (i+1)+" "+instObj.name;
            sel.append($('<option>', { value: i, text: instName}));
	}
	sel.val(PLAYER.instruments[ch]);
        sel.change(instrumentChanged);
    }
}

$(document).ready( function() {
    PLAYER.setupTrackInfo();
});
