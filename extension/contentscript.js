// Determine if the module pattern is appropriate/preferred for chrome extensions?
var lastArtist = null,
    playFooter, // = document.querySelector('.App_PlayerFooter');
    nowPlayingArtist, //playFooter.querySelector('artist_title');
    nowPlayingLoop,
    similarArtistList;

function lastFMResponse(data) {
    if (data.similarartists.artist) {

        // Empty similar artists list
        emptyElement(similarArtistList);

        // Add the first 15 similar artists
        // TODO: Consider adding paging support rather than truncating to a fixed value
        for (var i = 0; i < 15; i++) {
            if (data.similarartists.artist[i]) {

                var listItem = document.createElement('li');
                var artistName = document.createElement('a');
                artistName.className = 'playlist label';

                listItem.appendChild(artistName);
                artistName.setAttribute('href', 'http://www.rdio.com/search/' + data.similarartists.artist[i].name);

                artistName.textContent = data.similarartists.artist[i].name;
                //artistName.addEventListener("click", searchForArtist, false);

                similarArtistList.appendChild(listItem);
            }
        }
    }
};

// http://jsperf.com/innerhtml-vs-removechild
function emptyElement(elem) {
    while (elem.lastChild) {
        elem.removeChild(elem.lastChild);
    }
}

function searchForArtist(item) {
    document.getElementById('searchInput').value = this.textContent;
    document.getElementById('searchButton').click();
}

// Called via setInterval - checks for artist change: consider dom mutation event
function pollNowPlaying() {
    var currentArtist = nowPlayingArtist.innerText;
    if (currentArtist && lastArtist != currentArtist) {
        chrome.extension.sendRequest({ 'action': 'fetchSimilarArtists', 'artist': currentArtist }, lastFMResponse);
        lastArtist = currentArtist;
    }
}

function removeClass(elem, nameToRemove) {
    // Get class names
    var classes = elem.className.split(' ');

    // Find the item to remove
    var index = classes.indexOf(nameToRemove);

    // If needed, splice off the class name, join the array back on spaces and reset the className property
    if (index != -1) {
        classes.splice(index, 1);
        elem.className = classes.join(' ');
    }
}

// Loop until our elements are in place
var initLoop = window.setInterval(function (e) {
    // Look for the player footer and init when it exists
    playFooter = document.querySelector('.App_PlayerFooter');
    if (playFooter) {
        nowPlayingArtist = playFooter.querySelector('.artist_title');

        // This is all to appear below the '.playlists' element but still have a separator margin
        var playlists = document.querySelector('.section.playlists');
        removeClass(playlists, 'last');

        // During startup, create the element which will host our 'Similar Artists' results
        var similarArtistsBox = document.createElement('div');
        similarArtistsBox.className = 'section';

        // Append it below 'Playlists'
        var targetElem = document.querySelector('.scroll_content');
        targetElem.appendChild(similarArtistsBox);

        // Create a title
        var similarTitle = document.createElement('div');
        similarTitle.textContent = 'Similar Artists'
        similarTitle.className = 'Expander';

        similarArtistsBox.appendChild(similarTitle);

        var imgLFM = document.createElement('img');
        imgLFM.src = chrome.extension.getURL("lastfm.png");
        imgLFM.setAttribute('style', 'position: absolute; margin: -3px 0 0 10px; ');
        similarTitle.appendChild(imgLFM);

        // Create the list
        similarArtistList = document.createElement('ul');
        similarArtistList.className = 'new_playlist';  // To facilitate built in rdio hover class on .label li elements
        similarArtistsBox.appendChild(similarArtistList);

        // Clear/cancel the init timer/interval
        window.clearInterval(initLoop);

        nowPlayingLoop = window.setInterval(pollNowPlaying, 1000);
    }
}, 1000);