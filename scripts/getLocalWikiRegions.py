
import json
import urllib2

def fetchMaps():
    id = 0
    url = "https://localwiki.org/api/v4/regions/?format=json"
    uos = urllib2.urlopen(url)
    buf = uos.read()
    obj = json.loads(buf)
    count = obj["count"]
    print "count:", count
    next = obj["next"]
    print "next:", next
    results = obj["results"]
    wvrecs = []
    for res in results:
        name = res["full_name"]
	try:
	    print "name:", name, "  url:", url
	except:
            print "Bad name"
	    continue
	url = res["url"]
	try:
	    coords = res["settings"]["region_center"]["coordinates"]
	except:
            print "Unable to get coordinates"
	    continue
	id += 1
	print "coords:", coords
	print
	wvrec = {'id': "%d" % id,
		 'lat': coords[1],
		 'lon': coords[0],
		 'title': name,
		 'url': url}
	wvrecs.append(wvrec)
	print wvrec
    #print "wvrecs", wvrecs
    layer = {}
    layer["name"] = "LocalWiki Regions"
    layer["records"] = wvrecs
    print layer
    json.dump(layer, file("localWikiRegions_data.json", "w"), indent=4)

fetchMaps()
