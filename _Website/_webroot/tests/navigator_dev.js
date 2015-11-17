//everything in here simulates the nav sitting in the real app.
var gApplicationReady = 0;
var gTOCAll = [];
var gTOCIndex = [];
var gUtteranceIndex = [];
var gUtteranceData = [];
var gUtteranceDataLookup = [];
var gPhotoList = [];
var gPhotoIndex = [];
var gMissionStages = [];
var gVideoSegments = [];
var gLastTimeIdChecked;
var gMissionDurationSeconds = 1100166;
var gCountdownSeconds = 9442;
var gDefaultStartTimeId = '3044003';

var gLastHighlightedTranscriptElement;
var gUtteranceDisplayStartIndex;
var gUtteranceDisplayEndIndex;
var gCurrentHighlightedUtteranceIndex;

var background_color = "#000000";
var background_color_active = "#222222";

var gIntroInterval = null;


$( document ).ready(function() {

    $( "#utteranceDiv" ).scroll($.throttle(function() {
        //console.log("utterance scroll");
    }, 1000));

});


$.when(ajaxGetTOCAll(),
    ajaxGetPhotoIndex(),
    ajaxGetMissionStagesData(),
    ajaxGetUtteranceData(),
    ajaxGetVideoSegmentsData()).done(function(){
        // the code here will be executed when all ajax requests resolve
        initNavigator();

        repopulateUtterances(gDefaultStartTimeId);

        incrementFakeMissionTime();
        setAutoScrollPoller();
    });

function incrementFakeMissionTime() {
    return window.setInterval(function () {
        var tempSeconds = timeStrToSeconds(gCurrMissionTime);
        tempSeconds ++;
        gCurrMissionTime = secondsToTimeStr(tempSeconds);
        //redrawAll();
    }, 1000);
}

