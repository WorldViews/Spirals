"""
"""
from PVMidi import Note, TrackObj, MidiObj, playMelody

import math
import json
import midi
from midi.events import *


noteTypes = {'q': 32,
             'h': 64,
             'w': 128,
             'e': 16,
             's': 8}

def getDur(s):
    c = s[-1]
    if c in noteTypes:
        dur = noteTypes[c]
        n = int(s[:-1])
    else:
        dur = 32
        n = int(s)
    dur = dur/32.0
    return (n,dur)

def parse(str):
    parts = str.split()
    return map(getDur, parts)


class Shepard:
    def __init__(self, noctavesBelow=2, base=46):
        self.noctavesBelow = noctavesBelow
        self.noctavesAbove = noctavesBelow
        self.base = base
        self.t = 0
        self.dur = 10
        self.ticksPerBeat = 1000

    def getChord(self, pitch, dur=None, t=None):
        if dur == None:
            dur = self.dur
        if t == None:
            t = self.t
        notes = []
        method = 2
        p0 = pitch + self.base
        low = p0 - self.noctavesBelow*12
        high = p0 + self.noctavesBelow*12
        gap = high - low
        s = 0.9
        for j in range(-self.noctavesBelow, self.noctavesAbove+1):
            p = j*12 + p0
            dp = p - p0
            if method == 2:
                dp = p - self.base
            f = dp/float(gap)
            a = math.cos(s*f*math.pi)
            v = int(120*a)
            #print "  ", p0, p, dp, f, a, v
            if v <= 0:
                continue
            note = Note(0, p, t, v, dur*self.ticksPerBeat)
            notes.append(note)
        self.t = t + dur*self.ticksPerBeat
        return notes

    def gen(self, path, nnotes=200, motif=None):
        self.t = 0
        if motif:
            motif = parse(motif)
        print "="*60
        print "Generating Shepard Tones"
        tobj = TrackObj(trackName="Track1")
        for i in range(nnotes):
            dur = 1
            if motif:
                j,dur = motif[i % len(motif)]
            else:
                j = i % 12
            #print i, j
            notes = self.getChord(j, dur)
            for note in notes:
                tobj.addNote(note)

        midiObj = MidiObj()
        midiObj.addTrack(tobj)
        midiObj.saveAsJSON(path)

    
def run():
    s = Shepard()
    s.gen("shepard.json")
    s.gen("shepard_major.json", motif="1 3 5 6 8 10 12")
    s.gen("shepard2.json", motif="1e 3e 5e 1q 5e 6e 8h 10 6 10 12")
    playMelody("shepard2")

if __name__ == '__main__':
    run()



