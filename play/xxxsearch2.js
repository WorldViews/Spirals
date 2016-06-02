/**
 * Copyright 2014 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 *  @fileoverview  This code is an example implementation of how to implement YouTube geo-search
 *  and search filters via established APIs.  The application itself is directed toward the use
 *  case of journalists trying to discover citizen journalism on YouTube.   It integrates with the Google Maps API to plot
 *  the upload location of geo-tagged video results.
 *  @author:  Stephen Nicholls, March 10, 2014
 */


//Define a Global variables

//validationErrors flag is set if errors are found on the input object
var validationErrors = false;

//finalResults stores the search results from the API search
var finalResults = [];

//finalResults2 stores the final results 
var finalResults2 = [];

/** INITIAL_ZOOM_LEVEL is the zoom level that is set as default when our map is created
 *  @const {string}
 */
var INITIAL_ZOOM_LEVEL = 11;
var MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
//var API_ACCESS_KEY = 'AIzaSyAEcfhZe0akd47CTYaEOWQ1bLCCbLUfVEY';
var API_ACCESS_KEY = 'AIzaSyBuQiHS4B-axfTUpBGNeJlF2J78k962zkc';
 

var CAR_REGEX = /\d{4} (?:dodge|chevy|ford|toyota|bmw|mercedes|honda|chrysler|pontiac|hyundai|audi|jeep|scion|cadillac|volks|acura|lexus|suburu|nissan|mazda|suzuki|buick|gmc|chevrolet|lincoln|infiniti|mini|hummer|porsche|volvo|land|kia|saturn|mitsubishi)/i;


/** Initialize portions of page on page load and create object with all News channels in it
 */
$(document).ready(function() {
  $.getScript('https://apis.google.com/js/client.js?onload=handleClientLoad');
});

function handleClientLoad() {
  gapi.client.load('youtube', 'v3', function() {
  });
}

/**
 */
function searchYouTube() {
  //Reset errors section, final results array and results section
  $(".showErrors").remove();
  //resetResultsSection();
  finalResults = [];
  finalResults2 = [];

  //remove any old results
  $("div").remove(".tableOfVideoContentResults");
  getLocationSearchResults();
}

/** This method handle search button clicks.   It pulls data from the web
 * form into the inputObject and then calls the search function.
 */
function clickedSearchButton() {
    searchYouTube();
    return;
}



/**  This function generates a URL, with all the search parameters, which is then
 *  loaded into the omnibox of the browser.
 *  @returns url {string}
 */
function xxxgenerateURLwithQueryParameters() {
  parameterString = '';

  //if a custom range was selected in the search include start and end dates in the URL
  if (inputObject.inputTimeWindow === "custom_range") {
    parameterString =
      "?q=" + inputObject.inputQuery + "&la=" + inputObject.inputLat +
      "&lo=" + inputObject.inputLong + "&lr=" + inputObject.inputLocationRadius +
      "&tw=" + inputObject.inputTimeWindow + "&sd=" + inputObject.inputStartDate +
      "&ed=" + inputObject.inputEndDate + "&cl=" + inputObject.inputChannelList +
      "&sl=" + inputObject.inputSearchLocation + "&eo=" + inputObject.inputEmbedsOnly +
      "&loo=" + inputObject.inputLiveOnly + "&cco=" + inputObject.inputCreativeCommonsOnly +
      "&zl=" + inputObject.inputZoomLevel + "&pbt=" + publishBeforeTime;
  } else {
    parameterString =
      "?q=" + inputObject.inputQuery + "&la=" + inputObject.inputLat +
      "&lo=" + inputObject.inputLong + "&lr=" + inputObject.inputLocationRadius +
      "&tw=" + inputObject.inputTimeWindow +
      "&cl=" + inputObject.inputChannelList +
      "&sl=" + inputObject.inputSearchLocation + "&eo=" + inputObject.inputEmbedsOnly +
      "&loo=" + inputObject.inputLiveOnly + "&cco=" + inputObject.inputCreativeCommonsOnly +
      "&zl=" + inputObject.inputZoomLevel + "&pbt=" + publishBeforeTime;
  }

  //Retrieve the domain from the existing URL, to construct the new URL
  var currentURL = String(window.location);

  var newURLArray = [];
  var newURL = '';

  if (currentURL) {
    //split current URL by "?" delimiter.  The first element will be the domain.
    newURLArray = currentURL.split('?');

    //if currentURL does not contain a '?', then it is already just the domain and newURLArray will be undefined
    if (!newURLArray) {
      //concatenate the domain and the parameter string
      newURL = currentURL + parameterString;
    } else {
      //concatenate the first element of newURLArray (which is the domain) and the parameter string
      newURL = newURLArray[0] + parameterString;
    }
  }

  return newURL;
}

