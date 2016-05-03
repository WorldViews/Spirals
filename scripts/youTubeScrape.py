#!/usr/bin/python

#!/usr/bin/python -tt
# -*- coding: utf-8 -*-
import codecs
import sys 
import json

UTF8Writer = codecs.getwriter('utf8')
sys.stdout = UTF8Writer(sys.stdout)

from apiclient.discovery import build
from apiclient.errors import HttpError
from oauth2client.tools import argparser


# Set DEVELOPER_KEY to the API key value from the APIs & auth > Registered apps
# tab of
#   https://cloud.google.com/console
# Please ensure that you have enabled the YouTube Data API for your project.
#DEVELOPER_KEY = "REPLACE_ME"
exec file("YOUTUBE_DEV_KEY.txt").read()

YOUTUBE_API_SERVICE_NAME = "youtube"
#YOUTUBE_API_SERVICE_NAME = "WVVidWatch"
YOUTUBE_API_VERSION = "v3"

RECS = {}
VIDNUM = 0

def youtube_search(options, query, location):
  global VIDNUM
  youtube = build(YOUTUBE_API_SERVICE_NAME, YOUTUBE_API_VERSION,
    developerKey=DEVELOPER_KEY)

  # Call the search.list method to retrieve results matching the specified
  # query term.
  search_response = youtube.search().list(
    q=query,
    type="video",
    location=location,
    locationRadius=options.location_radius,
    part="id,snippet",
    maxResults=options.max_results
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
  for video_result in video_response.get("items", []):
    VIDNUM += 1
    lat = video_result["recordingDetails"]["location"]["latitude"]
    lon = video_result["recordingDetails"]["location"]["longitude"]
    title = video_result["snippet"]["title"]
    id = video_result["id"]
    rec = {'youtubeId': id,
           'id': "%d" % VIDNUM,
           'lat': lat,
           'lon': lon,
           'title': title}
    RECS[id] = rec
    print rec

def saveRecs(jsonPath):
    recs = []
    for id in RECS.keys():
        recs.append(RECS[id])
    file(jsonPath, "w").write(json.dumps(recs, indent=4, sort_keys=True))


"""
if __name__ == "__main__":
  argparser.add_argument("--q", help="Search term", default="Google")
  argparser.add_argument("--location", help="Location", default="37.42307,-122.08427")
  argparser.add_argument("--location-radius", help="Location radius", default="5km")
  argparser.add_argument("--max-results", help="Max results", default=25)
  args = argparser.parse_args()

  try:
    youtube_search(args)
  except HttpError, e:
    print "An HTTP error %d occurred:\n%s" % (e.resp.status, e.content)
"""

#argparser.add_argument("--q", help="Search term", default=q)
argparser.add_argument("--location-radius", help="Location radius", default="1000km")
argparser.add_argument("--max-results", help="Max results", default=50)

def fetch(q="surfing", loc="37.42307,-122.08427"):
  args = argparser.parse_args()
  try:
    youtube_search(args, query=q, location=loc)
  except HttpError, e:
    print "An HTTP error %d occurred:\n%s" % (e.resp.status, e.content)


if __name__ == "__main__":
    fetch(loc="37.42307,-122.08427")
    fetch(loc="15.0465951,-166.3735415")
    saveRecs("surfing_data.json")




