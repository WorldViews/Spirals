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

def test1():
    r = Risset(16, 16)
    print "0,0", r.get_te(0,0)
    print "0,1", r.get_te(0,1)
    print "0,2", r.get_te(0,2)
    print "4,0", r.get_te(4,0)
    print "4,1", r.get_te(4,1)
    print "4,2", r.get_te(4,1)
    print "0,-1", r.get_te(0,-1)


if __name__ == '__main__':
    test1()

