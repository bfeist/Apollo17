(function () {

var MEDIA_LIST = _.map([
    '0OQ6m5DZqeY|-002:37:22|000:00:00',
    'l0bJywiS5q0|000:00:00|008:00:00',
    '286j_hqO9Q8|008:00:00|016:00:00',
    'AfAU_79dAd8|016:00:00|024:00:00',
    'VE345fzF84Q|024:00:00|032:00:00',
    'ljqiT4ywXoo|032:00:00|040:00:00',
    'aCJ22Vl3a8k|040:00:00|048:00:00',
    '-npaJWdpNY8|048:00:00|056:00:00',
    'NN8W0KKoMr8|056:00:00|064:00:00',
    'Ec_pm0i47Uo|064:00:00|074:40:00',
    'MhYwOOyUJY8|074:40:00|082:40:00',
    'lrhvI3mHZV0|082:40:00|090:40:00',
    'Ulw1BE4bx90|090:40:00|098:40:00',
    'GtvEA3KoHJ4|098:40:00|106:40:00',
    'ZCL-dpn-Qns|106:40:00|114:40:00',
    'GakAd6epHko|114:40:00|122:40:00',
    'GXKJiWFym80|122:40:00|130:40:00',
    'And-OB9xcns|130:40:00|138:40:00',
    'IuiFCfg7x4k|138:40:00|146:40:00',
    'yH5BjOgPyzk|146:40:00|154:40:00',
    '0yTkQlgI_Bw|154:40:00|162:40:00',
    '_ksfHIYamyk|162:40:00|170:40:00',
    '0jiJ09dqZds|170:40:00|178:40:00',
    'nUjsfAjPHGQ|178:40:00|186:40:00',
    '2jGZck8uJhE|186:40:00|194:40:00',
    'RaonKYAZqCg|194:40:00|202:40:00',
    'PvEXCE31TIA|202:40:00|210:40:00',
    'bAyfD-qqaYA|210:40:00|218:40:00',
    'xDH2qR5wP8Q|218:40:00|226:40:00',
    'ChgcnwZ9xH8|226:40:00|234:40:00',
    'aCHsMs77YPY|234:40:00|242:40:00',
    'kLjJhSgNv_E|242:40:00|250:40:00',
    '4BaQnCJ0qWE|250:40:00|258:40:00',
    'oqcG7fsAe6M|258:40:00|266:40:00',
    'VGAJZjJEUN0|266:40:00|274:40:00',
    'D1DXH8SWNmk|274:40:00|282:40:00',
    'gXaDs5dH1FQ|282:40:00|290:40:00',
    'j3QTiLJIcS4|290:40:00|298:40:00',
    'XhCXA8nWgXM|298:40:00|306:40:00',
    ], function(i) {
        var p = i.split('|');
        return {
            id: p[0],
            start: p[1],
            end: p[2]
        }
    });
var MEDIA_HASH = _.keyBy(MEDIA_LIST, 'id');

var _deferred = $.Deferred();
var ytPlayer = null;

window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady.bind(null, _deferred);

window.loadVideo = function() {
    trace('video; loadVideo');

    var script = document.createElement('script');
    script.async = true;
    script.onload = onApiLoadSuccess.bind(this, _deferred);
    script.onerror = onApiLoadError.bind(this, _deferred);
    script.src = 'https://www.youtube.com/iframe_api';
    document.getElementsByTagName('body')[0].appendChild(script);

    return _deferred.promise();
}

// ### handlers for external events
function onTimelineSet(evt) {
    // trace('video; onTimelineSet; evt: ', evt);
    seekToTime(evt.secondsFromLaunch);
}

// ### local utils
function seekToTime(secondsFromLaunch) { // transcript click handling --------------------
    trace("seekToTime; secondsFromLaunch: " + secondsFromLaunch);

    // ga('send', 'event', 'seekToTime', 'seek', timeId);

    var curClipId = ytPlayer.getVideoUrl().match(/v=(.*)/)[1]; //.substr(player.getVideoUrl().indexOf("v=") + 2, 11);
    trace('curClipId: ' + curClipId);

    for (var i = 0; i < MEDIA_LIST.length; ++i) {
        var clip = MEDIA_LIST[i];
        var clipStartOffsets = getOffsets(clip.start);
        var clipEndOffsets = getOffsets(clip.end);
        
        var clipStartTime = LAUNCH_TIME.clone().add(clipStartOffsets);
        var clipEndTime = LAUNCH_TIME.clone().add(clipEndOffsets);
        // trace('clipStartTime: ', clipStartTime.format(DATETIME_FORMAT));
        // trace('clipEndTime: ', clipEndTime.format(DATETIME_FORMAT));

        var clipStartSecondsFromLaunch = clipStartTime.diff(LAUNCH_TIME, 'seconds');
        var clipEndSecondsFromLaunch = clipEndTime.diff(LAUNCH_TIME, 'seconds');
        // trace('clipStartSecondsFromLaunch: ', clipStartSecondsFromLaunch);
        // trace('clipEndSecondsFromLaunch: ', clipEndSecondsFromLaunch);

        if (secondsFromLaunch >= clipStartSecondsFromLaunch && secondsFromLaunch < clipEndSecondsFromLaunch) {
            trace('seek to clip: ' + clip.id)
            //change youtube video if the correct video isn't already playing
            var startCue = secondsFromLaunch - clipStartSecondsFromLaunch;
            if (curClipId !== clip.id) {
                trace('changing video from: ' + curClipId + ' to: ' + clip.id + ' cued to: ' + startCue);
                ytPlayer.loadVideoById(clip.id, startCue);
            } else {
                trace('no need to change video. Seeking to ' + startCue);
                ytPlayer.seekTo(startCue, true);
            }
            break;
        }
    }
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

// ### youtube API event handlers
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
            controls: 2,
            fs: 0,
            playsinline: 1
        },
        events: {
            onReady: onPlayerReady.bind(this, deferred),
            onStateChange: onPlayerStateChange.bind(this)
        }
    });
}

