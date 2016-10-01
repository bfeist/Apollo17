(function () {

var _deferred = $.Deferred();
var ytPlayer = null;

window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady.bind(null, _deferred);

window.loadVideo = function() {
    trace('video; loadVideo');


    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.onload = onApiLoadSuccess.bind(this, _deferred);
    script.onerror = onApiLoadError.bind(this, _deferred);
    script.src = 'https://www.youtube.com/iframe_api';
    document.getElementsByTagName('head')[0].appendChild(script);

    return _deferred.promise();
}

function onApiLoadSuccess(deferred, evt) {
    trace('video; onApiLoadSuccess; args: ', arguments);
    deferred.progress({
        status: 'loading',
        message: 'API loaded',
        evt: evt
    });
}

function onApiLoadError(deferred, evt) {
    trace('video; onApiLoadError; args: ', arguments);
    deferred.reject({
        status: 'error',
        evt: evt
    });
}

function onYouTubeIframeAPIReady(deferred) {
    trace('video; onYouTubeIframeAPIReady; creating player object');
    ytPlayer = new YT.Player('player', {
        videoId: '0OQ6m5DZqeY',
        width: '100%',
        height: '100%',
        playerVars: {
            frameborder: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            autohide: 1,
            rel: 0,
            'controls': 0,
            fs: 0
        },
        events: {
            onReady: onPlayerReady.bind(this, deferred),
            // onStateChange: onPlayerStateChange
        }
    });
}

// The API will call this function when the video player is ready.
function onPlayerReady(deferred, evt) {
    // gApplicationReady += 1; //increment app ready indicator.
    trace('video: onPlayerReady; ytPlayer.getPlayerState(): ' + ytPlayer.getPlayerState());
    //if (gMissionTimeParamSent == 0) {
        //event.target.playVideo();
        //seekToTime(gDefaultStartTime); //jump to 1 minute to launch
    //}
    
    deferred.resolve({
        status: 'success',
        evt: evt
    });
}

// The API calls this function when the player's state changes.
// The function indicates that when playing a video (state=1)
function onPlayerStateChange(event) {
    //trace("onPlayerStateChange():state: " + event.data);
    if (event.data == YT.PlayerState.PLAYING) {
        //trace("onPlayerStateChange():PLAYER PLAYING");
        gPlaybackState = "normal";
        $("#playPauseBtn").addClass('pause');

        if (gNextVideoStartTime != -1) {
            //trace("onPlayerStateChange():PLAYING: forcing playback from " + gNextVideoStartTime + " seconds in new video");
            player.seekTo(gNextVideoStartTime, true);
            gNextVideoStartTime = -1;
        }
        if (gPlaybackState == "unexpectedbuffering") {
            //trace("onPlayerStateChange():PLAYING: was unexpected buffering so calling findClosestUtterance");
            ga('send', 'event', 'transcript', 'click', 'youtube scrub');
            //scrollToTimeID(findClosestUtterance(event.target.getCurrentTime() + gCurrVideoStartSeconds));
            scrollTranscriptToTimeId(findClosestUtterance(event.target.getCurrentTime() + gCurrVideoStartSeconds));
            scrollCommentaryToTimeId(findClosestCommentary(event.target.getCurrentTime() + gCurrVideoStartSeconds));
            scrollToClosestTOC(event.target.getCurrentTime() + gCurrVideoStartSeconds);
        }
        if (gIntervalID == null) {
            //poll for mission time scrolling if video is playing
            gIntervalID = setAutoScrollPoller();
            //trace("onPlayerStateChange():INTERVAL: PLAYING: Interval started because was null: " + gIntervalID);
        }
    } else if (event.data == YT.PlayerState.PAUSED) {
        //clear polling for mission time scrolling if video is paused
        window.clearInterval(gIntervalID);
        //trace("onPlayerStateChange():PAUSED: interval stopped: " + gIntervalID);
        gIntervalID = null;
        gPlaybackState = "paused";
        $("#playPauseBtn").removeClass('pause');

    } else if (event.data == YT.PlayerState.BUFFERING) {
        //trace("onPlayerStateChange():BUFFERING: " + event.target.getCurrentTime() + gCurrVideoStartSeconds);
        if (gPlaybackState == "transcriptclicked") {
            gPlaybackState = "normal";
        } else {
            //buffering for unknown reason, probably due to scrubbing video
            trace("onPlayerStateChange():unexpected buffering");
            gPlaybackState = "unexpectedbuffering";
        }
    } else if (event.data == YT.PlayerState.ENDED) { //load next video
        //trace("onPlayerStateChange():ENDED. Load next video.");
        var currVideoID = player.getVideoUrl().substr(player.getVideoUrl().indexOf("v=") + 2,11);
        for (var i = 0; i < gMediaList.length; ++i) {
            if (gMediaList[i][1] == currVideoID) {
                trace("onPlayerStateChange():Ended. Changing video from: " + currVideoID + " to: " + gMediaList[i + 1][1]);
                currVideoID = gMediaList[i + 1][1];
                break;
            }
        }
        gCurrVideoStartSeconds = timeStrToSeconds(gMediaList[i + 1][2]);
        gCurrVideoEndSeconds = timeStrToSeconds(gMediaList[i + 1][3]);

        player.iv_load_policy = 3;
        gNextVideoStartTime = 0; //force next video to start at 0 seconds in the play event handler
        player.loadVideoById(currVideoID, 0);
    }
}
})();
