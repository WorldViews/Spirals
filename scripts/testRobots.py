
import sys, time
from math import sin,cos
import WVPoster

def run():
    wvp = WVPoster.WVPoster()
    i = 0
    while 1:
        i += 1
        x = 20+5*cos(i/10.0)
        y = 15 + 10*sin(i/10.0)
        obj = {'type': 'robot',
               'id': 'pal_robot_beam1',
               'coordSys': 'PAL',
               'status': 'available',
               'position': [x, y, 0]}
        print "posting", obj
        wvp.postToSIO("robots", obj)
        time.sleep(1)


if __name__ == '__main__':
    run()

