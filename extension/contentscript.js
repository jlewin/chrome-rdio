// Determine if the module pattern is appropriate/preferred for chrome extensions?
var lastArtist = null,
    playFooter, // = document.querySelector('.App_PlayerFooter');
    nowPlayingArtist, //playFooter.querySelector('artist_title');
    similarArtistList,
    lastFMLink,
    artistTitleElement,
    artistTitleObserver,  // A window.WebKitMutationObserver to monitor changes to the now playing artist
    monitorArtistChanges = false;

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

function collapseMonitorPane() {
    similarArtistList.style.display = 'none';
    lastFMLink.style.display = 'none';

    // Stop monitoring
    if (monitorArtistChanges) {
        artistTitleObserver.disconnect();
    }

    monitorArtistChanges = false;
}

function expandMonitorPane() {
    similarArtistList.style.display = 'block';
    lastFMLink.style.display = 'inline';

    // Start monitoring changes to '.artist_title' watching for 'childList' changes and firing pollNowPlaying when they occur
    artistTitleObserver.observe(artistTitleElement, { childList: true });

    monitorArtistChanges = true;

    // Perform an immediate query
    pollNowPlaying();
}

// Click handler for artistTitleElement
function toggleMonitorPane() {
    if (monitorArtistChanges)
        collapseMonitorPane();
    else
        expandMonitorPane();
}

// Called via setInterval - checks for artist change: consider dom mutation event
function pollNowPlaying() {

    // if the tab is not active or chrome is minimized and this update function is called 
    // then we should toggle into inactive mode, collapse the results 
    // and skip future last.fm lookups until the user again expands the monitoring pane
    // TODO: consider adding pin button to control this behavior and toggle autoUpdate; would autocollapse otherwise
    if (document.webkitHidden) {
        collapseMonitorPane();
    }

    // Exit monitoring is not applicable, exit
    if (!monitorArtistChanges) return;

    var currentArtist = nowPlayingArtist.innerText;
    if (currentArtist && lastArtist != currentArtist) {
        chrome.extension.sendRequest({ 'action': 'fetchSimilarArtists', 'artist': currentArtist }, lastFMResponse);
        lastFMLink.href = 'http://www.last.fm/music/' + currentArtist;

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
        similarArtistsBox.setAttribute('style', 'padding: 8px; background: #E5E5E5; border-radius: 3px 3px; overflow: auto;');
        similarArtistsBox.className = 'section';

        // Append it below 'Playlists'
        var targetElem = document.querySelector('.scroll_content');
        targetElem.appendChild(similarArtistsBox);

        // Add last.fm logo
        var imgLastFM = document.createElement('img');
        imgLastFM.src = chrome.extension.getURL("lastfm.png");
        imgLastFM.setAttribute('style', 'float: right;');
        similarArtistsBox.appendChild(imgLastFM);

        // Create a title
        var similarTitle = document.createElement('div');
        similarTitle.setAttribute('style', 'color: #D51007; margin: 3px 0');
        similarTitle.textContent = 'Similar Artists'
        similarTitle.className = 'Expander';
        similarTitle.addEventListener('click', toggleMonitorPane, false);

        similarArtistsBox.appendChild(similarTitle);

        // Create the artists list
        similarArtistList = document.createElement('ul');
        similarArtistList.className = 'new_playlist';        // Awkward To facilitate built in rdio hover class on .label li elements
        similarArtistsBox.appendChild(similarArtistList);

        lastFMLink = document.createElement('a');
        lastFMLink.setAttribute('target', '_top');
        lastFMLink.setAttribute('style', 'float: right;');
        lastFMLink.href = 'http://www.last.fm/home';
        similarArtistsBox.appendChild(lastFMLink);

        // Create the lower lastFM image
        imgLastFM = document.createElement('img');
        imgLastFM.src = 'http://cdn.last.fm/flatness/badges/lastfm_red_small.gif';
        imgLastFM.setAttribute('style', 'float: right; width: 50px;');
        lastFMLink.appendChild(imgLastFM);

        // Powered by Last.fm
        var span = document.createElement('span');
        span.textContent = 'Powered by';
        span.setAttribute('style', 'float: right; margin-right: 5px; font-size: 0.8em;');
        lastFMLink.appendChild(span);

        // We'll monitor changes to this element to determine if the now playing artist has changed
        artistTitleElement = playFooter.querySelector('.artist_title');

        // Clear/cancel the init timer/interval
        window.clearInterval(initLoop);

        // MutationObserver to fire pollNowPlaying when changes occur. Observer is connected when monitor pane is expanded
        var JsMutationObserver = window.MutationObserver || window.WebKitMutationObserver;
        artistTitleObserver = new JsMutationObserver(pollNowPlaying);

        // Initially set to inactive
        collapseMonitorPane();
    }
}, 1000);