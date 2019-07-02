//--------------- async page initialization calls ---------------

$.when(
    ajaxGetVideoURLData(),
    ajaxGetTOCData(),
    ajaxGetUtteranceData(),
    ajaxGetCommentaryData(),
    ajaxGetPhotoData(),
    ajaxGetMissionStagesData(),
    ajaxGetVideoSegmentData(),
    ajaxGetTelemetryData(),
    ajaxCrewStatusData(),
    ajaxOrbitData(),
    ajaxGeoData(),
    ajaxGeoCompendiumData(),
    ajaxPaperData()).done(function(){
        // the code here will be executed when all ajax requests resolve.
        gApplicationReady += 1;
        trace("APPREADY: Ajax loaded: " + gApplicationReady);

        createSearchData();

        setTimeout(function(){
                populatePhotoGallery();
            },500);
    });

//--------------- index file handling --------------------

function ajaxGetVideoURLData() {
    if (gCdnEnabled && window.location.href.indexOf(".dev") == -1) {
        var urlStr = "https://cdn.apollo17.org";
    } else {
        urlStr = "./";
    }
    urlStr += "indexes/videoURLData.csv";
    urlStr += gStopCache == true ? "?stopcache=" + Math.random() : "";
    return $.ajax({
        type: "GET",
        url: urlStr,
        dataType: "text",
        success: function(data) {processVideoURLData(data);}
    });
}
function ajaxGetTOCData() {
    if (gCdnEnabled && window.location.href.indexOf(".dev") == -1) {
        var urlStr = "https://cdn.apollo17.org";
    } else {
        urlStr = "./";
    }
    urlStr += "indexes/TOCData.csv";
    urlStr += gStopCache == true ? "?stopcache=" + Math.random() : "";
    return $.ajax({
        type: "GET",
        url: urlStr,
        dataType: "text",
        success: function(data) {processTOCData(data);}
    });
}
function ajaxGetUtteranceData() {
    if (gCdnEnabled && window.location.href.indexOf(".dev") == -1) {
        var urlStr = "https://cdn.apollo17.org";
    } else {
        urlStr = "./";
    }
    urlStr += "indexes/utteranceData.csv";
    urlStr += gStopCache == true ? "?stopcache=" + Math.random() : "";
    return $.ajax({
        type: "GET",
        url: urlStr,
        dataType: "text",
        success: function(data) {processUtteranceData(data);}
    });
}
function ajaxGetCommentaryData() {
    if (gCdnEnabled && window.location.href.indexOf(".dev") == -1) {
        var urlStr = "https://cdn.apollo17.org";
    } else {
        urlStr = "./";
    }
    urlStr += "indexes/commentaryData.csv";
    urlStr += gStopCache == true ? "?stopcache=" + Math.random() : "";
    return $.ajax({
        type: "GET",
        url: urlStr,
        dataType: "text",
        success: function(data) {processCommentaryData(data);}
    });
}
function ajaxGetPhotoData() {
    if (gCdnEnabled && window.location.href.indexOf(".dev") == -1) {
        var urlStr = "https://cdn.apollo17.org";
    } else {
        urlStr = "./";
    }
    urlStr += "indexes/photoData.csv";
    urlStr += gStopCache == true ? "?stopcache=" + Math.random() : "";
    return $.ajax({
        type: "GET",
        url: urlStr,
        dataType: "text",
        success: function(data) {processPhotoData(data);}
    });
}
function ajaxGetMissionStagesData() {
    if (gCdnEnabled && window.location.href.indexOf(".dev") == -1) {
        var urlStr = "https://cdn.apollo17.org";
    } else {
        urlStr = "./";
    }
    urlStr += "indexes/missionStagesData.csv";
    urlStr += gStopCache == true ? "?stopcache=" + Math.random() : "";
    return $.ajax({
        type: "GET",
        url: urlStr,
        dataType: "text",
        success: function(data) {processMissionStagesData(data);}
    });
}
function ajaxGetVideoSegmentData() {
    if (gCdnEnabled && window.location.href.indexOf(".dev") == -1) {
        var urlStr = "https://cdn.apollo17.org";
    } else {
        urlStr = "./";
    }
    urlStr += "indexes/videoSegmentData.csv";
    urlStr += gStopCache == true ? "?stopcache=" + Math.random() : "";
    return $.ajax({
        type: "GET",
        url: urlStr,
        dataType: "text",
        success: function(data) {processVideoSegmentData(data);}
    });
}
function ajaxGetTelemetryData() {
    if (gCdnEnabled && window.location.href.indexOf(".dev") == -1) {
        var urlStr = "https://cdn.apollo17.org";
    } else {
        urlStr = "./";
    }
    urlStr += "indexes/telemetryData.csv";
    urlStr += gStopCache == true ? "?stopcache=" + Math.random() : "";
    return $.ajax({
        type: "GET",
        url: urlStr,
        dataType: "text",
        success: function(data) {processTelemetryData(data);}
    });
}
function ajaxCrewStatusData() {
    if (gCdnEnabled && window.location.href.indexOf(".dev") == -1) {
        var urlStr = "https://cdn.apollo17.org";
    } else {
        urlStr = "./";
    }
    urlStr += "indexes/crewStatusData.csv";
    urlStr += gStopCache == true ? "?stopcache=" + Math.random() : "";
    return $.ajax({
        type: "GET",
        url: urlStr,
        dataType: "text",
        success: function(data) {processCrewStatusData(data);}
    });
}

