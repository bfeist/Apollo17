console.log("INIT: Loading index.js");

var gMissionDurationSeconds = 1100166;
var gCountdownSeconds = 9442;

var gLastTOCElement = '';
var gLastTOCTimeId = '';
var gLastCommentaryTimeId = '';
var gLastCommentaryElement = '';
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
var gVideoSegments = [];
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
            findClosestUtterance(event.target.getCurrentTime() + gCurrVideoStartSeconds);
            findClosestTOC(event.target.getCurrentTime() + gCurrVideoStartSeconds);
            findClosestCommentary(event.target.getCurrentTime() + gCurrVideoStartSeconds);

        }
        if (gIntervalID == null) {
            //poll for mission time scrolling if video is playing
            gIntervalID = autoScrollPoller();
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

//--------------- transcript iframe autoscroll handling --------------------
function autoScrollPoller() {
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
    var timeId = secondsToTimeId(secondsSearch);
    var scrollTimeId = gUtteranceIndex[gUtteranceIndex.length - 1];
    for (var i = 0; i < gUtteranceIndex.length; ++i) {
        if (timeId < parseInt(gUtteranceIndex[i])) {
            scrollTimeId = gUtteranceIndex[i - 1];
            break;
        }
    }
    displayUtteranceRegion(scrollTimeId);
}

function findClosestTOC(secondsSearch) {
    console.log("findClosestTOC():" + secondsSearch);
    var onCountdown = false;
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
    console.log("findClosestTOC(): searched TOC array, found closest: timeid" + gTOCIndex[i - 1] + " after " + i + " searches");
    scrollTOCToTimeID(scrollTimeId);
}

function findClosestCommentary(secondsSearch) {
    console.log("findClosestCommentary():" + secondsSearch);
    var onCountdown = false;
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
    console.log("findClosestCommentary(): searched commentary array, found closest: timeid" + gCommentaryIndex[i - 1] + " after " + i + " searches");
    scrollCommentaryToTimeID(scrollTimeId);
}

function scrollToTimeID(timeId) {
    //console.log ('#' + timeId + ' - ' + $('#iFrameTranscript').contents().find('#' + timeId).length);
    if ($.inArray(timeId, gUtteranceIndex) != -1) {
        // console.log("scrollToElementId " + elementId);
        // console.log("Utterance item found in array. Scrolling utterance frame to " + elementId);
        if ($("#tabs-left").tabs('option', 'active') != 0) {
            $("#transcriptTab").effect("highlight", {color: '#006400'}, 1000); //blink the transcript tab
        }
        displayUtteranceRegion(timeId);
    }
}

function scrollTOCToTimeID(timeId) {
    if (timeId != gLastTOCTimeId) {
        if ($.inArray(timeId, gTOCIndex) != -1) {
            //console.log("scrollTOCToTimeID(): scrolling to " + elementId);
            if ($("#tabs-left").tabs('option', 'active') != 1) {
                $("#tocTab").effect("highlight", {color: '#006400'}, 1000); //blink the toc tab
            }
            var TOCFrame = $('#iFrameTOC').contents();
            var TOCElement = TOCFrame.find('#timeid' + timeId);
            //reset background color of last line
            if (gLastTOCElement != '') {
                gLastTOCElement.css("background-color", background_color);
            }
            TOCElement.css("background-color", background_color_active);
            var scrollDestination = TOCElement.offset().top - 100;
            TOCFrame.find('body').animate({scrollTop: scrollDestination}, 500);
            gLastTOCElement = TOCElement;
        }
        gLastTOCTimeId = timeId;
    } else {
        //console.log("scrollTOCToTimeID(): TOC item already scrolled to. Not scrolling");
    }
}

function scrollCommentaryToTimeID(timeId) {
    if (timeId != gLastCommentaryTimeId) {
        if ($.inArray(timeId, gCommentaryIndex) != -1) {
            //$("#tabs-left").tabs( "option", "active", 1 ); //activate the commentary tab
            if ($("#tabs-left").tabs('option', 'active') != 2) {
                $("#commentaryTab").effect("highlight", {color: '#006400'}, 1000); //blink the commentary tab
            }
            //console.log("scrollCommentaryToTimeID(): scrolling to  " + timeId);
            var commentaryFrame = $('#iFrameCommentary').contents();
            var commentaryElement = commentaryFrame.find('#timeid' + timeId);
            if (commentaryElement.length != 0) {
                //reset background color of last line
                if (gLastCommentaryElement != '') {
                    gLastCommentaryElement.css("background-color", background_color);
                }
                commentaryElement.css("background-color", background_color_active);
                var scrollDestination = commentaryElement.offset().top - 100;
                commentaryFrame.find('body').animate({scrollTop: scrollDestination}, 500);
            }
            gLastCommentaryElement = commentaryElement;
        }
        gLastCommentaryTimeId = timeId;
    } else {
        //console.log("scrollCommentaryToTimeID(): Commentary item already scrolled to. Not scrolling");
    }
}

//--------------- transcript click handling --------------------
function seekToTime(elementId) {
    console.log("seekToTime(): " + elementId);
    var timeId = elementId.substr(6);

    var gaTimeVal = parseInt(timeId);
    ga('send', 'event', 'transcript', 'click', 'utterances', gaTimeVal.toString());

    var totalSeconds = timeIdToSeconds(timeId);
    gCurrMissionTime = secondsToTimeStr(totalSeconds); //set mission time right away to speed up screen refresh
    redrawAll();

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
                console.log("seekToTime(): no need to change video. Seeking to " + elementId.toString());
                player.seekTo(seekToSecondsWithOffset, true);
            }
            //scrollToTimeID(findClosestUtterance(totalSeconds));
            showCurrentPhoto(timeId);
            findClosestUtterance(totalSeconds);
            findClosestTOC(totalSeconds);
            findClosestCommentary(totalSeconds);

            break;
        }
    }
}

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

