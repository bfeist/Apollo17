console.log("INIT: Loading index.js");

var gMissionDurationSeconds = 1100166;
var gCountdownSeconds = 9442;

var gLastTimeIdMarker = '';
var gLastTOCTimeId = '';
var gLastTOCTimeIdMarker = '';
var gLastCommentaryTimeId = '';
var gLastCommentaryTimeIdMarker = '';
var gLastTimeIdChecked = '';
var gCurrMissionTime = '';
var gIntervalID = null;
var gIntroInterval = null;
var gMediaList = [];
var gTOCIndex = [];
var gTOCAll = [];
var gUtteranceIndex = [];
var gUtteranceData = [];
var gUtteranceDataLookup = [];
var gCommentaryIndex = [];
var gPhotoList = [];
var gPhotoIndex = [];
var gPhotoLookup = [];
var gMissionStages = [];
var gCurrentPhotoTimestamp = "initial";
var gCurrVideoStartSeconds = -9442;
var gCurrVideoEndSeconds = 0;
var gPlaybackState = "normal";
var gNextVideoStartTime = -1; //used to track when one video ends to ensure next plays from 0 (needed because youtube bookmarks where you left off in videos without being asked to)
var gMissionTimeParamSent = 0;
var player;
var gApplicationReady = 0; //starts at 0. Ready at 2. Checks both ajax loaded and player ready before commencing poller.
var gApplicationReadyIntervalID = null;

//var background_color = "#DEDDD1";
//var background_color_active = "#B5B4A4";

var background_color = "#000000";
var background_color_active = "#222222";

//load the youtube API
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

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
        //seekToTime("timeid-000100"); //jump to 1 minute to launch
    //}
}

// The API calls this function when the player's state changes.
// The function indicates that when playing a video (state=1)
function onPlayerStateChange(event) {
    console.log("onPlayerStateChange():state: " + event.data);
    if (event.data == YT.PlayerState.PLAYING) {
        console.log("onPlayerStateChange():PLAYER PLAYING");
        if (gNextVideoStartTime != -1) {
            console.log("onPlayerStateChange():PLAYING: forcing playback from " + gNextVideoStartTime + " seconds in new video");
            player.seekTo(gNextVideoStartTime, true);
            gNextVideoStartTime = -1;
            gPlaybackState = "normal";
        }
        if (gPlaybackState == "unexpectedbuffering") {
            console.log("onPlayerStateChange():PLAYING: was unexpected buffering so calling findClosestUtterance");
            ga('send', 'event', 'transcript', 'click', 'youtube scrub');
            //scrollToTimeID(findClosestUtterance(event.target.getCurrentTime() + gCurrVideoStartSeconds));
            findClosestUtterance(event.target.getCurrentTime() + gCurrVideoStartSeconds);
            findClosestTOC(event.target.getCurrentTime() + gCurrVideoStartSeconds);
            findClosestCommentary(event.target.getCurrentTime() + gCurrVideoStartSeconds);
            gPlaybackState = "normal";
        }
        if (gIntervalID == null) {
            //poll for mission time scrolling if video is playing
            gIntervalID = setAutoScrollPoller();
            console.log("onPlayerStateChange():INTERVAL: PLAYING: Interval started because was null: " + gIntervalID);
        }
    }
    if (event.data == YT.PlayerState.PAUSED) {
        //clear polling for mission time scrolling if video is paused
        window.clearInterval(gIntervalID);
        console.log("onPlayerStateChange():PAUSED: interval stopped: " + gIntervalID);
        gIntervalID = null;
    }
    if (event.data == YT.PlayerState.BUFFERING) {
        console.log("onPlayerStateChange():BUFFERING: " + event.target.getCurrentTime() + gCurrVideoStartSeconds);
        if (gPlaybackState == "transcriptclicked") {
            gPlaybackState = "normal";
        } else {
            //buffering for unknown reason, probably due to scrubbing video
            console.log("onPlayerStateChange():unexpected buffering");
            gPlaybackState = "unexpectedbuffering";
        }
    }
    if (event.data == YT.PlayerState.ENDED) { //load next video
        console.log("onPlayerStateChange():ENDED. Load next video.");
        var currVideoID = player.getVideoUrl().substr(player.getVideoUrl().indexOf("v=") + 2,11);
        for (var i = 0; i < gMediaList.length; ++i) {
            if (gMediaList[i][1] == currVideoID) {
                console.log("onPlayerStateChange():Ended. Changing video from: " + currVideoID + " to: " + gMediaList[i + 1][1]);
                currVideoID = gMediaList[i + 1][1];
                break;
            }
        }
        var itemStartTimeArray = gMediaList[i + 1][2].split(":");
        var startHours = parseInt(itemStartTimeArray[0]);
        var startMinutes = parseInt(itemStartTimeArray[1]);
        var startSeconds = parseInt(itemStartTimeArray[2]);
        var signToggle = (startHours < 0) ? -1 : 1;
        gCurrVideoStartSeconds = signToggle * (Math.abs(startHours) * 60 * 60 + startMinutes  * 60 + startSeconds);

        var itemEndTimeArray = gMediaList[i + 1][3].split(":");
        var endHours = parseInt(itemEndTimeArray[0]);
        var endMinutes = parseInt(itemEndTimeArray[1]);
        var endSeconds = parseInt(itemEndTimeArray[2]);
        signToggle = (endHours < 0) ? -1 : 1;
        gCurrVideoEndSeconds = signToggle * (Math.abs(endHours) * 60 * 60 + endMinutes * 60 + endSeconds);

        player.iv_load_policy = 3;
        gNextVideoStartTime = 0; //force next video to start at 0 seconds in the play event handler
        player.loadVideoById(currVideoID, 0);
    }
}

