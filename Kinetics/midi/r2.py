
from PVMidi import TrackObj, Note

t1 = TrackObj("risset0.25_0.5.json")
t2 = TrackObj("risset0.5_1.json")
t3 = TrackObj("risset1_2.json")
t4 = TrackObj("risset2_4.json")

print "t1 tMax: %8.2f %5d" % (t1.getMaxTime(), t1.getNumNotes())
print "t2 tMax: %8.2f %5d" % (t2.getMaxTime(), t2.getNumNotes())
print "t3 tMax: %8.2f %5d" % (t3.getMaxTime(), t3.getNumNotes())
print "t4 tMax: %8.2f %5d" % (t4.getMaxTime(), t4.getNumNotes())

rt = TrackObj()
rt.append(t1)
rt.append(t2)
rt.append(t3)
rt.append(t4)
rt.saveAsJSON("rissetvoice.json")

rt = TrackObj("rissetvoice.json")
print "rt tMax: %8.2f %5d" % (rt.getMaxTime(), rt.getNumNotes())
