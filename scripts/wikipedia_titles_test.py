import urllib2
import json
import requests
# def fetchPlaces():
    # id = 0
    # url = " https://en.wikipedia.org/w/api.php"
    # uos = urllib2.urlopen(url)
    # buf = uos.read()
    # obj = json.loads(buf)
    # count = obj["count"]
    # print "count:", count
    # next = obj["next"]
    # print "next:", next
    # results = obj["results"]
    # wvrecs = []
# for res in results:
        # name = res["title"]
	# try:
	    # print "name:", name, "  url:", url
	# except:
            # print "Bad name"
	    # continue
	# url = res["url"]
	# try:
	    # coords = res["conditions"]["nodes"]["coordinates"]
	# except:
            # print "Unable to get coordinates"
	    # continue
	# id += 1
	# print "coords:", coords
	# print
# wvrec = {'id': "%d" % id,
		 # 'lat': coords[1],
		 # 'lon': coords[0],
		 # 'title': name,
		 # 'url': url}
# wvrecs.append(wvrec)
# print wvrec
    # #print "wvrecs", wvrecs
# layer = {}
# layer["name"] = "Wikipedia Entries"
# layer["records"] = wvrecs
# print layer



baseurl = 'http://en.wikipedia.org/w/api.php'
my_atts = {}
my_atts['action'] = 'query'  # action=query
my_atts['list'] = 'geosearch'     # prop=info
my_atts['gscoord'] = '37.4061498|-122.1508337' 
my_atts['gsradius'] = '10000' 
my_atts['gsprimary'] = 'primary' 
my_atts['gslimit'] = '500' 
my_atts['format'] = 'json'   # format=json

resp = requests.get(baseurl, params = my_atts)
data = resp.json()
json.dump(data, file("wikipedia_test_data.json", "w"), indent=4)