//--------------- transcript iframe autoscroll handling --------------------
function setAutoScrollPoller() {
    console.log("setAutoScrollPoller()");
    return window.setInterval(function () {
        var totalSec = player.getCurrentTime() + gCurrVideoStartSeconds + 0.5;
        if (totalSec < 0) {
            var onCountdown = true; //if on the countdown video counting backwards, make all times positive for timecode generation, then add the negative sign to the search string
        } else {
            onCountdown = false;
        }
        if (gCurrVideoStartSeconds == 230400) {
            if (player.getCurrentTime() > 3600) { //if at 065:00:00 or greater, add 000:02:40 to time
                //console.log("adding 9600 seconds to autoscroll target due to MET time change");
                totalSec = totalSec + 9600;
            }
        }

        gCurrMissionTime = secondsToTimeStr(totalSec);
        //var hours = Math.abs(parseInt(totalSec / 3600));
        //var minutes = Math.abs(parseInt(totalSec / 60)) % 60 % 60;
        //var seconds = Math.abs(parseInt(totalSec)) % 60;
        //seconds = Math.floor(seconds);
        //
        //if (onCountdown) {
        //    var hoursText = "-" + padZeros(hours, 2);
        //} else {
        //    hoursText = padZeros(hours, 3);
        //}
        //gCurrMissionTime = hoursText + ":" + padZeros(minutes,2) + ":" + padZeros(seconds,2);

        if (gCurrMissionTime != gLastTimeIdChecked) {
            var timeId = "timeid" + gCurrMissionTime.split(":").join("");
            gLastTimeIdChecked = gCurrMissionTime;
            //console.log("totalsec: " + totalSec + "| divmarker: " + timeId);
           // $("#timer").text(gCurrMissionTime);

            scrollToTimeID(timeId);
            scrollTOCToTimeID(timeId);
            scrollCommentaryToTimeID(timeId);
            showCurrentPhoto(timeId);

            displayHistoricalTimeDifferenceByTimeId(timeId);

            //scroll nav cursor
            if (!gMouseOnNavigator) {
                redrawAll();
            } else {
                drawCursor(totalSec);
                paper.view.draw();
            }
            //drawCursor(timeStrToSeconds(gCurrMissionTime));

        }
    }, 500); //polling frequency in milliseconds
}

function padZeros(num, size) {
    var s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
}

//--------------- search for closest utterance time to video time (used upon seeked video) --------------------
function findClosestUtterance(secondsSearch) {
    console.log("findClosestUtterance():" + secondsSearch);
    var found = false;
    if (gCurrVideoStartSeconds == 230400) {
        if (secondsSearch > 230400 + 3600) { //if at 065:00:00 or greater, add 000:02:40 to time
            secondsSearch = secondsSearch + 9600;
        }
    }
    for (var i = 0; i < gUtteranceIndex.length; ++i) {
        var hours = Math.abs(parseInt(secondsSearch / 3600));
        var minutes = Math.abs(parseInt(secondsSearch / 60)) % 60;
        var seconds = Math.abs(parseInt(secondsSearch)) % 60;
        seconds = Math.floor(seconds);

        var timeId = "timeid" + padZeros(hours,3) + padZeros(minutes,2) + padZeros(seconds,2);
        if (secondsSearch < 0) {
            timeId = timeId.substr(0,6) + "-" + timeId.substr(7); //change timeid to negative, replacing leading zero in hours with "-"
        }
        if (parseInt(timeId.substr(6)) < parseInt(gUtteranceIndex[i])) {
            scrollDestination = "timeid" + gUtteranceIndex[i - 1];
            break;
        }
    }
    displayUtteranceRegion(scrollDestination);
}

