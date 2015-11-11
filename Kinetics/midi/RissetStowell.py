"""
This is an attempt to implement risset rhythm mapping
via the description given by Dan Stowell

http://c4dm.eecs.qmul.ac.uk/papers/2011/Stowell2011icmc.pdf

"""
from PVMidi import TrackObj, MidiObj, Note
from math import log, pow, floor

def lg(x):
    return log(x)/log(2.0)

def pw2(v):
    return pow(2.0,v)
    """
    if v == 0:
        return 1
    return 2*pw2(v-1)
    """

class Risset:
    def __init__(self, T, tau):
        self.T = T
        self.tau = tau

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
            #te = self.tau * lg( (tl + w*self.T + N)/float(self.T)) - v
            a = (tl + (w+N)*self.T) / self.T
            #print "a:", a
            te = self.tau * (lg(a) - v)
            #te = self.tau * lg( (tl + (w+N)*self.T)/float(self.T)) - v
            te_vals.append(te)
        return te_vals

def test1():
    r = Risset(16, 16)
    print "0,0", r.get_te(0,0)
    print "0,1", r.get_te(0,1)
    print "0,2", r.get_te(0,2)
    print "4,0", r.get_te(4,0)
    print "4,1", r.get_te(4,1)
    print "4,2", r.get_te(4,1)
    print "0,-1", r.get_te(0,-1)


test1()
