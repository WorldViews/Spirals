
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

def genImagePow2(path, opath, ow=None, oh=None):
    if not (path.endswith(".jpg") or path.endswith(".png")):
        return
    im = Image.open(path)
    w,h = im.size
    if not ow:
        ow = truncDown(w)
    if not oh:
        oh = truncDown(h)
    size = im.size
    im = im.resize((ow,oh), Image.ANTIALIAS)
    print path, w, h, ow, oh
    im.save(opath)

def genImagesPow2(inputDir, outputDir):
    verifyDir(outputDir)
    names = os.listdir(inputDir)
    for name in names:
        path = os.path.join(inputDir, name)
        opath = os.path.join(outputDir, name)
        genImagePow2(path, opath)


if __name__ == '__main__':
#    genImagesPow2("../images", "../imagesPow2")
    genImagePow2("images/clouds.png", "images/cloudsP2.png", 128,128)

