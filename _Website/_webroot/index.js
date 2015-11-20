console.log("INIT: Loading index.js");
var gStopCache = true;
var gCdnEnabled = false;

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
var gApplicationReady = 0; //starts at 0. Ready at 2. Checks both ajax loaded and player ready before commencing poller.
var gApplicationReadyIntervalID = null;

var gUtteranceDisplayStartIndex;
var gUtteranceDisplayEndIndex;
var gCurrentHighlightedUtteranceIndex;

var gCommentaryDisplayStartIndex;
var gCommentaryDisplayEndIndex;
var gCurrentHighlightedCommentaryIndex;

var gHoveredUtteranceArray; //share button

var gBackground_color_active = "#222222";

//load the youtube API
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// <editor-fold desc="youtube things------------------------------------------------">

function onYouTubeIframeAPIReady() {
    console.log("INIT: onYouTubeIframeAPIReady():creating player object");
    player = new YT.Player('player', {
        videoId: '5yLfnY1Opwg',
        width: '100%',
        height: '100%',
        playerVars: {
            frameborder: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            autohide: 1,
            rel: 0,
            //'controls': 0,
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
    console.log("APPREADY: onPlayerReady: " + gApplicationReady);
    //if (gMissionTimeParamSent == 0) {
        //event.target.playVideo();
        //seekToTime(gDefaultStartTime); //jump to 1 minute to launch
    //}
}

// The API calls this function when the player's state changes.
// The function indicates that when playing a video (state=1)
function onPlayerStateChange(event) {
    //console.log("onPlayerStateChange():state: " + event.data);
    if (event.data == YT.PlayerState.PLAYING) {
        console.log("onPlayerStateChange():PLAYER PLAYING");
        gPlaybackState = "normal";
        $("#playPauseBtn").button({
            icons: { primary: 'ui-icon-pause' },
            text: false,
            label: "Pause"
        });
        if (gNextVideoStartTime != -1) {
            console.log("onPlayerStateChange():PLAYING: forcing playback from " + gNextVideoStartTime + " seconds in new video");
            player.seekTo(gNextVideoStartTime, true);
            gNextVideoStartTime = -1;
        }
        if (gPlaybackState == "unexpectedbuffering") {
            console.log("onPlayerStateChange():PLAYING: was unexpected buffering so calling findClosestUtterance");
            ga('send', 'event', 'transcript', 'click', 'youtube scrub');
            //scrollToTimeID(findClosestUtterance(event.target.getCurrentTime() + gCurrVideoStartSeconds));
            scrollTranscriptToTimeId(findClosestUtterance(event.target.getCurrentTime() + gCurrVideoStartSeconds));
            scrollCommentaryToTimeId(findClosestCommentary(event.target.getCurrentTime() + gCurrVideoStartSeconds));
            scrollToClosestTOC(event.target.getCurrentTime() + gCurrVideoStartSeconds);
        }
        if (gIntervalID == null) {
            //poll for mission time scrolling if video is playing
            gIntervalID = setAutoScrollPoller();
            console.log("onPlayerStateChange():INTERVAL: PLAYING: Interval started because was null: " + gIntervalID);
        }
    } else if (event.data == YT.PlayerState.PAUSED) {
        //clear polling for mission time scrolling if video is paused
        window.clearInterval(gIntervalID);
        console.log("onPlayerStateChange():PAUSED: interval stopped: " + gIntervalID);
        gIntervalID = null;
        gPlaybackState = "paused";
        $("#playPauseBtn").button({
            icons: { primary: 'ui-icon-play' },
            text: false,
            label: "Play"
        });
    } else if (event.data == YT.PlayerState.BUFFERING) {
        console.log("onPlayerStateChange():BUFFERING: " + event.target.getCurrentTime() + gCurrVideoStartSeconds);
        if (gPlaybackState == "transcriptclicked") {
            gPlaybackState = "normal";
        } else {
            //buffering for unknown reason, probably due to scrubbing video
            console.log("onPlayerStateChange():unexpected buffering");
            gPlaybackState = "unexpectedbuffering";
        }
    } else if (event.data == YT.PlayerState.ENDED) { //load next video
        console.log("onPlayerStateChange():ENDED. Load next video.");
        var currVideoID = player.getVideoUrl().substr(player.getVideoUrl().indexOf("v=") + 2,11);
        for (var i = 0; i < gMediaList.length; ++i) {
            if (gMediaList[i][1] == currVideoID) {
                console.log("onPlayerStateChange():Ended. Changing video from: " + currVideoID + " to: " + gMediaList[i + 1][1]);
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
    console.log("autoScrollPoller()");
    return window.setInterval(function () {
        var totalSec = player.getCurrentTime() + gCurrVideoStartSeconds + 0.5;
        if (gCurrVideoStartSeconds == 230400) {
            if (player.getCurrentTime() > 3600) { //if at 065:00:00 or greater, add 002:40:00 to time
                //console.log("adding 9600 seconds to autoscroll target due to MET time change");
                totalSec = totalSec + 9600;
            }
        }
        gCurrMissionTime = secondsToTimeStr(totalSec);

        if (gCurrMissionTime != gLastTimeIdChecked) {
            var timeId = timeStrToTimeId(gCurrMissionTime);
            gLastTimeIdChecked = gCurrMissionTime;

            scrollTranscriptToTimeId(timeId);
            scrollTOCToTimeId(timeId);
            scrollCommentaryToTimeId(timeId);
            showPhotoByTimeId(timeId);

            displayHistoricalTimeDifferenceByTimeId(timeId);

            //scroll nav cursor
            if (!gMouseOnNavigator) {
                //redrawAll();
                updateNavigator();
            } else {
                drawCursor(totalSec);
                paper.view.draw();
            }
        }

        if (player.isMuted() == true) {
            var btnIcon = "ui-icon-volume-off";
            var btnText = "Un-Mute";
        } else {
            btnIcon = "ui-icon-volume-on";
            btnText = "Mute";
        }
        $("#soundBtn")
            .button({
                icons: { primary: btnIcon },
                text: false,
                label: btnText
            });

    }, 500); //polling frequency in milliseconds
}

function setIntroTimeUpdatePoller() {
    return window.setInterval(function () {
        //console.log("setIntroTimeUpdatePoller()");
        displayHistoricalTimeDifferenceByTimeId(getNearestHistoricalMissionTimeId());
    }, 1000);
}

function setApplicationReadyPoller() {
    return window.setInterval(function () {
        console.log("setApplicationReadyPoller(): Checking if App Ready");
        if (gApplicationReady >= 4) {
            console.log("APPREADY = 4! App Ready!");
            if (gMissionTimeParamSent == 0) {
                $('.simplemodal-wrap').isLoading("hide");
            } else {
                $('body').isLoading("hide");
                initializePlayback();
            }
            window.clearInterval(gApplicationReadyIntervalID);
        }
    }, 1000);
}

// </editor-fold>

// <editor-fold desc="find closest things------------------------------------------------">
function findClosestUtterance(secondsSearch) {
    //console.log("findClosestUtterance():" + secondsSearch);
    if (gCurrVideoStartSeconds == 230400) {
        if (secondsSearch > 230400 + 3600) { //if at 065:00:00 or greater, add 000:02:40 to time
            secondsSearch = secondsSearch + 9600;
        }
    }
    var timeId = secondsToTimeId(secondsSearch);
    var scrollTimeId = gUtteranceIndex[gUtteranceIndex.length - 1];
    for (var i = 0; i < gUtteranceIndex.length; ++i) {
        if (timeId < parseInt(gUtteranceIndex[i])) {
            scrollTimeId = gUtteranceIndex[i - 1];
            break;
        }
    }
    //console.log("findClosestUtterance(): searched utterance array, found closest: timeid" + gUtteranceIndex[i - 1] + " after " + i + " searches");
    return scrollTimeId;
}

function scrollToClosestTOC(secondsSearch) {
    //console.log("findClosestTOC():" + secondsSearch);
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
    //console.log("scrollToClosestTOC(): searched TOC array, found closest: timeid" + gTOCIndex[i - 1] + " after " + i + " searches");
    scrollTOCToTimeId(scrollTimeId);
}

function findClosestCommentary(secondsSearch) {
    //console.log("scrollToClosestCommentary():" + secondsSearch);
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
    //console.log("findClosestCommentary(): searched commentary array, found closest: timeid" + gCommentaryIndex[i - 1] + " after " + i + " searches");
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
    window.clearInterval(gIntroInterval);
    gIntroInterval = null;
    onMouseOutHandler(); //remove any errant navigator rollovers that occurred during modal
    var nearestHistTimeId = getNearestHistoricalMissionTimeId();
    //var closestUtteranceTimeid = findClosestUtterance(timeIdToSeconds(nearestHistTimeId));
    //var closestUtteranceTimeid = timeIdToSeconds(nearestHistTimeId);

    repopulateUtterances(nearestHistTimeId);
    repopulateCommentary(findClosestCommentary(timeIdToSeconds(nearestHistTimeId)));
    seekToTime(nearestHistTimeId);
}

function oneMinuteToLaunchButtonClick() {
    window.clearInterval(gIntroInterval);
    gIntroInterval = null;
    onMouseOutHandler(); //remove any errant navigator rollovers that occurred during modal
    initializePlayback();
}

function seekToTime(timeId) { // transcript click handling --------------------
    console.log("seekToTime(): " + timeId);

    var gaTimeVal = parseInt(timeId);
    ga('send', 'event', 'transcript', 'click', 'utterances', gaTimeVal.toString());

    var totalSeconds = timeIdToSeconds(timeId);
    gCurrMissionTime = secondsToTimeStr(totalSeconds); //set mission time right away to speed up screen refresh

    var currVideoID = player.getVideoUrl().substr(player.getVideoUrl().indexOf("v=") + 2 ,11);
    for (var i = 0; i < gMediaList.length; ++i) {
        var itemStartTimeSeconds = timeStrToSeconds(gMediaList[i][2]);
        var itemEndTimeSeconds = timeStrToSeconds(gMediaList[i][3]);

        if (totalSeconds >= itemStartTimeSeconds && totalSeconds < itemEndTimeSeconds) { //if this video in loop contains the time we want to seek to
            var seekToSecondsWithOffset = totalSeconds - itemStartTimeSeconds;
            //adjust for 000:02:40 time addition at 065:00:00 -- only the 65 hours-in video needs this manual adjustment, all others have their startTime listed including the time change
            if (itemStartTimeSeconds == 230400) {
                if (seekToSecondsWithOffset > 3600) { //if at 065:00:00 or greater, subtract 000:02:40 to time
                    console.log("seekToTime(): subtracting 9600 seconds from " + seekToSecondsWithOffset + " due to MET time change");
                    seekToSecondsWithOffset = seekToSecondsWithOffset - 9600;
                }
            }
            gCurrVideoStartSeconds = itemStartTimeSeconds;
            gCurrVideoEndSeconds = itemEndTimeSeconds;
            gPlaybackState = "transcriptclicked"; //used in the youtube playback code to determine whether vid has been scrubbed
            //change youtube video if the correct video isn't already playing
            if (currVideoID !== gMediaList[i][1]) {
                console.log("seekToTime(): changing video from: " + currVideoID + " to: " + gMediaList[i][1]);
                gNextVideoStartTime = seekToSecondsWithOffset;
                player.loadVideoById(gMediaList[i][1], seekToSecondsWithOffset);
            } else {
                console.log("seekToTime(): no need to change video. Seeking to " + timeId);
                player.seekTo(seekToSecondsWithOffset, true);
            }
            showPhotoByTimeId(findClosestPhoto(totalSeconds));
            scrollTranscriptToTimeId(findClosestUtterance(totalSeconds));
            scrollCommentaryToTimeId(findClosestCommentary(totalSeconds));
            scrollToClosestTOC(totalSeconds);
            redrawAll();
            break;
        }
    }
}

// </editor-fold>

// <editor-fold desc="historical time handling------------------------------------------------">

function displayHistoricalTimeDifferenceByTimeId(timeId) {
    //console.log("displayHistoricalTimeDifferenceByTimeId():" + timeid);
    //TODO accommodate mission time change mid-mission

    var launchDate = Date.parse("1972-12-07 0:33 -500");

    //TODO revisit these blatant date hacks
    //launchDate.setDate(launchDate.getDate() - 1); //required to get 43 years exactly during mission. Not understood why.
    //launchDate.setHours(launchDate.getHours() + 1);

    var sign = timeId.substr(0,1);
    var hours = parseInt(timeId.substr(0,3));
    var minutes = parseInt(timeId.substr(3,2));
    var seconds = parseInt(timeId.substr(5,2));

    var conversionMultiplier = 1;
    if (sign == "-") { //if on countdown, subtract the mission time from the launch moment
        conversionMultiplier = -1;
    }

    var timeidDate = new Date(launchDate.getTime());

    timeidDate.add({
        days: -1, //TODO figure out hack
        hours: hours * conversionMultiplier,
        minutes: minutes * conversionMultiplier,
        seconds: seconds * conversionMultiplier
    });
    var historicalDate = new Date(timeidDate.getTime()); //for display only
    historicalDate.add({days: 1}); //TODO figure out hack

    //var nowDate = Date.parse("2015-12-07 0:33 -500");
    var nowDate = Date.now();
    //if (nowDate.dst()) {
        //nowDate.setHours(nowDate.getHours() + 1); //TODO revisit potential dst offset
    //}

    var timeDiff = Math.abs(nowDate.getTime() - timeidDate.getTime());

    var humanizedRealtimeDifference = "Exactly: " + moment.preciseDiff(0, timeDiff) + " ago to the second.";

    $(".currentDate").text(nowDate.toDateString());
    $(".currentTime").text(nowDate.toLocaleTimeString());

    $("#historicalTimeDiff").html(humanizedRealtimeDifference);
    $(".historicalDate").text(historicalDate.toDateString());
    $(".historicalTime").text(historicalDate.toLocaleTimeString());
}

function getNearestHistoricalMissionTimeId() { //proc for "snap to real-time" button
    var launchDate = Date.parse("1972-12-07 0:33am -500");
    //var nowDate = Date.parse("2015-12-07 0:33am -500");
    var nowDate = Date.now();

    var histDate = new Date(nowDate.getTime());

    //if (histDate.dst()) {
    //    histDate.setHours(histDate.getHours() + 1); //TODO test DST offset
    //}
    var currDayOfMonth = histDate.getDate();

    if (currDayOfMonth >= 19) {
        histDate.setDate(currDayOfMonth - ((currDayOfMonth - 19) + 7));
    } else if (currDayOfMonth < 7) {
        histDate.setDate(currDayOfMonth + (7 - currDayOfMonth));
    }

    histDate.setMonth(launchDate.getMonth());
    histDate.setYear(launchDate.getYear());

    //find the difference between rounded date and mission start time to determine MET to jump to
    // Convert both dates to milliseconds
    var roundedDate_ms = histDate.getTime();
    var launchDate_ms = launchDate.getTime();
    var difference_ms = roundedDate_ms - launchDate_ms;

    var msInHour = 60 * 60 * 1000;
    var msInMinute = 60 * 1000;
    var h = Math.floor( (difference_ms) / msInHour);
    var m = Math.floor( ((difference_ms) - (h * msInHour)) / msInMinute );

    var timeId = padZeros(h,3) + padZeros(m,2) + padZeros(histDate.getSeconds(),2);
    //console.log("getNearestHistoricalMissionTimeId(): Nearest Mission timeId" + timeId);
    ga('send', 'event', 'button', 'click', 'snap to real-time');

    //gPlaybackState = "rounding";
    return timeId;
}

// </editor-fold>

// <editor-fold desc="scrolling things------------------------------------------------">

function scrollTOCToTimeId(timeId) {
    //if (gTOCDataLookup[timeId] !== undefined) {
    if (gTOCDataLookup.hasOwnProperty(timeId)) {
    //if ($.inArray(timeId, gTOCIndex) != -1) {
        //console.log("scrollTOCToTimeID(): scrolling to " + elementId);
        var TOCFrame = $('#iFrameTOC');
        var TOCFrameContents = TOCFrame.contents();
        var TOCElement = TOCFrameContents.find('#tocid' + timeId);
        var lineColor = TOCElement.css("color");
        TOCFrameContents.find('.tocitem').css("background-color", ""); //clear all element highlights
        TOCElement.css("background-color", gBackground_color_active); //set new element highlights

        flashTab("tocTab", 1, lineColor);

        var scrollDestination = TOCFrame.scrollTop() + TOCElement.offset().top;
        TOCFrameContents.find('body').animate({scrollTop: scrollDestination}, 500);
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

        //check if timeId is already loaded into commentary div
        if (gCommentaryDataLookup[timeId] < gCommentaryDisplayStartIndex + 49) { //prepend
            var prependCount = (gCommentaryDisplayStartIndex - gCommentaryDataLookup[timeId]) + 50;
            if (prependCount > 200) {
                repopulateCommentary(timeId);
            } else {
                prependCommentary(prependCount);
            }
        } else if (gCommentaryDataLookup[timeId] > gCommentaryDisplayEndIndex - 49) { //append
            var appendCount = (gCommentaryDataLookup[timeId] - gCommentaryDisplayEndIndex) + 50;
            if (appendCount > 200) {
                repopulateCommentary(timeId);
            } else {
                appendCommentary(appendCount);
            }
        }
        commentaryTable.children("*").css("background-color", ""); //clear all element highlights
        var highlightedCommentaryElement = $(".comid" + timeId);
        var lineColor = highlightedCommentaryElement.css("color");
        highlightedCommentaryElement.css("background-color", gBackground_color_active); //set new element highlights

        var newScrollDestination = commentaryDiv.scrollTop() + highlightedCommentaryElement.offset().top - commentaryDiv.offset().top;
        commentaryDiv.animate({scrollTop: newScrollDestination}, '1000', 'swing', function () {
            //console.log('Finished animating commentary: ' + newScrollDestination);
            trimCommentary();
        });

        flashTab("commentaryTab", 2, lineColor);
        gLastCommentaryTimeId = timeId;
    }
}

function scrollTranscriptToTimeId(timeId) { //timeid must exist in transcript
    //if (gUtteranceDataLookup[timeId] !== undefined) {
    if (gUtteranceDataLookup.hasOwnProperty(timeId)) {
    //if ($.inArray(timeId, gUtteranceIndex) != -1) {
        // console.log("scrollTranscriptToTimeId " + timeId);
        var utteranceDiv = $('#utteranceDiv');
        var utteranceTable = $('#utteranceTable');

        gCurrentHighlightedUtteranceIndex = gUtteranceDataLookup[timeId];

        //check if timeId is already loaded into utterance div
        if (gUtteranceDataLookup[timeId] < gUtteranceDisplayStartIndex + 49) { //prepend
            var prependCount = (gUtteranceDisplayStartIndex - gUtteranceDataLookup[timeId]) + 50;
            if (prependCount > 200) {
                repopulateUtterances(timeId);
            } else {
                prependUtterances(prependCount);
            }
        } else if (gUtteranceDataLookup[timeId] > gUtteranceDisplayEndIndex - 49) { //append
            var appendCount = (gUtteranceDataLookup[timeId] - gUtteranceDisplayEndIndex) + 50;
            if (appendCount > 200) {
                repopulateUtterances(timeId);
            } else {
                appendUtterances(appendCount);
            }
        }
        utteranceTable.children("*").css("background-color", ""); //clear all element highlights
        var highlightedTranscriptElement = $(".uttid" + timeId);
        var lineColor = highlightedTranscriptElement.css("color");
        highlightedTranscriptElement.css("background-color", gBackground_color_active); //set new element highlights

        var newScrollDestination = utteranceDiv.scrollTop() + highlightedTranscriptElement.offset().top - utteranceDiv.offset().top;
        utteranceDiv.animate({scrollTop: newScrollDestination}, '1000', 'swing', function () {
            //console.log('Finished animating: ' + scrollDestination);
            trimUtterances();
        });
        flashTab("transcriptTab", 0, lineColor);
        gLastUtteranceTimeId = timeId;
    }
}

function flashTab(tabName, tabNum, flashColor) {
    var flashDuration = 2000; //in ms
    if ($("#tabs-left").tabs('option', 'active') != tabNum) {
        $("#" + tabName).effect("highlight", {color: flashColor}, flashDuration); //blink the tab
        //$("#" + tabName).effect("pulsate", {times: 2, color: flashColor}, flashDuration); //blink the tab
        //$("#" + tabName).fadeTo(200, 0.5).fadeTo(200, 1.0); //blink the tab
    }
}

// </editor-fold> //scrolling things

// <editor-fold desc="utterance and commentary chunking code------------------------------------------------">

function repopulateUtterances(timeId) {
    var utteranceIndex = gUtteranceDataLookup[findClosestUtterance(timeIdToSeconds(timeId))];
    var utteranceTable = $('#utteranceTable');
    utteranceTable.html('');
    var startIndex = utteranceIndex - 50;
    var endIndex = startIndex + 200;
    startIndex = startIndex < 0 ? 0 : startIndex;
    endIndex = endIndex >= gUtteranceIndex.length ? gUtteranceIndex.length - 1 : endIndex;
    for (var i = startIndex; i <= endIndex; i++) {
        utteranceTable.append(getUtteranceObjectHTML(i));
    }
    gUtteranceDisplayStartIndex = startIndex;
    gUtteranceDisplayEndIndex = endIndex;
    $('#utteranceDiv').scrollTop('#uttid' + timeId);
}

function prependUtterances(count, atTop) {
    atTop = atTop || false;
    console.log("prependUtterances:" + count);
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
        //console.log("element to scroll back to: " + elementToScrollBackTo.attr('id'));
        var oldScrollDestination = utteranceDiv.scrollTop() + elementToScrollBackTo.offset().top - utteranceDiv.offset().top;
        utteranceDiv.scrollTop(oldScrollDestination);
    }

    //console.log("prepended utterances from:" + gUtteranceData[gUtteranceDisplayStartIndex][0]);
    gUtteranceDisplayStartIndex = gUtteranceDisplayStartIndex - prependedCount;
    //console.log("prepended utterances to:" + gUtteranceData[gUtteranceDisplayStartIndex][0]);
}

function appendUtterances(count, atBottom) {
    atBottom = atBottom || false;
    //console.log("appendUtterances:" + count);
    var utteranceDiv = $('#utteranceDiv');
    var utteranceTable = $('#utteranceTable');
    var htmlToAppend = "";
    var startIndex = gUtteranceDisplayEndIndex + 1;
    var appendedCount = 0;
    for (var i = startIndex; i < startIndex + count; i++) {
        if (i >= 0 && i < gUtteranceData.length) {
            //console.log("Appended: " + gUtteranceData[i][0]);
            htmlToAppend = htmlToAppend + (getUtteranceObjectHTML(i));
            appendedCount ++;
        }
    }
    if (atBottom)
        var topToScrollBackTo = utteranceDiv.scrollTop();

    utteranceTable.append(htmlToAppend);

    if (atBottom)
        utteranceDiv.scrollTop(topToScrollBackTo);

    //console.log("appended utterances from:" + gUtteranceData[gUtteranceDisplayEndIndex][0]);
    gUtteranceDisplayEndIndex = gUtteranceDisplayEndIndex + appendedCount;
    //console.log("appended utterances to:" + gUtteranceData[gUtteranceDisplayEndIndex][0]);
}

function trimUtterances() {
    //console.log("trimUtterances()");
    var numberToRemove = (gUtteranceDisplayEndIndex - gUtteranceDisplayStartIndex) - 200;
    if (numberToRemove > 0) {
        var currDistFromStart = gCurrentHighlightedUtteranceIndex - gUtteranceDisplayStartIndex;
        var currDistFromEnd = gUtteranceDisplayEndIndex - gCurrentHighlightedUtteranceIndex;
        if (currDistFromStart > currDistFromEnd) { //trim items from top of utterance div
            for (var i = gUtteranceDisplayStartIndex; i < gUtteranceDisplayStartIndex + numberToRemove; i++) {
                $('#uttid' + gUtteranceIndex[i]).remove();
            }
            //console.log("Trimming " + numberToRemove + " utterances from top");
            gUtteranceDisplayStartIndex = gUtteranceDisplayStartIndex + numberToRemove
        } else { //trim items from bottom of utterance div
            for (i = gUtteranceDisplayEndIndex - numberToRemove; i < gUtteranceDisplayEndIndex; i++) {
                $('#uttid' + gUtteranceIndex[i]).remove();
            }
            //console.log("Trimming " + numberToRemove + " utterances from bottom");
            gUtteranceDisplayEndIndex = gUtteranceDisplayEndIndex - numberToRemove;
        }
        var utteranceDiv = $('#utteranceDiv');
        var currElement = $('#uttid' + timeStrToTimeId(gUtteranceData[gCurrentHighlightedUtteranceIndex][0]));
        var newScrollDestination = utteranceDiv.scrollTop() + currElement.offset().top - utteranceDiv.offset().top;
        utteranceDiv.scrollTop(newScrollDestination);
    }
}

function getUtteranceObjectHTML(utteranceIndex, style) {
    style = style || '';
    //console.log("getUtteranceObjectHTML():" + utteranceIndex);
    var utteranceObject = gUtteranceData[utteranceIndex];

    var who_modified = utteranceObject[1];
    who_modified = who_modified.replace(/CDR/g, "Cernan");
    who_modified = who_modified.replace(/CMP/g, "Evans");
    who_modified = who_modified.replace(/LMP/g, "Schmitt");
    who_modified = who_modified.replace(/PAO/g, "Public Affairs");
    who_modified = who_modified.replace(/CC/g, "Mission Control");
    utteranceObject[1] = who_modified;
    var words_modified = utteranceObject[2];
    words_modified = words_modified.replace(/O2/g, "O<sub>2</sub>");
    words_modified = words_modified.replace(/H2/g, "H<sub>2</sub>");
    words_modified = words_modified.replace(/Tig /g, "T<sub>ig</sub> ");
    utteranceObject[2] = words_modified;

    var html = $('#utteranceTemplate').html();
    html = html.replace("@style", style);
    var timeId = timeStrToTimeId(utteranceObject[0]);
    html = html.replace(/@uttid/g, timeId);
    html = html.replace("@timestamp", utteranceObject[0]);
    html = html.replace("@who", utteranceObject[1]);
    html = html.replace("@words", utteranceObject[2]);
    if (utteranceObject[1] == "Public Affairs") {
        var uttTypeStr = "utt_pao";
    } else if (utteranceObject[1] == "Mission Control") {
        uttTypeStr = "utt_capcom";
    } else {
        uttTypeStr = "utt_crew";
    }
    html = html.replace(/@uttType/g, uttTypeStr);

    //console.log(utteranceObject[0] + " - " + utteranceObject[1] + " - " + utteranceObject[2]);
    return html;
}

function repopulateCommentary(timeId) {
    //console.log("repopulateCommentary:" + timeId);
    var commentaryIndex = gCommentaryDataLookup[findClosestCommentary(timeIdToSeconds(timeId))];
    var commentaryTable = $('#commentaryTable');
    commentaryTable.html('');
    var startIndex = commentaryIndex - 50;
    var endIndex = startIndex + 200;
    startIndex = startIndex < 0 ? 0 : startIndex;
    endIndex = endIndex >= gCommentaryIndex.length ? gCommentaryIndex.length - 1 : endIndex;  //TODO test >=
    for (var i = startIndex; i <= endIndex; i++) {
        commentaryTable.append(getCommentaryObjectHTML(i));
    }
    gCommentaryDisplayStartIndex = startIndex;
    gCommentaryDisplayEndIndex = endIndex;
    $('#commentaryDiv').scrollTop('#comid' + timeId);
}

function prependCommentary(count, atTop) {
    atTop = atTop || false;
    //console.log("prependCommentary:" + count);
    var commentaryDiv = $('#commentaryDiv');
    var commentaryTable = $('#commentaryTable');
    var htmlToPrepend = "";
    var prependedCount = 0;
    var startIndex = gCommentaryDisplayStartIndex - count;
    for (var i = startIndex; i < startIndex + count; i++) {
        if (i >= 0) {
            htmlToPrepend = htmlToPrepend + (getCommentaryObjectHTML(i));
            prependedCount ++;
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
}

function appendCommentary(count, atBottom) {
    atBottom = atBottom || false;
    //console.log("appendCommentary:" + count);
    var commentaryDiv = $('#commentaryDiv');
    var commentaryTable = $('#commentaryTable');
    var htmlToAppend = "";
    var startIndex = gCommentaryDisplayEndIndex + 1;
    var appendedCount = 0;
    for (var i = startIndex; i < startIndex + count; i++) {
        if (i >= 0 && i < gCommentaryData.length) {
            //console.log("Appended: " + gCommentaryData[i][0]);
            htmlToAppend = htmlToAppend + (getCommentaryObjectHTML(i));
            appendedCount ++;
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
}

function trimCommentary() {
    //console.log("trimCommentary()");
    var numberToRemove = (gCommentaryDisplayEndIndex - gCommentaryDisplayStartIndex) - 200;
    if (numberToRemove > 0) {
        var currDistFromStart = gCurrentHighlightedCommentaryIndex - gCommentaryDisplayStartIndex;
        var currDistFromEnd = gCommentaryDisplayEndIndex - gCurrentHighlightedCommentaryIndex;
        if (currDistFromStart > currDistFromEnd) { //trim items from top of commentary div
            for (var i = gCommentaryDisplayStartIndex; i < gCommentaryDisplayStartIndex + numberToRemove; i++) {
                $('#uttid' + gCommentaryIndex[i]).remove();
            }
            //console.log("Trimming " + numberToRemove + " commentary from top");
            gCommentaryDisplayStartIndex = gCommentaryDisplayStartIndex + numberToRemove
        } else { //trim items from bottom of commentary div
            for (i = gCommentaryDisplayEndIndex - numberToRemove; i < gCommentaryDisplayEndIndex; i++) {
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

    if (commentaryObject[2].length == 0) {
        var attribution = commentaryObject[1];
        attribution = attribution.replace(/ALSJ/g, '<a href="http://www.hq.nasa.gov/alsj/frame.html" target="alsj">ALSJ</a> Commentary');
        commentaryObject[1] = attribution;
    }
    if (commentaryObject[2].length != 0) {
        var who_modified = commentaryObject[2];
        who_modified = who_modified.replace(/CDR/g, "Cernan");
        who_modified = who_modified.replace(/CMP/g, "Evans");
        who_modified = who_modified.replace(/LMP/g, "Schmitt");
        commentaryObject[2] = who_modified;
    }
    var words_modified = commentaryObject[3];
    words_modified = words_modified.replace(/O2/g, "O<sub>2</sub>");
    words_modified = words_modified.replace(/H2/g, "H<sub>2</sub>");
    words_modified = words_modified.replace(/Tig /g, "T<sub>ig</sub> ");
    words_modified = words_modified.replace(/@alsjurl/g, '<a href="https://www.hq.nasa.gov/alsj');
    words_modified = words_modified.replace(/@alsjt/g, ' target="alsj"');
    commentaryObject[3] = words_modified;

    var html = $('#commentaryTemplate').html();

    if (typeof commentaryObject != 'object') {
        console.log("something very wrong");
    }

    var comId = timeStrToTimeId(commentaryObject[0]);
    html = html.replace(/@comid/g, comId);
    html = html.replace("@timestamp", commentaryObject[0]);
    if (commentaryObject[1] != '') {
        html = html.replace("@attribution", "(" + commentaryObject[1] + ")");
    } else {
        html = html.replace("@attribution", "");
    }
    html = html.replace("@who", commentaryObject[2]);
    html = html.replace("@words", commentaryObject[3]);

    if (commentaryObject[2] == "") {
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
        if (photoObject[3] != "") {
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
    console.log("APPREADY: populatePhotoGallery(): " + gApplicationReady);
}

function showPhotoByTimeId(timeId) {
    //if (gTOCDataLookup[timeId] !== undefined) {
    if (gPhotoDataLookup.hasOwnProperty(timeId)) {
        loadPhotoHtml(gPhotoDataLookup[timeId]);

        //scroll photo gallery to current photo
        var photoGalleryDiv = $('#photoGallery');
        photoGalleryDiv.children('*').css("border-color", "");
        var photoGalleryImageTimeId = "#gallerytimeid" + gPhotoData[gPhotoDataLookup[timeId]][0];
        $(photoGalleryImageTimeId).css("border-color", "green");

        var scrollDest = photoGalleryDiv.scrollTop() + $(photoGalleryImageTimeId).offset().top - gNavigatorHeight;
        photoGalleryDiv.animate({scrollTop: scrollDest}, '500', 'swing', function() {
            //console.log('Finished animating gallery: ' + scrollDest);
        });
    }
}

function loadPhotoHtml(photoIndex) {
    //console.log('loadPhotoHtml():' + photoIndex);
    if (typeof photoIndex == "undefined") {
        console.log('**invalid photo call');
    }
    var photoDiv = $("#photodiv");
    var photoObject = gPhotoData[photoIndex];
    var html = $('#photoTemplate').html();

    if (typeof photoObject != 'object') {
        console.log("something has gone very wrong");
    }

    if (photoObject[3] != "") {
        var photoTypePath = "flight";
        var filename = "AS17-" + photoObject[1];
    } else {
        photoTypePath = "supporting";
        filename = photoObject[1];
    }
    filename = filename + ".jpg";

    html = html.replace(/@photoTypePath/g , photoTypePath);
    //display prerendered 1024 height photos if photo div height smaller than 1024
    if (photoDiv.height() <= 1024) {
        var sizePath = "1024";
    } else {
        sizePath = "2100";
    }
    var fullSizePath = (photoTypePath == "supporting") ? "2100" : "4175";
    html = html.replace(/@fullSizePath/g , fullSizePath);
    if (gCdnEnabled) {
        var cdnNum = getRandomInt(1, 5);
        var serverUrl = "http://cdn" + cdnNum + ".apollo17.org";
    } else {
        serverUrl = "http://apollo17.org";
    }
    html = html.replace(/@serverUrl/g , serverUrl);
    html = html.replace(/@sizepath/g , sizePath);
    html = html.replace(/@filename/g , filename);
    html = html.replace("@timestamp",  timeIdToTimeStr(photoObject[0]));
    html = html.replace("@photo_num", photoObject[2]);
    var magNum = "AS17-" + photoObject[4] + "-";
    html = (photoObject[3] != "") ? html.replace("@mag_code", "Mag: " + photoObject[3]) : html.replace("@mag_code", "");
    html = (photoObject[4] != "") ? html.replace("@mag_number", magNum) : html.replace("@mag_number", "");
    html = (photoObject[5] != "") ? html.replace("@photographer", "Photographer: " + photoObject[5]) : html.replace("@photographer", "");
    html = html.replace("@description", photoObject[6]);

    photoDiv.html('');
    photoDiv.append(html);

    //prescale to height using css before calling scaleMissionImage so that it looks partically scaled as it loads
    var imageContainerImage = $('#imageContainerImage');
    imageContainerImage.css("width", 'auto');
    imageContainerImage.css("height", photoDiv.height());

    //when image finished loading, scale it proportionally both horizontally and vertically
    imageContainerImage.load(function(){ //scale image proportionally to image viewport on load
        //console.log('***image load complete');
        scaleMissionImage();
    });
}

function scaleMissionImage() {
    //console.log('scaleMissionImage()');
    var photodiv = $('#photodiv');
    var imageContainerImage = $('#imageContainerImage');

    var maxWidth = photodiv.width(); // Max width for the image
    var maxHeight = photodiv.height();    // Max height for the image
    var ratio = 0;  // Used for aspect ratio

    var width = imageContainerImage.get(0).naturalWidth; // Full image width
    var height = imageContainerImage.get(0).naturalHeight; // Full image height

    // Check if the current width is larger than the max7
    if(width > maxWidth){
        ratio = maxWidth / width;   // get ratio for scaling image
        imageContainerImage.css("width", maxWidth); // Set new width
        imageContainerImage.css("height", height * ratio);  // Scale height based on ratio

        height = height * ratio;    // Reset height to match scaled image
        width = width * ratio;    // Reset width to match scaled image
    } else if (width <= maxWidth) {  // get ratio for scaling image
        imageContainerImage.css("width", width); // Set new width
        imageContainerImage.css("height", "auto");  // Scale height based on ratio
    }

    // Check if current or newly width-scaled height is larger than max
    if(height > maxHeight){
        ratio = maxHeight / height; // get ratio for scaling image
        imageContainerImage.css("height", maxHeight);   // Set new height
        imageContainerImage.css("width", width * ratio);    // Scale width based on ratio
    }
}

// </editor-fold>

// <editor-fold desc="initializePlayback ---------------">

function initializePlayback() {
    console.log("initializePlayback()");
    if (gMissionTimeParamSent == 0) {
        repopulateUtterances(findClosestUtterance(gDefaultStartTimeId)); //jump to default start time (usually 1 minute to launch)
        repopulateCommentary(findClosestCommentary(gDefaultStartTimeId));
        seekToTime(gDefaultStartTimeId);
    } else {
        var paramMissionTime = $.getUrlVar('t'); //code to detect jump-to-timecode parameter
        if (typeof paramMissionTime != "undefined") {
            repopulateUtterances(findClosestUtterance(timeStrToTimeId(paramMissionTime)));
            repopulateCommentary(findClosestCommentary(timeStrToTimeId(paramMissionTime)));
            seekToTime(timeStrToTimeId(paramMissionTime));
        } else {
            console.log("Invalid t Parameter");
            repopulateUtterances(findClosestUtterance(gDefaultStartTimeId));
            repopulateCommentary(findClosestCommentary(gDefaultStartTimeId));
            seekToTime(gDefaultStartTimeId);
        }
    }
    clearInterval(gApplicationReadyIntervalID);
    gApplicationReadyIntervalID = null;
    gIntervalID = setAutoScrollPoller();
}

// </editor-fold>

// <editor-fold desc="utility functions ---------------">

function padZeros(num, size) {
    var s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
}

function toggleFullscreen() {
    if ($(document).fullScreen() == false) {
        $(document).fullScreen(true);
    } else {
        $(document).fullScreen(false);
    }
    //scaleMissionImage();
    //redrawAll();
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
    return parseInt(timeId);
}

function timeIdToSeconds(timeId) {
    var sign = timeId.substr(0,1);
    var hours = parseInt(timeId.substr(0,3));
    var minutes = parseInt(timeId.substr(3,2));
    var seconds = parseInt(timeId.substr(5,2));
    var signToggle = (sign == "-") ? -1 : 1;

    return signToggle * ((Math.abs(hours) * 60 * 60) + (minutes * 60) + seconds);
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
    return Math.round(signToggle * ((Math.abs(hours) * 60 * 60) + (minutes * 60) + seconds));
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

// </editor-fold>

// <editor-fold desc="document event handlers -------------------------------------------------">

//on doc init
jQuery(function ($) {
    console.log("INIT: jQuery(function ($)");
    if (typeof $.getUrlVar('t') != "undefined") {
        gMissionTimeParamSent = 1;
    } else {
        gMissionTimeParamSent = 0;
    }

    if (gMissionTimeParamSent == 0) {
        var modal = $('#basic-modal-content');
        modal.modal({opacity: 90});

        gIntroInterval = setIntroTimeUpdatePoller();

        $('.simplemodal-wrap').isLoading({text: "Loading", position: "overlay"});
        //console.log("Loading overlay on");

        $("#historicalBtn").button();
        $("#launchBtn").button();
    } else {
        $('body').isLoading({text: "Loading", position: "overlay"});
    }

    $("#fullscreenBtn")
        .button({
            icons: { primary: "ui-icon-arrow-4-diag" },
            text: false,
            label: "Full Screen"
        })
        .click(function(){
            toggleFullscreen();
        });


    $("#playPauseBtn")
        .button({
            icons: { primary: "ui-icon-pause" },
            text: false
        })
        .click(function(){
            if (gPlaybackState == "paused") {
                player.playVideo();
            } else {
                player.pauseVideo();
            }
        });

    $("#soundBtn")
        .button({
            icons: { primary: "ui-icon-volume-off" },
            text: false
        })
        .click(function(){
            if (player.isMuted() == true) {
                player.unMute();
                var btnIcon = "ui-icon-volume-on";
                var btnText = "Mute";
            } else {
                player.mute();
                btnIcon = "ui-icon-volume-off";
                btnText = "Un-Mute";
            }
            $( "#soundBtn" ).button({
                icons: { primary: btnIcon },
                text: false,
                label: btnText
            });
        });

    $("#realtimeBtn")
        .button({
            icons: { primary: "ui-icon-link" },
            text: false,
            label: "Snap to Historical Time"
        })
        .click(function(){
            historicalButtonClick();
        });

    $("#helpBtn")
        .button({
            icons: { primary: "ui-icon-help" },
            text: false,
            label: "Help"
        })
        .click(function(){
            alert("Help!");
        });

    //init tabs
    $(".mid-center").tabs();

    //tab clicks
    //tab clicks
    $("#transcriptTab").on("click", function() {
        scrollTranscriptToTimeId(findClosestUtterance(timeStrToSeconds(gCurrMissionTime)));
    });

    $("#tocTab").on("click", function() {
        scrollToClosestTOC(timeStrToSeconds(gCurrMissionTime));
    });

    $("#commentaryTab").on("click", function() {
        scrollCommentaryToTimeId(findClosestCommentary(timeStrToSeconds(gCurrMissionTime)));
    });

    // OUTER-LAYOUT
    $('body').layout({
        center__paneSelector:	".outer-center"
        ,   north__paneSelector:    ".outer-north"
        ,   west__paneSelector:     ".outer-west"
        ,   east__paneSelector:     ".outer-east"
        ,   north__togglerLength_open: 0
        ,   center__togglerLength_open: 0
        ,   west__togglerLength_open: 0
        ,	north__size:			"13%"
        ,   north__minSize:         120
        ,   west__size:             "40%"
        ,   east__size:             75
        ,	spacing_open:			0  // ALL panes
        ,	spacing_closed:			12 // ALL panes
        ,
        // WEST-LAYOUT (child of outer-west-pane)
        west__childOptions: {
            center__paneSelector:	".mid-center"
            ,   north__paneSelector:    ".mid-north"
            ,   north__size:             "60%"
            ,   center__size:            "40%"
            ,   north__togglerLength_open: 0
            ,   center__togglerLength_open: 0
            ,	spacing_open:			0  // ALL panes
            ,	spacing_closed:			12 // ALL panes
        }
    });
});

//on fullscreen toggle
$(window).bind('fullscreenchange', function(e) {
    var state = document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen;
    var stateStr = state ? 'FullScreenOn' : 'FullScreenOff';

    // Now do something interesting
    console.log("non-button fullscreen change state: " + stateStr);

    var fullScreenBtn = $('#fullScreenBtn');
    if (stateStr == "FullScreenOn") {
        fullScreenBtn.attr("value", "Exit Full Screen");
    } else {
        fullScreenBtn.attr("value", "Full Screen");
    }
    //scaleMissionImage();
    //populatePhotoGallery();
    redrawAll();
});

//on window resize
$(window).resize($.throttle(function(){ //scale image proportionally to image viewport on load
    console.log('***window resize');
    var myCanvasElement = $('#myCanvas');
    myCanvasElement.css("height", $('.outer-north').height());  // fix height for broken firefox div height
    myCanvasElement.css("width", $('.headerRight').width());
    //setTimeout(function(){
    //        populatePhotoGallery(); }
    //    ,1000);
    //scaleMissionImage();
    showPhotoByTimeId(gCurrentPhotoTimeid, true);
    redrawAll();
}, 250));

//on document ready
$(document).ready(function() {
    var myCanvasElement = $('#myCanvas');
    myCanvasElement.css("height", $('.outer-north').height());  // fix height for broken firefox div height
    myCanvasElement.css("width", $('.headerRight').width());
    gApplicationReadyIntervalID = setApplicationReadyPoller();

    //throttled scroll detection on commentaryDiv
    var commentaryDiv = $("#commentaryDiv");
    commentaryDiv.scroll($.throttle(function() {
        var commentaryDiv = $("#commentaryDiv");
        if(commentaryDiv.scrollTop() < 300) {
            //console.log("top of commentaryDiv reached");
            prependCommentary(50, true);
        } else if(commentaryDiv.scrollTop() + commentaryDiv.innerHeight() >= parseInt(commentaryDiv[0].scrollHeight) - 300) {
            //console.log("bottom of commentaryDiv reached");
            appendCommentary(50, true);
        }
    }, 10));

    //throttled scroll detection on utteranceDiv
    var utteranceDiv = $("#utteranceDiv");
    utteranceDiv.scroll($.throttle(function() {
        var utteranceDiv = $("#utteranceDiv");
        if(utteranceDiv.scrollTop() < 300) {
            //console.log("top of utteranceDiv reached");
            prependUtterances(50, true);
        } else if(utteranceDiv.scrollTop() + utteranceDiv.innerHeight() >= parseInt(utteranceDiv[0].scrollHeight) - 300) {
            //console.log("bottom of utteranceDiv reached");
            appendUtterances(50, true);
        }
    }, 10));

    utteranceDiv.delegate('.utterance', 'mouseenter', function() {
        var shareButtonSelector = $('.share-button');
        var loctop = $(this).position().top + 40;
        var locright = $(this).position().left + $(this).width() - 48;
        shareButtonSelector.css("display", "" );
        shareButtonSelector.css("z-index", 1000 );
        shareButtonSelector.animate({top: loctop, left: locright}, 0);
        var hoveredUtteranceText = $(this).text().replace(/\n/g, "|");
        hoveredUtteranceText = hoveredUtteranceText.replace(/  /g, "");
        gHoveredUtteranceArray = hoveredUtteranceText.split("|");
    });

    $('#tabs-left-1').mouseleave(function() {
        $('.share-button').css("display", "none" );
    });

    new Share(".share-button", {
        ui: {
            flyout: "middle left",
            button_text: ""
        },
        networks: {
            google_plus: {
                enabled: false,
                before: function(element) {
                    this.url = "http://apollo17.org?t=" + gHoveredUtteranceArray[1];
                },
                after: function() {
                    console.log("User shared google plus: ", this.url);
                    ga('send', 'event', 'share', 'click', 'google plus');
                }
            },
            facebook: {
                app_id: "1639595472942714",
                before: function(element) {
                    //this.url = element.getAttribute("data-url");
                    this.title = "Apollo 17 in Real-time - Moment: " + gHoveredUtteranceArray[1];
                    this.url = "http://apollo17.org?t=" + gHoveredUtteranceArray[1];
                    this.description = gHoveredUtteranceArray[1] + " " + gHoveredUtteranceArray[2] + ": " + gHoveredUtteranceArray[3];
                    this.image = "http://apollo17.org/mission_images/img/72-H-1454.jpg";
                },
                after: function() {
                    console.log("User shared facebook: ", this.url);
                    ga('send', 'event', 'share', 'click', 'facebook');
                }
            },
            twitter: {
                before: function(element) {
                    //this.url = element.getAttribute("data-url");
                    this.url = "http://apollo17.org?t=" + gHoveredUtteranceArray[1];
                    this.description = "%23Apollo17 in Real-time: " + gHoveredUtteranceArray[1] + " " + gHoveredUtteranceArray[2] + ": " + gHoveredUtteranceArray[3].substr(0, 67) + "... %23NASA";
                },
                after: function() {
                    console.log("User shared twitter: ", this.url);
                    ga('send', 'event', 'share', 'click', 'twitter');
                }
            },
            pinterest: {
                enabled: false,
                before: function(element) {
                    //this.url = element.getAttribute("data-url");
                    this.url = "http://apollo17.org?t=" + gHoveredUtteranceArray[1];
                    this.description = gHoveredUtteranceArray[1] + " " + gHoveredUtteranceArray[2] + ": " + gHoveredUtteranceArray[3];
                    this.image = "http://apollo17.org/mission_images/img/72-H-1454.jpg";
                },
                after: function() {
                    console.log("User shared pinterest: ", this.url);
                    ga('send', 'event', 'share', 'click', 'pinterest');
                }
            },
            email: {
                before: function(element) {
                    //this.url = element.getAttribute("data-url");
                    this.title = "Apollo 17 in Real-time: " + gHoveredUtteranceArray[1];
                    this.description = gHoveredUtteranceArray[2] + ": " + gHoveredUtteranceArray[3] + "     " + "http://apollo17.org?t=" + gHoveredUtteranceArray[1];
                },
                after: function() {
                    console.log("User shared email: ", this.title);
                    ga('send', 'event', 'share', 'click', 'email');
                }
            }
        }
    });
    $('.share-button').css("display", "none" );
});

// </editor-fold>