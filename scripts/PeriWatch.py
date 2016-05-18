import tweepy
from tweepy import Stream
from tweepy import OAuthHandler
from tweepy.streaming import StreamListener
import time, os, urllib2, json, traceback
import ImageResizer
import codecs
import sys 
from threading import Thread
from unidecode import unidecode
import socketIO_client
from WVPoster import WVPoster
from exceptions import KeyboardInterrupt

API = None
UTF8Writer = codecs.getwriter('utf8')
sys.stdout = UTF8Writer(sys.stdout)

#IMAGE_DIR = "C:/kimber/WorldViews/twitter_images"
IMAGE_DIR = "../images/twitter_images"
LOG_DIR = None
LOG_DIR = "../logs"
CONFIG_PATH = "C:/kimber/WorldViews/twitter_auth_config.py"
"""
You can get authentication values at twitter developer website https://dev.twitter.com/
"""

config = {}
execfile(CONFIG_PATH, config)
ckey = config['ckey']
csecret = config['csecret']
atoken = config['atoken']
asecret = config['asecret']
GOOGLE_API_KEY = config['GOOGLE_API_KEY']

print "ckey", ckey
print "csecret", csecret


def getGeo(loc):
    loc = unidecode(loc)
    print "location:", loc
    qloc = urllib2.quote(loc)
    url0 = "https://maps.googleapis.com/maps/api/geocode/json?address=%(location)s&key=%(key)s"
    url = url0 % {'location': qloc,
                 'key': GOOGLE_API_KEY}
    print "url:", url
    uos = urllib2.urlopen(url)
    str = uos.read()
    ret = json.loads(str)
    #print json.dumps(ret, indent=3)
    if ret['status'] == "OK":
        res = ret['results']
        if len(res) == 0:
            print "*** no machting results ***"
            return None
        if len(res) > 1:
            print "*** ignoring multiple results ***"
        res = res[0]
        geo = res['geometry']
        loc = geo['location']
        bounds = geo['bounds']
        obj = {'lat': loc['lat'],
               'lon': loc['lng'],
               'bounds': bounds,
               'address': res['formatted_address'],
               'query': loc}
    else:
        obj = None
    print obj
    return obj

def saveImage(url, id):
    path = "%s/%s.jpg" % (IMAGE_DIR, id)
    pow2path = "%s/%s_p2.jpg" % (IMAGE_DIR, id)
    print "Saving to", path
    try:
        uos = urllib2.urlopen(url)
    except:
        print "Couldn't open", url
        return None
    try:
        file(path, "wb").write(uos.read())
    except:
        print "Couldn't save", path
        return None
    ImageResizer.resizePow2(path, pow2path)
    return path
    
def lookup(id):
    print "---------------------------------"
    statuses = API.statuses_lookup([id])
    s = statuses[0]
    print "geo:", s.geo
    print "created_at:", s.created_at
    print "place:", s.place
    #print "user:", s.user
    print "coordinates:", s.coordinates
    #print "ent:", s.entities
    urls = s.entities['urls']
    #print "urls", urls
    print "---------------------------------"
    return s


