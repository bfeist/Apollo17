var gLastTimeIdMarker = '';
var gLastTOCTimeId = '';
var gLastTOCTimeIdMarker = '';
var gLastCommentaryTimeId = '';
var gLastCommentaryTimeIdMarker = '';
var gLastTimeIdChecked = '';
var gCurrMissionTime = '';
var gCurrMissionDate = null;
var gIntervalID = null;
var gYTList = [];
var gTOCIndex = [];
var gUtteranceIndex = [];
var gCommentaryIndex = [];
var gPhotoList = [];
var gPhotoIndex = [];
var gCurrentPhotoTimestamp = "initial";
var gCurrVideoStartSeconds = -9442;
var gCurrVideoEndSeconds = 0;
var gPlaybackState = "normal";
var gNextVideoStartTime = -1; //used to track when one video ends to ensure next plays from 0 (needed because youtube bookmarks where you left off in videos without being asked to)
var gMissionTimeParamSent = 0;
var player;

function onYouTubeIframeAPIReady() {
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
    console.log("onPlayerReady");
    if (gMissionTimeParamSent == 0) {
        event.target.playVideo();
        seekToTime("timeid-000100"); //jump to 1 minute to launch
    }
}
function utteranceIframeLoaded() {
    if (gMissionTimeParamSent == 1) {
        $("#outer-north").isLoading("hide");
        console.log("Loading overlay off");
        var paramMissionTime = $.getUrlVar('t'); //code to detect jump-to-timecode parameter
        if (typeof paramMissionTime != "undefined") {
            paramMissionTime = paramMissionTime.replace(/%3A/g, ":");
            var missionTimeArray = paramMissionTime.split(":");
            var timeId = "timeid" + padZeros(missionTimeArray[0], 3) + padZeros(missionTimeArray[1], 2) + padZeros(missionTimeArray[2], 2);
            gCurrentPhotoTimestamp = "replace";
            seekToTime(timeId);
        } else {
            seekToTime("timeid-000100"); //jump to 1 minute to launch
        }
    }
}

// The API calls this function when the player's state changes.
// The function indicates that when playing a video (state=1)
function onPlayerStateChange(event) {
    console.log("onPlayerStateChange: player state change: " + event.data);
    if (event.data == YT.PlayerState.PLAYING) {
        console.log("PLAYER PLAYING");
        if (gNextVideoStartTime != -1) {
            console.log("PLAYING: forcing playback from " + gNextVideoStartTime + " seconds in new video");
            player.seekTo(gNextVideoStartTime, true);
            gNextVideoStartTime = -1;
            gPlaybackState = "normal";
        }
        if (gPlaybackState == "unexpectedbuffering") {
            console.log("PLAYING: was unexpected buffering so calling findClosestUtterance");
            ga('send', 'event', 'transcript', 'click', 'youtube scrub');
            findClosestUtterance(event.target.getCurrentTime() + gCurrVideoStartSeconds);
            findClosestTOC(event.target.getCurrentTime() + gCurrVideoStartSeconds);
            findClosestCommentary(event.target.getCurrentTime() + gCurrVideoStartSeconds);
            gPlaybackState = "normal";
        }
        if (gIntervalID == null) {
            //poll for mission time scrolling if video is playing
            gIntervalID = setAutoScrollPoller();
            console.log("PLAYING: Interval started: " + gIntervalID);
        }
    }
    if (event.data == YT.PlayerState.PAUSED) {
        //clear polling for mission time scrolling if video is paused
        window.clearInterval(gIntervalID);
        console.log("PAUSED: interval stopped: " + gIntervalID);
        gIntervalID = null;
    }
    if (event.data == YT.PlayerState.BUFFERING) {
        console.log("BUFFERING: " + event.target.getCurrentTime() + gCurrVideoStartSeconds);
        if (gPlaybackState == "transcriptclicked") {
            gPlaybackState = "normal";
        } else {
            //buffering for unknown reason, probably due to scrubbing video
            gPlaybackState = "unexpectedbuffering";
        }
    }
    if (event.data == YT.PlayerState.ENDED) { //load next video
        console.log("ENDED. Load next video.");
        var currVideoID = player.getVideoUrl().substr(32,11);
        for (var i = 0; i < gYTList.length; ++i) {
            if (gYTList[i][1] == currVideoID) {
                console.log("Ended. Changing YT video from: " + currVideoID + " to: " + gYTList[i + 1][1]);
                currVideoID = gYTList[i + 1][1];
                break;
            }
        }
        var itemStartTimeArray = gYTList[i + 1][2].split(":");
        var startHours = parseInt(itemStartTimeArray[0]);
        var startMinutes = parseInt(itemStartTimeArray[1]);
        var startSeconds = parseInt(itemStartTimeArray[2]);
        var signToggle = (startHours < 0) ? -1 : 1;
        gCurrVideoStartSeconds = signToggle * (Math.abs(startHours) * 60 * 60 + startMinutes  * 60 + startSeconds);

        var itemEndTimeArray = gYTList[i + 1][3].split(":");
        var endHours = parseInt(itemEndTimeArray[0]);
        var endMinutes = parseInt(itemEndTimeArray[1]);
        var endSeconds = parseInt(itemEndTimeArray[2]);
        signToggle = (endHours < 0) ? -1 : 1;
        gCurrVideoEndSeconds = signToggle * (Math.abs(endHours) * 60 * 60 + endMinutes * 60 + endSeconds);

        player.loadVideoById(currVideoID, 0);
        player.iv_load_policy = 3;
        gNextVideoStartTime = 0; //force next video to start at 0 seconds in the play event handler

        window.clearInterval(gIntervalID); //reset the scrolling poller for the new video
        gIntervalID = setAutoScrollPoller();
    }
}