//------------------------------------------------- utterance chunking code -------------------------------------------------

function displayUtteranceRegion(timeId) {
    var utteranceIndex = gUtteranceDataLookup[timeId];

    var utteranceDiv = $('#utteranceDiv');
    var utteranceTable = $('#utteranceTable');

    repopulateUtteranceTable(utteranceIndex);

    var elementId = utteranceTable.find('#timeid' + timeId);
    var scrollDestination = elementId.offset().top - utteranceDiv.offset().top;
    utteranceDiv.animate({scrollTop: scrollDestination}, '1000', 'swing', function() {
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
    var paoStr = utteranceObject[1] == "PAO" ? "pao" : "";
    html = html.replace(/@pao/g, paoStr);

    //console.log(utteranceObject[0] + " - " + utteranceObject[1] + " - " + utteranceObject[2]);
    return html;
}

//------------------------------------------------- photo display and gallery -------------------------------------------------

function populatePhotoGallery() {
    var photoGalleryDiv = $('#photoGallery');
    photoGalleryDiv.html('');

    var listView = new infinity.ListView(photoGalleryDiv, {  //Inititalize infinity
        lazy: function() {                     //With the lazy load callback
            //console.log("lazy load attempt");
            $(this).find('.galleryImage').each(function() {
                var $ref = $(this);
                $ref.attr('src', $ref.attr('data-original')); //Set the img source from a string hard coded into the data-original attribute.
            });
        },
        useElementScroll: true
    });
    //for (var i = 0; i < 500; i++) {
    for (var i = 0; i < gPhotoIndex.length; i++) {
        var photoObject = gPhotoList[i];
        var html = $('#photoGalleryTemplate').html();
        html = html.replace(/@filename/g , photoObject[1]);
        html = html.replace(/@timestamp/g , photoObject[2]);
        var timeid = "timeid" + photoObject[0].split(":").join("");
        html = html.replace(/@timeid/g , timeid);

        listView.append(html);
    }
    photoGalleryDiv.data('listView', listView);
    gApplicationReady += 1;
    console.log("APPREADY: populatePhotoGallery(): " + gApplicationReady);
}

function showCurrentPhoto(timeId) {
    //console.log('showCurrentPhoto():' + timeId);
    //var closestTime = closest(timeStr, gPhotoIndex);

    //find closest photo and display it if it has changed
    var currentClosestTime = parseInt(gPhotoIndex[0]);
    var timeIDInt = parseInt(timeId);
    for (var i = 0; i < gPhotoIndex.length; i++) {
        if (gPhotoIndex[i] > timeIDInt) {
            var photoIndexNum = i - 1;
            currentClosestTime = gPhotoIndex[i - 1];
            break;
        }
    }
    if (currentClosestTime != gCurrentPhotoTimestamp) {
        gCurrentPhotoTimestamp = currentClosestTime;
        loadPhotoHtml(photoIndexNum);

        //find gallery element
        var photoGalleryImageTimeId = "#gallerytimeid" + gPhotoList[photoIndexNum][0].split(":").join("");
        //search the listview for the "top" of the current photo
        var photoGalleryDiv = $('#photoGallery');
        var listView = photoGalleryDiv.data('listView');
        var foundItem = null;
        for (var pageCounter = 0; pageCounter <= listView.pages.length; pageCounter++) {
            for (var itemCounter = 0; itemCounter < listView.pages[pageCounter].items.length; itemCounter++) {
                if (photoGalleryImageTimeId == listView.pages[pageCounter].items[itemCounter].$el.attr('id')) {
                    foundItem = listView.pages[pageCounter].items[itemCounter];
                    //console.log("findUtteranceTop():found:" + foundItemTop);
                    break;
                }
            }
            if (foundItem != null)
                break;
        }
        //scroll to that element //TODO figure out why I can't change CSS attributes of listItems (they blink out of existence on lazyload)
        if (foundItem != null) {
            var scrollDest = foundItem.top;
            //$("#photoGallery").scrollTop(scrollDest);
            photoGalleryDiv.animate({scrollTop: scrollDest}, '500', 'swing', function() {
                //console.log('Finished animating gallery: ' + scrollDest);
            });
        }
    }
}

function loadPhotoHtml(photoIndex) {
    console.log('loadPhotoHtml():' + photoIndex);
    var photoDiv = $("#photodiv");
    var photoObject = gPhotoList[photoIndex];
    var html = $('#photoTemplate').html();

    var photoTypePath = (photoObject[3] != "") ? "flight" : "supporting";
    html = html.replace(/@photoTypePath/g , photoTypePath);
    //display prerendered 1024 height photos if photo div height smaller than 1024
    if (photoDiv.height() <= 1024) {
        var sizePath = "1024/";
    } else {
        sizePath = ""
    }
    html = html.replace(/@sizepath/g , sizePath);
    html = html.replace(/@filename/g , photoObject[1]);
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
    var image = $('#imageContainerImage');

    var maxWidth = photodiv.width(); // Max width for the image
    var maxHeight = photodiv.height();    // Max height for the image
    var ratio = 0;  // Used for aspect ratio

    var width = image.get(0).naturalWidth; // Full image width
    var height =image.get(0).naturalHeight; // Full image height

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
            var elementId = "timeid" + timeStrToTimeId(paramMissionTime);
            seekToTime(elementId);
        } else {
            console.log("Invalid t Parameter");
            seekToTime("timeid-000100"); //jump to 1 minute to launch
        }
    }
    clearInterval(gApplicationReadyIntervalID);
    gApplicationReadyIntervalID = null;
    gIntervalID = autoScrollPoller();
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

function setIntroTimeUpdatePoller() {
    return window.setInterval(function () {
        //console.log("setIntroTimeUpdatePoller()");
        displayHistoricalTimeDifferenceByTimeId(getNearestHistoricalMissionTimeId());
    }, 1000);
}

function historicalButtonClick() {
    window.clearInterval(gIntroInterval);
    seekToTime("timeid" + getNearestHistoricalMissionTimeId());
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
    //scaleMissionImage();
    //populatePhotoGallery();
    //redrawAll();
});

//on window resize
$(window).resize(function(){ //scale image proportionally to image viewport on load
    console.log('***window resize');
    $('#myCanvas').css("height", $('.outer-north').height());  // fix height for broken firefox div height
    setTimeout(function(){
            populatePhotoGallery(); }
        ,1000);
    scaleMissionImage();
    redrawAll();
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