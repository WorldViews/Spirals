"""
"""
from PVMidi import Note, TrackObj, MidiObj, playMelody

import os, math, json
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
        if s[0] == 'r':
            n = 'r'
        else:
            n = int(s[:-1])
    else:
        dur = 32
        if s[0] == 'r':
            n = 'r'
        else:
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
        self.ticksPerBeat = 800

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
            ndur = .8*dur
            if v <= 0:
                continue
            note = Note(0, p, t, v, ndur*self.ticksPerBeat)
            notes.append(note)
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
                if j == 'r':
                    self.t += dur*self.ticksPerBeat
                    continue
            else:
                j = i % 12
            #print i, j
            notes = self.getChord(j, dur)
            self.t += dur*self.ticksPerBeat
            for note in notes:
                tobj.addNote(note)

        midiObj = MidiObj()
        midiObj.addTrack(tobj)
        midiObj.saveAsJSON(path)
        mpath = path.replace(".json", ".mid")
        midiObj.saveAsMidi(mpath)


def run():
    s = Shepard()
    s.gen("Shepard/shepard.json")
    s.gen("Shepard/shepard_cmajor.json", motif="1 3 5 6 8 10 12")
    s.gen("Shepard/shepard2.json", motif="1e 3e 5e 1q 5e 6e 8h 10 6 10 12")
    s.gen("Shepard/shepard3.json",
     motif="1q 3q 5q 3q 5q 6q 5q 6q 8q 6h 6q 8q 10q 8q 10q 12q 10q 12q 1q 1h")
    s.gen("Shepard/shepard4_cmajor.json",
     motif="1q 3q 5q 3q 5q 6q 5q 6q 8q 6q 8q 10q 8q 10q 12q 10q 12q 1q 12q")
    s.gen("Shepard/shepard4.json",
     motif="1q 2q 3q 2q 3q 4q 3q 4q 5q 4q 5q 6q 5q 6q 7q 6q 7q 8q "\
           "7q 8q 9q 8q 9q 10q 9q 10q 11q 10q 11q 12q 11q 12q")#
    s.gen("Shepard/shepard5.json",
     motif="1q 2q 3h 2q 3q 4h 3q 4q 5h 4q 5q 6h 5q 6q 7h 6q 7q 8h "\
           "7q 8q 9h 8q 9q 10h 9q 10q 11h 10q 11q 12h 11q 12q 1h 12q 1q 2h")
    s.gen("Shepard/shepard6.json", motif="""
1e 2e 3e 4h
2e 3e 4e 5h
3e 4e 5e 6h
4e 5e 6e 7h
5e 6e 7e 8h
6e 7e 8e 9h
7e 8e 9e 10h
8e 9e 10e 11h
9e 10e 11e 12h
10e 11e 12e 1h
11e 12e 1e 2h
12e 1e 2e 3h""")
    os.system("Shepard/shepard6.mid")
#    playMelody("shepard4")

def run():
    s = Shepard()
    s.gen("Shepard/xxx.json", motif="""
2q 1q 2q 4q 6q 4q 6q 7q 9q 6q 9q 11q 1q 9q 11q 1q
""")
    s.gen("Shepard/xxx.json", motif="""
2q 1q 2q 4q 6q 4q 6q 7q 9q 6q 9q 11q 1q 9q 11q 1q 2q rw rw rw
""")
    s.gen("Shepard/xxx.json", motif="""
2q 1q 2q 4q 6q 4q 6q 7q 9q 6q 9q 11q 1q 9q 11q 1q 2q 1q 2q 4q rw rw rw
""")
    s.gen("Shepard/x1.json", motif="""
2q 1q 2q 4q 6q 4q 6q 7q 9q 6q 9q 11q 1q 9q 11q 1q 
""")
    s.gen("Shepard/x2.json", motif="""
1 2 3 2 3 4 3 4 5 4 5 6 5 6 7 6 7 8 7 8 9 8 9 10 9 10 11 10 11 1 11 1 2
""")
    s.gen("Shepard/x2_cmajor.json", motif="""
1 3 5 3 5 6 5 6 8 6 8 10 8 10 12 10 12 1 12 1 3
""")

    os.system("Shepard/xxx.mid")

if __name__ == '__main__':
    run()