function padZeros(num, size) {
    var s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
}

//--------------- search for closest utterance time to video time (used upon seeked video) --------------------
function findClosestUtterance(secondsSearch) {
    console.log("findClosestUtterance: finding closest utterance to (seconds): " + secondsSearch);
    var found = false;
    var onCountdown = false;
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
        if (parseInt(timeId.substr(6)) < parseInt(gUtteranceIndex[i].substr(6))) {
            console.log("searched utterance array, found closest: " + gUtteranceIndex[i - 1] + " after " + i + " searches");
            scrollToTimeID(gUtteranceIndex[i - 1]);
            break;
        }
    }
}

function findClosestTOC(secondsSearch) {
    console.log("findClosestTOC: finding closest TOC to (seconds): " + secondsSearch);
    var onCountdown = false;
    if (gCurrVideoStartSeconds == 230400) {
        if (secondsSearch > 230400 + 3600) { //if at 065:00:00 or greater, add 000:02:40 to time
            secondsSearch = secondsSearch + 9600;
        }
    }
    var scrollDestination = gTOCIndex[gTOCIndex.length - 1];
    for (var i = 0; i < gTOCIndex.length; ++i) {
        var hours = Math.abs(parseInt(secondsSearch / 3600));
        var minutes = Math.abs(parseInt(secondsSearch / 60)) % 60;
        var seconds = Math.abs(parseInt(secondsSearch)) % 60;
        seconds = Math.floor(seconds);

        var timeId = "timeid" + padZeros(hours,3) + padZeros(minutes,2) + padZeros(seconds,2);
        if (secondsSearch < 0) {
            timeId = timeId.substr(0,6) + "-" + timeId.substr(7); //change timeid to negative, replacing leading zero in hours with "-"
        }
        if (parseInt(timeId.substr(6)) < parseInt(gTOCIndex[i].substr(6))) {
            scrollDestination = gTOCIndex[i - 1];
            break;
        }
    }
    console.log("searched TOC array, found closest: " + gTOCIndex[i - 1] + " after " + i + " searches");
    scrollTOCToTimeID(scrollDestination);
}

