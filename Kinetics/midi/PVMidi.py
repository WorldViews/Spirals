"""
some utilities for dealing with midi
This uses python package python-midi
"""
import traceback
import math
import json
import midi
import os, glob, sys, string
from midi.events import *
import copy

def is_ascii(s):
    return all(ord(c) < 128 for c in s)

import base64

def put(dic, key, val):
    if key in dic:
        dic[key].append(val)
    else:
        dic[key] = [val]

class PVEvent:
    def clone(self):
        return copy.copy(self)

class ProgChangeEvent(PVEvent):
    def __init__(self, t0, ch, instrument):
        self.t0 = t0
        self.channel = ch
        self.instrument = instrument
        
    def rescaleTime(self, sf):
        self.t0 *= sf

    def getT0(self):
        return self.t0

    def setT0(self, t0):
        self.t0 = t0

    def toDict(self):
        d = {"type": "programChange",
             "channel": self.channel,
             "instrument": self.instrument,
             "t0": self.t0}
        return d

    def toList(self):
        return ["programChange", self.t0, self.channel, self.instrument]


class TempoEvent(PVEvent):
    def __init__(self, t0, bpm, mpqn):
        self.t0 = t0
        self.bpm = bpm
        self.mpqn = mpqn
        
    def getT0(self):
        return self.t0

    def rescaleTime(self, sf):
        self.t0 *= sf

    def setT0(self, t0):
        self.t0 = t0

    def toDict(self):
        return {"type": "tempo",
                "t0": self.t0,
                "bpm": self.bpm,
                "mpqn": self.mpqn}

    def toList(self):
        return ["tempo", self.t0, self.bpm, self.mpqn]


