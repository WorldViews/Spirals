#!/usr/bin/python
# -*- coding: utf-8 -*-

import codecs
import sys, time, json, traceback

UTF8Writer = codecs.getwriter('utf8')
sys.stdout = UTF8Writer(sys.stdout)

from apiclient.discovery import build
from apiclient.errors import HttpError
#from oauth2client.tools import argparser


# Set DEVELOPER_KEY to the API key value from the APIs & auth > Registered apps
# tab of
#   https://cloud.google.com/console
# Please ensure that you have enabled the YouTube Data API for your project.
#DEVELOPER_KEY = "REPLACE_ME"
exec file("YOUTUBE_DEV_KEY.txt").read()

YOUTUBE_API_SERVICE_NAME = "youtube"
#YOUTUBE_API_SERVICE_NAME = "WVVidWatch"
YOUTUBE_API_VERSION = "v3"


class YouTubeScraper:
   def __init__(self):
      self.recs = {}
      self.VIDNUM = 0
      pass

   def fetch(self, name, query=None, locs=None, dimension="any"):
      if query == None:
         query = name
      fname = "%s_data.json" % name
      if locs == None:
         locs = ["37.42307,-122.08427",
                 "15.0465951,-166.3735415"]
      if locs == "global":
         locs = []
         for lat in range(-90,90+10,10):
           for lon in range(-180,180,15):
             if lat==0 and lon==0:
                continue
             if (lat==-90 or lat==90) and lon != 0:
                continue
             locs.append("%d,%d" % (lat,lon))
      for loc in locs:
         try:
            self.search(query=query, location=loc, dimension=dimension)
         except HttpError, e:
            print "An HTTP error %d occurred:\n%s" % (e.resp.status, e.content)
         except:
            traceback.print_exc()
         self.saveRecs(fname)

   def search(self, query, location, max_results=50, location_radius="1000km", dimension="any"):
      print "query:", query
      print "location:", location
      print "location_radius:", location_radius
      self.query = query
      youtube = build(YOUTUBE_API_SERVICE_NAME, YOUTUBE_API_VERSION,
                      developerKey=DEVELOPER_KEY)

      # Call the search.list method to retrieve results matching the specified
      # query term.
      search_response = youtube.search().list(
          q=query,
          type="video",
          location=location,
          videoDimension=dimension,
          locationRadius=location_radius,
          part="id,snippet",
          maxResults=max_results
      ).execute()

      search_videos = []

      # Merge video ids
      for search_result in search_response.get("items", []):
         search_videos.append(search_result["id"]["videoId"])
      video_ids = ",".join(search_videos)

      # Call the videos.list method to retrieve location details for each video.
      video_response = youtube.videos().list(
         id=video_ids,
         part='snippet, recordingDetails'
      ).execute()

      # Add each result to the list, and then display the list of matching videos.
      items = video_response.get("items", [])
      print "Got %d items" % len(items)
      for video_result in items:
         self.VIDNUM += 1
         #print video_result
         lat = video_result["recordingDetails"]["location"]["latitude"]
         lon = video_result["recordingDetails"]["location"]["longitude"]
         title = video_result["snippet"]["title"]
         id = video_result["id"]
         rec = {'youtubeId': id,
                'id': "%d" % self.VIDNUM,
                'lat': lat,
                'lon': lon,
                'title': title}
         rec['publishedAt'] = video_result["snippet"]["publishedAt"]
         rec['thumbnails'] = video_result["snippet"]["thumbnails"]
         self.recs[id] = rec
         #print rec

   def saveRecs(self, jsonPath):
      t0 = time.time()
      recs = []
      for id in self.recs.keys():
         recs.append(self.recs[id])
      f = UTF8Writer(file(jsonPath, "w"))
      obj = {'query': self.query,
             'time': time.time(),
             'records': recs}
      f.write(json.dumps(obj, indent=4, sort_keys=True))
      t1 = time.time()
      print "Wrote %d recs to %s in %.3fs" % (len(recs), jsonPath, t1-t0)


#argparser.add_argument("--location-radius", help="Location radius", default="1000km")
#argparser.add_argument("--max-results", help="Max results", default=50)

def fetch(name, query=None, loc="global", dimension="any"):
   ys = YouTubeScraper()
   ys.fetch(name, query, loc, dimension)
#   ys.fetch(name, query, loc, dimension)

if __name__ == "__main__":
#   fetch("hiking")
#   fetch("surfing")
#   fetch("boating", query="boating|sailing|surfing|waterski -fishing", loc=None)
   fetch("waterSports3D", query="360 video", loc=None)