function findClosestCommentary(secondsSearch) {
    console.log("findClosestCommentary: finding closest commentary to (seconds): " + secondsSearch);
    var onCountdown = false;
    if (gCurrVideoStartSeconds == 230400) {
        if (secondsSearch > 230400 + 3600) { //if at 065:00:00 or greater, add 000:02:40 to time
            secondsSearch = secondsSearch + 9600;
        }
    }
    var scrollDestination = gCommentaryIndex[gCommentaryIndex.length - 1];
    for (var i = 0; i < gCommentaryIndex.length; ++i) {
        var hours = Math.abs(parseInt(secondsSearch / 3600));
        var minutes = Math.abs(parseInt(secondsSearch / 60)) % 60;
        var seconds = Math.abs(parseInt(secondsSearch)) % 60;
        seconds = Math.floor(seconds);

        var timeId = "timeid" + padZeros(hours,3) + padZeros(minutes,2) + padZeros(seconds,2);
        if (secondsSearch < 0) {
            timeId = timeId.substr(0,6) + "-" + timeId.substr(7); //change timeid to negative, replacing leading zero in hours with "-"
        }
        if (parseInt(timeId.substr(6)) < parseInt(gCommentaryIndex[i].substr(6))) {
            scrollDestination = gCommentaryIndex[i - 1];
            break;
        }
    }
    console.log("searched commentary array, found closest: " + gCommentaryIndex[i - 1] + " after " + i + " searches");
    scrollCommentaryToTimeID(scrollDestination);
}

//--------------- transcript iframe autoscroll handling --------------------
function setAutoScrollPoller() {
    console.log("setAutoScrollPoller");
    return window.setInterval(function () {
        var onCountdown = false;
        var totalSec = player.getCurrentTime() + gCurrVideoStartSeconds + 0.5;
        if (totalSec < 0) {
            onCountdown = true; //if on the countdown video counting backwards, make all times positive for timecode generation, then add the negative to the search string
        }
        if (gCurrVideoStartSeconds == 230400) {
            if (player.getCurrentTime() > 3600) { //if at 065:00:00 or greater, add 000:02:40 to time
                //console.log("adding 9600 seconds to autoscroll target due to MET time change");
                totalSec = totalSec + 9600;
            }
        }
        var hours = Math.abs(parseInt(totalSec / 3600));
        var minutes = Math.abs(parseInt(totalSec / 60)) % 60 % 60;
        var seconds = Math.abs(parseInt(totalSec)) % 60;
        seconds = Math.floor(seconds);
        gCurrMissionTime = " " + padZeros(hours,3) + ":" + padZeros(minutes,2) + ":" + padZeros(seconds,2);

        if (gCurrMissionTime != gLastTimeIdChecked) {
            var timeId = "timeid" + padZeros(hours,3) + padZeros(minutes,2) + padZeros(seconds,2);
            gLastTimeIdChecked = gCurrMissionTime;
            if (onCountdown) {
                timeId = timeId.substr(0,6) + "-" + timeId.substr(7); //change timeid to negative, replacing leading triple zero hours with "-"
                gCurrMissionTime = "-" + gCurrMissionTime.substr(2);
            }
            //console.log("totalsec: " + totalSec + "| divmarker: " + timeId);
            $("#timer").text(gCurrMissionTime);
            scrollToTimeID(timeId);
            scrollTOCToTimeID(timeId);
            scrollCommentaryToTimeID(timeId);
            showCurrentPhoto(timeId);

            missionTimeHistoricalDifference();
        }
    }, 500); //polling frequency in milliseconds
}

function scrollToTimeID(timeId) {
    //console.log ('#' + timeId + ' - ' + $('#iFrameTranscript').contents().find('#' + timeId).length);
    if ($.inArray(timeId, gUtteranceIndex) != -1) {
        // console.log("scrollToTimeID " + timeId);
        // console.log("Utterance item found in array. Scrolling utterance frame to " + timeId);
        var transcriptFrame = $('#iFrameTranscript').contents();
        var timeIdMarker = transcriptFrame.find('#' + timeId);
        //reset background color of last line
        if (gLastTimeIdMarker != '') {
            gLastTimeIdMarker.css("background-color","#FFFFFF");
        }
        var scrollDestination = timeIdMarker.offset().top - 100;
        timeIdMarker.css("background-color","#DDDDDD");
        gLastTimeIdMarker = timeIdMarker;
        transcriptFrame.find('body').animate({ scrollTop: scrollDestination }, 500);
    }
}

