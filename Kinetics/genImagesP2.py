
from math import log, pow
import os
import Image

def lg(x):
    return log(x)/log(2.0)

def truncDown(n):
    return int(pow(2,int(lg(n))))

def verifyDir(path):
   if not os.path.exists(path):
       print "Creating", path
       os.mkdir(path)

def genImagesPow2(inputDir, outputDir):
    verifyDir(outputDir)
    names = os.listdir(inputDir)
    for name in names:
        path = os.path.join(inputDir, name)
        opath = os.path.join(outputDir, name)
        if not path.endswith(".jpg"):
            continue
        im = Image.open(path)
        w,h = im.size
        ow = truncDown(w)
        oh = truncDown(h)
        size = im.size
        im = im.resize((ow,oh), Image.ANTIALIAS)
        print name, w, h, ow, oh
        im.save(opath)


if __name__ == '__main__':
    genImagesPow2("../images", "../imagesPow2")

