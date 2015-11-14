
from PVMidi import TrackObj, MidiObj, Note

def save(tObj, path):
    mObj = MidiObj()
    mObj.addTrack(tObj)
    mObj.saveAsJSON(path)

path = "BluesRhythm1.mid"
m = MidiObj(path)
print m.tracks
t = m.tracks[1]
rt = t.rescaleByTime(t.rescaleTime(0.25, 2.0))
rt.scalePowerBySin()
save(rt, "ris1.json")