function scrollTOCToTimeID(timeId) {
    if ($.inArray(timeId, gTOCIndex) != -1) {
        if (timeId != gLastTOCTimeId) {
            // console.log("scrollTOCToTimeID " + timeId);
            var TOCFrame = $('#iFrameTOC').contents();
            var TOCtimeIdMarker = TOCFrame.find('#' + timeId);
            //reset background color of last line
            if (gLastTOCTimeIdMarker != '') {
                gLastTOCTimeIdMarker.css("background-color", "#FFFFFF");
            }
            TOCtimeIdMarker.css("background-color", "#DDDDDD");
            var TOCscrollDestination = TOCtimeIdMarker.offset().top - 100;
            TOCFrame.find('body').animate({scrollTop: TOCscrollDestination}, 500);
            gLastTOCTimeIdMarker = TOCtimeIdMarker;
            gLastTOCTimeId = timeId;
        } else {
            console.log("TOC item already scrolled to. Not scrolling");
        }
    }
}

function scrollCommentaryToTimeID(timeId) {
    if ($.inArray(timeId, gCommentaryIndex) != -1) {
        if (timeId != gLastCommentaryTimeId) {
            //$("#tabs-left").tabs( "option", "active", 1 ); //activate the commentary tab
            $("#commentaryTab").effect("highlight", {color: '#9DDD97'}, 1000); //blink the commentary tab

            //console.log("scrollCommentaryToTimeID " + timeId);
            var CommentaryFrame = $('#iFrameCommentary').contents();
            var CommentaryTimeIdMarker = CommentaryFrame.find('#' + timeId);
            //reset background color of last line
            if (gLastCommentaryTimeIdMarker != '') {
                gLastCommentaryTimeIdMarker.css("background-color", "#FFFFFF");
            }
            CommentaryTimeIdMarker.css("background-color", "#DDDDDD");
            var CommentaryScrollDestination = CommentaryTimeIdMarker.offset().top - 100;
            CommentaryFrame.find('body').animate({scrollTop: CommentaryScrollDestination}, 500);
            gLastCommentaryTimeIdMarker = CommentaryTimeIdMarker;
            gLastCommentaryTimeId = timeId;
        } else {
            console.log("Commentary item already scrolled to. Not scrolling");
        }
    }
}

function showCurrentPhoto(timeId) {
    var timeStr = parseInt(timeId.substr(6,7));
    //var closestTime = closest(timeStr, gPhotoIndex);

    var CurrentClosestTime = parseInt(gPhotoIndex[0]);
    var diff = Math.abs(timeStr - CurrentClosestTime);
    for (var i = 0; i < gPhotoIndex.length; i++) {
        if (gPhotoIndex[i] > timeStr) {
            break;
        }
        var newdiff = Math.abs(timeStr - parseInt(gPhotoIndex[i]));
        if (newdiff < diff) {
            diff = newdiff;
            CurrentClosestTime = gPhotoIndex[i];
        }
    }
    if (CurrentClosestTime != gCurrentPhotoTimestamp) {
        for (var i = 0; i < gPhotoList.length; i++) {
            if (gPhotoList[i][0] == CurrentClosestTime) {
                var photoFilename = gPhotoList[i][1];
                break;
            }
        }
        if (gCurrentPhotoTimestamp != "initial") { //if not the first photo replacement, activate the photos tab.
            $( "#tabs-right" ).tabs( "option", "active", 1 );
        }
        gCurrentPhotoTimestamp = CurrentClosestTime;
        console.log("closest photo time found: " + CurrentClosestTime + "| filename: " + photoFilename);

        var imageMetadata = "./mission_images/meta/" + photoFilename + ".html";
        $("#photoDescription").load(imageMetadata);

        var imageURL = "./mission_images/img/" + photoFilename;
        var anchor = document.createElement("a");
        anchor.href = imageURL;
        anchor.setAttribute('target', '_blank');
        var img = document.createElement("IMG");
        img.src = imageURL;
        anchor.appendChild(img);

        var photodiv = document.getElementById('photodiv');
        photodiv.replaceChild(anchor, photodiv.childNodes[1]);
    }
}

