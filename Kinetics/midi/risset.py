"""
This is an attempt to implement risset rhythm mapping
via the description given by Dan Stowell

http://c4dm.eecs.qmul.ac.uk/papers/2011/Stowell2011icmc.pdf

"""

from PVMidi import TrackObj, MidiObj, Note, ProgChangeEvent
from math import log, pow, cos, floor, pi

def round(r):
    return int(r+0.5)

def lg(x):
    return log(x)/log(2.0)

def pw2(v):
    return pow(2.0,v)
    """
    if v == 0:
        return 1
    return 2*pw2(v-1)
    """

class RissetMapper:
    """
    This class has time remmapping functions for taking base
    peices with events at times tl (for 'logical time') and
    mapping to actual elapsed times te in the Risset output.
    """
    def __init__(self, T, tau):
        self.T = T
        self.tau = tau

    def get_rate(self, te, v=0):
        r = (self.T * log(2)/self.tau) * pow(2,te/self.tau+v)
        return r

    def get_te(self, tl, v):
        te_vals = []
        N = pw2(v)
        num = N
        if num >= 1:
            num = int(floor(num+0.000001))
        if num < 1:
            num = 1
        #print num
        for w in range(num):
            a = (tl + (w+N)*self.T) / self.T
            te = self.tau * (lg(a) - v)
            if te <= self.tau:
                te_vals.append(te)
        return te_vals

def testMap():
    r = Risset(16, 16)
    print "0,0", r.get_te(0,0)
    print "0,1", r.get_te(0,1)
    print "0,2", r.get_te(0,2)
    print "4,0", r.get_te(4,0)
    print "4,1", r.get_te(4,1)
    print "4,2", r.get_te(4,1)
    print "0,-1", r.get_te(0,-1)

"""
def save(tObj, path):
    print "save:", path
    mObj = MidiObj()
    mObj.addTrack(tObj)
    mObj.saveAsJSON(path)
    mObj.dumpInfo()
"""

class Risset:
    def __init__(self, resoluton=None):
        self.resolution = resoluton # ticks per beat

    def remapMidi(self, mobj, tau=None, vLow=-2, vHigh=2, inst=127, fch=None, repeats=None):
        if len(mobj.tracks) != 1:
            print "Can only map single track Midi right now"
            return
        res = mobj.resolution
        if self.resolution != None and res != self.resolution:
            print "**** CHanging resoluton from %s to %s" % (res, self.resolution)
            res = self.resolution
        rmObj = self.remapTrack(mobj.tracks[0], tau, vLow, vHigh, inst, fch, res, repeats)
        return rmObj

    def remapTrack(self, tobj, tau=None, vLow=-2, vHigh=2, inst=127, fch=None, res=None, repeats=None):
        if res == None:
            res = self.resolution
        if res == None:
            print "Cannot remap track without resolution"
            return
        mObj = MidiObj(resolution=res)
        T = tobj.getMaxTime()
        print "T:", T
        if tau == None:
            tau = T
        tau = T
        rmap = RissetMapper(T, tau)
        reMax = rmap.get_te(T,0)[0]
        print "rmap(T):", reMax
        ch = 0
        for v in range(vLow, vHigh+1):
            print "v: ", v
            #rtObj = self.remapv(tobj, v, tau, ch=ch, inst=10+v)
            if fch != None:
                ch = fch
            rtObj = self.remapv(tobj, v, tau, ch=ch, inst=inst)
            rtObj.trackName = "risset v=%s" % v
            if repeats:
                rt0 = TrackObj()
                for i in range(repeats):
                    rt0.append(rtObj)
                rtObj = rt0
            mObj.addTrack(rtObj)
            ch += 1
        #mObj.resolution = rtObj.resolution
        mObj.loop = True
        return mObj

    def power(self, r, b=5, rc=1.0):
        toct = lg(r/rc) # tempo octaves from middle
        f = toct/(b/2.0)
        p = 0.5 * (cos(pi*f) + 1)
        #print "power r: %6.2f toct: %6.2f f: %6.2f p: %6.2f" % (r,toct, f, p)
        return p

    def remapv(self, tObj, v, tau=None, rtObj=None, ch=0, inst=0):
        print "------------------------"
        print "remapv", v
        T = tObj.getMaxTime()
        if rtObj == None:
            rtObj = TrackObj()
            rtObj.addEvent(ProgChangeEvent(0, ch, inst))
        print "T:", T
        if tau == None:
            tau = T
        tau = T
        rmap = RissetMapper(T, tau)
        reMax = rmap.get_te(T,0)[0]
        print "rmap(T):", reMax
        tvals = tObj.events.keys()
        tvals.sort()
        nNotes = 0
        for tv in tvals:
            for ev in tObj.events[tv]:
                if not isinstance(ev, Note):
                    print "Skipping non note object", ev.__class__.__name__
                    continue
                tl = ev.t0
                dur = ev.dur
                tes = rmap.get_te(tl, v)
                #print "tl: %7.2f te: %s" % (tl, tes)
                for te in tes:
                    rate = rmap.get_rate(te, v)
                    p = self.power(rate)
                    #print "v: %d te: %6.2f rate: %5.2f p: %5.1f" % (v, te, rate, p)
                    dr = dur/rate
                    if rate>2:
                        dr = dur
                    note = Note(ch, ev.pitch, round(te), round(p*ev.velocity), dr)
                    rtObj.addNote(note)
                    nNotes += 1
        #rtObj.resolution = tObj.resolution
        rtObj.instruments = [inst]
        rtObj.channels = [ch]
        print "nNotes:", nNotes
        return rtObj


