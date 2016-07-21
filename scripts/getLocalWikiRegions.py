
import json
import urllib2

def fetchMaps():
    url = "https://localwiki.org/api/v4/regions/?format=json"
    uos = urllib2.urlopen(url)
    buf = uos.read()
    obj = json.loads(buf)
    count = obj["count"]
    print "count:", count
    next = obj["next"]
    print "next:", next
    results = obj["results"]
    for res in results:
        name = res["full_name"]
	url = res["url"]
	try:
	    coords = res["settings"]["region_center"]["coordinates"]
	except:
            print "Unable to get coordinates"
	    continue
	print "name:", name, "  url:", url
	print "coords:", coords
	print

fetchMaps()