function findClosestTOC(secondsSearch) {
    console.log("findClosestTOC():" + secondsSearch);
    var onCountdown = false;
    if (gCurrVideoStartSeconds == 230400) {
        if (secondsSearch > 230400 + 3600) { //if at 065:00:00 or greater, add 000:02:40 to time
            secondsSearch = secondsSearch + 9600;
        }
    }
    var scrollDestination = "timeid" + gTOCIndex[gTOCIndex.length - 1];
    for (var i = 0; i < gTOCIndex.length; ++i) {
        var hours = Math.abs(parseInt(secondsSearch / 3600));
        var minutes = Math.abs(parseInt(secondsSearch / 60)) % 60;
        var seconds = Math.abs(parseInt(secondsSearch)) % 60;
        seconds = Math.floor(seconds);

        var timeId = "timeid" + padZeros(hours,3) + padZeros(minutes,2) + padZeros(seconds,2);
        if (secondsSearch < 0) {
            timeId = timeId.substr(0,6) + "-" + timeId.substr(7); //change timeid to negative, replacing leading zero in hours with "-"
        }
        if (parseInt(timeId.substr(6)) < parseInt(gTOCIndex[i])) {
            scrollDestination = "timeid" + gTOCIndex[i - 1];
            break;
        }
    }
    console.log("findClosestTOC(): searched TOC array, found closest: timeid" + gTOCIndex[i - 1] + " after " + i + " searches");
    scrollTOCToTimeID(scrollDestination);
}

function findClosestCommentary(secondsSearch) {
    console.log("findClosestCommentary():" + secondsSearch);
    var onCountdown = false;
    if (gCurrVideoStartSeconds == 230400) {
        if (secondsSearch > 230400 + 3600) { //if at 065:00:00 or greater, add 000:02:40 to time
            secondsSearch = secondsSearch + 9600;
        }
    }
    var scrollDestination = "timeid" + gCommentaryIndex[gCommentaryIndex.length - 1];
    for (var i = 0; i < gCommentaryIndex.length; ++i) {
        var hours = Math.abs(parseInt(secondsSearch / 3600));
        var minutes = Math.abs(parseInt(secondsSearch / 60)) % 60;
        var seconds = Math.abs(parseInt(secondsSearch)) % 60;
        seconds = Math.floor(seconds);

        var timeId = "timeid" + padZeros(hours,3) + padZeros(minutes,2) + padZeros(seconds,2);
        if (secondsSearch < 0) {
            timeId = timeId.substr(0,6) + "-" + timeId.substr(7); //change timeid to negative, replacing leading zero in hours with "-"
        }
        if (parseInt(timeId.substr(6)) < parseInt(gCommentaryIndex[i])) {
            scrollDestination = "timeid" + gCommentaryIndex[i - 1];
            break;
        }
    }
    console.log("findClosestCommentary(): searched commentary array, found closest: timeid" + gCommentaryIndex[i - 1] + " after " + i + " searches");
    scrollCommentaryToTimeID(scrollDestination);
}

function scrollToTimeID(timeId) {
    //console.log ('#' + timeId + ' - ' + $('#iFrameTranscript').contents().find('#' + timeId).length);
    if ($.inArray(timeId.substr(6), gUtteranceIndex) != -1) {
        // console.log("scrollToTimeID " + timeId);
        // console.log("Utterance item found in array. Scrolling utterance frame to " + timeId);
        if ($("#tabs-left").tabs('option', 'active') != 0) {
            $("#transcriptTab").effect("highlight", {color: '#006400'}, 1000); //blink the transcript tab
        }
        displayUtteranceRegion(timeId);
    }
}

function scrollTOCToTimeID(timeId) {
    if ($.inArray(timeId.substr(6), gTOCIndex) != -1) {
        if (timeId != gLastTOCTimeId) {
            //console.log("scrollTOCToTimeID(): scrolling to " + timeId);
            if ($("#tabs-left").tabs('option', 'active') != 1) {
                $("#tocTab").effect("highlight", {color: '#006400'}, 1000); //blink the toc tab
            }
            var TOCFrame = $('#iFrameTOC').contents();
            var TOCtimeIdMarker = TOCFrame.find('#' + timeId);
            //reset background color of last line
            if (gLastTOCTimeIdMarker != '') {
                gLastTOCTimeIdMarker.css("background-color", background_color);
            }
            TOCtimeIdMarker.css("background-color", background_color_active);
            var TOCscrollDestination = TOCtimeIdMarker.offset().top - 100;
            TOCFrame.find('body').animate({scrollTop: TOCscrollDestination}, 500);
            gLastTOCTimeIdMarker = TOCtimeIdMarker;
            gLastTOCTimeId = timeId;
        } else {
            //console.log("scrollTOCToTimeID(): TOC item already scrolled to. Not scrolling");
        }
    }
}