function ajaxOrbitData() {
    if (gCdnEnabled && window.location.href.indexOf(".dev") == -1) {
        var urlStr = "https://cdn.apollo17.org";
    } else {
        urlStr = "./";
    }
    urlStr += "indexes/orbitData.csv";
    urlStr += gStopCache == true ? "?stopcache=" + Math.random() : "";
    return $.ajax({
        type: "GET",
        url: urlStr,
        dataType: "text",
        success: function(data) {processOrbitData(data);}
    });
}

function ajaxGeoData() {
    if (gCdnEnabled && window.location.href.indexOf(".dev") == -1) {
        var urlStr = "https://cdn.apollo17.org";
    } else {
        urlStr = "./";
    }
    urlStr += "indexes/geoData.csv";
    urlStr += gStopCache == true ? "?stopcache=" + Math.random() : "";
    return $.ajax({
        type: "GET",
        url: urlStr,
        dataType: "text",
        success: function(data) {processGeoData(data);}
    });
}

function ajaxGeoCompendiumData() {
    if (gCdnEnabled && window.location.href.indexOf(".dev") == -1) {
        var urlStr = "https://cdn.apollo17.org";
    } else {
        urlStr = "./";
    }
    urlStr += "indexes/geoCompendiumData.csv";
    urlStr += gStopCache == true ? "?stopcache=" + Math.random() : "";
    return $.ajax({
        type: "GET",
        url: urlStr,
        dataType: "text",
        success: function(data) {processGeoCompendiumData(data);}
    });
}

function ajaxPaperData() {
    if (gCdnEnabled && window.location.href.indexOf(".dev") == -1) {
        var urlStr = "https://cdn.apollo17.org";
    } else {
        urlStr = "./";
    }
    urlStr += "indexes/paperData.csv";
    urlStr += gStopCache == true ? "?stopcache=" + Math.random() : "";
    return $.ajax({
        type: "GET",
        url: urlStr,
        dataType: "text",
        success: function(data) {processPaperData(data);}
    });
}


