var gLastTimeIdMarker = '';
var gLastTOCTimeId = '';
var gLastTOCTimeIdMarker = '';
var gLastCommentaryTimeId = '';
var gLastCommentaryTimeIdMarker = '';
var gLastTimeIdChecked = '';
var gCurrMissionTime = '';
var gCurrMissionDate = null;
var gIntervalID = null;
var gMediaList = [];
var gTOCIndex = [];
var gTOCAll = [];
var gUtteranceIndex = [];
var gUtteranceData = [];
var gUtteranceDataLookup = [];
var gCommentaryIndex = [];
var gPhotoList = [];
var gPhotoIndex = [];
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
    gApplicationReady += 1; //increment app ready indicator.
    if (gMissionTimeParamSent == 0) {
        //event.target.playVideo();
        //seekToTime("timeid-000100"); //jump to 1 minute to launch
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
            //scrollToTimeID(findClosestUtterance(event.target.getCurrentTime() + gCurrVideoStartSeconds));
            findClosestUtterance(event.target.getCurrentTime() + gCurrVideoStartSeconds);
            findClosestTOC(event.target.getCurrentTime() + gCurrVideoStartSeconds);
            findClosestCommentary(event.target.getCurrentTime() + gCurrVideoStartSeconds);
            gPlaybackState = "normal";
        }
        if (gIntervalID == null) {
            //poll for mission time scrolling if video is playing
            gIntervalID = setAutoScrollPoller();
            console.log("INTERVAL: PLAYING: Interval started because was null: " + gIntervalID);
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
        var currVideoID = player.getVideoUrl().substr(player.getVideoUrl().indexOf("v=") + 2,11);
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

        player.iv_load_policy = 3;
        gNextVideoStartTime = 0; //force next video to start at 0 seconds in the play event handler
        player.loadVideoById(currVideoID, 0);

            //window.clearInterval(gIntervalID); //reset the scrolling poller for the new video
            //console.log("INTERVAL: Next video started. New interval started: " + gIntervalID);
            //gIntervalID = setAutoScrollPoller();
    }
}

//--------------- transcript iframe autoscroll handling --------------------
function setAutoScrollPoller() {
    console.log("setAutoScrollPoller");
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
        var hours = Math.abs(parseInt(totalSec / 3600));
        var minutes = Math.abs(parseInt(totalSec / 60)) % 60 % 60;
        var seconds = Math.abs(parseInt(totalSec)) % 60;
        seconds = Math.floor(seconds);

        if (onCountdown) {
            var hoursText = "-" + padZeros(hours, 2);
        } else {
            hoursText = padZeros(hours, 3);
        }
        gCurrMissionTime = hoursText + ":" + padZeros(minutes,2) + ":" + padZeros(seconds,2);

        if (gCurrMissionTime != gLastTimeIdChecked) {
            var timeId = "timeid" + gCurrMissionTime.split(":").join("");
            gLastTimeIdChecked = gCurrMissionTime;
            //console.log("totalsec: " + totalSec + "| divmarker: " + timeId);
           // $("#timer").text(gCurrMissionTime);

            scrollToTimeID(timeId);
            scrollTOCToTimeID(timeId);
            scrollCommentaryToTimeID(timeId);
            showCurrentPhoto(timeId);

            missionTimeHistoricalDifference();

            //scroll nav cursor
            if (!gMouseOnNavigator) {
                redrawAll();
            }
            //drawCursor(timeStrToSeconds(gCurrMissionTime));
            paper.view.draw();
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
    //console.log("findClosestUtterance: finding closest utterance to (seconds): " + secondsSearch);
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
    console.log("findClosestTOC: finding closest TOC to (seconds): " + secondsSearch);
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
    console.log("searched TOC array, found closest: timeid" + gTOCIndex[i - 1] + " after " + i + " searches");
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
    console.log("searched commentary array, found closest: timeid" + gCommentaryIndex[i - 1] + " after " + i + " searches");
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

        //var transcriptFrame = $('#iFrameTranscript').contents();
        //var timeIdMarker = transcriptFrame.find('#' + timeId);
        ////reset background color of last line
        //if (gLastTimeIdMarker != '') {
        //    gLastTimeIdMarker.css("background-color",background_color);
        //}
        //var scrollDestination = timeIdMarker.offset().top - 100;
        //timeIdMarker.css("background-color",background_color_active);
        //gLastTimeIdMarker = timeIdMarker;
        //transcriptFrame.find('body').animate({ scrollTop: scrollDestination }, 500);
    }
}

