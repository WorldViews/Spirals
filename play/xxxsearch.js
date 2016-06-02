

//finalResults stores the search results from the API search
var finalResults = [];

var MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
//var API_ACCESS_KEY = 'AIzaSyAEcfhZe0akd47CTYaEOWQ1bLCCbLUfVEY';
var API_ACCESS_KEY = 'AIzaSyBuQiHS4B-axfTUpBGNeJlF2J78k962zkc';
 
/** Initialize portions of page on page load and create object with all News channels in it
 */
$(document).ready(function() {
  $.getScript('https://apis.google.com/js/client.js?onload=handleClientLoad');
});

function handleClientLoad() {
  gapi.client.load('youtube', 'v3', function() {
  });
}

/** This method handle search button clicks.   It pulls data from the web
 * form into the inputObject and then calls the search function.
 */
function clickedSearchButton() {
    getLocationSearchResults();
    return;
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
	//updateSearchResultCount(0);
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

  //updateSearchResultCount(finalResults.length);

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
