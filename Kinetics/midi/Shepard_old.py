"""
"""
from PVMidi import Note, TrackObj, MidiObj, playMelody

import math
import json
import midi
from midi.events import *


class ShepVoice:
    def __init__(self, noctaves=4, i0=0, dur=1):
        self.noctaves = noctaves
        self.nsteps = 12*noctaves
        self.low = 21
        self.high = self.low + self.nsteps
        self.i0 = i0
        self.dur = dur
        self.ticksPerBeat = 1000

    def getNote(self, tOn, n, dur=None):
        if dur == None:
            dur = self.dur
        step = (n - self.i0) % self.nsteps
        p = self.low + step
        f = (p-self.low)/float(self.nsteps - 1)
        a = int(120 * math.sin(f*math.pi))
        if a == 0:
            return 0, None
        tOff = tOn + dur*self.ticksPerBeat
        return tOn, Note(p, tOn, a, dur*self.ticksPerBeat)

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

def genShepard(path, nvoices=5, noctaves=5, nnotes=200, motif=None):
    if motif:
        motif = parse(motif)
    print "="*60
    print "Generating Shepard Tones"
    tobj = TrackObj(trackName="Track1")
    t = 0
    for v in range(nvoices):
        sv = ShepVoice(noctaves, 12*v)
        for i in range(nnotes):
            j = i
            dur = 1
            if motif:
                j,dur = motif[i % len(motif)]
            #print j, dur
            tOn, note = sv.getNote(t, j, dur)
            t += sv.ticksPerBeat*dur
            if note:
                #print i, note.toList()
                tobj.addNote(note)
    midiObj = MidiObj()
    midiObj.addTrack(tobj)
    midiObj.saveAsJSON(path)

    
def run():
    genShepard("shepard_major.json", motif="1 3 5 6 8 10 12")
    genShepard("shepard_5_5.json")
    genShepard("shepard2.json", motif="1e 3e 5e 1q 5e 6e 8h 10 6 10 12")
    playMelody("shepard2")

if __name__ == '__main__':
    run()



