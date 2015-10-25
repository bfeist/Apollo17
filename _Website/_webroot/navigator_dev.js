//everything in here simulates the nav sitting in the real app.
var gApplicationReady = 0;
var gTOCAll = [];
var gTOCIndex = [];
var gUtteranceIndex = [];
var gUtteranceData = [];
var gUtteranceDataLookup = [];
var gPhotoList = [];
var gPhotoIndex = [];
var gLastTimeIdChecked;

var gCurrMissionTime = "141:27:05";

$.when(ajaxGetTOCAll(),
    ajaxGetPhotoIndex(),
    ajaxGetUtteranceIndex(),
    ajaxGetUtteranceData()).done(function(){
        // the code here will be executed when all ajax requests resolve
        initNavigator();
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
function ajaxGetUtteranceIndex() {
    // NOTE:  This function must return the value
    //        from calling the $.ajax() method.
    return $.ajax({
        type: "GET",
        url: "./indexes/utteranceIndex.csv?stopcache=" + Math.random(),
        dataType: "text",
        success: function(data) {processUtteranceIndexData(data);}
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
function processUtteranceIndexData(allText) {
    console.log("processUtteranceIndexData");
    gUtteranceIndex = allText.split(/\r\n|\n/);
}
function processUtteranceData(allText) {
    console.log("processUtteranceData");
    var allTextLines = allText.split(/\r\n|\n/);
    for (var i = 0; i < allTextLines.length; i++) {
        var data = allTextLines[i].split('|');
        if (data[0] != "") {
            gUtteranceData.push(data);
            gUtteranceDataLookup[data[0].split(":").join("")] = i;
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

    displayUtteranceRegion(totalSeconds, true);
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

function displayUtteranceRegion(seconds, reset) {
    reset = typeof reset !== 'undefined' ? reset : false;

    var timecode = findClosestUtterance(Math.round(seconds)).substr(6);
    //var timecode = secondsToTimeStr(seconds).split(":").join("");
    var utteranceIndex = gUtteranceDataLookup[timecode];

    var utteranceDiv = $('#utteranceDiv');
    var utteranceTable = $('#utteranceTable');

    if (utteranceTable.html() == '' || reset == true) {
        console.log('resetting utterance html');
        repopulateUtteranceTable(utteranceIndex);
    } else {
        repopulateUtteranceTable(utteranceIndex);

        //var timeIdMarker = utteranceTable.find('#' + "timeid" + timecode);
        //var nextTimeIdMarker = gUtteranceData[utteranceIndex + 1];
        //var timeIdMarkerParent = timeIdMarker.parent().closest('div');
        //var scrollDestination = timeIdMarker.offset().top - timeIdMarker.parent().closest('div').offset().top - 50;
        //utteranceDiv.animate({scrollTop: scrollDestination}, '500', 'swing', function() {
        //    $('#utteranceDiv').scrollTop(scrollDestination);
        //    console.log('Finished animating: ' + scrollDestination);
        //    repopulateUtteranceTable(utteranceIndex);
        //});
    }

    //utteranceDiv.scrollTo("#timeid" + timecode);
}

function repopulateUtteranceTable(utteranceIndex) {
    var utteranceTable = $('#utteranceTable');
    utteranceTable.html('');
    for (var i = -2; i <= 30; i++) {
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