// The API will call this function when the video player is ready.
function onPlayerReady(deferred, evt) {
    trace('video: onPlayerReady; ytPlayer.getPlayerState(): ' + ytPlayer.getPlayerState());

    $(document).on("timeline.setMissionTime", onTimelineSet);
    
    deferred.resolve({
        status: 'success',
        evt: evt,
        component: 'video',
        player: evt.target
    });
}

// The API calls this function when the player's state changes.
// The function indicates that when playing a video (state=1)
function onPlayerStateChange(evt) {
    var evtName = _.findKey(YT.PlayerState, function(o) { return o === _.get(evt, 'data'); });

    switch (evtName) {
        case 'PLAYING' : {
            trace('onPlayerStateChange; PLAYING, time: ' + ytPlayer.getCurrentTime());
            break;
        }
        case 'PAUSED' : {
            trace('onPlayerStateChange; PAUSED');
            break;
        }
        case 'BUFFERING' : {
            trace('onPlayerStateChange; BUFFERING');
            break;
        }
        case 'ENDED' : {
            trace('onPlayerStateChange; ENDED');
            break;
        }
        default : {
            trace('onPlayerStateChange; no handler for event: ' + evtName);
            break;
        }
    }

    var event = {
        type: "player.stateChange",
        state: evtName
    }
    $.event.trigger(event);

    // if (event.data == YT.PlayerState.PLAYING) {
    //     gPlaybackState = "normal";
    //     $("#playPauseBtn").addClass('pause');

    //     if (gNextVideoStartTime != -1) {
    //         //trace("onPlayerStateChange():PLAYING: forcing playback from " + gNextVideoStartTime + " seconds in new video");
    //         player.seekTo(gNextVideoStartTime, true);
    //         gNextVideoStartTime = -1;
    //     }
    //     if (gPlaybackState == "unexpectedbuffering") {
    //         //trace("onPlayerStateChange():PLAYING: was unexpected buffering so calling findClosestUtterance");
    //         ga('send', 'event', 'transcript', 'click', 'youtube scrub');
    //         //scrollToTimeID(findClosestUtterance(event.target.getCurrentTime() + gCurrVideoStartSeconds));
    //         scrollTranscriptToTimeId(findClosestUtterance(event.target.getCurrentTime() + gCurrVideoStartSeconds));
    //         scrollCommentaryToTimeId(findClosestCommentary(event.target.getCurrentTime() + gCurrVideoStartSeconds));
    //         scrollToClosestTOC(event.target.getCurrentTime() + gCurrVideoStartSeconds);
    //     }
    //     if (gIntervalID == null) {
    //         //poll for mission time scrolling if video is playing
    //         gIntervalID = setAutoScrollPoller();
    //         //trace("onPlayerStateChange():INTERVAL: PLAYING: Interval started because was null: " + gIntervalID);
    //     }
    // } else if (event.data == YT.PlayerState.PAUSED) {
    //     //clear polling for mission time scrolling if video is paused
    //     window.clearInterval(gIntervalID);
    //     //trace("onPlayerStateChange():PAUSED: interval stopped: " + gIntervalID);
    //     gIntervalID = null;
    //     gPlaybackState = "paused";
    //     $("#playPauseBtn").removeClass('pause');

    // } else if (event.data == YT.PlayerState.BUFFERING) {
    //     //trace("onPlayerStateChange():BUFFERING: " + event.target.getCurrentTime() + gCurrVideoStartSeconds);
    //     if (gPlaybackState == "transcriptclicked") {
    //         gPlaybackState = "normal";
    //     } else {
    //         //buffering for unknown reason, probably due to scrubbing video
    //         trace("onPlayerStateChange():unexpected buffering");
    //         gPlaybackState = "unexpectedbuffering";
    //     }
    // } else if (event.data == YT.PlayerState.ENDED) { //load next video
    //     //trace("onPlayerStateChange():ENDED. Load next video.");
    //     var currVideoID = player.getVideoUrl().substr(player.getVideoUrl().indexOf("v=") + 2,11);
    //     for (var i = 0; i < gMediaList.length; ++i) {
    //         if (gMediaList[i][1] == currVideoID) {
    //             trace("onPlayerStateChange():Ended. Changing video from: " + currVideoID + " to: " + gMediaList[i + 1][1]);
    //             currVideoID = gMediaList[i + 1][1];
    //             break;
    //         }
    //     }
    //     gCurrVideoStartSeconds = timeStrToSeconds(gMediaList[i + 1][2]);
    //     gCurrVideoEndSeconds = timeStrToSeconds(gMediaList[i + 1][3]);

    //     player.iv_load_policy = 3;
    //     gNextVideoStartTime = 0; //force next video to start at 0 seconds in the play event handler
    //     player.loadVideoById(currVideoID, 0);
    // }
}
})();