class Note(PVEvent):
    def __init__(self, channel, pitch, t0, velocity, dur=None):
        self.channel = channel
        self.pitch = pitch
        self.t0 = t0
        self.velocity = velocity
        self.dur = dur
        self.parts = [[t0,velocity]]
        if dur:
            self.finish(t0+dur)

    def rescaleTime(self, sf):
        t0 = self.getT0()
        self.t0 = sf*t0
        self.dur *= sf
        for part in self.parts:
            part[0] = sf*t0

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
             "channel": self.channel,
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
        lst = ["note", t0, self.channel, self.pitch, v, dur]
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
        self.channels = set()
        self.instruments = set()
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
        self.addEvents(tobj.allEvents())
        self.instruments = self.instruments.union(tobj.instruments)
        self.channels = self.channels.union(tobj.channels)

    def append(self, tobj):
        tMax = self.getMaxTime()
        notes = tobj.allNotes()
        for note in notes:
            nnote = Note(note.channel, note.pitch, note.t0+tMax, note.velocity, note.dur)
            self.addNote(nnote)
        self.tMax = tMax + tobj.getMaxTime()

    def getNumNotes(self):
        return len(self.allNotes())

    def getMinTime(self):
        if not self.events:
            return 0
        return min(self.events.keys())

    def getDur(self):
        return self.getMaxTime()

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
        t = tMax
        #print "t1:",t1
        for evt in self.events[t1]:
            if isinstance(evt, Note):
                #print evt, evt.dur
                if evt.dur:
                    t = t1 + evt.dur
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

    def scalePowerBySin(self):
        t0 = self.getMinTime()
        t1 = self.getMaxTime()
        dur = t1-t0
        print "t0:", t0, "  t1:", t1, "   dur:", dur
        for note in self.allNotes():
            t = note.t0
            f = (t - t0)/float(dur)
            s = math.sin(f*math.pi)
            v = int(note.velocity * s)
            print "%5d %6.4f %3d -> %3d" % (t, s, note.velocity, v)
            note.setVelocity(v)

    def getRescaleTimeMap(self, s0=1, s1=2, maxTime=None):
        if maxTime == None:
            maxTime = self.getMaxTime()
        maxTime = int(maxTime)
        j = 0
        tmap = {}
        for i in range(maxTime+1):
            s = s0 + (s1-s0)*i/(maxTime-1.0)
            j += 1/s
            #print "%5d %7.2f %7.2f" % (i, s, j)
            tmap[i] = int(math.floor(j))
        return tmap

    def rescaleByTimeMap(self, tmap=None):
        if tmap == None:
            tmap = self.getRescaleTimeMap()
        tobj = TrackObj()
        keys = self.events.keys()
        keys.sort()
        for t in keys:
            nt = tmap[t]
            for note in self.events[t]:
                nnote = Note(note.channel, note.pitch, nt, note.velocity, note.dur)
                tobj.addNote(nnote)
        return tobj

    def rescaleTime(self, sf):
        tMax = self.getMaxTime()
        self.setMaxTime(sf*tMax)
        events = self.allEvents()
        self.events = {}
        for evt in events:
            evt.rescaleTime(sf)
            self.addEvent(evt)
            
    def allNotes(self):
        notes = []
        for ev in self.events.values():
            for e in ev:
                if isinstance(e, Note):
                    notes.append(e)
        return notes
        
    def allEvents(self):
        events = []
        for ev in self.events.values():
            for e in ev:
                events.append(e)
        return events

    def addEvents(self, evts):
        for ev in evts:
            self.addEvent(note)

    def addNote(self, note):
        self.addEvent(note)

    def addEvent(self, evt):
        t0 = evt.getT0()
        if t0 in self.events:
            self.events[t0].append(evt)
        else:
            self.events[t0] = [evt]

    def addTempoEvent(self, tempoEvent):
        self.addEvent(tempoEvent)

    def addProgramChangeEvent(self, event):
        self.addEvent(event)
        
    def observeTrack(self, track):
        tn = 0
        openNotes = {}
        for evt in track:
            tick = evt.tick
            tn += tick
            #print "tn: %s tick: %s evt: %s" % (tn, tick, evt)
            if isinstance(evt, NoteEvent):
                ch = evt.channel
                #if ch != 0:
                #    print "ch:", ch
                pitch = evt.pitch
                v = evt.velocity
                #print tn, evt.name, evt.pitch, evt.velocity
                if isinstance(evt, NoteOnEvent):
                    self.channels.add(ch)
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
                        openNotes[pitch] = Note(ch, pitch, tn, v)
                    if v == 0:
                        note = openNotes[pitch]
                        if note.dur == None:
                            note.dur = tn - note.t0
                            #print "added note.dur", note.dur
                        self.addNote(note)
                        del openNotes[pitch]
                elif isinstance(evt, NoteOffEvent):
                    if v != 64:
                        print "NoteOff with v != 64"
                    if pitch in openNotes:
                        note = openNotes[pitch]
                        note.finish(tn)
                        self.addEvent(note)
                        del openNotes[pitch]
                    else:
                        print "NoteOff for unstarted note"
                else:
                    print "Unexpected note type", evt.name
            elif isinstance(evt, TrackNameEvent):
                print "TrackName", evt.text
                if is_ascii(evt.text):
                    self.trackName = evt.text
                else:
                    print "**** Non ascii name", evt.text
            elif isinstance(evt, PitchWheelEvent):
                #print "PitchWheel", evt.pitch
                pass
            elif isinstance(evt, ProgramChangeEvent):
                ch = evt.channel
                instrument = evt.value
                self.channels.add(ch)
                self.instruments.add(instrument)
                print "ProgramChange", ch, instrument
                self.addProgramChangeEvent(ProgChangeEvent(tn, ch, evt.value))
                #if self.instrument != None and self.instrument != evt.value:
                #    print "**** Changing instrument within track"
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
                print "TempoEvent bpm: %s  mpqn: %s" % (bpm, mpqn)
                self.addTempoEvent(TempoEvent(tn, bpm, mpqn))
            elif isinstance(evt, EndOfTrackEvent):
                print "End of track"
            elif isinstance(evt, ControlChangeEvent):
                print "ControlChange"
                pass
            else:
                print "Unrecognized event type:", evt.name
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
                eventsAtT.append(evt.toDict())
            seq.append([t, eventsAtT])
        obj = {'type': 'TrackObj',
               'seq': seq}
        obj['numNotes'] = self.getNumNotes()
        obj['instruments'] = list(self.instruments)
        obj['channels'] = list(self.channels)
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
                #note = Note(n[2], n[1], n[3], n[4])
                note = Note(n[1], n[3], n[2], n[4], n[5])
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
    def __init__(self, path=None, resolution=1000):
        self.tracks = []
        self.instruments = set()
        self.channels = set()
        self.resolution = resolution # this is ticksPerBeat
        self.bpm = 100
        self.format = 1
        self.loop = False
        if path:
            self.load(path)

    def setResolution(self, r):
        self.resolution = r

    def setBPM(self, bpm):
        self.bpm = bpm

    def rescaleTime(self, sf):
        for track in self.tracks:
            track.rescaleTime(sf)

    def getTicksPerSec(self):
        # resolution is ticksPerBeat
        return self.resolution*self.bpm/60.0

    def ticksFromTime(self, t):
        return t*self.getTicksPerSec()

    def timeFromTicks(self, ticks):
        return ticks/self.getTicksPerSec()

    def dumpInfo(self):
        print "Num tracks", len(self.tracks)
        i = 0
        print "Num Name              Notes    Dur   Instruments        Channels"
        for track in self.tracks:
            i += 1
            print "%3d %-18s %4d %7d  %-18s %-18s" % \
                (i, track.trackName, track.getNumNotes(),
                   track.getDur(),  list(track.instruments),
                   list(track.channels))

    def load(self, midiPath):
        pattern = midi.read_midifile(midiPath)
        self.resolution = pattern.resolution
        self.format = pattern.format
        print "pattern.resolution:", pattern.resolution
        print "pattern.format:", pattern.format
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
        self.instruments = self.instruments.union(trackObj.instruments)
        self.channels = self.channels.union(trackObj.channels)
        self.tracks.append(trackObj)

    def toDict(self):
        return {'type': 'MidiObj',
                'instruments': list(self.instruments),
                'channels': list(self.channels),
                'format': self.format,
                'resolution': self.resolution,
                'loop': self.loop,
                'tracks': map(TrackObj.toDict, self.tracks)}

    def saveAsJSON(self, jpath):
        print "Save MidiObj to", jpath
        json.dump(self.toDict(), file(jpath, "w"), indent=4)

    def saveAsMidi(self, mpath, loop=False):
        print "Save MidiObj to", mpath
        pattern = midi.Pattern(resolution=self.resolution)
        for track in self.tracks:
            mtrack = midi.Track()
            mevents = {}
            #put(mevents, 0, midi.ProgramChangeEvent(channel=0, tick=0, value=0))
            for ev in track.allEvents():
                if isinstance(ev, ProgChangeEvent):
                    t = ev.t0
                    me = midi.ProgramChangeEvent(channel=ev.channel, tick=0, value=ev.instrument)
                    put(mevents, t, me)
                elif isinstance(ev, Note):
                    t = ev.t0
                    dur = ev.dur
                    me = midi.NoteOnEvent(channel=ev.channel, tick=0, velocity=ev.velocity, pitch=ev.pitch)
                    put(mevents, t, me)
                    me = midi.NoteOffEvent(channel=ev.channel, tick=0, pitch=ev.pitch)
                    put(mevents, t+dur, me)
                else:
                    continue
            tvals = mevents.keys()
            tvals.sort()
            prevT = 0
            for t in tvals:
                dt = t - prevT
                prevT = t
                mevs = mevents[t]
                i = 0
                for mev in mevs:
                    i += 1
                    mev.tick = 0
                    if i == 1:
                        mev.tick = int(dt)
                    mtrack.append(mev)
            if loop:
                mtrack.append(midi.TrackLoopEvent(tick=0))
            mtrack.append(midi.EndOfTrackEvent(tick=0))
            pattern.append(mtrack)
        #print pattern
        midi.write_midifile(mpath, pattern)


