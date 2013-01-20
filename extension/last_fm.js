//  Performs an XMLHttpRequest to Last.fm's API to get similar artists.
function fetchSimilarArtists(requestData, callback) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function (data) {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                var data = JSON.parse(xhr.responseText);
                callback(data);
            } else {
                callback(null);
            }
        }
    }

    // Note that any URL fetched here must be matched by a permission in
    // the manifest.json file!
    var url = 'http://ws.audioscrobbler.com/2.0/?method=artist.getsimilar&artist=' + escape(requestData.artist) + '&api_key=b244274f9b3d6174afedaed62cb04da4&format=json&limit=10';
    xhr.open('GET', url, true);
    xhr.send();
};

/**
    * Handles data sent via chrome.extension.sendRequest().
    * @param request Object Data sent in the request.
    * @param sender Object Origin of the request.
    * @param callback Function The method to call when the request completes.
    */
function onRequest(request, sender, callback) {
    if (request.action == 'fetchSimilarArtists') {
        fetchSimilarArtists(request, callback);
    }
};

// Wire up the listener.
chrome.extension.onRequest.addListener(onRequest);