function scrollCommentaryToTimeID(timeId) {
    if ($.inArray(timeId.substr(6), gCommentaryIndex) != -1) {
        if (timeId != gLastCommentaryTimeId) {
            //$("#tabs-left").tabs( "option", "active", 1 ); //activate the commentary tab
            if ($("#tabs-left").tabs('option', 'active') != 2) {
                $("#commentaryTab").effect("highlight", {color: '#006400'}, 1000); //blink the commentary tab
            }
            //console.log("scrollCommentaryToTimeID(): scrolling to  " + timeId);
            var CommentaryFrame = $('#iFrameCommentary').contents();
            var CommentaryTimeIdMarker = CommentaryFrame.find('#' + timeId);
            if (CommentaryTimeIdMarker.length != 0) {
                //reset background color of last line
                if (gLastCommentaryTimeIdMarker != '') {
                    gLastCommentaryTimeIdMarker.css("background-color", background_color);
                }
                CommentaryTimeIdMarker.css("background-color", background_color_active);
                var CommentaryScrollDestination = CommentaryTimeIdMarker.offset().top - 100;
                CommentaryFrame.find('body').animate({scrollTop: CommentaryScrollDestination}, 500);
            }
            gLastCommentaryTimeIdMarker = CommentaryTimeIdMarker;
            gLastCommentaryTimeId = timeId;
        } else {
            //console.log("scrollCommentaryToTimeID(): Commentary item already scrolled to. Not scrolling");
        }
    }
}

//--------------- transcript click handling --------------------
function seekToTime(elementId){
    console.log("seekToTime(): " + elementId);
    var gaTimeVal = parseInt(elementId.replace("timeid", ""));
    ga('send', 'event', 'transcript', 'click', 'utterances', gaTimeVal.toString());
    var timeStr = elementId.substr(6,7);
    var sign = timeStr.substr(0,1);
    var hours = parseInt(timeStr.substr(0,3));
    var minutes = parseInt(timeStr.substr(3,2));
    var seconds = parseInt(timeStr.substr(5,2));
    var signToggle = (sign == "-") ? -1 : 1;
    var totalSeconds = signToggle * ((Math.abs(hours) * 60 * 60) + (minutes * 60) + seconds);

    gCurrMissionTime = secondsToTimeStr(totalSeconds); //set mission time right away to speed up screen refresh
    redrawAll();

    var currVideoID = player.getVideoUrl().substr(player.getVideoUrl().indexOf("v=") + 2 ,11);
    for (var i = 0; i < gMediaList.length; ++i) {
        var itemStartTimeArray = gMediaList[i][2].split(":");
        var startHours = parseInt(itemStartTimeArray[0]);
        var startMinutes = parseInt(itemStartTimeArray[1]);
        var startSeconds = parseInt(itemStartTimeArray[2]);
        signToggle = (startHours < 0) ? -1 : 1;
        var itemStartTimeSeconds = signToggle * (Math.abs(startHours) * 60 * 60 + startMinutes  * 60 + startSeconds);

        var itemEndTimeArray = gMediaList[i][3].split(":");
        var endHours = parseInt(itemEndTimeArray[0]);
        var endMinutes = parseInt(itemEndTimeArray[1]);
        var endSeconds = parseInt(itemEndTimeArray[2]);
        signToggle = (endHours < 0) ? -1 : 1;
        var itemEndTimeSeconds = signToggle * (Math.abs(endHours) * 60 * 60 + endMinutes * 60 + endSeconds);

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
            //if (gPlaybackState != "rounding") { //if this function wasn't called from getNearestHistoricalMissionTimeId then set that the transcript has been clicked
            //    gPlaybackState = "transcriptclicked"; //used in the youtube playback code to determine whether vid has been scrubbed
            //}
            gPlaybackState = "transcriptclicked"; //used in the youtube playback code to determine whether vid has been scrubbed
            //change youtube video if the correct video isn't already playing
            if (currVideoID !== gMediaList[i][1]) {
                console.log("seekToTime(): changing video from: " + currVideoID + " to: " + gMediaList[i][1]);
                gNextVideoStartTime = seekToSecondsWithOffset;
                player.loadVideoById(gMediaList[i][1], seekToSecondsWithOffset);
                // window.clearInterval(gIntervalID); //reset the scrolling poller for the new video
                // gIntervalID = setAutoScrollPoller();
                // console.log("INTERVAL: New interval started after seek: " + gIntervalID);
            } else {
                console.log("seekToTime(): no need to change video. Seeking to " + elementId.toString());
                player.seekTo(seekToSecondsWithOffset, true);
            }
            //scrollToTimeID(findClosestUtterance(totalSeconds));
            showCurrentPhoto(elementId);
            findClosestUtterance(totalSeconds);
            findClosestTOC(totalSeconds);
            findClosestCommentary(totalSeconds);

            break;
        }
    }
}

