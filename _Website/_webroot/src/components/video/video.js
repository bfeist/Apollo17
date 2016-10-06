(function () {

// ### "public" functions
var _deferred = $.Deferred();
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

// ### define handlers for external events
$(document).on("App17.ready", onAppReady);
window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady.bind(null, _deferred);

// ### local vars
var DATETIME_FORMAT = 'MMM D YYYY HH:mm:ss';
var LAUNCH_TIME = new moment('Dec 7 1972 00:33:00', DATETIME_FORMAT);

var missionTime = null;

var pollTime = 500; //default milliseconds between updates
var pollInterval = null;

var ytPlayer = null;

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

// ### local "action" functions
function onAppReady(evt) {
    trace('video; onAppReady');
    init();
}

function init() {
    trace("video; init");
    var defaultStartOffset = '-000:01:05';

    var paramOffsets = getOffsets(getUrlVar('t'));
    var initOffsets = paramOffsets || getOffsets(defaultStartOffset);
    
    var initEventData = setMissionTime(initOffsets);
    seekToTime(initEventData.secondsFromLaunch);
}

function setMissionTime(offset) {
    trace('video; setMissionTime; offset, ', offset);
    //sets the mission time based on the offset; if the mission time changes, triggers an event (populated with eventData - see getEventData())
    //accepts either a time string (e.g., '-001:11:25' or '002:11:25') or an object (as returned by getOffsets())
    //returns:
    // - false (and doesn't adjust missionTime) if offset isn't valid (i.e., if it's an incorrectly formatted string)
    // - eventData if it is valid
    if (typeof(offset) === 'string') {
        offset = getOffsets(offset);
    }
    if (!offset) {
        return false;
    }

    var lastMissionTime = missionTime;
    missionTime = LAUNCH_TIME.clone().add(offset);

    var eventData = getEventData('timeUpdate');
    if (!missionTime.isSame(lastMissionTime)) {
        trace("missionTime changed; firing event: " + missionTime.format(DATETIME_FORMAT));
        $.event.trigger(eventData);
    } else {
        trace('no change in mission time');    
    }
    return eventData;
}

function startPoller() {
    trace("video; startPoller");
    pollInterval = setInterval(onPollTick, pollTime);
}

function stopPoller() {
    trace("video; stopPoller");
    clearInterval(pollInterval);
}

function onPollTick() {
    var curClipData = getCurrentClipData();
    var clipStartOffsets = getOffsets(curClipData.start);
    
    var clipStartTime = LAUNCH_TIME.clone().add(clipStartOffsets);
    // trace('clipStartTime: ', clipStartTime.format(DATETIME_FORMAT));

    var clipStartSecondsFromLaunch = clipStartTime.diff(LAUNCH_TIME, 'seconds');
    // trace('clipStartSecondsFromLaunch: ', clipStartSecondsFromLaunch);

    var curTotalSeconds = ytPlayer.getCurrentTime() + clipStartSecondsFromLaunch; // + .5;
    // trace('curTotalSeconds: ' + curTotalSeconds);

    var curTimeStr = secondsToTimeStr(curTotalSeconds);
    // trace('curTimeStr: ' + curTimeStr);

    setMissionTime(getOffsets(curTimeStr));
}

function getCurrentClipData() {
    var curClipId = ytPlayer.getVideoUrl().match(/v=(.*)/)[1];
    return MEDIA_HASH[curClipId];
}

function seekToTime(secondsFromLaunch) {
    trace("seekToTime; secondsFromLaunch: " + secondsFromLaunch);

    // ga('send', 'event', 'seekToTime', 'seek', timeId);

    var curClipData = getCurrentClipData();
    // trace('curClipData.id: ' + curClipData.id);

    for (var i = 0; i < MEDIA_LIST.length; ++i) {
        var targetClip = MEDIA_LIST[i];
        var clipStartOffsets = getOffsets(targetClip.start);
        var clipEndOffsets = getOffsets(targetClip.end);
        
        var clipStartTime = LAUNCH_TIME.clone().add(clipStartOffsets);
        var clipEndTime = LAUNCH_TIME.clone().add(clipEndOffsets);
        // trace('clipStartTime: ', clipStartTime.format(DATETIME_FORMAT));
        // trace('clipEndTime: ', clipEndTime.format(DATETIME_FORMAT));

        var clipStartSecondsFromLaunch = clipStartTime.diff(LAUNCH_TIME, 'seconds');
        var clipEndSecondsFromLaunch = clipEndTime.diff(LAUNCH_TIME, 'seconds');
        // trace('clipStartSecondsFromLaunch: ', clipStartSecondsFromLaunch);
        // trace('clipEndSecondsFromLaunch: ', clipEndSecondsFromLaunch);

        if (secondsFromLaunch >= clipStartSecondsFromLaunch && secondsFromLaunch < clipEndSecondsFromLaunch) {
            // trace('targetClip: ' + targetClip.id)
            //change youtube video if the correct video isn't already playing
            var startCue = secondsFromLaunch - clipStartSecondsFromLaunch;
            if (curClipData.id !== targetClip.id) {
                trace('changing video from: ' + curClipData.id + ' to: ' + targetClip.id + ' cued to: ' + startCue);
                ytPlayer.loadVideoById(targetClip.id, startCue);
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

// ### local utility functions
function getOffsets(str) {
    // takes something like '-001:22:33' and returns an object with integers for the hours, minutes and seconds offset (e.g., {hours:-1, minutes:-22, seconds:-33})
    // returns false if all required elements aren't found in str
    var pieces = getOffsetPieces(str);
    if (!pieces) {
        logger.warn('getOffsets; invalid offset string: ' + str);
        return false;
    }

    var multiplier = pieces[0] === '-' ? -1 : 1;
    var offsets = _.map(pieces.slice(1,4), function(p) {
        return parseInt(p) * multiplier;
    });
    // console.log('pieces,', pieces);

    return {
        hours: offsets[0],
        minutes: offsets[1],
        seconds: offsets[2]
    };
}

function getOffsetPieces(str) {
    // takes something like '-111:22:33'
    // returns an array of the offset elements found in str; e.g., [ ['-'|''], [HHH], [MM], [SS] ]
    // returns false if all required elements aren't found in str
    if (!str) {
        return false;
    }

    var pieces = str.match(/(-?)(\d\d\d)\D?(\d\d)\D?(\d\d)/);
    // console.log('pieces,', pieces);

    // should be 5 elements ([full match], [-], HHH, MM, SS)
    if (!pieces || pieces.length < 5) {
        return false;
    }

    return pieces.slice(1,5);
}

function secondsToTimeStr(totalSeconds) {
    var sec_num = Math.abs(parseFloat(totalSeconds));
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = Math.floor(sec_num - (hours * 3600) - (minutes * 60));
    return (totalSeconds < 0 ? '-' : '')
        + padZeros(hours,3) + ":" 
        + padZeros(minutes,2) + ":" 
        + padZeros(seconds,2);
}

function padZeros(num, size) {
    var s = String(num);
    while (s.length < size) s = "0" + s;
    return s;
}

function getEventData(type) {
    var secondsFromLaunch = missionTime.diff(LAUNCH_TIME, 'seconds');
    return {
        type: 'video.' + type,
        missionMoment: missionTime,
        missionDateTime: missionTime.format(DATETIME_FORMAT),
        secondsFromLaunch: secondsFromLaunch,
        missionElapsedTime: secondsToTimeStr(secondsFromLaunch)
    };
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
            onPollTick();
            startPoller();
            break;
        }
        case 'PAUSED' : {
            trace('onPlayerStateChange; PAUSED');
            stopPoller();
            break;
        }
        case 'BUFFERING' : {
            trace('onPlayerStateChange; BUFFERING');
            stopPoller();
            break;
        }
        case 'ENDED' : {
            trace('onPlayerStateChange; ENDED');
            stopPoller();
            break;
        }
        default : {
            trace('onPlayerStateChange; no handler for event: ' + evtName);
            break;
        }
    }

    // $.event.trigger({
    //     type: "player.stateChange",
    //     state: evtName
    // });
}

})();