function scrollTOCToTimeID(timeId) {
    if ($.inArray(timeId.substr(6), gTOCIndex) != -1) {
        if (timeId != gLastTOCTimeId) {
            // console.log("scrollTOCToTimeID " + timeId);
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
            console.log("TOC item already scrolled to. Not scrolling");
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

        var photoPage = "./mission_images/meta/" + photoFilename + ".html?nocache=" + Math.random();

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
    var timeStr = elementId.substr(6,7);
    var sign = timeStr.substr(0,1);
    var hours = parseInt(timeStr.substr(0,3));
    var minutes = parseInt(timeStr.substr(3,2));
    var seconds = parseInt(timeStr.substr(5,2));
    var signToggle = (sign == "-") ? -1 : 1;
    var totalSeconds = signToggle * ((Math.abs(hours) * 60 * 60) + (minutes * 60) + seconds);

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
                console.log("changing video from: " + currVideoID + " to: " + gMediaList[i][1]);
                gNextVideoStartTime = seekToSecondsWithOffset;
                player.loadVideoById(gMediaList[i][1], seekToSecondsWithOffset);
                // window.clearInterval(gIntervalID); //reset the scrolling poller for the new video
                // gIntervalID = setAutoScrollPoller();
                // console.log("INTERVAL: New interval started after seek: " + gIntervalID);
            } else {
                console.log("no need to change video. Seeking to " + elementId.toString());
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
        utteranceTable.append(getUtteranceObjectHTML(utteranceIndex + i, style));
    }
}

function getUtteranceObjectHTML(utteranceIndex, style) {
    var utteranceObject = gUtteranceData[utteranceIndex];
    var html = '<tr class="utterance" style="@style" onclick="seekToTime(this.id)" id="@timeid">' +
        '<td class="afjget afjpao">@timestamp</td>' +
        '<td class="afjwho afjpao">@who</td>' +
        '<td class="spokenwords afjpao">@words</td>' +
        '</tr>';
    html = html.replace("@style", style);
    var timeid = "timeid" + utteranceObject[0].split(":").join("");
    html = html.replace("@timeid", timeid);
    html = html.replace("@timeid", timeid);
    html = html.replace("@timestamp", utteranceObject[0]);
    html = html.replace("@who", utteranceObject[1]);
    html = html.replace("@words", utteranceObject[2]);
    if (utteranceObject[1] != "PAO") {
        html = html.split("afjpao").join("");
    }
    //console.log(utteranceObject[0] + " - " + utteranceObject[1] + " - " + utteranceObject[2]);
    return html;
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
});

function initializePlayback() {
    console.log("initializePlayback");
    if (gMissionTimeParamSent == 0) {
        //event.target.playVideo();
        //player.src(gMediaSrcURL + "_- - 000.mp4");
        gCurrMissionTime = "-00:01:00";
        seekToTime("timeid-000100"); //jump to 1 minute to launch upon initial load
        player.playVideo();
        //findClosestUtterance(-60); //jump to 1 minute to launch upon initial load
    }
    clearInterval(gApplicationReadyIntervalID);
    gApplicationReadyIntervalID = null;

    gIntervalID = setAutoScrollPoller();
}

//--------------- index file handling --------------------

