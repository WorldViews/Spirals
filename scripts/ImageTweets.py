
import time, json, os, glob

IMAGE_DIR = "../images/twitter_images"

class ImageTweets:
    def __init__(self):
        self.dir = IMAGE_DIR
    
    def get(self, maxNum=None):
        t0 = time.time()
        objs = []
        paths = glob.glob(self.dir+"/*.json")
        n = 0
        for path in paths:
            path = path.replace("\\", "/")
            n += 1
            if maxNum and n > maxNum:
                return
            #print path
            id = path[path.rfind("/")+1: -len(".json")]
            #print id
            obj = json.load(file(path))
            coord = obj['coordinates']
            coord = coord['coordinates']
            mobj = {'id': id, 'lonlat': coord}
            objs.append(mobj)
        t1 = time.time()
        print "Got %d images in %.3fs" % (len(paths), t1-t0)
        return objs

if __name__ == '__main__':
    it = ImageTweets()
    images = it.get()
    print images

