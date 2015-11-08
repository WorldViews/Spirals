
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
PLAYER.crankFactor = 0;
PLAYER.crankAngle0 = null;
PLAYER.crankAngle = null;
PLAYER.instruments = {};
PLAYER.USE_NEW_METHOD = true;

//PLAYER.tracks = {}

PLAYER.startPlaying = function()
{
    report("startPlaying");
    if (PLAYER.midiObj == null) {
	report("No midi loaded");
	return;
    }
    $("#midiTogglePlaying").text("Pause");
    PLAYER.crankAngle0 = PLAYER.crankAngle;
    PLAYER.setupInstruments();
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
    PLAYER.crankAngle0 = PLAYER.crankAngle;
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
    PLAYER.setPlayTime(0);
    //PLAYER.startPlaying();
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
    PLAYER.trackChannels = {};  // These are 'global' tracks which
                                // arise from a given channel of a
                                // midi track                      
    PLAYER.instruments = {};
    for (var i=0; i<tracks.length; i++) {
	var track = tracks[i];
	var ntchs = 0;
	if (track.numNotes === 0)
	    continue;
	if (track.channels) {
	    for (var k=0; k<track.channels.length; k++) {
                var ch = track.channels[k];
		var gch = ch; // global channel assignment
		//var tchName = "T"+i+"."+k+"_"+ch;
		var tchName = "T"+i+"_"+ch+"_"+gch;
		report(">>>>>> tch: "+tchName+" "+gch);
		PLAYER.trackChannels[tchName] = {'id': tchName,
						 'channel': ch,
						 'track': track};
		ntchs++;
	    }
	}
	if (ntchs == 0) {
	    // No channels were assigned - we will use 0
	    var ch = 0;
	    var gch = 0; // 
	    var tchName = "T"+i+"_"+ch+"_"+gch;
	    PLAYER.trackChannels[tchName] = {'id': tchName,
					     'channel': ch,
					     'track': track};
	}
	if (track.instrument != undefined) {
	    //PLAYER.instruments[track.instrument] = 1;
	    PLAYER.instruments[track.instrument] = 0;
	}
	else {
	    //PLAYER.instruments[0] = 1;
	    PLAYER.instruments[0] = 0;
	}
	if (track.instruments) {
	    for (var k=0; k<PLAYER.instruments.length; k++) {
                var inst = PLAYER.instruments[k];
		PLAYER.instruments[inst] = 1;
	    }
	}
	var evGroups = track.seq;
	for (var j=0; j<evGroups.length; j++) {
            var evGroup = evGroups[j];
            var t0 = evGroup[0];
            var evs = evGroup[1];
            for (var k=0; k<evs.length; k++) {
		var ev = evs[k];
		ev.track = i;
		if (ev[0] == "programChange") {
		    var ch = ev[2];
		    var gch = ch;
		    var inst = ev[3];
		    var tchName = "T"+i+"_"+ch+"_"+gch;
		    report(">> "+tchName);
		    PLAYER.trackChannels[tchName].instrument = inst;
		}
		//report("ev: "+JSON.stringify(ev)+" "+ev.track);
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
    PLAYER.loadInstruments();
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
   //PLAYER.lastEventPlayTime = 0;
   //PLAYER.lastEventClockTime = Date.now()/1000.0;
   if (!PLAYER.USE_NEW_METHOD) {
       setTimeout(function() {
	    PLAYER.playNextStep(PLAYER.seqNum)}, 0);
   }
}

PLAYER.getPlayTime = function()
{
    if (PLAYER.crankFactor && PLAYER.crankAngle) {
	if (PLAYER.crankAngle0 == null)
	    PLAYER.crankAngle0 = PLAYER.crankAngle;
        return PLAYER.crankFactor*(PLAYER.crankAngle-PLAYER.crankAngle0);
    }
    var ct = Date.now()/1000.0;
    if (PLAYER.isPlaying) {
	var t = PLAYER.lastEventPlayTime + (ct - PLAYER.lastEventClockTime);
	return t;
    }
    else {
	PLAYER.lastEventClockTime = ct;
	return PLAYER.lastEventPlayTime;
    }
}

PLAYER.setPlayTime = function(t)
{
    report("setPlayTime t: "+t);
    PLAYER.lastEventPlayTime = t;
    PLAYER.lastEventClockTime = Date.now()/1000.0;
    //TODO: should set PLAYER.i to appopriate place...
}

//
// THis works and is self scheduling...
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

//
PLAYER.checkForEvent = function()
{
    //report("playNextStep "+PLAYER.i);
   if (!PLAYER.isPlaying) {
      report("player stopped!");
      return;
   }
   var pt = PLAYER.getPlayTime();
   var evGroup = PLAYER.events[PLAYER.i];
   var nextT0 = evGroup[0];
   var nextPt = nextT0/PLAYER.ticksPerBeat;
   if (pt < nextPt)
   {
       if (PLAYER.i > 0) {
           var evGroup = PLAYER.events[PLAYER.i-1];
           var prevT0 = evGroup[0];
           var prevPt = prevT0/PLAYER.ticksPerBeat;
           if (pt > prevPt)
               return;
           PLAYER.lastEventPlayTime = pt;
           PLAYER.lastEventClockTime = Date.now()/1000.0;
           PLAYER.handleEventGroup(evGroup);
           PLAYER.i -= 1;
	   if (PLAYER.i < 0)
	       PLAYER.i = 0;
       }
       return;
   }
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
	/*
	var channel = PLAYER.trackChannels[note.track];
        var etype = note[0];
        var t0_ = note[1];
        var pitch = note[2];
	var v = note[3];
        var dur = note[4]/PLAYER.ticksPerBeat;
	*/
        var etype = note[0];
        var t0_ = note[1];
	var t = 0;
	if (etype == "tempo") {
	    report("tempo");
	    continue;
	}
	var channel = note[2];
	if (etype == "programChange") {
	    var inst = note[3];
	    report("programChange ch: "+channel+" inst: "+inst);
	    //MIDI.programChange(channel, inst);
	    PLAYER.programChange(note.track, channel, inst);
	    continue;
	}
        var pitch = note[3];
	var v = note[4];
        var dur = note[5]/PLAYER.ticksPerBeat;
        if (etype != "note") {
            report("*** unexpected etype: "+etype);
        }
        if (t0_ != t0) {
            report("*** mismatch t0: "+t0+" t0_: "+t0_);
        }
	/*
	if (channel != 0) {
	    report("channel "+channel+" -> 0");
	    channel = 0;
	}
	*/
	//report(""+t0+" note channel: "+channel+" pitch: "+pitch+" v:"+v+" dur: "+dur);
        MIDI.noteOn(channel, pitch, v, t+PLAYER.delay0);
        MIDI.noteOff(channel, pitch, v, t+dur+PLAYER.delay0);
    }
}

PLAYER.programChange = function(trackNo, ch, inst)
{
    MIDI.programChange(ch, inst);
    try {
        var selName = "selectT"+trackNo+"_"+ch+"_"+ch;
	report("programChange sel: "+selName+" "+inst);
	$("#"+selName).val(inst);
    }
    catch (e) {
	report("err: "+e);
    }
}

/*
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
*/

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

PLAYER.setupInstruments = function()
{
    report("setupInstruments");
    for (var tchName in PLAYER.trackChannels) {
	tch = PLAYER.trackChannels[tchName];
	if (tch.instrument) {
	    PLAYER.programChange(tch.channel, tch.instrument)
	}
    }
}

PLAYER.loadInstruments = function(successFn)
{
    report("loadInstruments "+JSON.stringify(PLAYER.instruments));
    var instruments = [];
    for (var id in PLAYER.instruments) {
	var instObj = MIDI.GM.byId[id];
	instruments.push(instObj.id);
    }
    report("instruments: "+instruments);
    MIDI.loadPlugin({
        soundfontUrl: "./soundfont/",
	instruments: instruments,
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
                    report("** finished with loading instruments");
                    for (var i=0; i<instruments.length; i++) {
			var inst = instruments[i];
			report("loaded "+inst);
			PLAYER.loadedInstruments[inst] = true;
		    }
		    if (successFn)
			successFn();
		}
    });
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

/*
PLAYER.loadInstrument = function(instr, successFn)
{
    report("loadInstrument "+instr);
    PLAYER.setupChannel(0, instr, successFn);
}
*/

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
        var pitch = note[3];
	var v = note[4];
        var dur = note[5]/PLAYER.ticksPerBeat;
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
    if (PLAYER.isPlaying && PLAYER.USE_NEW_METHOD)
	PLAYER.checkForEvent();
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
function muteCheckboxChanged(e)
{
    report("muteCheckboxChanged")
    var id = $(this).attr('id');
    var i = id.lastIndexOf("_");
    var ch = id.slice(i+1);
    report("id: "+id+" ch: "+ch);
    var val = $(this).is(":checked");
    //var val = $("#"+mute_id).is(":checked");
    val = eval(val);
    report("mute_id: "+id+" ch: "+ch+"  val: "+val);
    PLAYER.muted[ch] = val;
}

function instrumentChanged(e)
{
    report("instrumentChanged")
    var id = $(this).attr('id');
    var i = id.lastIndexOf("_");
    var ch = id.slice(i+1);
    var val = $(this).val();
    val = eval(val);
    //val = val - 1; // indices start at 0 but names start at 1
    report("id: "+id+" ch: "+ch+"  val: "+val);
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
    "shimauta1",
    "passac",
    "DistantDrums",
    "EarthandSky",
    "silkroad",
    "shores_of_persia",
    "distdrums",
    "cello2",
];

PLAYER.setupTrackInfo = function()
{
    report("showTrackInfo");
    report("trackChannels: "+JSON.stringify(PLAYER.trackChannels));
    var d = $("#midiTrackInfo");
    if (d.length == 0) {
	report("**** No track info div found *****");
	PLAYER.setupMidiControlDiv();
    }
    d.html("");
    for (var tchName in PLAYER.trackChannels) {
	var trackChannel = PLAYER.trackChannels[tchName];
	var ch = trackChannel.channel;
        report("Tchannel: "+tchName+" ch: "+ch);
        var mute_id = "mute"+tchName;
        var select_id = "select"+tchName;
	var s = "track: "+tchName+"&nbsp";
	report("mute_id: "+mute_id+"   select_id: "+select_id);
	s += 'mute: <input type="checkbox" id="MUTE_ID">\n';
        s += '&nbsp;&nbsp;&nbsp;';
        s += 'instrument: <select id="SELECT_ID"></select>\n'
	s += '<br>\n';
	s = s.replace("MUTE_ID", mute_id);
	s = s.replace("SELECT_ID", select_id);
	d.append(s);
        var cb = $("#"+mute_id);
	cb.change(muteCheckboxChanged)
        var sel = $("#"+select_id);
        for (var i=0; i<128; i++) {
            var instObj = MIDI.GM.byId[i];
	    //var instName = (i+1)+" "+instObj.name;
	    var instName = i+" "+instObj.name;
            //sel.append($('<option>', { value: i+1, text: instName}));
            sel.append($('<option>', { value: i, text: instName}));
	}
	report("PLAYER.instruments[ch]: "+PLAYER.instruments[ch]);
	var inst = trackChannel.instrument;
	report("instrument: "+inst);
	if (inst) {
	    sel.val(inst);
	}
        sel.change(instrumentChanged);
    }
}

$(document).ready( function() {
    PLAYER.setupTrackInfo();
});
