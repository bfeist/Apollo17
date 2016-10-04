(function () {

$(document).on("App17.ready", onAppReady);
$(document).on("player.stateChange", onPlayerStateChange);

window.DATETIME_FORMAT = 'MMM D YYYY HH:mm:ss';

window.LAUNCH_TIME = null;
var missionTime = null;

var defaultStartOffset = '-000:01:05';

var _player = null;

var tickTime  = 1000; //milliseconds between updates
var tickInterval = null;

var gCurrVideoStartSeconds = 1;

window.setMissionTime = setMissionTime;

// ### handlers for external events
function onAppReady(evt) {
    trace('timeline; onAppReady');
    _player = evt.player;

    init();
}
function onPlayerStateChange(evt) {
    trace('timeline; onPlayerStateChange', evt);
    // stop();

    switch (evt.state) {
        case 'PLAYING' : {
            trace('timeline; onPlayerStateChange; PLAYING');
            start();
            break;
        }
        case 'PAUSED' : {
            trace('timeline; onPlayerStateChange; PAUSED');
            stop();
            break;
        }
        case 'BUFFERING' : {
            trace('timeline; onPlayerStateChange; BUFFERING');
            stop();
            break;
        }
        case 'ENDED' : {
            trace('timeline; onPlayerStateChange; ENDED');
            stop();
            break;
        }
        default : {
            trace('onPlayerStateChange; no handler for event: ' + evt.state);
            break;
        }
    }
}

// ### local
function init() {
    trace("timeline; init");
    LAUNCH_TIME = new moment('Dec 7 1972 00:33:00', DATETIME_FORMAT);
    trace("LAUNCH_TIME: " + LAUNCH_TIME.format(DATETIME_FORMAT));

    var paramOffsets = getOffsets(getUrlVar('t'));
    var initOffsets = paramOffsets || getOffsets(defaultStartOffset);
    
    setMissionTime(initOffsets);
}

function setMissionTime(offset) {
    trace('offset, ', offset);
    //sets the mission time based on the offset
    //accepts either an object (as returned by getOffsets()) or a string in the  (e.g., -001:11:25 or 002:11:25)
    //returns false (and doesn't adjust missionTime) if offset isn't valid (i.e., if it's an incorrectly formatted string); return true (and adjusts missionTime) if it is valid

    if (typeof(offset) === 'string') {
        offset = getOffsets(offset);
    }
    if (!offset) {
        return false;
    }
    var newMissionTime = LAUNCH_TIME.clone().add(offset);

    if (!newMissionTime.isSame(missionTime)) {
        missionTime = newMissionTime;
        trace("setMissionTime; missionTime: " + missionTime.format(DATETIME_FORMAT));

        $.event.trigger(getEventObject('setMissionTime'));
    } else {
        trace('no change in mission time');
    }

    return true;
}

//TODO - don't set globals (move to utils?)
window.getOffsetPieces = function(str) {
    // takes something like '-111:22:33'
    // returns an array of the offset elements found in the str; e.g., [ ['-'|''], [HHH], [MM], [SS] ]
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

window.getOffsets = function(str) {
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

function secondsToTimeStr(totalSeconds) {
    var hours = Math.abs(parseInt(totalSeconds / 3600));
    var minutes = Math.abs(parseInt(totalSeconds / 60)) % 60 % 60;
    var seconds = Math.floor(Math.abs(parseInt(totalSeconds)) % 60);
    return (totalSeconds < 0 ? '-' : '')
        + padZeros(hours,3) + ":" 
        + padZeros(minutes,2) + ":" 
        + padZeros(seconds,2);
}

function padZeros(num, size) {
    var s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
}

function parseTime(str) {
    // routing all times through this function reduces conditionals and allows for flexibility in things like the URL 't' param
    // turns a string with the required elements (i.e, [-]HHH:MM:SS) into a time string (e.g., '-0000100' or '-000:01:00' will both return '-000:01:00')
    // returns false if all required elements aren't found in str

    var pieces = getOffsetPieces(str);
    if (!pieces) {
        return false;
    }

    var digitPieces = pieces.slice(2,5);

    // we have to have 7 digits
    if (digitPieces.join('').length < 7) {
        return false;
    }

    return pieces[1] + digitPieces.join(':');
}

function getEventObject(type) {
    var secondsFromLaunch = missionTime.diff(LAUNCH_TIME, 'seconds');
    return {
        type: 'timeline.' + type,
        missionMoment: missionTime,
        missionDateTime: missionTime.format(DATETIME_FORMAT),
        secondsFromLaunch: secondsFromLaunch,
        missionElapsedTime: secondsToTimeStr(secondsFromLaunch)
    };
}

var c = 0;
function stop() {
    clearInterval(tickInterval);
}

function start() {
    trace("timeline; start");
    tickInterval = setInterval(function () {
        trace("timeline; tick; missionTime: " + missionTime.format(DATETIME_FORMAT));

        missionTime.add({
            milliseconds: tickTime
        });

        $.event.trigger(getEventObject('tick'));
        // {
        //     type: 'timeline.tick',
        //     missionMoment: missionTime,
        //     secondsFromLaunch: secondsFromLaunch,
        //     missionTime: secondsToTimeStr(secondsFromLaunch)
        // });

        // (c++ === 2) && clearInterval(tickInterval);

        // var totalSec = gOffline ? timeStrToSeconds(gCurrMissionTime) + 1 : player.getCurrentTime() + gCurrVideoStartSeconds + 0.5;
        // var totalSec = _player.getCurrentTime() + gCurrVideoStartSeconds + 0.5;
        // console.log('totalSec: ' + totalSec);

        // if (gCurrVideoStartSeconds == 230400) {
        //     if (player.getCurrentTime() > 3600) { //if at 065:00:00 or greater, add 002:40:00 to time
        //         //trace("adding 9600 seconds to autoscroll target due to MET time change");
        //         totalSec = totalSec + 9600;
        //     }
        // }
        // gCurrMissionTime = secondsToTimeStr(totalSec);

        // if (gCurrMissionTime != gLastTimeIdChecked) {
        //     if (parseInt(totalSec) % 10 == 0) { //every 10 seconds, fire a playing event
        //         ga('send', 'event', 'playback', 'playing', gCurrMissionTime);
        //     }

        //     var timeId = timeStrToTimeId(gCurrMissionTime);
        //     gLastTimeIdChecked = gCurrMissionTime;

        //     scrollTranscriptToTimeId(timeId);
        //     scrollTOCToTimeId(timeId);
        //     scrollCommentaryToTimeId(timeId);
        //     showPhotoByTimeId(timeId);

        //     displayHistoricalTimeDifferenceByTimeId(timeId);

        //     //scroll nav cursor
        //     // if (!gMouseOnNavigator && !gMustInitNav) {
        //     //     //redrawAll();
        //     //     updateNavigator();
        //     // } else {
        //     //     drawCursor(totalSec);
        //     //     paper.view.draw();
        //     // }
        // }

        // if (!gOffline) {
        //     if (player.isMuted() == true) {
        //         $('#soundBtn').removeClass('mute');
        //     } else {
        //         $('#soundBtn').addClass('mute');
        //     }
        // }

    }, tickTime);
}

})();
