//everything in here simulates the nav sitting in the real app.
var gMissionDurationSeconds = 1100166;
var gApplicationReady = 0;
var gTOCAll = [];
var gTOCIndex = [];
var gUtteranceIndex = [];
var gUtteranceData = [];
var gUtteranceDataLookup = [];
var gPhotoList = [];
var gPhotoIndex = [];
var gMissionStages = [];
var gLastTimeIdChecked;

var gCurrMissionTime = "141:27:05";

$.when(ajaxGetTOCAll(),
    ajaxGetPhotoIndex(),
    ajaxGetMissionStagesData(),
    ajaxGetUtteranceData()).done(function(){
        // the code here will be executed when all ajax requests resolve
        initNavigator();
        incrementFakeMissionTime();
        setAutoScrollPoller();
        repopulateUtteranceTable();
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
        url: "./indexes/TOCall.csv?stopcache=" + Math.random(),
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
        url: "./indexes/photoIndex.csv?stopcache=" + Math.random(),
        dataType: "text",
        success: function(data) {processPhotoIndexData(data);}
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
                displayUtteranceRegion(timeStrToSeconds(gCurrMissionTime));
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

    displayUtteranceRegion(totalSeconds);
    //displayUtteranceRegion(totalSeconds);
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
    return "timeid" + gUtteranceIndex[i - 1];
}

function padZeros(num, size) {
    var s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
}

//------------------------------------------------- utterance chunking code -------------------------------------------------

function displayUtteranceRegion(seconds) {
    var timecode = findClosestUtterance(Math.round(seconds)).substr(6);
    //var timecode = secondsToTimeStr(seconds).split(":").join("");
    var utteranceIndex = gUtteranceDataLookup[timecode];

    //var utteranceDiv = $('#utteranceDiv');
    //var utteranceTable = $('#utteranceTable');
    //
    //var timeIdMarker = utteranceTable.find('#' + "timeid" + timecode);
    //var scrollDestination = timeIdMarker.offset().top - utteranceDiv.offset().top;
    //utteranceDiv.animate({scrollTop: scrollDestination}, '500', 'swing', function() {
    //    console.log('Finished animating: ' + scrollDestination);
    //});
    //prePopulateUtteranceTable(utteranceIndex);
}

function repopulateUtteranceTable() {
    var utteranceTable = $('#utteranceTable');
    //utteranceTable.html('');
    var listView = new infinity.ListView(utteranceTable, {  //Inititalize infinity
        lazy: function() {                      //With the lazy load callback
            //$(this).find('.pic').each(function() {
            //    var $ref = $(this);
            //    $ref.attr('src', $ref.attr('data-original')); //Set the img source from a string hard coded into the data-original attribute.
            //});
            console.log("lazy load attempt");
        }
    });
    //utteranceTable.data('listView', listView); //Use jQeary Data to set our list to the element as a conveniance.

    //$('#utteranceDiv').scrollTop(0);
    for (var i = 0; i <= 1000; i++) {
        if (i == 0) {
            var style = "background-color: #222222";
        } else {
            style = "";
        }
        var html = getUtteranceObjectHTML(i, style);
        listView.append(html);
    }
    var listItems = listView.find('.utterance');
    console.log("listitems: " + listItems.length);
}

function getUtteranceObjectHTML(utteranceIndex, style) {
    var utteranceObject = gUtteranceData[utteranceIndex];
    //var html = '<tr class="utterance" style="@style" onclick="seekToTime(this.id)" id="@timeid">' +
    //    '<td class="afjget afjpao">@timestamp</td>' +
    //    '<td class="afjwho afjpao">@who</td>' +
    //    '<td class="spokenwords afjpao">@words</td>' +
    //    '</tr>';
    var html = '<div class="utterance" style="display: flex; @style" onclick="seekToTime(this.id)" id="@timeid">' +
            '<div class="afjget afjpao" style="width: auto;">@timestamp</div>' +
            '<div class="afjwho afjpao" style="width: auto;">@who</div>' +
            '<div class="spokenwords afjpao" style="flex: 1;">@words</div>' +
            '</div>';
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