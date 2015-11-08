
from PVMidi import TrackObj, MidiObj, Note

def save(tObj, path):
    mObj = MidiObj()
    mObj.addTrack(tObj)
    mObj.saveAsJSON(path)

def genTrack():
    t = TrackObj()
    for i in range(10):
        t0 = 400*i
        v1 = 50
        v2 = 90
        v3 = 30
        t.addNote(Note(50, t0,     v1,  25))
        t.addNote(Note(51, t0+50,  v2,  25))
        t.addNote(Note(52, t0+200, v2,  50))
        t.addNote(Note(53, t0+300, v2,  25))
        t.setMaxTime(t0 + 400)
    return t

#t = genTrack()
t = TrackObj("BluesRhythm1.json")

t.saveAsJSON("foo.json")
print "t.maxTime", t.getMaxTime()
print "=========================================="
print "1_2"
rt1 = t.rescaleByTime(t.rescaleTime(0.25, 0.5))
rt1.scalePower(0, 0.3)
save(rt1, "risset0.25_0.5.json")
print "=========================================="

rt2 = t.rescaleByTime(t.rescaleTime(0.5, 1))
rt2.scalePower(0.3, 1)
save(rt2, "risset0.5_1.json")

rt3 = t.rescaleByTime(t.rescaleTime(1, 2))
rt3.scalePower(1, 0.3)
save(rt3, "risset1_2.json")

rt4 = t.rescaleByTime(t.rescaleTime(2, 4))
rt4.scalePower(0.3, 0)
save(rt4, "risset2_4.json")

rv = TrackObj()
rv.append(rt1)
rv.append(rt2)
rv.append(rt3)
rv.append(rt4)
save(rv, "rissetvoice.json")

"""
rt = TrackObj()
rt.append(rt4)
rt.append(rt4)
rt.saveAsJSON("risset2_4x2.json")

rt = TrackObj()
rt.merge(rt1)
rt.merge(rt2)
rt.merge(rt3)
rt.merge(rt4)
rt.saveAsJSON("crazy_risset.json")
"""
"""
tmap = t.rescaleTime(1, 2)
tvals = tmap.keys()
tvals.sort()
for t in tvals:
    print t, tmap[t]
"""