function displayHistoricalTimeDifferenceByTimeId(timeid) {
    //console.log("displayHistoricalTimeDifferenceByTimeId():" + timeid);
    //TODO accommodate mission time change mid-mission

    var launchDate = Date.parse("1972-12-07 0:33 -500");

    //TODO revisit these blatant date hacks
    //launchDate.setDate(launchDate.getDate() - 1); //required to get 43 years exactly during mission. Not understood why.
    //launchDate.setHours(launchDate.getHours() + 1);

    var timeStr = timeid.substr(6);
    var sign = timeStr.substr(0,1);
    var hours = parseInt(timeStr.substr(0,3));
    var minutes = parseInt(timeStr.substr(3,2));
    var seconds = parseInt(timeStr.substr(5,2));

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

    var timeId = "timeid" + padZeros(h,3) + padZeros(m,2) + padZeros(histDate.getSeconds(),2);
    //console.log("getNearestHistoricalMissionTimeId(): Nearest Mission timeId" + timeId);
    ga('send', 'event', 'button', 'click', 'snap to real-time');

    //gPlaybackState = "rounding";
    return timeId;
}

//------------------------------------------------- utterance chunking code -------------------------------------------------

function displayUtteranceRegion(timeid) {
    var utteranceIndex = gUtteranceDataLookup[timeid.substr(6)];

    var utteranceDiv = $('#utteranceDiv');
    var utteranceTable = $('#utteranceTable');

    repopulateUtteranceTable(utteranceIndex);

    var timeIdMarker = utteranceTable.find('#' + timeid);
    var scrollDestination = timeIdMarker.offset().top - utteranceDiv.offset().top;
    utteranceDiv.animate({scrollTop: scrollDestination}, '500', 'swing', function() {
        //console.log('Finished animating: ' + scrollDestination);
    });
    //repopulateUtteranceTable(utteranceIndex);
}

function repopulateUtteranceTable(utteranceIndex) {
    var utteranceTable = $('#utteranceTable');
    utteranceTable.html('');
    $('#utteranceDiv').scrollTop(0);
    for (var i = -1; i <= 50; i++) {
        if (i == 0) {
            var style = "background-color: #222222";
        } else {
            style = "";
        }
        if (utteranceIndex + i >= 0) { //TODO verify that this accommodates the first mission utterance
            utteranceTable.append(getUtteranceObjectHTML(utteranceIndex + i, style));
        }
    }
}

function getUtteranceObjectHTML(utteranceIndex, style) {
    //console.log("getUtteranceObjectHTML():" + utteranceIndex);
    var utteranceObject = gUtteranceData[utteranceIndex];
    var html = $('#utteranceTemplate').html();
    html = html.replace("@style", style);
    var timeid = "timeid" + utteranceObject[0].split(":").join("");
    html = html.replace(/@timeid/g, timeid);
    html = html.replace("@timestamp", utteranceObject[0]);
    html = html.replace("@who", utteranceObject[1]);
    html = html.replace("@words", utteranceObject[2]);
    if (utteranceObject[1] != "PAO") {
        html = html.split("afjpao").join("");
    }
    //console.log(utteranceObject[0] + " - " + utteranceObject[1] + " - " + utteranceObject[2]);
    return html;
}

//------------------------------------------------- photo display and gallery -------------------------------------------------

function populatePhotoGallery() {
    var photoGallery = $('#photoGallery');
    photoGallery.html('');

    for (var i = 0; i < gPhotoIndex.length; i++) {
        var photoObject = gPhotoList[i];
        photoGallery.append(photoObject[1] + "<BR>");
    }
    console.log("APPREADY: populatePhotoGallery(): " + gApplicationReady);
    gApplicationReady += 1;
}

function showCurrentPhoto(timeId) {
    //console.log('showCurrentPhoto():' + timeId);
    var timeStr = parseInt(timeId.substr(6));
    //var closestTime = closest(timeStr, gPhotoIndex);

    //find closest photo and display it if it has changed
    var currentClosestTime = parseInt(gPhotoIndex[0]);
    var diff = Math.abs(timeStr - currentClosestTime);
    for (var i = 0; i < gPhotoIndex.length; i++) {
        if (gPhotoIndex[i] > timeStr) {
            var photoIndexNum = i - 1;
            break;
        }
        var newdiff = Math.abs(timeStr - parseInt(gPhotoIndex[i]));
        if (newdiff < diff) {
            diff = newdiff;
            currentClosestTime = gPhotoIndex[i];
        }
    }
    if (currentClosestTime != gCurrentPhotoTimestamp) {
        gCurrentPhotoTimestamp = currentClosestTime;
        loadPhotoHtml(photoIndexNum);
    }
}