def convertToJSON(path, jpath=None):
    if not jpath:
        jpath = path.replace(".mid", ".json")
    midiObj = MidiObj(path)
    midiObj.dumpInfo()
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

def processAll(force=False):
    #fnames = os.listdir(".")
    fnames = glob.glob("*") + glob.glob("*/*")
    ids = {}
    for fname in fnames:
        fname = fname.replace("\\", "/")
        name, ext = os.path.splitext(fname)
        ext = ext.lower()
        if ext not in [".mb64", ".mid"]:
            continue
        ids[name] = fname
        if ext == ".mb64" and os.path.exists(name+".mid"):
            print "Skipping conversion to .mid"
            continue
        print name
        if os.path.exists(name+".json") and not force:
            print "Skipping %s because .json exists" % name
            continue
        process(fname, force)
    names = ids.keys()
    names.sort()
    json.dump(names, file("compositions.json", "w"), indent=4)

def process(path=None, force=False):
    if path == None:
        return processAll(force)
    print "="*64
    print "path:", path
    if path.endswith(".mb64"):
        mpath = path.replace(".mb64", ".mid")
        convert(path, mpath)
        path = mpath
    jpath = path.replace(".mid", ".json")
    if force or not os.path.exists(jpath):
        convertToJSON(path)
    #pattern = midi.read_midifile(path)
    #print pattern

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
    process("cello2.mid", force=True)
    return
    process("EarthAndSky.mid")
    process("DistantDrums.mid")
    process("BluesRhythm1.mid")
    return
    process("shimauta1.mid")
    process("minute_waltz.mid")
    process("jukebox.mid")
    process("beethovenSym5m1.mb64")
    process("chopin69.mb64")
    process("wtc0.mb64")
    process("passac.mid")

if __name__ == '__main__':
    run()

