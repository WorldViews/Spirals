"""
some utilities for dealing with midi
This uses python package python-midi
"""
import traceback
import math
import json
import midi
from midi.events import *


import base64

class TempoEvent:
    def __init__(self, t0, bpm, mpqn):
        self.t0 = t0
        self.bpm = bpm
        self.mpqn = mpqn
        
    def getT0(self):
        return self.t0

    def setT0(self, t0):
        self.t0 = t0

    def toList(self):
        return ["tempo", self.t0, self.bpm, self.mpqn]


class Note:
    def __init__(self, pitch, t0, velocity, dur=None):
        self.pitch = pitch
        self.t0 = t0
        self.velocity = velocity
        self.dur = dur
        self.parts = [[t0,velocity]]
        if dur:
            self.finish(t0+dur)

    def setT0(self, t0):
        self.t0 = t0
        self.parts[0][0] = t0

    def setVelocity(self, v):
        self.velocity = v
        self.parts[0][1] = v

    def getT0(self):
        return self.parts[0][0]

    def extend(self, t, velocity):
        self.parts.append([t,velocity])

    def finish(self, t):
        self.parts.append([t,0])

    def toDict(self):
        t0 = self.parts[0][0]
        v = self.parts[0][1]
        dur = self.parts[-1][0] - t0
        d = {"type": "note",
             "t0": t0,
             "pitch": self.pitch,
             "dur": dur,
             "v": v}
        if len(self.parts) != 2:
            print "Note with other than less than 2 parts"
            d['parts'] = self.parts
        return d

    def toList(self):
        t0 = self.parts[0][0]
        v = self.parts[0][1]
        dur = self.parts[-1][0] - t0
        lst = ["note", t0, self.pitch, v, dur]
        if len(self.parts) != 2:
            print "Note with %d parts" % len(self.parts)
            lst.append(self.parts)
        return lst