function loadPhotoHtml(photoIndex) {
    console.log('loadPhotoHtml():' + photoIndex);
    var photoDiv = $("#photodiv");
    var photoObject = gPhotoList[photoIndex];
    var html = $('#photoTemplate').html();

    //display prerendered 1024 height photos if photo div height smaller than 1024
    if (photoDiv.height() <= 1024) {
        var sizePath = "1024/";
    } else {
        sizePath = ""
    }

    html = html.replace(/@sizepath/g , sizePath);
    html = html.replace(/@filename/g , photoObject[1]);
    html = html.replace("@timestamp", photoObject[2]);
    html = html.replace("@photo_num", photoObject[3]);
    var magNum = "AS17-" + photoObject[5] + "-";
    html = (photoObject[4] != "") ? html.replace("@mag_code", "Mag: " + photoObject[4]) : html.replace("@mag_code", "");
    html = (photoObject[5] != "") ? html.replace("@mag_number", magNum) : html.replace("@mag_number", "");
    html = (photoObject[6] != "") ? html.replace("@photographer", "Photographer: " + photoObject[6]) : html.replace("@photographer", "");
    html = html.replace("@description", photoObject[7]);

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
    var image = $('#imageContainerImage');

    var maxWidth = photodiv.width(); // Max width for the image
    var maxHeight = photodiv.height();    // Max height for the image
    //console.log("scaleMissionImage():maxWidth " + maxWidth);
    //console.log("scaleMissionImage():maxHeight " + maxHeight);
    var ratio = 0;  // Used for aspect ratio
    //var width = image.width();    // Current image width
    //var height =image.height();  // Current image height

    var width = image.get(0).naturalWidth;
    var height =image.get(0).naturalHeight;
    //console.log("scaleMissionImage():naturalWidth " + width);
    //console.log("scaleMissionImage():naturalHeight " + height);

    // Check if the current width is larger than the max7
    if(width > maxWidth){
        ratio = maxWidth / width;   // get ratio for scaling image
        image.css("width", maxWidth); // Set new width
        image.css("height", height * ratio);  // Scale height based on ratio

        height = height * ratio;    // Reset height to match scaled image
        width = width * ratio;    // Reset width to match scaled image
    }

    // Check if current or newly width-scaled height is larger than max
    if(height > maxHeight){
        ratio = maxHeight / height; // get ratio for scaling image
        image.css("height", maxHeight);   // Set new height
        image.css("width", width * ratio);    // Scale width based on ratio
    }
}

//--------------- initializePlayback ---------------

function initializePlayback() {
    console.log("initializePlayback()");
    if (gMissionTimeParamSent == 0) {
        seekToTime("timeid-000100"); //jump to 1 minute to launch
    } else {
        var paramMissionTime = $.getUrlVar('t'); //code to detect jump-to-timecode parameter
        if (typeof paramMissionTime != "undefined") {
            var timeId = "timeid" + paramMissionTime.split(":").join("");
            seekToTime(timeId);
        } else {
            console.log("Invalid t Parameter");
            seekToTime("timeid-000100"); //jump to 1 minute to launch
        }
    }
    clearInterval(gApplicationReadyIntervalID);
    gApplicationReadyIntervalID = null;
    gIntervalID = setAutoScrollPoller();
}



//--------------- async page initialization calls ---------------

$.when(ajaxGetMediaIndex(),
    ajaxGetTOCAll(),
    ajaxGetCommentaryIndex(),
    ajaxGetUtteranceData(),
    ajaxGetPhotoIndex(),
    ajaxGetMissionStagesData()).done(function(){
    // the code here will be executed when all ajax requests resolve and the video.js player has been initialized.
        gApplicationReady += 1;
        console.log("APPREADY: Ajax loaded: " + gApplicationReady);

        //populatePhotoGallery next
        populatePhotoGallery();
});

//--------------- index file handling --------------------

