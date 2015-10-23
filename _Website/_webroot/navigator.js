//var missionDuration = "305:36:00";
//var durationHours = parseInt(missionDuration.substr(0,3));
//var durationMinutes = parseInt(missionDuration.substr(4,2));
//var durationSeconds = parseInt(missionDuration.substr(5,2));
//var missionDurationSeconds = (Math.abs(durationHours) * 60 * 60) + (durationMinutes * 60) + durationSeconds;
// 1100166

var timelineWidth;
var timelineHeight;
var missionDurationSeconds = 1100166;
var TOCall;
var TOCGroup;

paper.install(window);
onload = function() {
    paper.setup('myCanvas');
    // Create a simple drawing tool:

    TOCGroup = new paper.Group;
    var tool = new paper.Tool();

    var mouseFollowPath = new paper.Path();
    mouseFollowPath.strokeColor = 'white';

    var xhrObj = new XMLHttpRequest();
    xhrObj.open('GET', "indexes/TOCall.csv", false);
    xhrObj.send('');
    TOCall = xhrObj.responseText.split(/\r\n|\n/);

    timelineWidth = paper.view.size.width - 1;
    timelineHeight = paper.view.size.height - 1;

    //DRAW ----------------
    var text = new paper.PointText({
        point: paper.view.center,
        justification: 'center',
        fontSize: 12,
        fillColor: 'grey',
        content: 'Mission Timeline'
    });
    drawTOC();
    paper.view.draw();

    // paperscript handlers
    paper.view.onResize = function (event) {
        timelineWidth = paper.view.size.width - 1;
        timelineHeight = paper.view.size.height - 1;
        text.point = paper.view.center;
        TOCGroup.removeChildren();
        drawTOC();

    };

    tool.onMouseMove = function (event) {
        mouseFollowPath.removeSegments();
        mouseFollowPath.add(event.point.x, 0);
        mouseFollowPath.add(event.point.x, timelineHeight);

        text.content = "Mission Timeline " + displayRolloverTime(event.point.x);
    };

    tool.onMouseUp = function (event) {
        //seekToTime("timeid-000100");
        var secondsPerPixel = missionDurationSeconds / timelineWidth;
        var mouseSeconds = event.point.x * secondsPerPixel;
        var timeStr = secondsToTimeStr(mouseSeconds);
        console.log("Timeline Clicked. Jumping to " + timeStr);
        parent.seekToTime("timeid" + timeStr.split(":").join(""));
    };
}

function displayRolloverTime(mousex) {
    var secondsPerPixel = missionDurationSeconds / timelineWidth;
    var mouseSeconds = mousex * secondsPerPixel;
    return secondsToTimeStr(mouseSeconds);
}

function padZeros(num, size) {
    var s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
}

function secondsToTimeStr(totalSeconds) {
    var hours = Math.abs(parseInt(totalSeconds / 3600));
    var minutes = Math.abs(parseInt(totalSeconds / 60)) % 60 % 60;
    var seconds = Math.abs(parseInt(totalSeconds)) % 60;
    seconds = Math.floor(seconds);
    return padZeros(hours,3) + ":" + padZeros(minutes,2) + ":" + padZeros(seconds,2);
}

function timeStrToSeconds(timeStr) {
    var sign = timeStr.substr(0,1);
    var hours = parseInt(timeStr.substr(0,3));
    var minutes = parseInt(timeStr.substr(4,2));
    var seconds = parseInt(timeStr.substr(7,2));
    var signToggle = (sign == "-") ? -1 : 1;
    return signToggle * ((Math.abs(hours) * 60 * 60) + (minutes * 60) + seconds);
}

function drawTOC() {
    //console.log("parent" + parent.gTOCAll[0]);
    var largeRect = new paper.Rectangle(1,1,timelineWidth, timelineHeight);
    var largeRectPath = paper.Path.Rectangle(largeRect);
    largeRectPath.strokeColor = 'grey';
    TOCGroup.addChild(largeRectPath);

    var pixelsPerSecond = (paper.view.bounds.width - 1) / missionDurationSeconds;
    for (var i = 0; i < TOCall.length; i++) {
        var data = TOCall[i].split('|');
        if (data[1] == "1") { //if level 1 TOC item
            var TOCItemLocX = Math.round(timeStrToSeconds(data[0]) * pixelsPerSecond);
            var topPoint = new paper.Point(TOCItemLocX, 0);
            var bottomPoint = new paper.Point(TOCItemLocX, timelineHeight);
            var aLine = new paper.Path.Line(topPoint, bottomPoint);
            aLine.strokeColor = '#333333';
            TOCGroup.addChild(aLine);
        }
    }
}