class TrackObj:
    def __init__(self, trackOrPath=None, trackName=None):
        self.tMax = None
        self.trackName = trackName
        self.events = {}
        self.instrument = None
        if trackOrPath == None:
            return
        if type(trackOrPath) in [type("str"), type(u"str")]:
            self.loadJSON(trackOrPath)
        else:
            self.observeTrack(trackOrPath)

    def merge(self, tobj):
        """
        Copy all notes from other track to play in parallel.
        """
        self.addNotes(tobj.allNotes())

    def append(self, tobj):
        tMax = self.getMaxTime()
        notes = tobj.allNotes()
        for note in notes:
            nnote = Note(note.pitch, note.t0+tMax, note.velocity, note.dur)
            self.addNote(nnote)
        self.tMax = tMax + tobj.getMaxTime()

    def getNumNotes(self):
        return len(self.allNotes())

    def getMinTime(self):
        if not self.events:
            return 0
        return min(self.events.keys())

    def setMaxTime(self, tMax):
        self.tMax = tMax

    def getMaxTime(self):
        if self.tMax != None:
            return self.tMax
        if not self.events:
            return 0
        times = self.events.keys()
        times.sort()
        t1 = times[-1]
        tMax = t1
        #print "t1:",t1
        for note in self.events[t1]:
            t = t1 + note.dur
            tMax = max(tMax, t)
        self.tMax = tMax
        return t

    def scalePower(self, s0, s1=None):
        t0 = self.getMinTime()
        t1 = self.getMaxTime()
        dur = t1-t0
        print "t0:", t0, "  t1:", t1, "   dur:", dur
        if s1 == None:
            s1 = s0
        for note in self.allNotes():
            t = note.t0
            f = (t - t0)/float(dur)
            s = s0 + f*(s1-s0)
            v = int(note.velocity * s)
            print "%5d %6.4f %3d -> %3d" % (t, s, note.velocity, v)
            note.setVelocity(v)

    def rescaleTime(self, s0=1, s1=2, maxTime=None):
        if maxTime == None:
            maxTime = self.getMaxTime()
        maxTime = int(maxTime)
        j = 0
        tmap = {}
        for i in range(maxTime):
            s = s0 + (s1-s0)*i/(maxTime-1.0)
            j += 1/s
            #print "%5d %7.2f %7.2f" % (i, s, j)
            tmap[i] = int(math.floor(j))
        return tmap

    def rescaleByTime(self, tmap=None):
        if tmap == None:
            tmap = self.rescaleTime()
        tobj = TrackObj()
        keys = self.events.keys()
        keys.sort()
        for t in keys:
            nt = tmap[t]
            for note in self.events[t]:
                nnote = Note(note.pitch, nt, note.velocity, note.dur)
                tobj.addNote(nnote)
        return tobj

    def allNotes(self):
        notes = []
        for ev in self.events.values():
            for note in ev:
                notes.append(note)
        return notes

    def addNotes(self, notes):
        for note in notes:
            self.addNote(note)

    def addNote(self, note):
        t0 = note.getT0()
        if t0 in self.events:
            self.events[t0].append(note)
        else:
            self.events[t0] = [note]

    def addTempoEvent(self, tempoEvent):
        self.addNote(tempoEvent)
        
    def observeTrack(self, track):
        tn = 0
        openNotes = {}
        for evt in track:
            tick = evt.tick
            tn += tick
            #print "tn: %s tick: %s evt: %s" % (tn, tick, evt)
            if isinstance(evt, NoteEvent):
                ch = evt.channel
                if ch != 0:
                    print "ch:", ch
                pitch = evt.pitch
                v = evt.velocity
                #print tn, evt.name, evt.pitch, evt.velocity
                if isinstance(evt, NoteOnEvent):
                    if pitch in openNotes:
                        if openNotes[pitch].parts[-1] == [tn,v]:
                            print "*** ignoring redundant NoteOn ****"
                        else:
                            openNotes[pitch].extend(tn,v)
                            if v != 0:
                                print "*** extending note", openNotes[pitch].parts
                    else:
                        if v == 0:
                            print "**** Warning ignoring note with velocity 0 ****"
                            continue
                        openNotes[pitch] = Note(pitch, tn, v)
                    if v == 0:
                        note = openNotes[pitch]
                        self.addNote(note)
                        del openNotes[pitch]
                elif isinstance(evt, NoteOffEvent):
                    if v != 64:
                        print "NoteOff with v != 64"
                    if pitch in openNotes:
                        note = openNotes[pitch]
                        note.finish(tn)
                        self.addNote(note)
                        del openNotes[pitch]
                    else:
                        print "NoteOff for unstarted note"
                else:
                    print "Unexpected note type", evt.name
            elif isinstance(evt, TrackNameEvent):
                print "TrackName", evt.text
                #self.trackName = evt.text
            elif isinstance(evt, PitchWheelEvent):
                #print "PitchWheel", evt.pitch
                pass
            elif isinstance(evt, ProgramChangeEvent):
                print "ProgramChange", evt.value
                if self.instrument != None and self.instrument != evt.value:
                    print "**** Changing instrument within track"
                self.instrument = evt.value
            elif isinstance(evt, TimeSignatureEvent):
                n = evt.numerator
                d = evt.denominator
                met = evt.metronome
                s30 = evt.thirtyseconds
                print "TimeSignature %s/%s met: %s s30: %s" % \
                      (n,d, met, s30)
            elif isinstance(evt, SetTempoEvent):
                bpm = evt.bpm
                mpqn = evt.mpqn
                #print "TempoEvent bpm: %s  mpqn: %s" % (bpm, mpqn)
                self.addTempoEvent(TempoEvent(tn, bpm, mpqn))
            elif isinstance(evt, EndOfTrackEvent):
                print "End of track"
            elif isinstance(evt, ControlChangeEvent):
                pass
            else:
                print evt.name
        #
        # Now must close any open notes
        for pitch in openNotes:
            note = openNotes[pitch]
            note.finish(tn)
            self.addNote(note)

    def toDict(self):
        seq = []
        keys = self.events.keys()
        keys.sort()
        for t in keys:
            eventsAtT = []
            evts = self.events[t]
            for evt in evts:
                eventsAtT.append(evt.toList())
            seq.append([t, eventsAtT])
        obj = {'type': 'TrackObj',
               'seq': seq}
        if self.instrument != None:
            obj['instrument'] = self.instrument
        if self.trackName:
            obj['trackName'] = self.trackName
        if self.tMax != None:
            obj['tMax'] = self.tMax
        return obj

    def saveAsJSON(self, path):
        print "Saving TrackObj to", path
        json.dump(self.toDict(), file(path, "w"),indent=4, sort_keys=True)
        
    def loadJSON(self, path):
        print "Loading TrackObj from", path
        obj = json.load(file(path))
        if 'tMax' in obj:
            self.tMax = obj['tMax']
        evList = obj['seq']
        for ev in evList:
            t, noteList = ev
            notes = []
            for n in noteList:
                note = Note(n[2], n[1], n[3], n[4])
                notes.append(note)
            self.events[t] = notes

    def dump(self):
        print "%d complete notes" % len(self.notes)
        i = 0
        for note in self.notes:
            print note
            if i >= 10:
                break