function processVideoURLData(allText) {
    //console.log("processVideoURLData");
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
function processTOCData(allText) {
    //console.log("processTOCIndexData");
    var allTextLines = allText.split(/\r\n|\n/);
    var curRow = 0;
    for (var i = 0; i < allTextLines.length; i++) {
        var data = allTextLines[i].split('|');
        if (data[0] != "") {
            gTOCIndex[i] = data[0];
            gTOCDataLookup[data[0]] = curRow;
            data[0] = timeIdToTimeStr(data[0]);
            gTOCData.push(data);
            curRow++;
        }
    }
}
function processUtteranceData(allText) {
    //console.log("processUtteranceData");
    var allTextLines = allText.split(/\r\n|\n/);
    var curRow = 0;
    for (var i = 0; i < allTextLines.length; i++) {
        var data = allTextLines[i].split('|');
        if (data[0] != "") {
            gUtteranceDataLookup[data[0]] = curRow;
            gUtteranceIndex[i] = data[0];
            gUtteranceData.push(data);
            curRow ++;
        }
    }
}
function processCommentaryData(allText) {
    //console.log("processCommentaryIndexData");
    var allTextLines = allText.split(/\r\n|\n/);
    var curRow = 0;
    for (var i = 0; i < allTextLines.length; i++) {
        var data = allTextLines[i].split('|');
        if (data[0] != "") {
            gCommentaryIndex[curRow] = data[0];
            gCommentaryDataLookup[data[0]] = curRow;
            gCommentaryData.push(data);
            curRow ++;
        }
    }
}
function processPhotoData(allText) {
    //console.log("processPhotoData");
    var allTextLines = allText.split(/\r\n|\n/);
    var curRow = 0;
    for (var i = 0; i < allTextLines.length; i++) {
        if (allTextLines[i] != "") {
            var data = allTextLines[i].split('|');
            gPhotoData.push(data);
            gPhotoDataLookup[data[0]] = curRow;
            gPhotoIndex[i] = data[0];
            curRow++;
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
            gMissionStages[i - 1][3] = data[0]; //append this item's start time as the last item's end time
        }
    }
    gMissionStages[gMissionStages.length - 1][3] = secondsToTimeStr(gMissionDurationSeconds); //insert last end time as end of mission
}
function processVideoSegmentData(allText) {
    //console.log("processVideoSegmentData");
    var allTextLines = allText.split(/\r\n|\n/);
    for (var i = 0; i < allTextLines.length; i++) {
        var data = allTextLines[i].split('|');
        if (data[0] != "") {
            gVideoSegments.push(data);
        }
    }
}

function createSearchData() {
    //gSearchData = gUtteranceData.concat(gCommentaryData);

    /*
    array info:
    0 - timeId
    1 - [unused]
    2 - who
    3 - words
    4 - item type 0=utterance, 1=commentary, 2=geosample, 3=photo
     */
    for (var counter = 0; counter < gUtteranceData.length; counter++) {
        var tmpItem = [];
        tmpItem[0] = gUtteranceData[counter][0];
        tmpItem[1] = "";
        tmpItem[2] = gUtteranceData[counter][1];
        tmpItem[3] = gUtteranceData[counter][2];
        tmpItem[4] = 0;
        gSearchData.push(tmpItem);
    }
    for (counter = 0; counter < gCommentaryData.length; counter++) {
        tmpItem = gCommentaryData[counter];
        tmpItem[4] = 1;
        gSearchData.push(tmpItem);
    }
    for (counter = 0; counter < gGeoData.length; counter++) {
        tmpItem = [];
        tmpItem[0] = gGeoData[counter][0];
        tmpItem[1] = "";
        tmpItem[2] = "";

        tmpItem[3] = "Geology sample description: " + gGeoData[counter][1] + "; Sample bag: " + gGeoData[counter][2] + "; Sample Numbers: " + gGeoData[counter][5].replace(/`/g, ", ");
        tmpItem[4] = 2;
        gSearchData.push(tmpItem);
    }
    for (counter = 0; counter < gPhotoData.length; counter++) {
        var photoObject = gPhotoData[counter];
        var photoTimeId = photoObject[0];
        var filename = photoObject[1];
        var magCode = photoObject[2];
        var photographer = photoObject[3];
        var description = photoObject[4];

        tmpItem = [];
        tmpItem[0] = photoTimeId;
        tmpItem[1] = "";
        tmpItem[2] = "";
        tmpItem[3] = "Photo: " + filename + "; Mag: " + magCode + "; Photographer: " + photographer + "; Description: " + description;
        tmpItem[4] = 3; //type 3 is photo
        gSearchData.push(tmpItem);
    }

    gSearchData.sort(searchArraySortFunction);

    trace("whatever");
}

function searchArraySortFunction(a, b) {
    if (a[0] === b[0]) {
        return 0;
    }
    else {
        return (a[0] < b[0]) ? -1 : 1;
    }
}

function processTelemetryData(allText) {
    //console.log("processTelemetryData()");
    var allTextLines = allText.split(/\r\n|\n/);
    for (var i = 0; i < allTextLines.length; i++) {
        var data = allTextLines[i].split('|');
        if (data[0] != "") {
            gTelemetryData.push(data);
        }
        if (i > 0) {
            gTelemetryData[i - 1][5] = data[0]; //append this item's start time as the last item's end time
        }
    }
    gTelemetryData[gTelemetryData.length - 1][5] = secondsToTimeStr(gMissionDurationSeconds); //insert last end time as end of mission
}

function processCrewStatusData(allText) {
    //console.log("processCrewStatusData()");
    var allTextLines = allText.split(/\r\n|\n/);
    for (var i = 0; i < allTextLines.length; i++) {
        var data = allTextLines[i].split('|');
        if (data[0] != "") {
            gCrewStatusData.push(data);
        }
        if (i > 0) {
            gCrewStatusData[i - 1][2] = data[0]; //append this item's start time as the last item's end time
        }
    }
    gCrewStatusData[gCrewStatusData.length - 1][2] = secondsToTimeStr(gMissionDurationSeconds); //insert last end time as end of mission
}

function processOrbitData(allText) {
    //console.log("processOrbitData()");
    var allTextLines = allText.split(/\r\n|\n/);
    for (var i = 0; i < allTextLines.length; i++) {
        var data = allTextLines[i].split('|');
        if (data[0] != "") {
            gOrbitData.push(data);
        }
        if (i > 0) {
            gOrbitData[i - 1][2] = data[0]; //append this item's start time as the last item's end time
        }
    }
    gOrbitData[gOrbitData.length - 1][2] = gOrbitData[gOrbitData.length - 1][0]; //insert 0 length end time record for TEI
}

function processGeoData(allText) {
    //console.log("processGeoData()");
    var allTextLines = allText.split(/\r\n|\n/);
    for (var i = 0; i < allTextLines.length; i++) {
        var data = allTextLines[i].split('|');
        if (data[0] != "") {
            var tmpItem = [];
            tmpItem[0] = timeStrToTimeId(data[0]);
            tmpItem[1] = data[1];
            tmpItem[2] = data[2];
            tmpItem[3] = data[3];
            tmpItem[4] = data[4];
            tmpItem[5] = data[5];
            gGeoData.push(tmpItem);
        }
    }
}

function processGeoCompendiumData(allText) {
    //console.log("processGeoCompendiumData()");
    var allTextLines = allText.split(/\r\n|\n/);
    for (var i = 0; i < allTextLines.length; i++) {
        var data = allTextLines[i].split('|');
        if (data[0] != "") {
            var tmpItem = [];
            tmpItem[0] = data[0];
            tmpItem[1] = data[1];
            gGeoCompendiumData.push(tmpItem);
        }
    }
}

function processPaperData(allText) {
    //console.log("processPaperData()");
    var allTextLines = allText.split(/\r\n|\n/);
    for (var i = 0; i < allTextLines.length; i++) {
        var data = allTextLines[i].split('|');
        if (data[0] != "Bibcode") {
            var tmpItem = [];
            tmpItem[0] = data[0]; // bibcode
            tmpItem[1] = data[1]; // Year
            tmpItem[2] = data[2]; // Title
            tmpItem[3] = data[3]; // Authors
            tmpItem[4] = data[4]; // Publication
            tmpItem[5] = data[5]; // Volume
            tmpItem[6] = data[6]; // Issue
            tmpItem[7] = data[7]; // Page
            tmpItem[8] = data[8]; // Abstract
            tmpItem[9] = data[9]; // DOI
            tmpItem[10] = data[10]; // Samples
            gPaperData.push(tmpItem);
        }
    }
    console.log("processPaperData(): done")
}