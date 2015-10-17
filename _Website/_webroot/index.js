var gLastTimeIdMarker = '';
var gLastTOCTimeId = '';
var gLastTOCTimeIdMarker = '';
var gLastCommentaryTimeId = '';
var gLastCommentaryTimeIdMarker = '';
var gLastTimeIdChecked = '';
var gCurrMissionTime = '';
var gCurrMissionDate = null;
var gIntervalID = null;
var gStateIntervalID = null;
var gMediaList = [];
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
var mediaSrcURL = "http://media.apollo17.org/video/";

//var background_color = "#DEDDD1";
//var background_color_active = "#B5B4A4";

var background_color = "#000000";
var background_color_active = "#222222";

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
        }
    }
}

function initializePlayback() {
    console.log("initializePlayback");
    if (gMissionTimeParamSent == 0) {
        //event.target.playVideo();
        player.src(mediaSrcURL + "_- - 000.mp4");
        //player.play();
    }
    gIntervalID = setAutoScrollPoller();
    gStateIntervalID = setVideoStatePoller();
}

function setVideoStatePoller() {
    return window.setInterval(function () {
        if (!player.paused()) { //PLAYING
            //console.log("PLAYER PLAYING");
            if (gNextVideoStartTime != -1) {
                console.log("PLAYING: forcing playback from " + gNextVideoStartTime + " seconds in new video");
                player.currentTime(gNextVideoStartTime);
                gNextVideoStartTime = -1;
                gPlaybackState = "normal";
            }
            if (gPlaybackState == "scrubbed") {
                console.log("PLAYING: was unexpected buffering so calling findClosestUtterance");
                ga('send', 'event', 'transcript', 'click', 'youtube scrub');
                findClosestUtterance(player.currentTime() + gCurrVideoStartSeconds);
                findClosestTOC(player.currentTime() + gCurrVideoStartSeconds);
                findClosestCommentary(player.currentTime() + gCurrVideoStartSeconds);
                gPlaybackState = "normal";
            }
            if (gIntervalID == null) {
                //poll for mission time scrolling if video is playing
                console.log("INTERVAL: PLAYING: Interval started because was null: " + gIntervalID);
                gIntervalID = setAutoScrollPoller();
            }
        }
        if (player.paused()) { //PAUSED
            //clear polling for mission time scrolling if video is paused
            if (gIntervalID != null) {
                window.clearInterval(gIntervalID);
                console.log("PAUSED: scrolling interval stopped: " + gIntervalID);
                gIntervalID = null;
            }
        }
        //if (player.scrubbing(isScrubbing)) { //SCRUBBER Pressed
        //    console.log("SCRUBBER pressed");
        //    if (gPlaybackState == "transcriptclicked") {
        //        gPlaybackState = "normal";
        //    } else {
        //        gPlaybackState = "scrubbed";
        //    }
        //}
        if (player.ended()) {
            console.log("ENDED. Load next video.");
            var currVideoID = decodeURIComponent(player.currentSrc().split('/').pop());
            for (var i = 0; i < gMediaList.length; ++i) {
                if (gMediaList[i][1] == currVideoID) {
                    console.log("Ended. Changing video from: " + currVideoID + " to: " + gMediaList[i + 1][1]);
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

            //player.iv_load_policy = 3;
            gNextVideoStartTime = 0; //force next video to start at 0 seconds in the play event handler
            player.src(mediaSrcURL + currVideoID);
            player.play();

            //window.clearInterval(gIntervalID); //reset the scrolling poller for the new video
            //console.log("INTERVAL: Next video started. New interval started: " + gIntervalID);
            //gIntervalID = setAutoScrollPoller();
        }

    }, 1000); //polling frequency in milliseconds
}

function setAutoScrollPoller() {
    console.log("setAutoScrollPoller");
    return window.setInterval(function () {
        var totalSec = player.currentTime() + gCurrVideoStartSeconds + 0.5;
        if (totalSec < 0) {
            var onCountdown = true; //if on the countdown video counting backwards, make all times positive for timecode generation, then add the negative sign to the search string
        } else {
            onCountdown = false;
        }
        if (gCurrVideoStartSeconds == 230400) {
            if (player.currentTime() > 3600) { //if at 065:00:00 or greater, add 000:02:40 to time
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
                timeId = timeId.substr(0,6) + "-" + timeId.substr(7); //change timeid to negative, replacing leading zero of triple zero hours with "-"
                gCurrMissionTime = "-" + gCurrMissionTime.substr(2);
            }
            console.log("totalsec: " + totalSec + "| divmarker: " + timeId);
            $("#timer").text(gCurrMissionTime);
            scrollToTimeID(timeId);
            scrollTOCToTimeID(timeId);
            scrollCommentaryToTimeID(timeId);
            showCurrentPhoto(timeId);

            missionTimeHistoricalDifference();
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
    console.log("findClosestUtterance: finding closest utterance to (seconds): " + secondsSearch);
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
        var totalSec = player.currentTime() + gCurrVideoStartSeconds + 0.5;
        if (totalSec < 0) {
            var onCountdown = true; //if on the countdown video counting backwards, make all times positive for timecode generation, then add the negative sign to the search string
        } else {
            onCountdown = false;
        }
        if (gCurrVideoStartSeconds == 230400) {
            if (player.currentTime() > 3600) { //if at 065:00:00 or greater, add 000:02:40 to time
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
                timeId = timeId.substr(0,6) + "-" + timeId.substr(7); //change timeid to negative, replacing leading zero of triple zero hours with "-"
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
        $("#transcriptTab").effect("highlight", {color: '#006400'}, 1000); //blink the transcript tab
        var transcriptFrame = $('#iFrameTranscript').contents();
        var timeIdMarker = transcriptFrame.find('#' + timeId);
        //reset background color of last line
        if (gLastTimeIdMarker != '') {
            gLastTimeIdMarker.css("background-color",background_color);
        }
        var scrollDestination = timeIdMarker.offset().top - 100;
        timeIdMarker.css("background-color",background_color_active);
        gLastTimeIdMarker = timeIdMarker;
        transcriptFrame.find('body').animate({ scrollTop: scrollDestination }, 500);
    }
}

function scrollTOCToTimeID(timeId) {
    if ($.inArray(timeId, gTOCIndex) != -1) {
        if (timeId != gLastTOCTimeId) {
            // console.log("scrollTOCToTimeID " + timeId);
            $("#tocTab").effect("highlight", {color: '#006400'}, 1000); //blink the toc tab
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
            console.log("TOC item already scrolled to. Not scrolling");
        }
    }
}

function scrollCommentaryToTimeID(timeId) {
    if ($.inArray(timeId, gCommentaryIndex) != -1) {
        if (timeId != gLastCommentaryTimeId) {
            //$("#tabs-left").tabs( "option", "active", 1 ); //activate the commentary tab
            $("#commentaryTab").effect("highlight", {color: '#006400'}, 1000); //blink the commentary tab

            //console.log("scrollCommentaryToTimeID " + timeId);
            var CommentaryFrame = $('#iFrameCommentary').contents();
            var CommentaryTimeIdMarker = CommentaryFrame.find('#' + timeId);
            //reset background color of last line
            if (gLastCommentaryTimeIdMarker != '') {
                gLastCommentaryTimeIdMarker.css("background-color", background_color);
            }
            CommentaryTimeIdMarker.css("background-color", background_color_active);
            var CommentaryScrollDestination = CommentaryTimeIdMarker.offset().top - 100;
            CommentaryFrame.find('body').animate({scrollTop: CommentaryScrollDestination}, 500);
            gLastCommentaryTimeIdMarker = CommentaryTimeIdMarker;
            gLastCommentaryTimeId = timeId;
        } else {
            console.log("Commentary item already scrolled to. Not scrolling");
        }
    }
}

function loadPhotoPage(filename) {
    document.getElementById("photodiv").innerHTML='<object type="text/html" data="' + filename + '" width="100%" height="100%" ></object>';
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

        var photoPage = "./mission_images/meta/" + photoFilename + ".html";

        loadPhotoPage(photoPage);

        //$("#photoDiv").load(imagePage);

        //var imageURL = "./mission_images/img/" + photoFilename;
        //var anchor = document.createElement("a");
        //anchor.href = imageURL;
        //anchor.setAttribute('target', '_blank');
        //var img = document.createElement("IMG");
        //img.src = imageURL;
        //anchor.appendChild(img);
        //
        //var photodiv = document.getElementById('photodiv');
        //photodiv.replaceChild(anchor, photodiv.childNodes[1]);
    }
}

//--------------- transcript click handling --------------------
function seekToTime(elementId){
    console.log("seekToTime " + elementId);
    var gaTimeVal = parseInt(elementId.replace("timeid", ""));
    ga('send', 'event', 'transcript', 'click', 'utterances', gaTimeVal.toString());
    var signToggle = 1;
    var timeStr = elementId.substr(6,7);
    var sign = timeStr.substr(0,1);
    var hours = parseInt(timeStr.substr(0,3));
    var minutes = parseInt(timeStr.substr(3,2));
    var seconds = parseInt(timeStr.substr(5,2));
    signToggle = (sign == "-") ? -1 : 1;
    var totalSeconds = signToggle * ((Math.abs(hours) * 60 * 60) + (minutes * 60) + seconds);

    var currVideoID = decodeURIComponent(player.currentSrc().split('/').pop());
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
            if (currVideoID !== gMediaList[i][1]) {
                console.log("changing YT video from: " + currVideoID + " to: " + gMediaList[i][1]);
                gNextVideoStartTime = seekToSecondsWithOffset;
                player.src(mediaSrcURL + gMediaList[i][1]);
                player.currentTime(seekToSecondsWithOffset);

                //window.clearInterval(gIntervalID); //reset the scrolling poller for the new video
                //gIntervalID = setAutoScrollPoller();
                //console.log("INTERVAL: New interval started after seek: " + gIntervalID);
            } else {
                console.log("no need to change video. Seeking to " + elementId.toString());
                player.currentTime(seekToSecondsWithOffset);
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
    $("#historicalDate").text(gCurrMissionDate.toDateString());
    $("#historicalTime").text(gCurrMissionDate.toLocaleTimeString());
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

//--------------- index file handling --------------------
$(document).ready(function() {
    $.ajax({
        type: "GET",
        url: "./indexes/media_index.csv?stopcache=" + Math.random(),
        dataType: "text",
        success: function(data) {processMediaIndexData(data);}
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

function processMediaIndexData(allText) {
    console.log("processMediaIndexData");
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
    seekToTime("timeid-000100"); //jump to 1 minute to launch upon initial load
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
    findClosestUtterance(-60); //jump to 1 minute to launch upon initial load
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

    player = videojs("player", {
        "controls": true,
        "autoplay": true,
        "preload": "auto",
        "muted": false
    });
    initializePlayback();

    if (typeof $.getUrlVar('t') != "undefined") {
        $("#outer-north").isLoading({ text: "Loading", position: "overlay" });
        gMissionTimeParamSent = 1;
        console.log("Loading overlay on");
    } else {
        gMissionTimeParamSent = 0;
    }

    $(".mid-center")
        .tabs()
        //.addClass('ui-tabs-vertical ui-helper-clearfix');

    // OUTER-LAYOUT
    $('body').layout({
        center__paneSelector:	".outer-center"
        ,   north__paneSelector:    ".outer-north"
        ,   west__paneSelector:     ".outer-west"
        ,   north__togglerLength_open: 0
        ,   center__togglerLength_open: 0
        ,   west__togglerLength_open: 0
        ,	north__size:			"130"
        ,   west__size:             "40%"
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