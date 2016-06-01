
function report(str) { console.log(str); }

// After the API loads, call a function to enable the search box.
function handleAPILoaded() {
    report("api loaded");
  $('#search-button').attr('disabled', false);
}

// Search for a specified string.
function search() {
    report("search()");
  var q = $('#query').val();
  var request = gapi.client.youtube.search.list({
    q: q,
    part: 'snippet'
  });

  request.execute(function(response) {
    var str = JSON.stringify(response.result);
    $('#search-container').html('<pre>' + str + '</pre>');
  });
}

