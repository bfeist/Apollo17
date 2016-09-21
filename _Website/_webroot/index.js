trace("INIT: Loading index.js");
var gStopCache = false;
var gCdnEnabled = false;
var gOffline = false;

var gMissionDurationSeconds = 1100166;
var gCountdownSeconds = 9442;
var gDefaultStartTimeId = '-000105';

var gLastTOCElement = '';
var gLastTOCTimeId = '';
var gLastCommentaryTimeId = '';
var gLastUtteranceTimeId = '';
var gLastTimeIdChecked = '';
var gCurrMissionTime = '';
var gIntervalID = null;
var gIntroInterval = null;
var gLastLROOverlaySegment = '';
var gLastVideoSegmentDashboardHidden = '';
var gDashboardManuallyToggled = false;
var gMediaList = [];
var gTOCIndex = [];
var gTOCData = [];
var gTOCDataLookup = [];
var gUtteranceIndex = [];
var gUtteranceData = [];
var gUtteranceDataLookup = [];
var gCommentaryIndex = [];
var gCommentaryData = [];
var gCommentaryDataLookup = [];
var gUttCommData = [];
var gTelemetryData = [];
var gPhotoData = [];
var gPhotoIndex = [];
var gPhotoDataLookup = [];
var gMissionStages = [];
var gVideoSegments = [];
var gCurrentPhotoTimeid = "initial";
var gCurrVideoStartSeconds = -9442; //countdown
var gCurrVideoEndSeconds = 0;
var gPlaybackState = "normal";
var gNextVideoStartTime = -1; //used to track when one video ends to ensure next plays from 0 (needed because youtube bookmarks where you left off in videos without being asked to)
var gMissionTimeParamSent = 0;
var player;
var gApplicationReady = gOffline ? 1 : 0; //starts at 0, or start at 1 if "offline" to skip youtube checker
var gApplicationReadyIntervalID = null;
var gFontsLoaded = false;
var gSplashImageLoaded = false;
var gMustInitNav = true;
var gFontLoaderDelay = 3; //seconds

var gUtteranceDisplayStartIndex;
var gUtteranceDisplayEndIndex;
var gCurrentHighlightedUtteranceIndex;

var gCommentaryDisplayStartIndex;
var gCommentaryDisplayEndIndex;
var gCurrentHighlightedCommentaryIndex;

var gShareButtonObject;

var gBackground_color_active = "#222222";

//load the youtube API
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// <editor-fold desc="youtube things------------------------------------------------">