//--------------- transcript click handling --------------------
function seekToTime(elementId){
    console.log("seekToTime " + elementId);
    var gaTimeVal = parseInt(elementId.replace("timeid", ""));
    ga('send', 'event', 'transcript', 'click', 'utterances', gaTimeVal);
    var signToggle = 1;
    var timeStr = elementId.substr(6,7);
    var sign = timeStr.substr(0,1);
    var hours = parseInt(timeStr.substr(0,3));
    var minutes = parseInt(timeStr.substr(3,2));
    var seconds = parseInt(timeStr.substr(5,2));
    signToggle = (sign == "-") ? -1 : 1;
    var totalSeconds = signToggle * ((Math.abs(hours) * 60 * 60) + (minutes * 60) + seconds);

    var currVideoID = player.getVideoUrl().substr(player.getVideoUrl().indexOf("v=") + 2 ,11);
    for (var i = 0; i < gYTList.length; ++i) {
        var itemStartTimeArray = gYTList[i][2].split(":");
        var startHours = parseInt(itemStartTimeArray[0]);
        var startMinutes = parseInt(itemStartTimeArray[1]);
        var startSeconds = parseInt(itemStartTimeArray[2]);
        signToggle = (startHours < 0) ? -1 : 1;
        var itemStartTimeSeconds = signToggle * (Math.abs(startHours) * 60 * 60 + startMinutes  * 60 + startSeconds);

        var itemEndTimeArray = gYTList[i][3].split(":");
        var endHours = parseInt(itemEndTimeArray[0]);
        var endMinutes = parseInt(itemEndTimeArray[1]);
        var endSeconds = parseInt(itemEndTimeArray[2]);
        signToggle = (endHours < 0) ? -1 : 1;
        var itemEndTimeSeconds = signToggle * (Math.abs(endHours) * 60 * 60 + endMinutes * 60 + endSeconds);

        if (totalSeconds >= itemStartTimeSeconds && totalSeconds < itemEndTimeSeconds) { //if this YT video in loop contains the time we want to seek to
            var seekToSecondsWithOffset = totalSeconds - itemStartTimeSeconds;
            //adjust for 000:02:40 time addition at 065:00:00 -- only the 65 hours-in video needs this manual adjustment, all others have their startTime listed including the time change
            if (itemStartTimeSeconds == 230400) {
                if (seekToSecondsWithOffset > 3600) { //if at 065:00:00 or greater, subtract 000:02:40 to time
                    console.log("subtracting 9600 seconds from " + seekToSecondsWithOffset + " due to MET time change");
                    seekToSecondsWithOffset = seekToSecondsWithOffset - 9600;
                }
            }
            gCurrVideoStartSeconds = itemStartTimeSeconds;
            gCurrVideoEndSeconds = itemEndTimeSeconds;
            if (gPlaybackState != "rounding") { //if this function wasn't called from roundToNearestHistoricalTime then set that the transcript has been clicked
                gPlaybackState = "transcriptclicked"; //used in the youtube playback code to determine whether vid has been scrubbed
            }
            //change youtube video if the correct video isn't already playing
            if (currVideoID !== gYTList[i][1]) {
                console.log("changing YT video from: " + currVideoID + " to: " + gYTList[i][1]);
                gNextVideoStartTime = seekToSecondsWithOffset;
                player.loadVideoById(gYTList[i][1], seekToSecondsWithOffset);
                window.clearInterval(gIntervalID); //reset the scrolling poller for the new video
                gIntervalID = setAutoScrollPoller();
            } else {
                console.log("no need to change video. Seeking to " + elementId.toString());
                player.seekTo(seekToSecondsWithOffset, true);
            }
            findClosestUtterance(totalSeconds);
            //scrollToTimeID(elementId);
            findClosestTOC(totalSeconds);
            findClosestCommentary(totalSeconds);
            break;
        }
    }
}