function ajaxGetMediaIndex() {
    // NOTE:  This function must return the value
    //        from calling the $.ajax() method.
    return $.ajax({
        type: "GET",
        url: "./indexes/media_index.csv?stopcache=" + Math.random(),
        dataType: "text",
        success: function(data) {processMediaIndexData(data);}
    });
}
function ajaxGetTOCAll() {
    // NOTE:  This function must return the value
    //        from calling the $.ajax() method.
    return $.ajax({
        type: "GET",
        url: "./indexes/TOCall.csv?stopcache=" + Math.random(),
        dataType: "text",
        success: function(data) {processTOCAllData(data);}
    });
}
function ajaxGetUtteranceData() {
    // NOTE:  This function must return the value
    //        from calling the $.ajax() method.
    return $.ajax({
        type: "GET",
        url: "./indexes/utteranceData.csv?stopcache=" + Math.random(),
        dataType: "text",
        success: function(data) {processUtteranceData(data);}
    });
}
function ajaxGetCommentaryIndex() {
    // NOTE:  This function must return the value
    //        from calling the $.ajax() method.
    return $.ajax({
        type: "GET",
        url: "./indexes/commentaryIndex.csv?stopcache=" + Math.random(),
        dataType: "text",
        success: function(data) {processCommentaryIndexData(data);}
    });
}
function ajaxGetPhotoIndex() {
    // NOTE:  This function must return the value
    //        from calling the $.ajax() method.
    return $.ajax({
        type: "GET",
        url: "./indexes/photoIndex.csv?stopcache=" + Math.random(),
        dataType: "text",
        success: function(data) {processPhotoIndexData(data);}
    });
}
function ajaxGetMissionStagesData() {
    // NOTE:  This function must return the value
    //        from calling the $.ajax() method.
    return $.ajax({
        type: "GET",
        url: "./indexes/missionStages.csv?stopcache=" + Math.random(),
        dataType: "text",
        success: function(data) {processMissionStagesData(data);}
    });
}
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
}
function processTOCAllData(allText) {
    console.log("processTOCIndexData");
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
    console.log("processUtteranceData");
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
    console.log("processCommentaryIndexData");
    gCommentaryIndex = allText.split(/\r\n|\n/);
}
function processPhotoIndexData(allText) {
    console.log("processPhotoIndexData");
    var allTextLines = allText.split(/\r\n|\n/);
    for (var i = 0; i < allTextLines.length; i++) {
        if (allTextLines[i] != "") {
            var data = allTextLines[i].split('|');
            gPhotoList.push(data);
            gPhotoIndex[i] = data[0];
        }
    }
}
function processMissionStagesData(allText) {
    console.log("processMissionStagesData");
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

$('iFrameTranscript').load(function() {
    $("#outer-north").isLoading("hide");
    console.log("Loading overlay off");

    if (gMissionTimeParamSent == 1) {
        var paramMissionTime = $.getUrlVar('t'); //code to detect jump-to-timecode parameter
        if (typeof paramMissionTime != "undefined") {
            paramMissionTime = paramMissionTime.replace(/%3A/g, ":");
            var missionTimeArray = paramMissionTime.split(":");
            var timeId = "timeid" + padZeros(missionTimeArray[0], 3) + padZeros(missionTimeArray[1], 2) + padZeros(missionTimeArray[2], 2);
            gCurrentPhotoTimestamp = "replace";
            seekToTime(timeId);
        }
    }
});

function setApplicationReadyPoller() {
    return window.setInterval(function () {
        console.log("Checking if App Ready");
        if (gApplicationReady >= 3) {
            console.log("App Ready!");
            $.isLoading( "hide" );
            initializePlayback();
            initNavigator();
        }
    }, 1000);
}

$(document).ready(function() {
    console.log("Loading overlay on");
    
    if (typeof $.getUrlVar('t') != "undefined") {
        gMissionTimeParamSent = 1;
    } else {
        gMissionTimeParamSent = 0;
    }

    gApplicationReadyIntervalID = setApplicationReadyPoller();

    $(".mid-center").tabs();

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

    $.isLoading({ text: "Loading", position: "overlay" });
});