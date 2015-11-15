//--------------- async page initialization calls ---------------

$.when(ajaxGetMediaIndex(),
    ajaxGetTOCAll(),
    ajaxGetCommentaryIndex(),
    ajaxGetUtteranceData(),
    ajaxGetPhotoIndex(),
    ajaxGetMissionStagesData(),
    ajaxGetVideoSegmentsData()).done(function(){
        // the code here will be executed when all ajax requests resolve and the video.js player has been initialized.
        gApplicationReady += 1;
        console.log("APPREADY: Ajax loaded: " + gApplicationReady);

        setTimeout(function(){
            populatePhotoGallery(); }
        ,1000);
    });

//--------------- index file handling --------------------

function ajaxGetMediaIndex() {
    if (gCdnEnabled && window.location.href.indexOf(".dev") == -1) {
        var cdnNum = getRandomInt(1, 5);
        var urlStr = "http://cdn" + cdnNum + ".apollo17.org/develop";
    } else {
        urlStr = ".";
    }
    urlStr += "/indexes/media_index.csv";
    urlStr += gStopCache == true ? "?stopcache=" + Math.random() : "";
    return $.ajax({
        type: "GET",
        url: urlStr,
        dataType: "text",
        success: function(data) {processMediaIndexData(data);}
    });
}
function ajaxGetTOCAll() {
    if (gCdnEnabled && window.location.href.indexOf(".dev") == -1) {
        var cdnNum = getRandomInt(1, 5);
        var urlStr = "http://cdn" + cdnNum + ".apollo17.org/develop";
    } else {
        urlStr = ".";
    }
    urlStr += "/indexes/TOCall.csv";
    urlStr += gStopCache == true ? "?stopcache=" + Math.random() : "";
    return $.ajax({
        type: "GET",
        url: urlStr,
        dataType: "text",
        success: function(data) {processTOCAllData(data);}
    });
}
function ajaxGetUtteranceData() {
    if (gCdnEnabled && window.location.href.indexOf(".dev") == -1) {
        var cdnNum = getRandomInt(1, 5);
        var urlStr = "http://cdn" + cdnNum + ".apollo17.org/develop";
    } else {
        urlStr = ".";
    }
    urlStr += "/indexes/utteranceData.csv";
    urlStr += gStopCache == true ? "?stopcache=" + Math.random() : "";
    return $.ajax({
        type: "GET",
        url: urlStr,
        dataType: "text",
        success: function(data) {processUtteranceData(data);}
    });
}
function ajaxGetCommentaryIndex() {
    if (gCdnEnabled && window.location.href.indexOf(".dev") == -1) {
        var cdnNum = getRandomInt(1, 5);
        var urlStr = "http://cdn" + cdnNum + ".apollo17.org/develop";
    } else {
        urlStr = ".";
    }
    urlStr += "/indexes/commentaryIndex.csv";
    urlStr += gStopCache == true ? "?stopcache=" + Math.random() : "";
    return $.ajax({
        type: "GET",
        url: urlStr,
        dataType: "text",
        success: function(data) {processCommentaryIndexData(data);}
    });
}
function ajaxGetPhotoIndex() {
    if (gCdnEnabled && window.location.href.indexOf(".dev") == -1) {
        var cdnNum = getRandomInt(1, 5);
        var urlStr = "http://cdn" + cdnNum + ".apollo17.org/develop";
    } else {
        urlStr = ".";
    }
    urlStr += "/indexes/photoIndex.csv";
    urlStr += gStopCache == true ? "?stopcache=" + Math.random() : "";
    return $.ajax({
        type: "GET",
        url: urlStr,
        dataType: "text",
        success: function(data) {processPhotoIndexData(data);}
    });
}
function ajaxGetMissionStagesData() {
    if (gCdnEnabled && window.location.href.indexOf(".dev") == -1) {
        var cdnNum = getRandomInt(1, 5);
        var urlStr = "http://cdn" + cdnNum + ".apollo17.org/develop";
    } else {
        urlStr = ".";
    }
    urlStr += "/indexes/missionStages.csv";
    urlStr += gStopCache == true ? "?stopcache=" + Math.random() : "";
    return $.ajax({
        type: "GET",
        url: urlStr,
        dataType: "text",
        success: function(data) {processMissionStagesData(data);}
    });
}
function ajaxGetVideoSegmentsData() {
    if (gCdnEnabled && window.location.href.indexOf(".dev") == -1) {
        var cdnNum = getRandomInt(1, 5);
        var urlStr = "http://cdn" + cdnNum + ".apollo17.org/develop";
    } else {
        urlStr = ".";
    }
    urlStr += "/indexes/video_segments.csv";
    urlStr += gStopCache == true ? "?stopcache=" + Math.random() : "";
    return $.ajax({
        type: "GET",
        url: urlStr,
        dataType: "text",
        success: function(data) {processVideoSegmentsData(data);}
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
            data[0] = timeIdToTimeStr(data[0]);

            var who_modified = data[1];
            who_modified = who_modified.replace(/CDR/g, "Cernan");
            who_modified = who_modified.replace(/CMP/g, "Evans");
            who_modified = who_modified.replace(/LMP/g, "Schmitt");
            who_modified = who_modified.replace(/PAO/g, "Public Affairs");
            who_modified = who_modified.replace(/CC/g, "Mission Control");
            data[1] = who_modified;

            var words_modified = data[2];
            words_modified = words_modified.replace(/O2/g, "O<sub>2</sub>");
            words_modified = words_modified.replace(/H2/g, "H<sub>2</sub>");
            words_modified = words_modified.replace(/Tig /g, "T<sub>ig</sub> ");
            data[2] = words_modified;

            gUtteranceData.push(data);
            gUtteranceDataLookup[timeStrToTimeId(data[0])] = i;
            gUtteranceIndex[i] = timeStrToTimeId(data[0]);
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
function processVideoSegmentsData(allText) {
    //console.log("processVideoSegmentsData");
    var allTextLines = allText.split(/\r\n|\n/);
    for (var i = 0; i < allTextLines.length; i++) {
        var data = allTextLines[i].split('|');
        if (data[0] != "") {
            gVideoSegments.push(data);
        }
    }
}