function missionTimeHistoricalDifference() {
    //console.log("missionTimeHistoricalDifference");
    var launchDate = Date.parse("1972-12-07 5:33am GMT");

    var currMissionTimeArray = gCurrMissionTime.split(":");
    var currMissionHours = parseInt(currMissionTimeArray[0]);
    var currMissionMinutes = parseInt(currMissionTimeArray[1]);
    var currMissionSeconds = parseInt(currMissionTimeArray[2]);
    var conversionMultiplier = 1;
    if (currMissionTimeArray[0].substr(0,1) == "-") { //if on countdown, subtract the mission time from the launch moment
        conversionMultiplier = -1;
    }
    gCurrMissionDate = launchDate.add({
        hours: currMissionHours,
        minutes: currMissionMinutes * conversionMultiplier,
        seconds: currMissionSeconds * conversionMultiplier
    });
    //var custom_date_formats = {past: [{ ceiling: null, text: "$years years, $months months, $days days, $hours hours, $minutes minutes, $seconds seconds ago" }]}
    //var humanizedRealtimeDifference = humanized_time_span(gCurrMissionDate, Date.now(), custom_date_formats);

    var timeDiff = Math.abs(Date.now().getTime() - gCurrMissionDate.getTime());
    //var timeDiff = Math.abs(Date.parse("2015-12-07 5:33am GMT").getTime() - Date.parse("1972-12-07 5:33am GMT").getTime());

    var msInMinute = 60 * 1000;
    var msInHour = 60 * msInMinute;
    var msInDay = 24 * msInHour;
    var msInYear = 365 * msInDay;

    timeDiff = timeDiff + msInHour; //no idea why I need to add an additional hour to get the time difference to be correct

    var diffYears = Math.floor(timeDiff / msInYear);
    timeDiff = timeDiff - diffYears * msInYear;
    var diffDays = Math.floor(timeDiff / msInDay);
    timeDiff = timeDiff - diffDays * msInDay;
    var diffHours = Math.floor(timeDiff / msInHour);
    timeDiff = timeDiff - diffHours * msInHour;
    var diffMinutes = Math.floor(timeDiff / msInMinute);
    timeDiff = timeDiff - diffMinutes * msInMinute;
    var diffSeconds = Math.floor(timeDiff / 1000);

    var humanizedRealtimeDifference = "Exactly " + diffYears + " years<br/>" + diffDays + " days<br/>" + diffHours + " hours<br />" + diffMinutes + " minutes<br />" + diffSeconds + " seconds ago.";

    $("#historicalTimeDiff").html(humanizedRealtimeDifference);
    $("#historicalTime").text(gCurrMissionDate);
}

function roundToNearestHistoricalTime() { //proc for "snap to real-time" button
    //$("#roundedMissionTime").text(gCurrMissionDate);
    var d = Date.now();
    //var d = Date.parse("2015-12-07 6:33am GMT");
    var currDayOfMonth = d.getDate();

    if (currDayOfMonth >= 19) {
        d.setDate(currDayOfMonth - ((currDayOfMonth - 19) + 12));
    } else if (currDayOfMonth < 7) {
        d.setDate(currDayOfMonth + (7 - currDayOfMonth));
    }
    d.setMonth(gCurrMissionDate.getMonth());
    d.setYear(gCurrMissionDate.getYear());
    var roundedDate = d;
    var launchDate = Date.parse("1972-12-07 5:33am GMT");

    //find the difference between rounded date and mission start time to determine MET to jump to
    // Convert both dates to milliseconds
    var roundedDate_ms = roundedDate.getTime();
    var launchDate_ms = launchDate.getTime();
    var difference_ms = roundedDate_ms - launchDate_ms;

    var msInHour = 60 * 60 * 1000;
    var msInMinute = 60 * 1000;
    var h = Math.floor( (difference_ms) / msInHour);
    var m = Math.floor( ((difference_ms) - (h * msInHour)) / msInMinute );

    var timeId = "timeid" + padZeros(h,3) + padZeros(m,2) + padZeros(d.getSeconds(),2);
    console.log("Rounded time to skip to: " + timeId);
    ga('send', 'event', 'button', 'click', 'snap to real-time');

    gPlaybackState = "rounding";
    seekToTime(timeId);
}

//--------------- youtube index file handling --------------------
$(document).ready(function() {
    $.ajax({
        type: "GET",
        url: "./indexes/YouTube_media_index.csv?stopcache=" + Math.random(),
        dataType: "text",
        success: function(data) {processYTData(data);}
    });
    $.ajax({
        type: "GET",
        url: "./indexes/TOCindex.csv?stopcache=" + Math.random(),
        dataType: "text",
        success: function(data) {processTOCIndexData(data);}
    });
    $.ajax({
        type: "GET",
        url: "./indexes/utteranceIndex.csv?stopcache=" + Math.random(),
        dataType: "text",
        success: function(data) {processUtteranceIndexData(data);}
    });
    $.ajax({
        type: "GET",
        url: "./indexes/commentaryIndex.csv?stopcache=" + Math.random(),
        dataType: "text",
        success: function(data) {processCommentaryIndexData(data);}
    });
    $.ajax({
        type: "GET",
        url: "./indexes/photoIndex.csv?stopcache=" + Math.random(),
        dataType: "text",
        success: function(data) {processPhotoIndexData(data);}
    });
});