function ajaxGetMediaIndex() {
    return $.ajax({
        type: "GET",
        url: "./indexes/media_index.csv?stopcache=" + Math.random(),
        dataType: "text",
        success: function(data) {processMediaIndexData(data);}
    });
}
function ajaxGetTOCAll() {
    return $.ajax({
        type: "GET",
        url: "./indexes/TOCall.csv?stopcache=" + Math.random(),
        dataType: "text",
        success: function(data) {processTOCAllData(data);}
    });
}
function ajaxGetUtteranceData() {
    return $.ajax({
        type: "GET",
        url: "./indexes/utteranceData.csv?stopcache=" + Math.random(),
        dataType: "text",
        success: function(data) {processUtteranceData(data);}
    });
}
function ajaxGetCommentaryIndex() {
    return $.ajax({
        type: "GET",
        url: "./indexes/commentaryIndex.csv?stopcache=" + Math.random(),
        dataType: "text",
        success: function(data) {processCommentaryIndexData(data);}
    });
}
function ajaxGetPhotoIndex() {
    return $.ajax({
        type: "GET",
        url: "./indexes/photoIndex.csv?stopcache=" + Math.random(),
        dataType: "text",
        success: function(data) {processPhotoIndexData(data);}
    });
}
function ajaxGetMissionStagesData() {
    return $.ajax({
        type: "GET",
        url: "./indexes/missionStages.csv?stopcache=" + Math.random(),
        dataType: "text",
        success: function(data) {processMissionStagesData(data);}
    });
}
function processMediaIndexData(allText) {
    //console.log("processMediaIndexData");
    var allTextLines = allText.split(/\r\n|\n/);
    for (var i = 0; i < allTextLines.length; i++) {
        var data = allTextLines[i].split('|');

        var rec = [];
        rec.push(data[0]);
        rec.push(data[1]);
        rec.push(data[2]);
        rec.push(data[3]);
        gMediaList.push(rec);
    }
}
function processTOCAllData(allText) {
    //console.log("processTOCIndexData");
    var allTextLines = allText.split(/\r\n|\n/);
    for (var i = 0; i < allTextLines.length; i++) {
        var data = allTextLines[i].split('|');
        if (data[0] != "") {
            gTOCAll.push(data);
            gTOCIndex[i] = data[0].split(":").join("");
        }
    }
}
function processUtteranceData(allText) {
    //console.log("processUtteranceData");
    var allTextLines = allText.split(/\r\n|\n/);
    for (var i = 0; i < allTextLines.length; i++) {
        var data = allTextLines[i].split('|');
        if (data[0] != "") {
            gUtteranceData.push(data);
            gUtteranceDataLookup[data[0].split(":").join("")] = i;
            gUtteranceIndex[i] = data[0].split(":").join("");
        }
    }
}
function processCommentaryIndexData(allText) {
    //console.log("processCommentaryIndexData");
    gCommentaryIndex = allText.split(/\r\n|\n/);
}
function processPhotoIndexData(allText) {
    //console.log("processPhotoIndexData");
    var allTextLines = allText.split(/\r\n|\n/);
    for (var i = 0; i < allTextLines.length; i++) {
        if (allTextLines[i] != "") {
            var data = allTextLines[i].split('|');
            gPhotoList.push(data);
            gPhotoLookup[data[0].split(":").join("")] = i;
            gPhotoIndex[i] = data[0];
        }
    }
}
function processMissionStagesData(allText) {
    //console.log("processMissionStagesData");
    var allTextLines = allText.split(/\r\n|\n/);
    for (var i = 0; i < allTextLines.length; i++) {
        var data = allTextLines[i].split('|');
        if (data[0] != "") {
            gMissionStages.push(data);
        }
        if (i > 0) {
            gMissionStages[i - 1][3] = data[0]; //append this items start time as the last item's end time
        }
    }
    gMissionStages[gMissionStages.length - 1][3] = secondsToTimeStr(gMissionDurationSeconds); //insert last end time as end of mission
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

function toggleFullscreen() {
    var fullScreenBtn = $('#fullScreenBtn');
    if ($(document).fullScreen() == false) {
        $(document).fullScreen(true);
        fullScreenBtn.attr("value", "Exit Full Screen");
    } else {
        $(document).fullScreen(false);
        fullScreenBtn.attr("value", "Full Screen");
    }
    scaleMissionImage();
    redrawAll();
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

function timeStrToSeconds(timeStr) {
    var sign = timeStr.substr(0,1);
    var hours = parseInt(timeStr.substr(0,3));
    var minutes = parseInt(timeStr.substr(4,2));
    var seconds = parseInt(timeStr.substr(7,2));
    var signToggle = (sign == "-") ? -1 : 1;
    return Math.round(signToggle * ((Math.abs(hours) * 60 * 60) + (minutes * 60) + seconds));
}

function setIntroTimeUpdatePoller() {
    return window.setInterval(function () {
        //console.log("setIntroTimeUpdatePoller()");
        displayHistoricalTimeDifferenceByTimeId(getNearestHistoricalMissionTimeId());
    }, 1000);
}

function historicalButtonClick() {
    window.clearInterval(gIntroInterval);
    seekToTime(getNearestHistoricalMissionTimeId());
    onMouseOutHandler(); //remove any errant navigator rollovers that occurred during modal
    gIntroInterval = null;
}

function oneMinuteToLaunchButtonClick() {
    window.clearInterval(gIntroInterval);
    gIntroInterval = null;
    onMouseOutHandler(); //remove any errant navigator rollovers that occurred during modal
    initializePlayback();
}

Date.prototype.stdTimezoneOffset = function() {
    var jan = new Date(this.getFullYear(), 0, 1);
    var jul = new Date(this.getFullYear(), 6, 1);
    return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
};

Date.prototype.dst = function() {
    return this.getTimezoneOffset() < this.stdTimezoneOffset();
};

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
        $("#fullScreenBtn").button();
        $("#launchBtn").button();
    } else {
        $('body').isLoading({text: "Loading", position: "overlay"});
    }

    //init tabs
    $(".mid-center").tabs();

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
        ,   east__size:             150
        ,	spacing_open:			0  // ALL panes
        ,	spacing_closed:			12 // ALL panes
        ,
        // WEST-LAYOUT (child of outer-west-pane)
        west__childOptions: {
            center__paneSelector:	".mid-center"
            ,   north__paneSelector:    ".mid-north"
            ,   north__size:             "60%"
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
    var stateStr = state ? 'FullscreenOn' : 'FullscreenOff';

    // Now do something interesting
    console.log("non-button fullscreen change state: " + stateStr);

    var fullScreenBtn = $('#fullScreenBtn');
    if (stateStr == "FullscreenOn") {
        fullScreenBtn.attr("value", "Exit Full Screen");
    } else {
        fullScreenBtn.attr("value", "Full Screen");
    }
    scaleMissionImage();
    redrawAll();
});