function onYouTubeIframeAPIReady() {
    trace("INIT: onYouTubeIframeAPIReady():creating player object");
    player = new YT.Player('player', {
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
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

// The API will call this function when the video player is ready.
function onPlayerReady(event) {
    gApplicationReady += 1; //increment app ready indicator.
    trace("APPREADY: onPlayerReady: " + gApplicationReady);
    //if (gMissionTimeParamSent == 0) {
        //event.target.playVideo();
        //seekToTime(gDefaultStartTime); //jump to 1 minute to launch
    //}
}

// The API calls this function when the player's state changes.
// The function indicates that when playing a video (state=1)
function onPlayerStateChange(event) {
    //trace("onPlayerStateChange():state: " + event.data);
    if (event.data == YT.PlayerState.PLAYING) {
        //trace("onPlayerStateChange():PLAYER PLAYING");
        gPlaybackState = "normal";
        $("#playPauseBtn > img").addClass('pause');

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
        $("#playPauseBtn > img").removeClass('pause');

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
// </editor-fold>

// <editor-fold desc="pollers -------------------------------------------------">
function setAutoScrollPoller() {
    trace("autoScrollPoller()");
    return window.setInterval(function () {
        var totalSec = gOffline ? timeStrToSeconds(gCurrMissionTime) + 1 : player.getCurrentTime() + gCurrVideoStartSeconds + 0.5;

        if (gCurrVideoStartSeconds == 230400) {
            if (player.getCurrentTime() > 3600) { //if at 065:00:00 or greater, add 002:40:00 to time
                //trace("adding 9600 seconds to autoscroll target due to MET time change");
                totalSec = totalSec + 9600;
            }
        }
        gCurrMissionTime = secondsToTimeStr(totalSec);

        if (gCurrMissionTime != gLastTimeIdChecked) {
            if (parseInt(totalSec) % 10 == 0) { //every 10 seconds, fire a playing event
                ga('send', 'event', 'playback', 'playing', gCurrMissionTime);
            }

            var timeId = timeStrToTimeId(gCurrMissionTime);
            gLastTimeIdChecked = gCurrMissionTime;

            scrollTranscriptToTimeId(timeId);
            scrollTOCToTimeId(timeId);
            scrollCommentaryToTimeId(timeId);
            showPhotoByTimeId(timeId);

            displayHistoricalTimeDifferenceByTimeId(timeId);
            updateDashboard(timeId);
            manageOverlaysAutodisplay(timeId);

            //scroll nav cursor
            if (!gMouseOnNavigator && !gMustInitNav) {
                //redrawAll();
                updateNavigator();
            } else {
                drawCursor(totalSec);
                paper.view.draw();
            }
        }

        if (!gOffline) {
            if (player.isMuted() == true) {
                $('#soundBtn > img').removeClass('mute');
            } else {
                $('#soundBtn > img').addClass('mute');
            }
        }
    }, 500); //polling frequency in milliseconds
}

function setIntroTimeUpdatePoller() {
    return window.setInterval(function () {
        //trace("setIntroTimeUpdatePoller()");
        displayHistoricalTimeDifferenceByTimeId(getNearestHistoricalMissionTimeId());
    }, 1000);
}

function setApplicationReadyPoller() {
    return window.setInterval(function () {
        trace("setApplicationReadyPoller(): Checking if App Ready");

        if (gFontLoaderDelay <= 0 && gFontsLoaded == false) {
            trace ('INIT: giving up on font loader');
            gFontsLoaded = true;
        }
        gFontLoaderDelay --;

        if (gFontsLoaded && gSplashImageLoaded && gMustInitNav) {
            $('body').addClass('splash-loaded'); //shows splash screen because now the fonts and image have been loaded
            initNavigator(); //only init navigator after fonts have loaded to avoid mousex position bug
            gMustInitNav = false;
        }

        if (gApplicationReady >= 4) {
            trace("APPREADY = 4! App Ready!");
            if (gMissionTimeParamSent != 0) {
                fadeOutSplash();
                initializePlayback();
            }
            // $.isLoading( "hide" );
            $('body').addClass('app-ready');

            window.clearInterval(gApplicationReadyIntervalID);
        }
    }, 1000);
}

// </editor-fold>

// <editor-fold desc="find closest things------------------------------------------------">
function findClosestUtterance(secondsSearch) {
    trace("findClosestUtterance():" + secondsSearch);
    //if (gCurrVideoStartSeconds == 230400) {
    //    if (secondsSearch > 230400 + 3600) { //if at 065:00:00 or greater, add 000:02:40 to time
    //        secondsSearch = secondsSearch + 9600;
    //    }
    //}
    var timeId = secondsToTimeId(secondsSearch);
    var scrollTimeId = gUtteranceIndex[gUtteranceIndex.length - 1];
    for (var i = 0; i < gUtteranceIndex.length; ++i) {
        if (timeId < parseInt(gUtteranceIndex[i])) {
            scrollTimeId = gUtteranceIndex[i - 1];
            break;
        }
    }
    //trace("findClosestUtterance(): searched utterance array, found closest: timeid" + gUtteranceIndex[i - 1] + " after " + i + " searches");
    return scrollTimeId;
}

function scrollToClosestTOC(secondsSearch) {
    trace("findClosestTOC():" + secondsSearch);
    if (gCurrVideoStartSeconds == 230400) {
        if (secondsSearch > 230400 + 3600) { //if at 065:00:00 or greater, add 000:02:40 to time
            secondsSearch = secondsSearch + 9600;
        }
    }
    var timeId = secondsToTimeId(secondsSearch);
    var scrollTimeId = gTOCIndex[gTOCIndex.length - 1];
    for (var i = 0; i < gTOCIndex.length; ++i) {
        if (timeId < parseInt(gTOCIndex[i])) {
            scrollTimeId = gTOCIndex[i - 1];
            break;
        }
    }
    //trace("scrollToClosestTOC(): searched TOC array, found closest: timeid" + gTOCIndex[i - 1] + " after " + i + " searches");
    scrollTOCToTimeId(scrollTimeId);
}

function findClosestCommentary(secondsSearch) {
    //trace("scrollToClosestCommentary():" + secondsSearch);
    if (gCurrVideoStartSeconds == 230400) {
        if (secondsSearch > 230400 + 3600) { //if at 065:00:00 or greater, add 000:02:40 to time
            secondsSearch = secondsSearch + 9600;
        }
    }
    var timeId = secondsToTimeId(secondsSearch);
    var scrollTimeId = gCommentaryIndex[gCommentaryIndex.length - 1];
    for (var i = 0; i < gCommentaryIndex.length; ++i) {
        if (timeId < parseInt(gCommentaryIndex[i])) {
            scrollTimeId = gCommentaryIndex[i - 1];
            break;
        }
    }
    //trace("findClosestCommentary(): searched commentary array, found closest: timeid" + gCommentaryIndex[i - 1] + " after " + i + " searches");
    return scrollTimeId;
}

function findClosestPhoto(secondsSearch) {
    //console.log("scrollToClosestCommentary():" + secondsSearch);
    if (gCurrVideoStartSeconds == 230400) {
        if (secondsSearch > 230400 + 3600) { //if at 065:00:00 or greater, add 000:02:40 to time
            secondsSearch = secondsSearch + 9600;
        }
    }
    var timeId = secondsToTimeId(secondsSearch);
    var photoTimeId = gPhotoIndex[gPhotoIndex.length - 1];
    for (var i = 0; i < gPhotoIndex.length; ++i) {
        if (timeId < parseInt(gPhotoIndex[i])) {
            photoTimeId = gPhotoIndex[i - 1];
            break;
        }
    }
    //console.log("findClosestPhoto(): searched commentary array, found closest: timeid" + gCommentaryIndex[i - 1] + " after " + i + " searches");
    return photoTimeId;
}

// </editor-fold>

// <editor-fold desc="custom event (click) handlers -------------------------------------------------">

function historicalButtonClick() {
    trace('historicalButtonClick');
    ga('send', 'event', 'launch', 'click', 'realtime');
    window.clearInterval(gIntroInterval);
    gIntroInterval = null;
    var nearestHistTimeId = getNearestHistoricalMissionTimeId();
    onMouseOutHandler(); //remove any errant navigator rollovers that occurred during modal

    //scrollTranscriptToTimeId(findClosestUtterance(timeIdToSeconds(nearestHistTimeId)))
    //scrollCommentaryToTimeId(findClosestCommentary(timeIdToSeconds(nearestHistTimeId)));
    fadeOutSplash();
    seekToTime(nearestHistTimeId);
    //scrollTranscriptToTimeId(findClosestUtterance(timeStrToSeconds(gCurrMissionTime)));
    //scrollCommentaryToTimeId(findClosestCommentary(timeStrToSeconds(gCurrMissionTime)));
    //scrollToClosestTOC(timeStrToSeconds(gCurrMissionTime));
}

function oneMinuteToLaunchButtonClick() {
    trace('oneMinuteToLaunchButtonClick');
    ga('send', 'event', 'launch', 'click', 'oneminute');
    window.clearInterval(gIntroInterval);
    gIntroInterval = null;
    onMouseOutHandler(); //remove any errant navigator rollovers that occurred during modal

    fadeOutSplash();
    initializePlayback();
}

// <editor-fold desc="initializePlayback ---------------">

function initializePlayback() {
    trace("initializePlayback()");
    if (gMissionTimeParamSent == 0) {
        //repopulateUtterances(findClosestUtterance(timeIdToSeconds(gDefaultStartTimeId))); //jump to default start time (usually 1 minute to launch)
        //repopulateCommentary(findClosestCommentary(timeIdToSeconds(gDefaultStartTimeId)));
        seekToTime(gDefaultStartTimeId);
    } else {
        var paramMissionTime = $.getUrlVar('t'); //code to detect jump-to-timecode parameter
        //paramMissionTime = paramMissionTime.replace(/%3A/g, ":");
        paramMissionTime = decodeURIComponent(paramMissionTime);
        if (paramMissionTime == 'rt') {
            historicalButtonClick();
        } else {
            window.clearInterval(gIntroInterval);
            gIntroInterval = null;
            //repopulateUtterances(findClosestUtterance(timeStrToSeconds(paramMissionTime)));
            //repopulateCommentary(findClosestCommentary(timeStrToSeconds(paramMissionTime)));
            seekToTime(timeStrToTimeId(paramMissionTime));
        }
    }
    clearInterval(gApplicationReadyIntervalID);
    gApplicationReadyIntervalID = null;
    gIntervalID = setAutoScrollPoller();
}

// </editor-fold>

function fadeOutSplash() {
    trace('fadeOutSplash');
    //toggleFullscreen();
    $('body').removeClass('splash-loaded');
    $('.splash-content').hide();
    //setTimeout(
    //    function () {
    //        $('body').removeClass('splash-loaded');
    //        $('.splash-content').hide();
    //    }, 1600);
}

function galleryClick(timeId) {
    ga('send', 'event', 'galleryClick', 'img', gPhotoData[gPhotoDataLookup[timeId]][1] + ".jpg");
    seekToTime(timeId);
}

function seekToTime(timeId) { // transcript click handling --------------------
    trace("seekToTime(): " + timeId);

    ga('send', 'event', 'seekToTime', 'seek', timeId);

    gDashboardManuallyToggled = false; //reset manual dashboard toggle to reenable auto show/hide
    var totalSeconds = timeIdToSeconds(timeId);
    gCurrMissionTime = secondsToTimeStr(totalSeconds); //set mission time right away to speed up screen refresh

    if (!gOffline) {
        var currVideoID = player.getVideoUrl().substr(player.getVideoUrl().indexOf("v=") + 2, 11);
        for (var i = 0; i < gMediaList.length; ++i) {
            var itemStartTimeSeconds = timeStrToSeconds(gMediaList[i][2]);
            var itemEndTimeSeconds = timeStrToSeconds(gMediaList[i][3]);

            if (totalSeconds >= itemStartTimeSeconds && totalSeconds < itemEndTimeSeconds) { //if this video in loop contains the time we want to seek to
                var seekToSecondsWithOffset = totalSeconds - itemStartTimeSeconds;
                //adjust for 000:02:40 time addition at 065:00:00 -- only the 65 hours-in video needs this manual adjustment, all others have their startTime listed including the time change
                if (itemStartTimeSeconds == 230400) {
                    if (seekToSecondsWithOffset > 3600) { //if at 065:00:00 or greater, subtract 000:02:40 to time
                        trace("seekToTime(): subtracting 9600 seconds from " + seekToSecondsWithOffset + " due to MET time change");
                        seekToSecondsWithOffset = seekToSecondsWithOffset - 9600;
                    }
                }
                gCurrVideoStartSeconds = itemStartTimeSeconds;
                gCurrVideoEndSeconds = itemEndTimeSeconds;
                gPlaybackState = "transcriptclicked"; //used in the youtube playback code to determine whether vid has been scrubbed
                //change youtube video if the correct video isn't already playing
                if (currVideoID !== gMediaList[i][1]) {
                    trace("seekToTime(): changing video from: " + currVideoID + " to: " + gMediaList[i][1]);
                    gNextVideoStartTime = seekToSecondsWithOffset;
                    player.loadVideoById(gMediaList[i][1], seekToSecondsWithOffset);
                } else {
                    trace("seekToTime(): no need to change video. Seeking to " + timeId);
                    player.seekTo(seekToSecondsWithOffset, true);
                }
                showPhotoByTimeId(findClosestPhoto(totalSeconds));
                setTimeout(function() {
                    scrollTranscriptToTimeId(findClosestUtterance(totalSeconds));
                    scrollCommentaryToTimeId(findClosestCommentary(totalSeconds));
                    scrollToClosestTOC(totalSeconds);
                    redrawAll();
                },100);

                break;
            }
        }
    }
}

// </editor-fold>

// <editor-fold desc="historical time handling ------------------------------------------------">

function displayHistoricalTimeDifferenceByTimeId(timeId) {
    //trace("displayHistoricalTimeDifferenceByTimeId():" + timeid);
    var launchDate = Date.parse("1972-12-07 0:33 -500");

    var sign = timeId.substr(0,1);
    var hours = Math.abs(parseInt(timeId.substr(0,3)));
    var minutes = parseInt(timeId.substr(3,2));
    var seconds = parseInt(timeId.substr(5,2));

    var conversionMultiplier = 1;
    if (sign == "-") { //if on countdown, subtract the mission time from the launch moment
        conversionMultiplier = -1;
    }

    var timeidDate = new Date(launchDate.getTime());

    timeidDate.add({
        hours: hours * conversionMultiplier,
        minutes: minutes * conversionMultiplier,
        seconds: seconds * conversionMultiplier
    });

    if (parseInt(timeId) > 650000) {
        //trace("displayHistoricalTimeDifferenceByTimeId(): subtracting 2 hours 40 minutes from time due to MET time change");
        timeidDate.add({
            hours: -2,
            minutes: -40
        });
    }

    var historicalDate = new Date(timeidDate.getTime()); //for display only

    //var nowDate = Date.parse("2015-12-07 0:33 -500");
    var nowDate = Date.now();
    //if (nowDate.dst()) {
        //nowDate.setHours(nowDate.getHours() + 1); //TODO revisit potential dst offset
    //}
    var timeDiff = nowDate.getTime() - timeidDate.getTime();
    var humanizedRealtimeDifference = "Exactly: " + moment.preciseDiff(0, timeDiff) + " ago to the second.";

    //$(".currentDate").text(nowDate.toDateString());
    //$(".currentTime").text(nowDate.toLocaleTimeString());

    $("#historicalTimeDiff").html(humanizedRealtimeDifference);
    $(".historicalDate").text(historicalDate.toDateString());

    var options = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
    $(".historicalTime").text(historicalDate.toLocaleTimeString('en-US', options));
    //$(".historicalTime").text(historicalDate.toLocaleTimeString().match(/^[^:]+(:\d\d){2} *(am|pm)\b/i)[0]);  //.replace(/([AP]M)$/, ""));
    //$(".historicalTimeAMPM").text(historicalDate.toLocaleTimeString().match(/([AP]M)/)[0])

    $(".missionElapsedTime").text(gCurrMissionTime);
}

function getNearestHistoricalMissionTimeId() { //proc for "snap to real-time" button
    var launchDate = Date.parse("1972-12-07 0:33am -500");
    var countdownStartDate = Date.parse("1972-12-06 9:55:39pm -500");
    //var nowDate = Date.parse("2015-12-06 10:00pm -500");
    var nowDate = Date.now();

    var histDate = new Date(nowDate.getTime());
    //if (histDate.dst()) {
    //    histDate.setHours(histDate.getHours() + 1); //TODO test DST offset
    //}
    histDate.setMonth(countdownStartDate.getMonth());
    histDate.setYear(countdownStartDate.getYear());

    // Convert dates to milliseconds
    var histDate_ms = histDate.getTime();
    var countdownStartDate_ms = countdownStartDate.getTime();
    var launchDate_ms = launchDate.getTime();

    if (histDate_ms < countdownStartDate_ms) { //if now is before the countdownStartDate, shift forward days to start on first day of the mission
        //var daysToMoveForward = Math.ceil((countdownStartDate_ms - histDate_ms) / (1000 * 60 * 60 * 24));
        var daysToMoveForward = 6;
        histDate_ms += (1000 * 60 * 60 * 24) * daysToMoveForward;
    } else if (histDate_ms > launchDate_ms + (gMissionDurationSeconds * 1000)) { //hist date occurs after mission ended, shift backward days to start on first day of the mission
        //var daysToMoveBackward = Math.floor((histDate_ms - countdownStartDate_ms) / (1000 * 60 * 60 * 24));
        var daysToMoveBackward = 12;
        histDate_ms -= (1000 * 60 * 60 * 24) * daysToMoveBackward;
    }

    var timeSinceLaunch_ms = histDate_ms - launchDate_ms;
    if (timeSinceLaunch_ms / 1000 > 65 * 60 * 60) { //if past 65 hours into the mission, add the 2:40 MET time switch
        timeSinceLaunch_ms += 9600 * 1000;
    }

    return secondsToTimeId(timeSinceLaunch_ms / 1000);
}

// </editor-fold>

// <editor-fold desc="scrolling things------------------------------------------------">

function scrollTOCToTimeId(timeId) {
    //if (gTOCDataLookup[timeId] !== undefined) {
    if (gTOCDataLookup.hasOwnProperty(timeId)) {
    //if ($.inArray(timeId, gTOCIndex) != -1) {
        //console.log("scrollTOCToTimeID(): scrolling to " + timeId);
        var TOCFrame = $('#iFrameTOC');
        var TOCFrameContents = TOCFrame.contents();
        var TOCContainer = TOCFrameContents.find('.TOC_container');
        var TOCElement = TOCFrameContents.find('#tocid' + timeId);
        TOCFrameContents.find('.tocitem').css("background-color", ""); //clear all element highlights
        TOCElement.css("background-color", gBackground_color_active); //set new element highlights

        flashTab("tocTab");

        var scrollDestination = TOCContainer.scrollTop() + TOCElement.offset().top;
        TOCContainer.animate({scrollTop: scrollDestination}, 500);
        gLastTOCElement = TOCElement;
        gLastTOCTimeId = timeId;
    }
}

function scrollCommentaryToTimeId(timeId) { //timeid must exist in commentary
    //if (gCommentaryDataLookup[timeId] !== undefined) {
    if (gCommentaryDataLookup.hasOwnProperty(timeId)) {
    //if ($.inArray(timeId, gCommentaryIndex) != -1) {
        // console.log("scrollTranscriptToTimeId " + timeId);
        var commentaryDiv = $('#commentaryDiv');
        var commentaryTable = $('#commentaryTable');

        gCurrentHighlightedCommentaryIndex = gCommentaryDataLookup[timeId];

        if (typeof gCommentaryDisplayStartIndex == 'undefined') {
            repopulateCommentary(timeId);
            //check if timeId is already loaded into commentary div
        } else if (gCommentaryDataLookup[timeId] < gCommentaryDisplayStartIndex + 49) { //prepend
            var prependCount = (gCommentaryDisplayStartIndex - gCommentaryDataLookup[timeId]) + 50;
            if (prependCount > 50) {
                repopulateCommentary(timeId);
            } else {
                prependCount = 50;
                prependCommentary(prependCount);
            }
        } else if (gCommentaryDataLookup[timeId] > gCommentaryDisplayEndIndex - 49) { //append
            var appendCount = (gCommentaryDataLookup[timeId] - gCommentaryDisplayEndIndex) + 50;
            if (appendCount > 50) {
                repopulateCommentary(timeId);
            } else {
                appendCount = 50;
                appendCommentary(appendCount);
            }
        }
        commentaryTable.children("*").css("background-color", ""); //clear all element highlights
        var highlightedCommentaryElement = $(".comid" + timeId);
        highlightedCommentaryElement.css("background-color", gBackground_color_active); //set new element highlights

        var newScrollDestination = commentaryDiv.scrollTop() + highlightedCommentaryElement.offset().top - commentaryDiv.offset().top;
        commentaryDiv.animate({scrollTop: newScrollDestination}, '1000', 'swing', function () {
            //console.log('Finished animating commentary: ' + newScrollDestination);
            trimCommentary();
        });

        flashTab("commentaryTab");
        gLastCommentaryTimeId = timeId;
    }
}

function scrollTranscriptToTimeId(timeId) {
    //if (gUtteranceDataLookup[timeId] !== undefined) {
    if (gUtteranceDataLookup.hasOwnProperty(timeId)) {
    //if ($.inArray(timeId, gUtteranceIndex) != -1) {
        //trace("scrollTranscriptToTimeId " + timeId);
        var utteranceDiv = $('#utteranceDiv');
        var utteranceTable = $('#utteranceTable');

        gCurrentHighlightedUtteranceIndex = gUtteranceDataLookup[timeId];

        //check if utteranceDiv is empty
        if (typeof gUtteranceDisplayStartIndex == 'undefined') {
            repopulateUtterances(timeId);
            //check if timeId is already loaded into utterance div
        } else if (gUtteranceDataLookup[timeId] < gUtteranceDisplayStartIndex + 49) { //prepend - always have 50 lines above current time
            var prependCount = (gUtteranceDisplayStartIndex - gUtteranceDataLookup[timeId]) + 50;
            if (prependCount > 50) {
                repopulateUtterances(timeId);
            } else {
                prependCount = 50;
                prependUtterances(prependCount);
            }
        } else if (gUtteranceDataLookup[timeId] > gUtteranceDisplayEndIndex - 49) { //append - always have 50 lines below current time
            var appendCount = (gUtteranceDataLookup[timeId] - gUtteranceDisplayEndIndex) + 50;
            if (appendCount > 50) {
                repopulateUtterances(timeId);
            } else {
                appendCount = 50;
                appendUtterances(appendCount);
            }
        }
        utteranceTable.children("*").css("background-color", ""); //clear all element highlights
        var highlightedTranscriptElement = $(".uttid" + timeId);
        highlightedTranscriptElement.css("background-color", gBackground_color_active); //set new element highlights

        var newScrollDestination = utteranceDiv.scrollTop() + highlightedTranscriptElement.offset().top - utteranceDiv.offset().top;
        utteranceDiv.animate({scrollTop: newScrollDestination}, '1000', 'swing', function () {
            //trace('Finished animating: ' + scrollDestination);
            trimUtterances();
        });
        flashTab("transcriptTab");
        gLastUtteranceTimeId = timeId;
    }
}

function flashTab(tabName, tabNum, flashColor) {
    var flashDuration = 500; //in ms
    var $tab = $('#' + tabName);
    if (!$tab.hasClass('selected')) {
        //trace("flash tab");
        $tab.addClass("blink_me");
        setTimeout(function(){$tab.removeClass("blink_me")}, flashDuration);

        //$tab.effect("highlight", {color: flashColor}, flashDuration); //blink the tab
        //$tab.css("background-color", flashColor);

        //$tab.animate({
        //    backgroundColor: flashColor
        //}, 500, function() {
        //    trace("tab flash animation complete.");
        //    $tab.css("background-color", "");
        //});
        //$tab.effect("bounce", "slow");
        //$("#" + tabName).effect("pulsate", {times: 2, color: flashColor}, flashDuration); //blink the tab
        //$("#" + tabName).fadeTo(200, 0.5).fadeTo(200, 1.0); //blink the tab
    }
}

// </editor-fold> //scrolling things

// <editor-fold desc="utterance and commentary chunking code------------------------------------------------">

function repopulateUtterances(timeId) {
    var utteranceIndex = gUtteranceDataLookup[timeId]; //must be a timeId that exists in the transcripts
    var utteranceTable = $('#utteranceTable');
    utteranceTable.html('');
    var startIndex = utteranceIndex - 50;
    var endIndex = startIndex + 100;
    startIndex = startIndex < 0 ? 0 : startIndex;
    endIndex = endIndex >= gUtteranceIndex.length ? gUtteranceIndex.length - 1 : endIndex;
    for (var i = startIndex; i <= endIndex; i++) {
        utteranceTable.append(getUtteranceObjectHTML(i));
    }
    gUtteranceDisplayStartIndex = startIndex;
    gUtteranceDisplayEndIndex = endIndex;
    trace("repopulateUtterances(): populated utterances from: " + gUtteranceDisplayStartIndex + " to " + gUtteranceDisplayEndIndex);
    $('#utteranceDiv').scrollTop('#uttid' + timeId);
}

function prependUtterances(count, atTop) {
    atTop = atTop || false;
    var utteranceDiv = $('#utteranceDiv');
    var utteranceTable = $('#utteranceTable');
    var htmlToPrepend = "";
    var prependedCount = 0;
    var startIndex = gUtteranceDisplayStartIndex - count;
    for (var i = startIndex; i < startIndex + count; i++) {
        if (i >= 0) {
            htmlToPrepend = htmlToPrepend + (getUtteranceObjectHTML(i));
            prependedCount ++;
        }
    }
    utteranceTable.prepend(htmlToPrepend);

    if (atTop) {
        var elementToScrollBackTo = $("#uttid" + timeStrToTimeId(gUtteranceData[gUtteranceDisplayStartIndex][0]));
        //trace("element to scroll back to: " + elementToScrollBackTo.attr('id'));
        var oldScrollDestination = utteranceDiv.scrollTop() + elementToScrollBackTo.offset().top - utteranceDiv.offset().top;
        utteranceDiv.scrollTop(oldScrollDestination);
    }

    trace("prependUtterances(): prepended utterances from: " + startIndex);
    gUtteranceDisplayStartIndex = gUtteranceDisplayStartIndex - prependedCount;
    trace("prependUtterances(): prepended utterances to: " + i);
    var diff = i - startIndex;
    trace("prependUtterances(): difference: " + diff);
    trace("prependUtterances(): counted prepends in if statement: " + prependedCount);
}

function appendUtterances(count, atBottom) {
    atBottom = atBottom || false;
    var utteranceDiv = $('#utteranceDiv');
    var utteranceTable = $('#utteranceTable');
    var htmlToAppend = "";
    var startIndex = gUtteranceDisplayEndIndex + 1;
    var appendedCount = 0;
    for (var i = startIndex; i < startIndex + count; i++) {
        if (i >= 0 && i < gUtteranceData.length) {
            //trace("Appended: " + gUtteranceData[i][0]);
            htmlToAppend = htmlToAppend + (getUtteranceObjectHTML(i));
            appendedCount ++;
        }
    }
    if (atBottom)
        var topToScrollBackTo = utteranceDiv.scrollTop();

    utteranceTable.append(htmlToAppend);

    if (atBottom)
        utteranceDiv.scrollTop(topToScrollBackTo);

    trace("appendUtterances(): appended utterances from: " + startIndex);
    gUtteranceDisplayEndIndex = gUtteranceDisplayEndIndex + appendedCount;
    trace("appendUtterances(): appended utterances to: " + i);
    var diff = i - startIndex;
    trace("appendUtterances(): difference: " + diff);
    trace("appendUtterances(): counted appends in if statement: " + appendedCount);
}

function trimUtterances() {
    var numberToRemove = (gUtteranceDisplayEndIndex - gUtteranceDisplayStartIndex) - 150;
    if (numberToRemove > 0) {
        trace("trimUtterances():" + numberToRemove);
        var currDistFromStart = gCurrentHighlightedUtteranceIndex - gUtteranceDisplayStartIndex;
        var currDistFromEnd = gUtteranceDisplayEndIndex - gCurrentHighlightedUtteranceIndex;
        trace("trimUtterances(): currDistFromStart: " + currDistFromStart);
        trace("trimUtterances(): currDistFromEnd: " + currDistFromEnd);
        if (currDistFromStart > currDistFromEnd) { //trim items from top of utterance div
            var counter = 0;
            for (var i = gUtteranceDisplayStartIndex; i < gUtteranceDisplayStartIndex + numberToRemove; i++) {
                $('#uttid' + gUtteranceIndex[i]).remove();
                counter++;
            }
            //trace("Trimming " + numberToRemove + " utterances from top");
            var tempEndForTrace = gUtteranceDisplayStartIndex + numberToRemove;
            trace("trimUtterances(): removed from top: " + counter + " starting at index: " + gUtteranceDisplayStartIndex + " up to index: " + tempEndForTrace);
            gUtteranceDisplayStartIndex = gUtteranceDisplayStartIndex + numberToRemove;

        } else { //trim items from bottom of utterance div
            counter = 0;
            for (i = gUtteranceDisplayEndIndex - numberToRemove; i <= gUtteranceDisplayEndIndex; i++) {
                $('#uttid' + gUtteranceIndex[i]).remove();
                counter++;
            }
            //trace("Trimming " + numberToRemove + " utterances from bottom");
            gUtteranceDisplayEndIndex = gUtteranceDisplayEndIndex - numberToRemove;
            trace("trimUtterances(): removed from bottom: " + counter + " starting at index: " + gUtteranceDisplayEndIndex - numberToRemove);
        }
        var utteranceDiv = $('#utteranceDiv');
        var currElement = $('#uttid' + timeStrToTimeId(gUtteranceData[gCurrentHighlightedUtteranceIndex][0]));
        var newScrollDestination = utteranceDiv.scrollTop() + currElement.offset().top - utteranceDiv.offset().top;
        utteranceDiv.scrollTop(newScrollDestination);
    }
}

function getUtteranceObjectHTML(utteranceIndex, style) {
    style = style || '';
    //trace("getUtteranceObjectHTML():" + utteranceIndex);
    var utteranceObject = gUtteranceData[utteranceIndex];

    var who_modified = utteranceObject[1];
    who_modified = who_modified.replace(/CDR/g, "Cernan");
    who_modified = who_modified.replace(/CMP/g, "Evans");
    who_modified = who_modified.replace(/LMP/g, "Schmitt");
    who_modified = who_modified.replace(/PAO/g, "Public Affairs");
    who_modified = who_modified.replace(/CC/g, "Mission Control");

    var words_modified = utteranceObject[2];
    words_modified = words_modified.replace(/O2/g, "O<sub>2</sub>");
    words_modified = words_modified.replace(/H2/g, "H<sub>2</sub>");
    words_modified = words_modified.replace(/Tig /g, "T<sub>ig</sub> ");

    var html = $('#utteranceTemplate').html();
    html = html.replace("@style", style);
    var timeId = utteranceObject[0];
    html = html.replace(/@uttid/g, timeId);
    html = html.replace("@timestamp", timeIdToTimeStr(utteranceObject[0]));
    html = html.replace("@who", who_modified);
    //html = html.replace("@words", "[" + utteranceIndex + "]" + words_modified);
    html = html.replace("@words", words_modified);
    if (who_modified == "Public Affairs" || who_modified == "") {
        var uttTypeStr = "utt_pao";
    } else if (who_modified == "Mission Control") {
        uttTypeStr = "utt_capcom";
    } else {
        uttTypeStr = "utt_crew";
    }
    html = html.replace(/@uttType/g, uttTypeStr);

    //trace(utteranceObject[0] + " - " + utteranceObject[1] + " - " + utteranceObject[2]);
    return html;
}

function repopulateCommentary(timeId) {
    //console.log("repopulateCommentary:" + timeId);
    var commentaryIndex = gCommentaryDataLookup[timeId]; //must be a timeId that exists in the commentary transcripts
    var commentaryTable = $('#commentaryTable');
    commentaryTable.html('');
    var startIndex = commentaryIndex - 50;
    var endIndex = startIndex + 100;
    startIndex = startIndex < 0 ? 0 : startIndex;
    endIndex = endIndex >= gCommentaryIndex.length ? gCommentaryIndex.length - 1 : endIndex;
    for (var i = startIndex; i <= endIndex; i++) {
        commentaryTable.append(getCommentaryObjectHTML(i));
    }
    gCommentaryDisplayStartIndex = startIndex;
    gCommentaryDisplayEndIndex = endIndex;
    //$('#commentaryDiv').scrollTop('#comid' + timeId);
    var commentaryDiv = $('#commentaryDiv');
    var highlightedCommentaryElement = $(".comid" + timeId);
    var newScrollDestination = commentaryDiv.scrollTop() + highlightedCommentaryElement.offset().top - commentaryDiv.offset().top;
    commentaryDiv.animate({scrollTop: newScrollDestination}, '1000', 'swing', function () {
        //trace('Finished animating: ' + scrollDestination);
        //trimUtterances();
    });
}

function prependCommentary(count, atTop) {
    atTop = atTop || false;
    if (gCommentaryDisplayStartIndex > 0) {
        var commentaryDiv = $('#commentaryDiv');
        var commentaryTable = $('#commentaryTable');
        var htmlToPrepend = "";
        var prependedCount = 0;
        var startIndex = gCommentaryDisplayStartIndex - count;
        for (var i = startIndex; i < startIndex + count; i++) {
            if (i >= 0) {
                htmlToPrepend = htmlToPrepend + (getCommentaryObjectHTML(i));
                prependedCount++;
            }
        }
        commentaryTable.prepend(htmlToPrepend);

        if (atTop) {
            var elementToScrollBackTo = $("#comid" + timeStrToTimeId(gCommentaryData[gCommentaryDisplayStartIndex][0]));
            //console.log("element to scroll back to: " + elementToScrollBackTo.attr('id'));
            var oldScrollDestination = commentaryDiv.scrollTop() + elementToScrollBackTo.offset().top - commentaryDiv.offset().top;
            commentaryDiv.scrollTop(oldScrollDestination);
        }

        //console.log("prepended commentary from:" + gCommentaryData[gCommentaryDisplayStartIndex][0]);
        gCommentaryDisplayStartIndex = gCommentaryDisplayStartIndex - prependedCount;
        //console.log("prepended commentary to:" + gCommentaryData[gCommentaryDisplayStartIndex][0]);
        trace("prependCommentary:" + prependedCount);
    } else {
        //trace("at first commentary item");
    }
}

function appendCommentary(count, atBottom) {
    atBottom = atBottom || false;
    var startIndex = gCommentaryDisplayEndIndex + 1;
    if (gCommentaryDisplayEndIndex < gCommentaryData.length - 1) {
        var commentaryDiv = $('#commentaryDiv');
        var commentaryTable = $('#commentaryTable');
        var htmlToAppend = "";
        var appendedCount = 0;
        for (var i = startIndex; i < startIndex + count; i++) {
            if (i >= 0 && i < gCommentaryData.length) {
                //trace("Appended: " + gCommentaryData[i][0]);
                htmlToAppend = htmlToAppend + (getCommentaryObjectHTML(i));
                appendedCount++;
            }
        }
        if (atBottom)
            var topToScrollBackTo = commentaryDiv.scrollTop();

        commentaryTable.append(htmlToAppend);

        if (atBottom)
            commentaryDiv.scrollTop(topToScrollBackTo);

        //console.log("appended commentary from:" + gCommentaryData[gCommentaryDisplayEndIndex][0]);
        gCommentaryDisplayEndIndex = gCommentaryDisplayEndIndex + appendedCount;
        //console.log("appended commentary to:" + gCommentaryData[gCommentaryDisplayEndIndex][0]);
        trace("appendCommentary:" + count);
    } else {
        //trace("at last commentary item");
    }
}

function trimCommentary() {
    var numberToRemove = (gCommentaryDisplayEndIndex - gCommentaryDisplayStartIndex) - 150;
    if (numberToRemove > 0) {
        trace("trimCommentary():" + numberToRemove);
        var currDistFromStart = gCurrentHighlightedCommentaryIndex - gCommentaryDisplayStartIndex;
        var currDistFromEnd = gCommentaryDisplayEndIndex - gCurrentHighlightedCommentaryIndex;
        if (currDistFromStart > currDistFromEnd) { //trim items from top of commentary div
            for (var i = gCommentaryDisplayStartIndex; i < gCommentaryDisplayStartIndex + numberToRemove; i++) {
                $('#uttid' + gCommentaryIndex[i]).remove();
            }
            //console.log("Trimming " + numberToRemove + " commentary from top");
            gCommentaryDisplayStartIndex = gCommentaryDisplayStartIndex + numberToRemove
        } else { //trim items from bottom of commentary div
            for (i = gCommentaryDisplayEndIndex - numberToRemove; i <= gCommentaryDisplayEndIndex; i++) {
                $('#uttid' + gCommentaryIndex[i]).remove();
            }
            //console.log("Trimming " + numberToRemove + " commentary from bottom");
            gCommentaryDisplayEndIndex = gCommentaryDisplayEndIndex - numberToRemove;
        }
        var commentaryDiv = $('#commentaryDiv');
        var currElement = $('#comid' + timeStrToTimeId(gCommentaryData[gCurrentHighlightedCommentaryIndex][0]));
        var newScrollDestination = commentaryDiv.scrollTop() + currElement.offset().top - commentaryDiv.offset().top;
        commentaryDiv.scrollTop(newScrollDestination);
    }
}

function getCommentaryObjectHTML(commentaryIndex, style) {
    style = style || '';
    //console.log("getCommentaryObjectHTML():" + commentaryIndex);
    var commentaryObject = gCommentaryData[commentaryIndex];

    var comId = commentaryObject[0];

    var attribution = commentaryObject[1];
    var who_modified = commentaryObject[2];
    if (who_modified.length == 0) {
        //attribution = attribution.replace(/ALSJ/g, '<a href="http://www.hq.nasa.gov/alsj/frame.html" target="alsj">ALSJ</a> Commentary');
    }
    if (who_modified.length != 0) {
        who_modified = who_modified.replace(/CDR/g, "Cernan");
        who_modified = who_modified.replace(/CMP/g, "Evans");
        who_modified = who_modified.replace(/LMP/g, "Schmitt");
        if (who_modified == "summary")
            who_modified = '';
    } else {
        who_modified = '';
    }
    var words_modified = commentaryObject[3];
    words_modified = words_modified.replace(/O2/g, "O<sub>2</sub>");
    words_modified = words_modified.replace(/H2/g, "H<sub>2</sub>");
    words_modified = words_modified.replace(/Tig /g, "T<sub>ig</sub> ");
    words_modified = words_modified.replace(/@alsjurl/g, '<a href="https://www.hq.nasa.gov/alsj');
    words_modified = words_modified.replace(/@alsjt/g, ' target="alsj"');

    var html = $('#commentaryTemplate').html();

    if (typeof commentaryObject != 'object') {
        trace("something very wrong");
    }

    if (who_modified != '') {
        html = html.replace('@whocell', '<td class="who @comType">@who</td>');
        html = html.replace('@wordscell', '<td class="spokenwords @comType">@words <span class="attribution">@attribution</span></td>');
    } else {
        html = html.replace('@whocell', '');
        html = html.replace('@wordscell', '<td class="spokenwords @comType" colspan="2">@words <span class="attribution">@attribution</span></td>');
    }

    html = html.replace(/@comid/g, comId);
    html = html.replace("@timestamp", timeIdToTimeStr(comId));
    if (attribution != '') {
        html = html.replace("@attribution", "(" + attribution + ")");
    } else {
        html = html.replace("@attribution", "");
    }
    html = html.replace("@who", who_modified);
    html = html.replace("@words", words_modified);

    if (who_modified == '') {
        var comTypeStr = "com_support";
    } else {
        comTypeStr = "com_crew";
    }
    html = html.replace(/@comType/g, comTypeStr);

    //console.log(commentaryObject[0] + " - " + commentaryObject[1] + " - " + commentaryObject[2]);
    return html;
}

// </editor-fold> //utterances and commentary

// <editor-fold desc="photo display and gallery -------------------------------------------------">

function populatePhotoGallery() {
    var photoGalleryDiv = $('#photoGallery');
    photoGalleryDiv.html('');

    for (var i = 0; i < gPhotoIndex.length; i++) {
        var photoObject = gPhotoData[i];
        var html = $('#photoGalleryTemplate').html();
        if (photoObject[2] != "") {
            var photoTypePath = "flight";
            var filename = "AS17-" + photoObject[1];
        } else {
            photoTypePath = "supporting";
            filename = photoObject[1];
        }
        filename = filename + ".jpg";

        if (gCdnEnabled) {
            var cdnNum = getRandomInt(1, 5);
            var serverUrl = "http://cdn" + cdnNum + ".apollo17.org";
        } else {
            serverUrl = "http://apollo17.org";
        }

        html = html.replace(/@serverUrl/g , serverUrl);
        html = html.replace(/@photoTypePath/g , photoTypePath);
        html = html.replace(/@filename/g ,filename);
        html = html.replace(/@timestamp/g , timeIdToTimeStr(photoObject[0]));
        var timeid = photoObject[0];
        html = html.replace(/@timeid/g , timeid);

        //listView.append(html);
        photoGalleryDiv.append(html);
    }

    $("img.galleryImage").lazyload({
        container: photoGalleryDiv,
        threshold : 50
    });

    gApplicationReady += 1;
    trace("APPREADY: populatePhotoGallery(): " + gApplicationReady);
}

function showPhotoByTimeId(timeId) {
    //if (gTOCDataLookup[timeId] !== undefined) {
    if (gPhotoDataLookup.hasOwnProperty(timeId)) {
        loadPhotoHtml(gPhotoDataLookup[timeId]);

        //scroll photo gallery to current photo
        var photoGalleryDiv = $('#photoGallery');
        photoGalleryDiv.find('.selected').removeClass('selected');
        var photoGalleryImageTimeId = "#gallerytimeid" + gPhotoData[gPhotoDataLookup[timeId]][0];
        $(photoGalleryImageTimeId).addClass('selected');

        var scrollDest = photoGalleryDiv.scrollTop() + $(photoGalleryImageTimeId).offset().top - gNavigatorHeight - 40; //added offset for ted design
        photoGalleryDiv.animate({scrollTop: scrollDest}, '500', 'swing', function() {
            //trace('Finished animating gallery: ' + scrollDest);
        });
    }
}

function loadPhotoHtml(photoIndex) {
    //trace('loadPhotoHtml():' + photoIndex);
    if (typeof photoIndex == "undefined") {
        trace('**invalid photo call');
    }
    var photoDiv = $("#photodiv");
    var photoObject = gPhotoData[photoIndex];
    var html = $('#photoTemplate').html();

    var photoTimeId = photoObject[0];
    var magCode = photoObject[2];
    if (magCode != "") {
        var photoTypePath = "flight";
        var filename = "AS17-" + photoObject[1];
    } else {
        photoTypePath = "supporting";
        filename = photoObject[1];
    }
    var photographer = photoObject[3];
    var description = photoObject[4];

    //display prerendered 1024 height photos if photo div height smaller than 1024
    if (photoDiv.height() <= 1024) {
        var sizePath = "1024";
    } else {
        sizePath = "2100";
    }
    //var fullSizePath = (photoTypePath == "supporting") ? "2100" : "4175";
    var fullSizePath = "2100";

    if (gCdnEnabled) {
        var cdnNum = getRandomInt(1, 5);
        var serverUrl = "http://cdn" + cdnNum + ".apollo17.org";
    } else {
        serverUrl = "http://apollo17.org";
    }

    html = html.replace(/@photoTypePath/g , photoTypePath);
    html = html.replace(/@fullSizePath/g , fullSizePath);
    html = html.replace(/@serverUrl/g , serverUrl);
    html = html.replace(/@sizepath/g , sizePath);
    html = html.replace(/@filename/g , filename);
    html = html.replace(/@timeStr/g,  timeIdToTimeStr(photoTimeId));
    html = (magCode != "") ? html.replace("@mag_code", "Mag " + magCode) : html.replace("@mag_code", "");
    html = (photographer != "") ? html.replace("@photographer", photographer) : html.replace("@photographer", "");
    html = html.replace("@description", description);

    photoDiv.html('');
    photoDiv.append(html);
}
// </editor-fold>

// <editor-fold desc="search and dashboard functions ---------------">

function performSearch() {
    //trace("performSearch(): start");
    var searchResultsTable = $('#searchResultsTable');
    var searchResultCount = 0;
    var searchText = $('#searchInputField').val().toLowerCase();
    searchResultsTable.html('');
    if (searchText.length > 1) {
        for (var counter = 0; counter < gUttCommData.length; counter++) {
            if ( gUttCommData[counter][3].toLowerCase().indexOf(searchText) != -1) {
                var html = getSearchResultHTML(counter);
                var searchResultTextIndex = html.toLowerCase().indexOf(searchText);
                var foundWord = getWordAt(html, searchResultTextIndex);
                html = html.replace(foundWord, "<span class='searchResultHighlight'>" + foundWord + "</span>");
                searchResultsTable.append(html);
                //trace("performSearch():found: " + counter);
                searchResultCount++;
            }
            if (searchResultCount > 500) {
                break;
            }
        }
    }
}

function getSearchResultHTML(searchArrayIndex) {
    //trace("getUtteranceObjectHTML():" + utteranceIndex);
    var searchObject = gUttCommData[searchArrayIndex];

    var who_modified = searchObject[2];
    who_modified = who_modified.replace(/CDR/g, "Cernan");
    who_modified = who_modified.replace(/CMP/g, "Evans");
    who_modified = who_modified.replace(/LMP/g, "Schmitt");
    who_modified = who_modified.replace(/PAO/g, "Public Affairs");
    who_modified = who_modified.replace(/CC/g, "Mission Control");

    var words_modified = searchObject[3];
    words_modified = words_modified.replace(/O2/g, "O<sub>2</sub>");
    words_modified = words_modified.replace(/H2/g, "H<sub>2</sub>");
    words_modified = words_modified.replace(/Tig /g, "T<sub>ig</sub> ");

    var html = $('#searchResultTemplate').html();
    var timeId = searchObject[0];
    html = html.replace(/@searchResultid/g, timeId);
    html = html.replace("@timestamp", timeIdToTimeStr(searchObject[0]));
    html = html.replace("@who", who_modified);
    html = html.replace("@words", words_modified);
    if (who_modified == "Public Affairs" || who_modified == "") {
        var uttTypeStr = "utt_pao";
    } else if (who_modified == "Mission Control") {
        uttTypeStr = "utt_capcom";
    } else {
        uttTypeStr = "utt_crew";
    }
    html = html.replace(/@uttType/g, uttTypeStr);
    if (searchObject[4] == 0) { //0 for utterance
        html = html.replace(/@entrytypevar/g, "transcript");
        html = html.replace(/@entrytype/g, "");
    } else { //1 for commentary
        html = html.replace(/@entrytypevar/g, "commentary");
        html = html.replace(/@entrytype/g, "Commentary");
    }
    return html;
}

function searchResultClick(searchResultId, itemType) {
    toggleSearchOverlay();
    seekToTime(searchResultId);
    if (itemType == "transcript") {
        activateTab("transcriptTab");
        scrollTranscriptToCurrMissionTime();
    } else {
        activateTab("commentaryTab");
        scrollCommentaryToCurrMissionTime();
    }
}

function updateDashboard(timeId) {
    /*
     Mission Day 6/13
     Day 2 on Lunar Surface

     Command and Service Module:
     Onboard: Ron Evans
     Lunar orbit 23

     Lunar Module:
     Onboard: Gene Cernan, Jack Schmitt
     On Lunar Surface
     Preparing for 2nd EVA (Extravehicular Activity): (countdown)
     */

    /*
     Mission Day 2/13
     Trans-lunar Coast
     Current velocity (relative to Earth):
     10000 feet/second (10000 km/h) (Mach 10)

     Current distance from Earth:
     110000nm (110000km)

     Command and Service Module:
     Onboard: Gene Cernan, Jack Schmitt, Ron Evans

     Lunar Module:
     Docked with Command and Service Module.
     */
    var timeIdInSeconds = timeIdToSeconds(timeId);

    //Decide whether to auto-hide dashboard


    //Display day
    var dashMissionDay = Math.ceil(timeIdInSeconds / 86400);
    dashMissionDay = dashMissionDay == 0 ? 1 : dashMissionDay;
    $('#dashMissionDay').html(dashMissionDay);

    //Display Mission Stage
    for (var counter = 0; counter < gMissionStages.length; counter ++) {
        if (timeStrToSeconds(gMissionStages[counter][0]) < timeIdInSeconds && timeStrToSeconds(gMissionStages[counter][3]) > timeIdInSeconds) {
            var dashMissionStage = gMissionStages[counter][2];
            break;
        }
    }
    $('#dashMissionStage').html(dashMissionStage);


    var calculateVelocity;
    var calculateDistanceFromEarth;
    if (timeIdInSeconds < timeStrToSeconds("088:43:38")) { //trans-lunar coast
        calculateVelocity = true;
        calculateDistanceFromEarth = true
    } else if (timeIdInSeconds > timeStrToSeconds("236:52:03")){ //trans-earth coast
        calculateVelocity = true;
        calculateDistanceFromEarth = true;
    } else { //lunar orbit
        calculateVelocity = false;
        calculateDistanceFromEarth = false;
    }
    //Display velocity
    if (calculateVelocity) {
        if (timeIdInSeconds < timeStrToSeconds("304:32:00")) {
            for (counter = 0; counter < gTelemetryData.length; counter++) {
                if (timeStrToSeconds(gTelemetryData[counter][0]) < timeIdInSeconds) {
                    if (gTelemetryData[counter][1] != "") {
                        var prevVelocityTimestampObject = gTelemetryData[counter];
                    }
                } else {
                    if (gTelemetryData[counter][1] != "") {
                        var nextVelocityTimestampObject = gTelemetryData[counter];
                        break;
                    }
                }
            }
            var startSeconds = timeStrToSeconds(prevVelocityTimestampObject[0]);
            startSeconds = startSeconds > 230400 ? startSeconds - 9600 : startSeconds;
            var startVelocity = parseInt(prevVelocityTimestampObject[1]);
            var currSecondsAdjusted = timeIdInSeconds > 230400 ? timeIdInSeconds - 9600 : timeIdInSeconds;

            var endSeconds = timeStrToSeconds(nextVelocityTimestampObject[0]);
            endSeconds = endSeconds > 230400 ? endSeconds - 9600 : endSeconds;
            var endVelocity = parseInt(nextVelocityTimestampObject[1]);
            var secondsRange = endSeconds - startSeconds;
            var velocityRange = endVelocity - startVelocity;
            var currentPositionInSecondsRange = currSecondsAdjusted - startSeconds;
            var currentVelocityFPS = ((currentPositionInSecondsRange * velocityRange) / secondsRange) + startVelocity;

        } else {
            currentVelocityFPS = 0;
        }
        var numDecimals = 1;
        if (currentVelocityFPS < 100) numDecimals = 2;
        currentVelocityFPS = parseFloat(Math.round(currentVelocityFPS * 100) / 100).toFixed(numDecimals);
        var currentVelocityKPH = parseFloat(Math.round(currentVelocityFPS * 1.09728 * 100) / 100).toFixed(numDecimals);
        var currentVelocityMach = parseFloat(Math.round(currentVelocityFPS * 0.00088863 * 10) / 10).toFixed(1);
        var dashVelocity = '<span class="value">' + numberWithCommas(currentVelocityFPS) + '</span> feet per second (<span class="value">' +  numberWithCommas(currentVelocityKPH) + '</span> km/h) (Mach <span class="value">' +  currentVelocityMach + '</span>)';
        $('#dashVelocityDiv').css('display', 'block');
    } else {
        $('#dashVelocityDiv').css("display", "none");
        dashVelocity = '<span class="value">In lunar orbit</span>';
    }
    $('#dashVelocity').html(dashVelocity);

    //Display distance from Earth
    if (calculateDistanceFromEarth) {
        if (timeIdInSeconds > 0 && timeIdInSeconds < timeStrToSeconds("304:32:00")) {
            for (counter = 0; counter < gTelemetryData.length; counter++) {
                if (timeStrToSeconds(gTelemetryData[counter][0]) < timeIdInSeconds) {
                    if (gTelemetryData[counter][2] != "") {
                        var prevDistanceEarthTimestampObject = gTelemetryData[counter];
                    }
                } else {
                    if (gTelemetryData[counter][2] != "") {
                        var nextDistanceEarthTimestampObject = gTelemetryData[counter];
                        break;
                    }
                }
            }
            startSeconds = timeStrToSeconds(prevDistanceEarthTimestampObject[0]);
            startSeconds = startSeconds > 230400 ? startSeconds - 9600 : startSeconds;
            var startDistanceEarth = parseFloat(prevDistanceEarthTimestampObject[2]);
            currSecondsAdjusted = timeIdInSeconds > 230400 ? timeIdInSeconds - 9600 : timeIdInSeconds;

            endSeconds = timeStrToSeconds(nextDistanceEarthTimestampObject[0]);
            endSeconds = endSeconds > 230400 ? endSeconds - 9600 : endSeconds;
            var endDistanceEarth = parseFloat(nextDistanceEarthTimestampObject[2]);
            secondsRange = endSeconds - startSeconds;
            var distanceEarthRange = endDistanceEarth - startDistanceEarth;
            currentPositionInSecondsRange = currSecondsAdjusted - startSeconds;
            var currentDistanceEarthNM = ((currentPositionInSecondsRange * distanceEarthRange) / secondsRange) + startDistanceEarth;

        } else {
            currentDistanceEarthNM = 0;
        }
        numDecimals = 1;
        if (currentDistanceEarthNM < 100) numDecimals = 2;
        currentDistanceEarthNM = parseFloat(Math.round(currentDistanceEarthNM * 100) / 100).toFixed(numDecimals);
        var currentDistanceEarthKM = parseFloat(Math.round(currentDistanceEarthNM * 1.852 * 100) / 100).toFixed(numDecimals);
        var dashDistanceEarth = '<span class="value">' + numberWithCommas(currentDistanceEarthNM) + '</span> nautical miles (<span class="value">' + numberWithCommas(currentDistanceEarthKM) + '</span> km)';

    } else {
        dashDistanceEarth = '<span class="value">207,559</span> nautical miles (<span class="value">384,399.2</span> km) average while in lunar orbit';
    }
    $('#dashDistanceEarth').html(dashDistanceEarth);

    //attempts at formulaic velocity calculation. Doesn't work due to moon's gravitational influence on the parabola formula
    //var dashDistanceNM = -1 * (8486888657 * Math.pow(timeIdInSeconds, 2) / 8820689674156545) + ((1881583668117446 * timeIdInSeconds) / 1764137934831309) + (811004768622602161 / 2940229891385515);
    //left half
    //var dashDistanceNM = -1 * (9987355187 * Math.pow(timeIdInSeconds, 2) / 3604494879727504) + ((5611270876937931 * timeIdInSeconds) / 3604494879727504) - (35715506986568310715 / 1802247439863752);
}

function manageOverlaysAutodisplay(timeId) {
    //trace("manageOverlaysAutodisplay()");
    //look to see if the current time is within a video segment
    var inVideoSegment = false;
    for (var counter = 0; counter < gVideoSegments.length; counter ++) {
        if (timeStrToSeconds(gVideoSegments[counter][0]) <= timeIdToSeconds(timeId) && timeStrToSeconds(gVideoSegments[counter][1]) >= timeIdToSeconds(timeId)) {
            inVideoSegment = true;
            //Fade in LRO message if it hasn't been displayed in this video segment yet
            if (gVideoSegments[counter][2] == "3D" && gLastLROOverlaySegment != gVideoSegments[counter][0]) {
                gLastLROOverlaySegment = gVideoSegments[counter][0];
                trace("manageOverlaysAutodisplay():In LRO segment");
                $('#LRO-overlay').fadeIn();
                setTimeout(function(){
                    $('#LRO-overlay').fadeOut();
                },8000);
            }
            //hide dashboard overlay if it is displayed (once per video segment)
            if ($('.dashboard-overlay').css('display').toLowerCase() != 'none' && gLastVideoSegmentDashboardHidden != gVideoSegments[counter][0] && !gDashboardManuallyToggled) {
                gLastVideoSegmentDashboardHidden = gVideoSegments[counter][0];
                hideDashboardOverlay();
            }
            break;
        }
    }
    if (!inVideoSegment && $('.dashboard-overlay').css('display').toLowerCase() == 'none' && !gDashboardManuallyToggled) {
        showDashboardOverlay();
        gLastLROOverlaySegment = '';
        gLastVideoSegmentDashboardHidden = '';
    }
}

// </editor-fold>

// <editor-fold desc="utility functions ---------------">

function padZeros(num, size) {
    var s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
}

function toggleSearchOverlay() {
    var searchOverlaySelector = $('.search-overlay');
    var searchBtnSelector =  $('#searchBtn');
    if (searchOverlaySelector.css('display').toLowerCase() == 'none') {
        //searchOverlaySelector.css('display', 'block');
        searchOverlaySelector.fadeIn();
        searchBtnSelector.removeClass('subdued');
        searchBtnSelector.addClass('primary');
        $('#searchInputField').focus();
        if ($('.dashboard-overlay').css('display').toLowerCase() != 'none') { //turn off dashboard if it's up
            toggleDashboardOverlay();
        }
    } else {
        //searchOverlaySelector.css("display", "none");
        searchOverlaySelector.fadeOut();
        searchBtnSelector.removeClass('primary');
        searchBtnSelector.addClass('subdued');
    }
}

function toggleDashboardOverlay() {
    gDashboardManuallyToggled = true; //because dashboard manually clicked, turn off auto dashboard toggle to disable auto show/hide. Seeking resets this.
    var dashboardOverlaySelector = $('.dashboard-overlay');
    var dashboardBtnSelector =  $('#dashboardBtn');
    if (dashboardOverlaySelector.css('display').toLowerCase() == 'none') {
        showDashboardOverlay();
    } else {
        hideDashboardOverlay();
    }
}

function showDashboardOverlay() {
    var dashboardOverlaySelector = $('.dashboard-overlay');
    var dashboardBtnSelector =  $('#dashboardBtn');
    //dashboardOverlaySelector.css('display', 'block');
    dashboardOverlaySelector.fadeIn();
    $('#dashboardContent').modemizr({
        bps: 2400,
        cursor: true,
        blink: false,
        imageSpeedup: 100,
        show: false
    });
    dashboardBtnSelector.removeClass('subdued');
    dashboardBtnSelector.addClass('primary');
    if ($('.search-overlay').css('display').toLowerCase() != 'none') { //turn off search if it's up
        toggleSearchOverlay();
    }
}

function hideDashboardOverlay() {
    var dashboardOverlaySelector = $('.dashboard-overlay');
    var dashboardBtnSelector =  $('#dashboardBtn');
    //dashboardOverlaySelector.css("display", "none");
    dashboardOverlaySelector.fadeOut();
    dashboardBtnSelector.removeClass('primary');
    dashboardBtnSelector.addClass('subdued');
}

function toggleFullscreen() {
    if ($(document).fullScreen() == false) {
        $(document).fullScreen(true);
    } else {
        $(document).fullScreen(false);
    }
}

function secondsToTimeStr(totalSeconds) {
    var hours = Math.abs(parseInt(totalSeconds / 3600));
    var minutes = Math.abs(parseInt(totalSeconds / 60)) % 60 % 60;
    var seconds = Math.abs(parseInt(totalSeconds)) % 60;
    seconds = Math.floor(seconds);
    var timeStr = padZeros(hours,3) + ":" + padZeros(minutes,2) + ":" + padZeros(seconds,2);
    if (totalSeconds < 0) {
        timeStr = "-" + timeStr.substr(1); //change timeStr to negative, replacing leading zero in hours with "-"
    }
    return timeStr;
}

function secondsToTimeId(seconds) {
    var timeId = secondsToTimeStr(seconds).split(":").join("");
    return timeId;
}

function timeIdToSeconds(timeId) {
    var sign = timeId.substr(0,1);
    var hours = parseInt(timeId.substr(0,3));
    var minutes = parseInt(timeId.substr(3,2));
    var seconds = parseInt(timeId.substr(5,2));
    var signToggle = (sign == "-") ? -1 : 1;
    var totalSeconds = signToggle * ((Math.abs(hours) * 60 * 60) + (minutes * 60) + seconds);
    //if (totalSeconds > 230400)
    //    totalSeconds -= 9600;
    return totalSeconds;
}

function timeIdToTimeStr(timeId) {
    return timeId.substr(0,3) + ":" + timeId.substr(3,2) + ":" + timeId.substr(5,2);
}

function timeStrToTimeId(timeStr) {
    return timeStr.split(":").join("");
}

function timeStrToSeconds(timeStr) {
    var sign = timeStr.substr(0,1);
    var hours = parseInt(timeStr.substr(0,3));
    var minutes = parseInt(timeStr.substr(4,2));
    var seconds = parseInt(timeStr.substr(7,2));
    var signToggle = (sign == "-") ? -1 : 1;
    var totalSeconds = Math.round(signToggle * ((Math.abs(hours) * 60 * 60) + (minutes * 60) + seconds));
    //if (totalSeconds > 230400)
    //    totalSeconds -= 9600;
    return totalSeconds;
}

Date.prototype.stdTimezoneOffset = function() {
    var jan = new Date(this.getFullYear(), 0, 1);
    var jul = new Date(this.getFullYear(), 6, 1);
    return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
};

Date.prototype.dst = function() {
    return this.getTimezoneOffset() < this.stdTimezoneOffset();
};

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function trace(str) {
    var debug = true;
    if (debug === true) {
        try {
            console.log(str);
        } catch (e) {
            //no console, no trace
        }
    }
}

function getWordAt(str, pos) {

    // Perform type conversions.
    str = String(str);
    pos = Number(pos) >>> 0;

    // Search for the word's beginning and end.
    var left = str.slice(0, pos + 1).search(/\S+$/),
        right = str.slice(pos).search(/\s/);

    // The last word in the string is a special case.
    if (right < 0) {
        return str.slice(left);
    }

    // Return the word, using the located bounds to extract it from the string.
    return str.slice(left, right + pos);
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// </editor-fold>

// <editor-fold desc="document event handlers -------------------------------------------------">

//on doc init
jQuery(function ($) {
    trace("INIT: jQuery(function ($)");
    if (typeof $.getUrlVar('t') != "undefined") {
        gMissionTimeParamSent = 1;
    } else {
        gMissionTimeParamSent = 0;
    }
    activateTab('transcriptTab');
    //buttons

    $("#searchBtn")
        .click(function(){
            ga('send', 'event', 'button', 'click', 'search');
            toggleSearchOverlay();
        });

    $("#dashboardBtn")
        .click(function(){
            ga('send', 'event', 'button', 'click', 'dashboard');
            toggleDashboardOverlay();
        });

    $("#searchInputField")
        //.change(function(){
        .keyup($.throttle(function(){
            performSearch();
        }, 100));


    $(".fullscreenBtn")
        .click(function(){
            ga('send', 'event', 'button', 'click', 'fullscreen');
            toggleFullscreen();
        });

    $("#playPauseBtn")
        .click(function(){
            if (gPlaybackState == "paused") {
                ga('send', 'event', 'button', 'click', 'play');
                player.playVideo();
            } else {
                ga('send', 'event', 'button', 'click', 'pause');
                player.pauseVideo();
            }
        });

    $("#soundBtn")
        .click(function(){
            if (!gOffline) {
                if (player.isMuted() == true) {
                    ga('send', 'event', 'button', 'click', 'unmute');
                    player.unMute();
                    // var btnIcon = "ui-icon-volume-on";
                    // var btnText = "Mute";
                    $(this).addClass('mute');
                } else {
                    ga('send', 'event', 'button', 'click', 'mute');
                    player.mute();
                    // btnIcon = "ui-icon-volume-off";
                    // btnText = "Un-Mute";
                    $(this).removeClass('mute');
                }
            }
        });

    $("#realtimeBtn")
        .click(function(){
            ga('send', 'event', 'button', 'click', 'realtime');
            historicalButtonClick();
        });

    $("#aboutBtn")
        .click(function(){
            ga('send', 'event', 'button', 'click', 'help');

            $('[data-js-class="HelpOverlayManager"]').each(function() {
              $(this).data('helpOverlayManager').showHelp();
            });

            //gShareButtonObject.toggle();
        });

    $("#shareBtn")
        .click(function(){
            ga('send', 'event', 'button', 'click', 'share');
            //gShareButtonObject.toggle(); //this is already happening within the share button div itself.
        });


    //tab button events
    $("#transcriptTab").click(function(){
        ga('send', 'event', 'tab', 'click', 'transcript');
        activateTab(this.id);
        setTimeout(function(){
            scrollTranscriptToCurrMissionTime();
        },100);

    });

    $("#tocTab").click(function(){
        ga('send', 'event', 'tab', 'click', 'toc');
        activateTab(this.id);
        scrollTOCToCurrMissionTime();
    });

    $("#commentaryTab").click(function(){
        ga('send', 'event', 'tab', 'click', 'commentary');
        activateTab(this.id);
        setTimeout(function(){
            scrollCommentaryToCurrMissionTime();
        },100);
    });

});

function activateTab(tabId) {
    $('.splash-btn.content-tab').removeClass('selected');
    $('#' + tabId).addClass('selected');

    var rootName = tabId.substring(0, tabId.length - 3);
    $('.text-wrapper').css("display", "none");
    $('#' + rootName + "Wrapper").css("display", "block");
}

function scrollTranscriptToCurrMissionTime() {
    scrollTranscriptToTimeId(findClosestUtterance(timeStrToSeconds(gCurrMissionTime)));
}
function scrollTOCToCurrMissionTime() {
    scrollToClosestTOC(timeStrToSeconds(gCurrMissionTime));
}
function scrollCommentaryToCurrMissionTime() {
    scrollCommentaryToTimeId(findClosestCommentary(timeStrToSeconds(gCurrMissionTime)));
}

//on fullscreen toggle
$(window).bind('fullscreenchange', function(e) {
    var state = document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen;
    redrawAll();
});

//on window resize
$(window).resize($.throttle(function(){ //scale image proportionally to image viewport on load
    console.log('***window resize');

    proportionalWidthOnPhotoBlock();

    //var myCanvasElement = $('#myCanvas');
    //myCanvasElement.css("height", $('#navigator').height());  // fix height for broken firefox div height
    //myCanvasElement.css("width", $('#navigator').width());
    //setTimeout(function(){
    //        populatePhotoGallery(); }
    //    ,1000);
    //scaleMissionImage();
    //showPhotoByTimeId(gCurrentPhotoTimeid, true);
    redrawAll();
}, 250));

function initSplash() {
    //flags set in this function are acted upon in the applicationreadypoller
    var $splash = $('.splash-content');
    var webFontConfig = {
        google: {
            families: ['Michroma',
                'Oswald:300,400,700',
                'Roboto Mono:200,400,500,700',
                'Roboto Slab:300']
        },
        active: function() {
            trace("INIT: fonts loaded");
            gFontsLoaded = true;
        }
    };
    WebFont.load(webFontConfig);
    $.when($splash.waitForImages()).done(function(){
        trace("INIT: splash image loaded");
        gSplashImageLoaded = true;
    });
    $('#LRO-overlay').hide(); //hide LRO overlay by default
    setSplashHistoricalSubtext();
    gIntroInterval = setIntroTimeUpdatePoller();
}

function setSplashHistoricalSubtext() {
    var launchDate = Date.parse("1972-12-07 0:33am -500");
    var countdownStartDate = Date.parse("1972-12-06 9:55:39pm -500");
    //var currDate = Date.parse("1972-12-10 0:33am -500");
    var currDate = Date.now();

    var currDate_ms = currDate.getTime();
    var countdownStartDate_ms = countdownStartDate.getTime();
    var launchDate_ms = launchDate.getTime();
    var missionEndDate_ms = launchDate_ms + (gMissionDurationSeconds * 1000);

    if (currDate_ms >= countdownStartDate_ms && currDate_ms < missionEndDate_ms) { //check if during mission anniversary
        //$('.section.now').css('display', '');
        $('.historicalSubtext').html("<b>Mission Anniversary.</b><BR>43 years ago to the second.");
    } else {
        $('.historicalSubtext').text("(43 years ago)");  //todo make this calculate how many years ago
    }
}

function proportionalWidthOnPhotoBlock() {
    var photoBlockWidth = $('body').width() - $('.video-block').width() - 1;
    //trace("trying to set photo block width: " + photoBlockWidth);
    $('.photo-block').width(photoBlockWidth);
}

//on document ready
$(document).ready(function() {
    //var myCanvasElement = $('#myCanvas');
    //myCanvasElement.css("height", $('.outer-north').height());  // fix height for broken firefox div height
    //myCanvasElement.css("width", $('.headerRight').width());

    proportionalWidthOnPhotoBlock();

    initSplash();

    gApplicationReadyIntervalID = setApplicationReadyPoller();

    //throttled scroll detection on commentaryDiv
    var commentaryDiv = $("#commentaryDiv");
    commentaryDiv.scroll($.throttle(function() {
        var commentaryDiv = $("#commentaryDiv");
        if(commentaryDiv.scrollTop() < 300) {
            //trace("top of commentaryDiv reached");
            prependCommentary(25, true);
        } else if(commentaryDiv.scrollTop() + commentaryDiv.innerHeight() >= parseInt(commentaryDiv[0].scrollHeight) - 300) {
            //trace("bottom of commentaryDiv reached");
            appendCommentary(25, true);
        }
    }, 10));

    //throttled scroll detection on utteranceDiv
    var utteranceDiv = $("#utteranceDiv");
    utteranceDiv.scroll($.throttle(function() {
        var utteranceDiv = $("#utteranceDiv");
        if(utteranceDiv.scrollTop() < 300) {
            //trace("top of utteranceDiv reached");
            prependUtterances(25, true);
        } else if(utteranceDiv.scrollTop() + utteranceDiv.innerHeight() >= parseInt(utteranceDiv[0].scrollHeight) - 300) {
            //trace("bottom of utteranceDiv reached");
            appendUtterances(25, true);
        }
    }, 10));

    gShareButtonObject = new Share(".share-button", {
        ui: {
            flyout: "bottom bottom",
            button_text: ""
        },
        networks: {
            facebook: {
                app_id: "1639595472942714",
                before: function(element) {
                    var sharedUtteranceArray = gUtteranceData[gUtteranceDataLookup[findClosestUtterance(timeStrToSeconds(gCurrMissionTime))]];
                    this.title = "Apollo 17 in Real-time - Moment: " + gCurrMissionTime;
                    this.url = "http://apollo17.org?t=" + timeIdToTimeStr(sharedUtteranceArray[0]);
                    this.description = timeIdToTimeStr(sharedUtteranceArray[0]) + " " + sharedUtteranceArray[1] + ": " + sharedUtteranceArray[2];
                    var nearestPhotoObject = gPhotoData[gPhotoDataLookup[findClosestPhoto(timeStrToSeconds(gCurrMissionTime))]];
                    if (nearestPhotoObject[3] != "") {
                        var photoTypePath = "flight";
                        var filename = "AS17-" + nearestPhotoObject[1];
                    } else {
                        photoTypePath = "supporting";
                        filename = nearestPhotoObject[1];
                    }
                    filename = filename + ".jpg";
                    this.image = "http://apollo17.org/mission_images/" + photoTypePath + "/1024/" + filename;
                },
                after: function() {
                    trace("User shared facebook: ", this.url);
                    ga('send', 'event', 'share', 'click', 'facebook');
                    //gShareButtonObject.close();
                }
            },
            twitter: {
                before: function(element) {
                    var sharedUtteranceArray = gUtteranceData[gUtteranceDataLookup[findClosestUtterance(timeStrToSeconds(gCurrMissionTime))]];
                    this.url = "http://apollo17.org?t=" + timeIdToTimeStr(sharedUtteranceArray[0]);
                    this.description = "%23Apollo17 in Real-time: " + timeIdToTimeStr(sharedUtteranceArray[0]) + " " + sharedUtteranceArray[1] + ": " + sharedUtteranceArray[2].substr(0, 67) + "... %23NASA";
                },
                after: function() {
                    trace("User shared twitter: ", this.url);
                    ga('send', 'event', 'share', 'click', 'twitter');
                    //this.close();
                }
            },

            email: {
                before: function(element) {
                    var sharedUtteranceArray = gUtteranceData[gUtteranceDataLookup[findClosestUtterance(timeStrToSeconds(gCurrMissionTime))]];
                    this.title = "Apollo 17 in Real-time: " + timeIdToTimeStr(sharedUtteranceArray[0]);
                    this.description = sharedUtteranceArray[1] + ": " + sharedUtteranceArray[2] + "     " + "http://apollo17.org?t=" + timeIdToTimeStr(sharedUtteranceArray[0]);
                },
                after: function() {
                    trace("User shared email: ", this.title);
                    ga('send', 'event', 'share', 'click', 'email');
                    //this.close();
                }
            }
        }
    });
});

// </editor-fold>