function processYTData(allText) {
    console.log("processYTData");
    var allTextLines = allText.split(/\r\n|\n/);

    for (var i = 0; i < allTextLines.length; i++) {
        var data = allTextLines[i].split('|');

        var rec = [];
        rec.push(data[0]);
        rec.push(data[1]);
        rec.push(data[2]);
        rec.push(data[3]);
        gYTList.push(rec);
    }
    // alert(lines);
}

function processTOCIndexData(allText) {
    console.log("processTOCIndexData");
    var allTextLines = allText.split(/\r\n|\n/);
    for (var i = 0; i < allTextLines.length; i++) {
        var data = allTextLines[i].split('|');
        gTOCIndex[i] = "timeid" + data[0];
    }
    // alert(lines);
}

function processUtteranceIndexData(allText) {
    console.log("processUtteranceIndexData");
    var allTextLines = allText.split(/\r\n|\n/);
    for (var i = 0; i < allTextLines.length; i++) {
        var data = allTextLines[i].split('|');
        gUtteranceIndex[i] = "timeid" + data[0];
    }
    // alert(lines);
}

function processCommentaryIndexData(allText) {
    console.log("processCommentaryIndexData");
    var allTextLines = allText.split(/\r\n|\n/);
    for (var i = 0; i < allTextLines.length - 1; i++) {
        var data = allTextLines[i].split('|');
        gCommentaryIndex[i] = "timeid" + data[0];
    }
    // alert(lines);
}

function processPhotoIndexData(allText) {
    console.log("processPhotoIndexData");
    var allTextLines = allText.split(/\r\n|\n/);
    for (var i = 0; i < allTextLines.length; i++) {
        var data = allTextLines[i].split('|');
        if (data[0] != "") {
            var rec = [];
            rec.push(data[0]);
            rec.push(data[1]);
            gPhotoList.push(rec);
            gPhotoIndex[i] = data[0];
        }
    }
}

$(document).ready(function() {
    if (typeof $.getUrlVar('t') != "undefined") {
        $("#outer-north").isLoading({ text: "Loading", position: "overlay" });
        gMissionTimeParamSent = 1;
        console.log("Loading overlay on");
    } else {
        gMissionTimeParamSent = 0;
    }

    $(".middle-east").tabs();
    $(".middle-west").tabs();

    // OUTER-LAYOUT
    $('body').layout({
        center__paneSelector:	".outer-center"
        ,   north__paneSelector:     ".outer-north"
        ,   south__paneSelector:     ".outer-south"
        ,   north__togglerLength_open: 0
        ,   south__togglerLength_open: 0
        ,	north__maxSize:			"55%"
        ,   north__minSize:         "55%"
        ,	south__maxSize:			100
        ,   south__minSize:			100
        ,	spacing_open:			5  // ALL panes
        ,	spacing_closed:			12 // ALL panes
        ,
        // NORTH-LAYOUT (child of outer-north-pane)
        north__childOptions: {

            center__paneSelector:	".north-center"
            ,   north__paneSelector:    ".north-north"
            ,   north_size:             50
            ,	west__paneSelector:		".north-west"
            ,	west__size:				"60%"
            ,	spacing_open:			5  // ALL panes
            ,	spacing_closed:			12 // ALL panes
            ,   west__togglerLength_open: 0
            ,   center__togglerLength_open: 0
            ,   north__togglerLength_open:  0
        },
        // CENTER-LAYOUT (child of outer-center-pane)
        center__childOptions: {
            center__paneSelector:	".middle-center"
            ,	west__paneSelector:		".middle-west"
            ,	east__paneSelector:		".middle-east"
            ,	west__size:				"45%"
            ,	east__size:				"45%"
            ,	spacing_open:			5  // ALL panes
            ,	spacing_closed:			12 // ALL panes
            ,   west__togglerLength_open: 0
            ,   center__togglerLength_open: 0
            ,   east__togglerLength_open: 0
        }
    });
});