def genTrackBasicBeat0(resolution):
    t = TrackObj()
    numMeasures = 8
    tpb = resolution  # ticks per beat
    bpm = 4           # beats per measure
    for m in range(numMeasures):
        b = m*bpm
        t0 = b * tpb
        print "b: %3d t: %8.3f" % (b, t0)
        #              c  p   t          v    dur
        t.addNote(Note(0, 50, t0,        90,   0.5*tpb))
        #t.addNote(Note(0, 51, t0+1*tpb,  60,  0.5*tpb))
        t.addNote(Note(0, 51, t0+0.5*tpb,  60,  0.25*tpb))
        t.addNote(Note(0, 52, t0+2*tpb,  70,    0.25*tpb))
        t.addNote(Note(0, 53, t0+3*tpb,  70,    0.5*tpb))
    t.setMaxTime(t0 + bpm*tpb)
    m = MidiObj(resolution=tpb)
    m.addTrack(t)
    return m

def genTrackBasicBeat1(resolution):
    t = TrackObj()
    numMeasures = 8
    tpb = resolution  # ticks per beat
    bpmeasure = 4           # beats per measure
    for m in range(numMeasures):
        b = m*bpmeasure
        t0 = b * tpb
        print "b: %3d t: %8.3f" % (b, t0)
        #              c  p   t          v    dur
        t.addNote(Note(0, 50, t0,        90,  0.25*tpb))
        t.addNote(Note(0, 50, t0+1*tpb,  70,  0.25*tpb))
        t.addNote(Note(0, 50, t0+2*tpb,  70,  0.25*tpb))
        t.addNote(Note(0, 50, t0+3*tpb,  70,  0.25*tpb))
    t.setMaxTime(t0 + bpmeasure*tpb)
    m = MidiObj(resolution=tpb)
    m.addTrack(t)
    return m

def genBasic(resolution=300):
    mObj = genTrackBasicBeat1(resolution)
    print "------------------"
    r = Risset()
    mObj.saveAsJSON("Risset/basicBeat.json")
    mObj.saveAsMidi("Risset/basicBeat.mid")
    mObj.dumpInfo()
    rmObj = r.remapMidi(mObj, inst=11, fch=9, repeats=4)
    rmObj.saveAsJSON("Risset/rissetBeat.json")
    rmObj.saveAsMidi("Risset/rissetBeat.mid", loop=True)
    rmObj.dumpInfo()

"""
def gen(mpath):
    jpath = mpath.replace(".mid", ".json")
    rpath = mpath.replace(".mid", "_ris.mid")
    mObj = MidiObj(mpath)
    mObj.saveAsMidi("check1.mid")
    mObj.rescaleTime(100)
    mObj.saveAsMidi("check5.mid")
    mObj.saveAsJSON(jpath)
    print "Resolution:", mObj.resolution
    print "ntracks:", len(mObj.tracks)
    r = Risset(mObj.resolution * 50)
    #rmObj = r.remapMidi(mObj, inst=11, fch=9)
#    t0 = mObj.tracks[0]
#    t0.resolution = mObj.resolution
    rmObj = r.remapMidi(mObj, inst=11, fch=9)
    rmObj.saveAsMidi(rpath, loop=True)
"""


if __name__ == '__main__':
    genBasic()
#    gen("AYOUB_Jas.mid")