class Listener(StreamListener):
    #DATAFILE_PATH = "periscope_data.json"
    DATAFILE_PATH = None
    #logFile = UTF8Writer(file("pw.txt", "w"))
    logFile = None
    records = []
    recs = {}
    n = 0
    k = 0
    wvPoster = WVPoster()
    #sio = SIO()
    #sio.runInThread()

    def on_data(self, data):
        print "========================================================"
        try:
            return self.on_data_(data)
        except KeyboardInterrupt:
            print "Killing with KeyboardInterrupt"
            return False
        except:
            traceback.print_exc()
            return True

    def on_data_(self, data):
        self.k += 1
        print "n:", self.k
        t = time.time()
        obj = json.loads(data)
        #print json.dumps(obj, indent=3, sort_keys=True)
        #file("peri_%d.json" % self.k, "w").write(
        #    json.dumps(obj, indent=3, sort_keys=True))
        #print "place: ", obj.get("place", None)
        text = obj.get('text', None)
        place = obj.get('place', None)
        geo = obj.get('geo', None)
        bbox = None
        try:
            bbox = place["bounding_box"]["coordinates"]
        except:
            print "cannot get bbox"
        media_urls = []
        urls = []
        hashtags = None
        id = None
        try:
            id = obj.get("id", None)
            ents = obj['entities']
            hashtags = ents.get("hashtags")
            hashtags = [o['text'] for o in hashtags]
            urls = ents['urls']
            media = ents['media']
            for med in media:
                if 'media_url' in med:
                    media_urls.append(med['media_url'])
        except KeyError:
            pass
        if not hashtags:
            #print "Skipping record with no hashtags"
            return True
        if 'Periscope' not in hashtags:
            print "Skipping rec with no Periscope"
            return True
        periscope_url = None
        display_url = None
        for url in urls:
            if url['expanded_url'].find("periscope") >= 0:
                periscope_url = url['expanded_url']
            display_url = url['display_url']
        print "id:", id
        print "periscope_url:", periscope_url
        print "hashtags:", hashtags
        print "urls:", urls
        print "bbox:", bbox
        print "text:", text
        user = obj.get('user')
        userLoc = user['location']
        userGeo = None
        if userLoc != None:
            userGeo = getGeo(userLoc)
        #if id:
        #    lobj = lookup(int(id))
        if self.logFile:
            jobj = {'text': text, 'expanded_url': periscope_url,
                    'display_url': display_url, 'fullObj': obj}
            json.dump(jobj, logFile, indent=3, sort_keys=True)
            logFile.flush()
        if place == None and geo == None and userGeo == None:
            print "skipping rec with no place"
            return True
        if periscope_url == None:
            print "skipping rec with no persiscope_url"
        print "*** BINGO\07 ***"
        self.n += 1
        lgId = "%07d" % self.n
        if LOG_DIR:
            jsonPath = "%s/peri_%s.json" % (LOG_DIR, lgId)
            print "saving to ", jsonPath
            json.dump(obj, file(jsonPath, "w"), indent=3, sort_keys=True)
        pobj = {'title': text,
                'id': id,
                'lgId': lgId,
                't': t,
                'userGeo': userGeo,
                'lat': userGeo['lat'],
                'lon': userGeo['lon'],
                'url': periscope_url}
        pobj['tweet'] = obj
        if self.DATAFILE_PATH:
            self.records.append(pobj)
            pLayer = {"name": "periscope",
                      "records": self.records}
            t1 = time.time()
            f = UTF8Writer(file(self.DATAFILE_PATH,"w"))
            json.dump(pLayer, f, indent=3, sort_keys=True)
            t2 = time.time()
            print "Saved %d records to %s in %.3fsec" % \
                   (len(self.records), self.DATAFILE_PATH, t2-t1)
        #if self.sio:
        #    self.sio.emit(pobj)
        if id in self.recs:
            print "********************** REPEAT ****************"
            print "\07\07\07"
            self.recs[id] += 1
        else:
            self.recs[id] = 1
        if self.wvPoster:
            print "posting to periscope stream"
            self.wvPoster.postToSIO("periscope", pobj)

    def on_error(self, status):
        print "on_error:"
        print status


def verifyDir(path):
    if not os.path.exists(path):
        print "Creating", path
        os.makedirs(path)
        

class TwitterWatcher:
    def __init__(self):
        global API
        auth = OAuthHandler(ckey, csecret)
        auth.set_access_token(atoken, asecret)
        self.twitterStream = Stream(auth, Listener())
        API = tweepy.API(auth)
        verifyDir(IMAGE_DIR)
        verifyDir(LOG_DIR)

    def run(self):
        pattern = ["#Periscope"]
        #pattern = ["find:periscope"]
        #pattern = ["Periscope"]
        #pattern = ["#Periscope geocode:39.8,-95.583068847656,2500km"]
        print "filter: pattern: ", pattern
        #self.twitterStream.filter(locations=[-180.0, -90.0, 180.0, 90.0],
        #                          track=pattern)
        self.twitterStream.filter(track=pattern)



def run():
    tw = TwitterWatcher()
    tw.run()


if __name__ == '__main__':
#    run()
#    getGeo("Mountain View, CA")
    run()

    