function ajaxGetTOCAll() {
    // NOTE:  This function must return the value
    //        from calling the $.ajax() method.
    return $.ajax({
        type: "GET",
        url: "../indexes/TOCData.csv?stopcache=" + Math.random(),
        dataType: "text",
        success: function(data) {
            processTOCAllData(data);
        }
    });
}
function ajaxGetPhotoIndex() {
    // NOTE:  This function must return the value
    //        from calling the $.ajax() method.
    return $.ajax({
        type: "GET",
        url: "../indexes/photoData.csv?stopcache=" + Math.random(),
        dataType: "text",
        success: function(data) {processPhotoIndexData(data);}
    });
}
function ajaxGetUtteranceData() {
    // NOTE:  This function must return the value
    //        from calling the $.ajax() method.
    return $.ajax({
        type: "GET",
        url: "../indexes/utteranceData.csv?stopcache=" + Math.random(),
        dataType: "text",
        success: function(data) {processUtteranceData(data);}
    });
}
function ajaxGetMissionStagesData() {
    // NOTE:  This function must return the value
    //        from calling the $.ajax() method.
    return $.ajax({
        type: "GET",
        url: "../indexes/missionStagesData.csv?stopcache=" + Math.random(),
        dataType: "text",
        success: function(data) {processMissionStagesData(data);}
    });
}
function ajaxGetVideoSegmentsData() {
    return $.ajax({
        type: "GET",
        url: "../indexes/videoSegmentData.csv?stopcache=" + Math.random(),
        dataType: "text",
        success: function(data) {processVideoSegmentsData(data);}
    });
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
function processPhotoIndexData(allText) {
    console.log("processPhotoData");
    var allTextLines = allText.split(/\r\n|\n/);
    for (var i = 0; i < allTextLines.length; i++) {
        if (allTextLines[i] != "") {
            var data = allTextLines[i].split('|');
            gPhotoList.push(data);
            gPhotoIndex[i] = data[0];
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
function processVideoSegmentsData(allText) {
    //console.log("processVideoSegmentData");
    var allTextLines = allText.split(/\r\n|\n/);
    for (var i = 0; i < allTextLines.length; i++) {
        var data = allTextLines[i].split('|');
        if (data[0] != "") {
            gVideoSegments.push(data);
        }
    }
}


function setAutoScrollPoller() {
    return window.setInterval(function () {
        if (gCurrMissionTime != gLastTimeIdChecked) {
            gLastTimeIdChecked = gCurrMissionTime;
            //scroll nav cursor
            if (!gMouseOnNavigator) {
                drawTier1NavBox(timeStrToSeconds(gCurrMissionTime));
                drawTier2NavBox(timeStrToSeconds(gCurrMissionTime));
                drawTier3();
            }
            drawCursor(timeStrToSeconds(gCurrMissionTime));
            paper.view.draw();
            //console.log (gCurrMissionTime.split(':').join('') + " | " + gUtteranceDataLookup[gCurrMissionTime.split(':').join('')] + " | " + (typeof gUtteranceDataLookup[gCurrMissionTime.split(':').join('')] !== 'undefined'));
            if (typeof gUtteranceDataLookup[gCurrMissionTime.split(':').join('')] !== 'undefined') {
                scrollTranscriptToTimeId(timeStrToTimeId(gCurrMissionTime));
            }
        }
    }, 500); //polling frequency in milliseconds
}

function seekToTime(elementId) {
    var gaTimeVal = parseInt(elementId.replace("timeid", ""));
    var timeStr = elementId.substr(6,7);
    var sign = timeStr.substr(0,1);
    var hours = parseInt(timeStr.substr(0,3));
    var minutes = parseInt(timeStr.substr(3,2));
    var seconds = parseInt(timeStr.substr(5,2));
    var signToggle = (sign == "-") ? -1 : 1;
    var totalSeconds = signToggle * ((Math.abs(hours) * 60 * 60) + (minutes * 60) + seconds);
    gCurrMissionTime = secondsToTimeStr(totalSeconds);

    scrollTranscriptToTimeId(findClosestUtterance(totalSeconds));
}

function findClosestUtterance(secondsSearch) {
    //console.log("findClosestUtterance: finding closest utterance to (seconds): " + secondsSearch);
    var found = false;
//            if (gCurrVideoStartSeconds == 230400) {
//                if (secondsSearch > 230400 + 3600) { //if at 065:00:00 or greater, add 000:02:40 to time
//                    secondsSearch = secondsSearch + 9600;
//                }
//            }
    for (var i = 0; i < gUtteranceIndex.length; ++i) {
        var hours = Math.abs(parseInt(secondsSearch / 3600));
        var minutes = Math.abs(parseInt(secondsSearch / 60)) % 60;
        var seconds = Math.abs(parseInt(secondsSearch)) % 60;
        seconds = Math.floor(seconds);

        var timeId = "timeid" + padZeros(hours,3) + padZeros(minutes,2) + padZeros(seconds,2)
        if (secondsSearch < 0) {
            timeId = timeId.substr(0,6) + "-" + timeId.substr(7); //change timeid to negative, replacing leading zero in hours with "-"
        }
        if (parseInt(timeId.substr(6)) < parseInt(gUtteranceIndex[i])) {
            //console.log("searched utterance array, found closest: " + gUtteranceIndex[i - 1] + " after " + i + " searches");
            break;
        }
    }
    //var timeStr = gUtteranceIndex[i - 1].substr(0,3) + ":" +  gUtteranceIndex[i - 1].substr(3,2) + ":" + gUtteranceIndex[i - 1].substr(5,2);
    //return timeStrToSeconds(timeStr);
    scrollTranscriptToTimeId( gUtteranceIndex[i - 1]);
    //repopulateUtterances(gUtteranceIndex[i - 1]);
    return timeId.substr(6);
}

function padZeros(num, size) {
    var s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
}

//------------------------------------------------- utterance chunking code -------------------------------------------------

function scrollTranscriptToTimeId(timeId) { //must be an existing timeId
    // console.log("scrollTranscriptToTimeId " + timeId);
    var utteranceDiv = $('#utteranceDiv');
    var utteranceTable = $('#utteranceTable');

    gCurrentHighlightedUtteranceIndex = gUtteranceDataLookup[timeId];

    var moreLoaded = false;
    //check if timeId is already loaded into utterance div
    if (gUtteranceDataLookup[timeId] < gUtteranceDisplayStartIndex + 49) { //prepend
        if  (gUtteranceDataLookup[timeId] < gUtteranceDisplayStartIndex) {
            var prependCount = (gUtteranceDisplayStartIndex - gUtteranceDataLookup[timeId]) + 50;
        } else {
            prependCount = 50;
        }
        if (prependCount > 200) {
            repopulateUtterances(timeId);
        } else {
            prependUtterances(prependCount);
            moreLoaded = true;
        }
    } else if (gUtteranceDataLookup[timeId] > gUtteranceDisplayEndIndex - 49) { //append
        if  (gUtteranceDataLookup[timeId] > gUtteranceDisplayEndIndex) {
            var appendCount = (gUtteranceDataLookup[timeId] - gUtteranceDisplayEndIndex) + 50;
        } else {
            appendCount = 50;
        }
        if (appendCount > 200) {
            repopulateUtterances(timeId);
        } else {
            appendUtterances(appendCount);
            moreLoaded = true;
        }
    }

    //if ($("#tabs-left").tabs('option', 'active') != 0) {
    //    $("#transcriptTab").effect("highlight", {color: '#006400'}, 1000); //blink the transcript tab
    //}

    var highlightedTranscriptElement = utteranceTable.find('#timeid' + timeId);
    if (typeof gLastHighlightedTranscriptElement != 'undefined') {
        gLastHighlightedTranscriptElement.css("background-color", "");
        var oldScrollDestination = utteranceDiv.scrollTop() + gLastHighlightedTranscriptElement.offset().top - utteranceDiv.offset().top;
        utteranceDiv.scrollTop(oldScrollDestination);
    }
    highlightedTranscriptElement.css("background-color", background_color_active);
    if (moreLoaded) { //jump the window to the old scroll dest just prior to animating because more HTML was just appended/prepended

    }
    var newScrollDestination = utteranceDiv.scrollTop() + highlightedTranscriptElement.offset().top - utteranceDiv.offset().top;
    utteranceDiv.animate({scrollTop: newScrollDestination}, '1000', 'swing', function () {
        //console.log('Finished animating: ' + scrollDestination);
        trimUtterances();
    });
    gLastHighlightedTranscriptElement = highlightedTranscriptElement;
}

function repopulateUtterances(timeId) {
    var utteranceIndex = gUtteranceDataLookup[timeId];
    var utteranceTable = $('#utteranceTable');
    utteranceTable.html('');
    var startIndex = utteranceIndex - 50;
    var endIndex = startIndex + 200;
    startIndex = startIndex < 0 ? 0 : startIndex;
    endIndex = endIndex > gUtteranceIndex.length - 1 ? gUtteranceIndex.length - 1 : endIndex;
    for (var i = startIndex; i <= endIndex; i++) {
        utteranceTable.append(getUtteranceObjectHTML(i));
    }
    gUtteranceDisplayStartIndex = startIndex;
    gUtteranceDisplayEndIndex = endIndex;
    $('#utteranceDiv').scrollTop('#timeid' + timeId);
}

function prependUtterances(count) {
    console.log("prependUtterances:" + count);
    var utteranceDiv = $('#utteranceDiv');
    var utteranceTable = $('#utteranceTable');
    var htmlToPrepend = "";
    var prependedCount = 0;
    var startIndex = gUtteranceDisplayStartIndex - count;
    for (var i = startIndex; i < startIndex + count - 1; i++) {
        if (i >= 0) {
            htmlToPrepend = htmlToPrepend + (getUtteranceObjectHTML(i, ""));
            prependedCount ++;
        }
    }
    utteranceTable.prepend(htmlToPrepend);
    gUtteranceDisplayStartIndex = gUtteranceDisplayStartIndex - prependedCount;
}

function appendUtterances(count) {
    console.log("appendUtterances:" + count);
    var utteranceDiv = $('#utteranceDiv');
    var utteranceTable = $('#utteranceTable');
    var htmlToAppend = "";
    var startIndex = gUtteranceDisplayEndIndex;
    var appendedCount = 0;
    for (var i = startIndex; i < startIndex + count; i++) {
        if (i >= 0 && i < gUtteranceData.length) {
            htmlToAppend = htmlToAppend + (getUtteranceObjectHTML(i, ""));
            appendedCount ++;
        }
    }
    utteranceTable.append(htmlToAppend);
    gUtteranceDisplayEndIndex = gUtteranceDisplayEndIndex + appendedCount;
}

function trimUtterances() {
    var numberToRemove = (gUtteranceDisplayEndIndex - gUtteranceDisplayStartIndex) - 200;
    if (numberToRemove > 0) {
        var currDistFromStart = gCurrentHighlightedUtteranceIndex - gUtteranceDisplayStartIndex;
        var currDistFromEnd = gUtteranceDisplayEndIndex - gCurrentHighlightedUtteranceIndex;
        if (currDistFromStart > currDistFromEnd) { //trim items from top of utterance div
            for (var i = gUtteranceDisplayStartIndex; i < gUtteranceDisplayStartIndex + numberToRemove; i++) {
                //console.log("trimming: " + '#timeid' + gUtteranceIndex[i]);
                $('#timeid' + gUtteranceIndex[i]).remove();
            }
            gUtteranceDisplayStartIndex = gUtteranceDisplayStartIndex + numberToRemove
        } else { //trim items from bottom of utterance div
            for (i = gUtteranceDisplayEndIndex - numberToRemove; i < gUtteranceDisplayEndIndex; i++) {
                //$('#timeid' + gUtteranceIndex[i]).remove();
                //$('#utteranceTable').remove('#timeid' + gUtteranceIndex[i]);
            }
            gUtteranceDisplayEndIndex = gUtteranceDisplayEndIndex - numberToRemove;
        }
        var utteranceDiv = $('#utteranceDiv');
        var currElement = $('#timeid' + timeStrToTimeId(gUtteranceData[gCurrentHighlightedUtteranceIndex][0]));
        var newScrollDestination = utteranceDiv.scrollTop() + currElement.offset().top - utteranceDiv.offset().top;
        utteranceDiv.scrollTop(newScrollDestination);
    }
}

function getUtteranceObjectHTML(utteranceIndex, style) {
    style = style || '';
    //console.log("getUtteranceObjectHTML():" + utteranceIndex);
    var utteranceObject = gUtteranceData[utteranceIndex];
    var html = $('#utteranceTemplate').html();
    html = html.replace("@style", style);
    var elementId = "timeid" + timeStrToTimeId(utteranceObject[0]);
    html = html.replace(/@timeid/g, elementId);
    html = html.replace("@timestamp", utteranceObject[0]);
    html = html.replace("@who", utteranceObject[1]);
    html = html.replace("@words", utteranceObject[2]);
    var paoStr = utteranceObject[1] == "PAO" ? "pao" : "";
    html = html.replace(/@pao/g, paoStr);

    //console.log(utteranceObject[0] + " - " + utteranceObject[1] + " - " + utteranceObject[2]);
    return html;
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