
var PLAYER = {};
PLAYER.ticksPerBeat = 500;
PLAYER.delay0 = 1;
PLAYER.isPlaying = false;
PLAYER.isAsync = false;
PLAYER.distPerSec = 1.2;
PLAYER.prevClockTime = null;
PLAYER.graphics = null;
PLAYER.scene = null;
PLAYER.graphicsScale = null;
PLAYER.muted = {};
PLAYER.midiObj = null;
PLAYER.loadedInstruments = {};
//PLAYER.tracks = {}

PLAYER.stopPlaying = function ()
{
   report("Stop Playing");
   //   MIDI.stopAllNotes();
   PLAYER.isPlaying = false;
}

PLAYER.startPlaying = function()
{
    if (PLAYER.midiObj == null) {
	report("No midi loaded");
	return;
    }
    PLAYER.playSync(PLAYER.midiObj);
}


PLAYER.playMelody = function(name)
{
    report("playMelody "+name);
    var melodyUrl = "midi/"+name+".json";
    PLAYER.stopPlaying();
    $.getJSON(melodyUrl, function(obj) { PLAYER.playMidiObj(obj) });
}

PLAYER.fmt = function(t) { return ""+Math.floor(t*1000)/1000; }

PLAYER.playMidiObj = function(obj)
{
    report("playMidiObj");
    PLAYER.midiObj = processMidiObj(obj);
    if (PLAYER.isAsync)
        PLAYER.playAsync(PLAYER.midiObj);
    else
        PLAYER.playSync(PLAYER.midiObj);
    if (PLAYER.scene) {
        report("***** adding Note Graphics ******");
        PLAYER.addNoteGraphics(PLAYER.scene, PLAYER.midiObj);
    }
    else {
        report("***** No registered scene so not adding Note Graphics ******");
    }
}

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
    for (var i=0; i<seqTimes.length; i++) {
        var t = seqTimes[i];
	var evGroup = seqEvents[t];
	seq.push([t, evGroup[1]]);
	//report("t: "+ t+ " nevents: "+evGroup.length);
    }
    midiObj.seq = seq;
    PLAYER.setupChannels();
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
   PLAYER.isAsync = false;
   PLAYER.i = 0;
   PLAYER.delay0 = 0;
   PLAYER.events = obj.seq;
   PLAYER.isPlaying = true;
   setTimeout(PLAYER.playNextStep, 0);
}

PLAYER.playNextStep = function()
{
    //report("playNextStep "+PLAYER.i);
   if (!PLAYER.isPlaying) {
      report("player stopped!");
      return;
   }
   var evGroup = PLAYER.events[PLAYER.i];
   var t0 = evGroup[0];
   PLAYER.handleEventGroup(evGroup);
   PLAYER.i += 1;
   if (PLAYER.i >= PLAYER.events.length) {
      report("FInished playing");
      PLAYER.isPlaying = false;
      return;
   }
   var t1 = PLAYER.events[PLAYER.i][0];
   var dt = (t1-t0)/PLAYER.ticksPerBeat;
   setTimeout(PLAYER.playNextStep, dt*1000);
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
        if (PLAYER.isAsync)
            t = t0/PLAYER.ticksPerBeat;
	report(""+t0+" note channel: "+channel+" pitch: "+pitch+" v:"+v+" dur: "+dur);
        MIDI.noteOn(channel, pitch, v, t+PLAYER.delay0);
        MIDI.noteOff(channel, pitch, v, t+dur+PLAYER.delay0);
    }
}

/*
  This version sends all note events immediately and returns.
  Once it returns, nothing more needs to be done.
 */
PLAYER.playAsync = function(obj)
{
    report("Playing Async");
    PLAYER.isAsync = true;
    var events = obj.seq;
    PLAYER.delay0 = 1;
    for (var i=0; i<events.length; i++) {
	PLAYER.handleEventGroup(events[i]);
    }
}

PLAYER.playScale = function(){
    report("scheduling notes");
    MIDI.programChange(0, instrument);
    var firstNote = 21;
    var lastNote = firstNote + 5*12+1;
    var t = 0;
    var delay = 0.6; // delta time - time between events
    var velocity = 127; // how hard the note hits
    var note = 21; // the note to use
    MIDI.setVolume(0, 127);
    for(var note=firstNote; note <= lastNote; ++note){
        MIDI.noteOn(0, note, velocity, t);
	MIDI.noteOff(0, note, t += delay);
    }
    report("finished scheduling notes");
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


PLAYER.getNoteGraphic = function(t, dur, pitch, material)
{
    var y0 = -6;
    var x0 = -8;
    var z0 = 0;
    var gap = .2;
    var w = .1;
    var h = PLAYER.distPerSec*dur;
    material.color.setHSL((pitch%12)/12.0, .6, .5);
    var geometry = new THREE.BoxGeometry( h, w, w );
    var ng = new THREE.Mesh( geometry, material );
    ng._mat = material;
    ng.position.x = x0 + PLAYER.distPerSec*t;
    ng.position.y = y0 + gap * pitch;
    ng.position.z = z0;
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
	var noteGraphic = PLAYER.getNoteGraphic(t, dur, pitch, material);
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
    var gObj = new THREE.Object3D();
    for (var i=0; i<events.length; i++) {
	PLAYER.graphicsHandleEventGroup(gObj, events[i]);
    }
    if (PLAYER.graphicsScale) {
        var s = PLAYER.graphicsScale;
        gObj.scale.x = s[0];
        gObj.scale.y = s[1];
        gObj.scale.z = s[2];
    }
    scene.add(gObj);
    PLAYER.graphics = gObj;
    return gObj;
}

PLAYER.update = function()
{
    if (!PLAYER.graphics)
	return;
    clockTime = Date.now()/1000;
    if (!PLAYER.prevClockTime)
	PLAYER.prevClockTime = clockTime;
    var dt = clockTime - PLAYER.prevClockTime;
    PLAYER.prevClockTime = clockTime;
    dt *= 10.0;
    var dx = dt*PLAYER.distPerSec*dt;
    //report("translating graphic by "+dx);
    PLAYER.graphics.position.x -= dx;
}