//on window resize
$(window).resize(function(){ //scale image proportionally to image viewport on load
    console.log('***window resize');
    $('#myCanvas').css("height", $('.outer-north').height());  // fix height for broken firefox div height
    scaleMissionImage();
});

//on document ready
$(document).ready(function() {
    $('#myCanvas').css("height", $('.outer-north').height());  // fix height for broken firefox div height

    gApplicationReadyIntervalID = setApplicationReadyPoller();


    //$('.utterancetable').delegate('.utterance', 'mouseenter', function() {
    //    var loctop = $(this).position().top;
    //    var locright = $(this).position().left + $(this).width() - 28;
    //    $('.share-button').animate({top: loctop, left: locright}, 0);
    //    var hoveredUtteranceText = $(this).text().replace(/\n/g, "|");
    //    hoveredUtteranceText = hoveredUtteranceText.replace(/  /g, "");
    //    gHoveredUtteranceArray = hoveredUtteranceText.split("|");
    //});
    //
    //new Share(".share-button", {
    //    ui: {
    //        flyout: "middle left",
    //        button_text: ""
    //    },
    //    networks: {
    //        google_plus: {
    //            enabled: "false",
    //            before: function(element) {
    //                this.url = "http://apollo17.org?t=" + gHoveredUtteranceArray[1];
    //            },
    //            after: function() {
    //                console.log("User shared google plus: ", this.url);
    //                ga('send', 'event', 'share', 'click', 'google plus');
    //            }
    //        },
    //        facebook: {
    //            app_id: "1639595472942714",
    //            before: function(element) {
    //                //this.url = element.getAttribute("data-url");
    //                this.title = "Apollo 17 in Real-time - Moment: " + gHoveredUtteranceArray[1];
    //                this.url = "http://apollo17.org?t=" + gHoveredUtteranceArray[1];
    //                this.description = gHoveredUtteranceArray[1] + " " + gHoveredUtteranceArray[2] + ": " + gHoveredUtteranceArray[3];
    //                this.image = "http://apollo17.org/mission_images/img/72-H-1454.jpg";
    //            },
    //            after: function() {
    //                console.log("User shared facebook: ", this.url);
    //                ga('send', 'event', 'share', 'click', 'facebook');
    //            }
    //        },
    //        twitter: {
    //            before: function(element) {
    //                //this.url = element.getAttribute("data-url");
    //                this.url = "http://apollo17.org?t=" + gHoveredUtteranceArray[1];
    //                this.description = "%23Apollo17 in Real-time: " + gHoveredUtteranceArray[1] + " " + gHoveredUtteranceArray[2] + ": " + gHoveredUtteranceArray[3].substr(0, 67) + "... %23NASA";
    //            },
    //            after: function() {
    //                console.log("User shared twitter: ", this.url);
    //                ga('send', 'event', 'share', 'click', 'twitter');
    //            }
    //        },
    //        pinterest: {
    //            enabled: "false",
    //            before: function(element) {
    //                //this.url = element.getAttribute("data-url");
    //                this.url = "http://apollo17.org?t=" + gHoveredUtteranceArray[1];
    //                this.description = gHoveredUtteranceArray[1] + " " + gHoveredUtteranceArray[2] + ": " + gHoveredUtteranceArray[3];
    //                this.image = "http://apollo17.org/mission_images/img/72-H-1454.jpg";
    //            },
    //            after: function() {
    //                console.log("User shared pinterest: ", this.url);
    //                ga('send', 'event', 'share', 'click', 'pinterest');
    //            }
    //        },
    //        email: {
    //            before: function(element) {
    //                //this.url = element.getAttribute("data-url");
    //                this.title = "Apollo 17 in Real-time: " + gHoveredUtteranceArray[1];
    //                this.description = gHoveredUtteranceArray[2] + ": " + gHoveredUtteranceArray[3] + "     " + "http://apollo17.org?t=" + gHoveredUtteranceArray[1];
    //            },
    //            after: function() {
    //                console.log("User shared email: ", this.title);
    //                ga('send', 'event', 'share', 'click', 'email');
    //            }
    //        }
    //    }
    //});
});