/**  This function handles the display of the search result count
 */
function updateSearchResultCount(count) {
  var resultString;
  //if no results were found, provide some ideas on improving the query to the end-user
  if (count === 0) {
    resultString = "No results found.  Try expanding the location radius, time frame, or just leaving the location and radius fields blank and doing a keyword search.";
  } else {
    resultString = "Found " + count + " results.";
  }

  //clear the old search results count and add the updated one
  $('#searchResultCount').remove();
  $('#searchResultCountContainer').append('<div id="searchResultCount">' + resultString + '</div>');
}

/**  This function takes a request object, executes the request, and uses a callback function parse the response
 *  into a results array.
 *  @param request {object} - this is the request object returned from the YouTube search API
 */
function processYouTubeRequest(request) {
  request.execute(function(response) {
    var resultsArr = [];
    var videoIDString = '';

    //if the result object from the response is null, show error; if its empty, remove old results and display
    //message on how to broaden search to get more results.
    if ('error' in response || !response) {
      showConnectivityError();
    } else if (!response.result || !response.result.items) {
      updateSearchResultCount(0);
      resetResultsSection();
      $("div").remove(".tableOfVideoContentResults");
    } else {
      var entryArr = response.result.items;
      for (var i = 0; i < entryArr.length; i++) {
        var videoResult = new Object();
        videoResult.title = entryArr[i].snippet.title;

        //Pull the lattitude and longitude data per search result
	// if ((inputObject.hasSearchLocation) && entryArr[i].georss$where) {
        if (entryArr[i].georss$where) {
          var latlong = entryArr[i].georss$where.gml$Point.gml$pos.$t;
          var latlongArr = latlong.split(' ');
          videoResult.lat = latlongArr[0].trim();
          videoResult.long = latlongArr[1].trim();
        }

        videoResult.videoId = entryArr[i].id.videoId;
        videoIDString = videoIDString + videoResult.videoId + ",";

        videoResult.url = "https://www.youtube.com/watch?v=" + videoResult.videoId;
        videoResult.channelID = entryArr[i].snippet.channelId;
        videoResult.channel = entryArr[i].snippet.channelTitle;
        videoResult.liveBroadcastContent = entryArr[i].snippet.liveBroadcastContent;
        videoResult.thumbNailURL = entryArr[i].snippet.thumbnails.default.url;
        videoResult.description = entryArr[i].snippet.description;

        var year = entryArr[i].snippet.publishedAt.substr(0, 4);
        var monthNumeric = entryArr[i].snippet.publishedAt.substr(5, 2);
        var monthInt = 0;

        if (monthNumeric.indexOf("0") === 0) {
          monthInt = monthNumeric.substr(1, 1);
        } else {
          monthInt = monthNumeric;
        }
        var day = entryArr[i].snippet.publishedAt.substr(8, 2);
        var time = entryArr[i].snippet.publishedAt.substr(11, 8);

        var monthString = MONTH_NAMES[monthInt - 1];

        videoResult.displayTimeStamp = monthString + " " + day + ", " + year + " - " + time + " UTC";
        videoResult.publishTimeStamp = entryArr[i].snippet.publishedAt;

        //add result to results
        resultsArr.push(videoResult);
      }

      //Now we will use the string of video IDs from the search to do another API call to pull latitude
      //and longitude values for each search result

      //remove trailing comma from the string of video ids
      var videoIDStringFinal = videoIDString.substring(0, videoIDString.length - 1);

      //generate request object for video search
      var videoIDRequest = gapi.client.youtube.videos.list({
        id: videoIDStringFinal,
        part: 'id,snippet,recordingDetails',
        key: API_ACCESS_KEY
      });

      //execute request and process the response object to pull in latitude and longitude
      videoIDRequest.execute(function(response) {
        if ('error' in response || !response) {
          showConnectivityError();
        } else {
          //iterate through the response items and execute a callback function for each
          $.each(response.items, function() {
            var videoRequestVideoId = this.id;

            //ensure recordingDetails and recordingDetails.location are not null or blank
            if (this.recordingDetails && this.recordingDetails.location) {
              //for every search result in resultArr, pull in the latitude and longitude from the response
              for (var i = 0; i < resultsArr.length; i++) {
                if (resultsArr[i].videoId === videoRequestVideoId) {
                  resultsArr[i].lat = this.recordingDetails.location.latitude;
                  resultsArr[i].long = this.recordingDetails.location.longitude;
                  break;
                }
              }
            }
          });
        }

        //remove duplicates from global results list
        for (var i = 0; i < resultsArr.length; i++) {
          var addResult = true;
          for (var j = 0; j < finalResults.length; j++) {
            if (resultsArr[i].url === finalResults[j].url) {
              //it is a duplicate, do not add to final results and break inner loop
              addResult = false;
              break;
            }
          }
          if (addResult) {
            finalResults.push(resultsArr[i]);
          }
        }

        if (finalResults.length === 0) {
          //No Search Results to Display
          //remove results section as there is nothing to display
          resetResultsSection();
          $("div").remove(".tableOfVideoContentResults");
        } else {
          //show results section
          //showResultsSection();

          //remove any old results
          $("div").remove(".tableOfVideoContentResults");

          //generate result list and map of videos
          generateResultList();
        }
      });
    }
  });
}