class MidiObj:
    def __init__(self, path=None):
        self.tracks = []
        if path:
            self.load(path)

    def load(self, midiPath):
        pattern = midi.read_midifile(midiPath)
        i = 0;
        print type(pattern)
        ntracks = len(pattern)
        print "ntracks:", ntracks
        for track in pattern:
            i += 1
            trackName = "Track%d" % i
            #if ntracks > 1:
            #    jpath = path.replace(".mid", "%d.json" % i)
            print trackName
            self.addTrack(TrackObj(track, trackName))

    def addTrack(self, trackObj):
        self.tracks.append(trackObj)

    def toDict(self):
        return {'type': 'MidiObj',
                'tracks': map(TrackObj.toDict, self.tracks)}

    def saveAsJSON(self, jpath):
        print "Save MidiObj to", jpath
        json.dump(self.toDict(), file(jpath, "w"), indent=4)

        

def XconvertToJSON(path, jpath=None):
    if not jpath:
        jpath = path.replace(".mid", ".json")
    pattern = midi.read_midifile(path)
    i = 0;
    print type(pattern)
    ntracks = len(pattern)
    print "ntracks:", ntracks
    for track in pattern:
        i += 1
        #if ntracks > 1:
        #    jpath = path.replace(".mid", "%d.json" % i)
        print "track %d" % i
        tobj = TrackObj(track)
        #tobj.dump()
        tobj.saveAsJSON(jpath)
        """
        for evt in track:
            print ".....", evt
        """
        print "-------"


def convertToJSON(path, jpath=None):
    if not jpath:
        jpath = path.replace(".mid", ".json")
    midiObj = MidiObj(path)
    midiObj.saveAsJSON(jpath)

"""
Convert one of the base64 coded data urls found
in euphomy tracks directory to proper .mid file.
"""
def convert(b64path, mpath):
    str = file(b64path).read()
    i = str.find(",")
    data = str[i+1:]
    mid = base64.b64decode(data)
    file(mpath,"wb").write(mid)

def dump(path):
    print "="*64
    print "path:", path
    if path.endswith(".mb64"):
        mpath = path.replace(".mb64", ".mid")
        convert(path, mpath)
        path = mpath
    if 1:
        convertToJSON(path)
    if 0:
        pattern = midi.read_midifile(path)
        print pattern

def playMelody(name):
    try:
        playMelody_(name)
    except:
        traceback.print_exc()

def playMelody_(name):
    import websocket
    #ws = websocket.create_connection("ws://echo.websocket.org/")
    ws = websocket.create_connection("ws://localhost:8100/")
    msg = {'msgType': 'midi.play', 'name': name}
    jstr = json.dumps(msg)
    ws.send(jstr)
    result = ws.recv()
    print "result"

def run():
    dump("shimauta1.mid")


if __name__ == '__main__':
    run()