/** This function generates the UI of the results section after the search has been processed
 */
function generateResultList() {
  var div = $('<div>');
  div.addClass('video-content');

  var tableOfVideoContent_div = $('<div>');
  div.addClass('tableOfVideoContentResults');

  var tableDefinition = $('<table>');
  tableDefinition.attr('width', '500');
  tableDefinition.attr('cellpadding', '5');

  //filter out any irrelevant results
  //filterIrrelevantResults();

  //update the search result counter after filter

  updateSearchResultCount(finalResults.length);

  for (var i = 0; i < finalResults.length; i++) {
    var channel = finalResults[i].channel;
    var channelID = finalResults[i].channelID;
    if (!channel) {
      channel = channelID;
    }

    //each result, will be listed in a row with an image, meta-data and rank sections
    var resultRow = $('<tr>');
    var imageCell = $('<td width=100>');
    var metaDataCell = $('<td width=350 valign=top>');
    var rankCell = $('<td>');

    //format image section
    var imageString = "<img src='" + finalResults[i].thumbNailURL + "' height='100' width='100'/>";
    imageCell.append(imageString);

    //format meta-data section
    var videoString = "<attr title='Description: " + finalResults[i].description + "'><a href=" + finalResults[i].url + "' target='_blank'>" + finalResults[i].title + "</a></attr><br>";
    metaDataCell.append(videoString);
    var uploadDate = "Uploaded on: " + finalResults[i].displayTimeStamp + "<br>";
    var channelString = "Channel:  <attr title='Click to go to uploader's Channel'><a href='https://www.youtube.com/channel/" + channelID + "' target='_blank'>" + channel + "</a></attr><br>";
    var reverseImageString = "<attr title='Use Google Image Search to find images that match the thumbnail image of the video.'><a href='https://www.google.com/searchbyimage?&image_url=" + finalResults[i].thumbNailURL + "' target='_blank'>reverse image search</a></attr><br>";

    metaDataCell.append(uploadDate);
    metaDataCell.append(channelString);
    metaDataCell.append(reverseImageString);

    //format rank section
    var rank = i + 1;
    var imageNumberRank = '<h2>' + rank + '</h2><br>';
    rankCell.append(imageNumberRank);

    //Put all the sections of the row together
    resultRow.append(imageCell);
    resultRow.append(metaDataCell);
    resultRow.append(rankCell);
    tableDefinition.append(resultRow);
  }
  //show results in a table on UI
  tableOfVideoContent_div.append(tableDefinition);
  $('#tableOfVideoContentResults').append(tableOfVideoContent_div);

  //ensure table is nested in 'video-container' div for proper formatting
  div.append(tableOfVideoContent_div);
  $('#video-container').append(div);
}

/** Show the Errors Section
 */
function showErrorSection() {
  $("#showErrors").show();
}



function getLocationSearchResults() {
	inputLat = 45;
	inputLong = -120;
	inputRadius = "10km";
	inputQuery = "";
	try {
            var request = gapi.client.youtube.search.list({
              q: inputQuery,
              order: "date",
              type: "video",
              part: "id,snippet",
              location: inputLat + "," + inputLong,
              locationRadius: inputRadius,
              maxResults: "50",
              key: API_ACCESS_KEY
            });
	} catch (err) {
            //cannot search via the YouTube API
            showConnectivityError();
	}
        processYouTubeRequest(request);
}


/**  This function displays a connectivity error to the end user in the event
 *  that we lose connectivity to one or more of the Google APIs
 */
function showConnectivityError() {
  var div = $('<div>');
  div.addClass('showErrors');
  div.append("Error connecting to Google APIs");

  $('#showErrorsContainer').empty();
  $('#showErrorsContainer').append(div);
  showErrorSection();
}
