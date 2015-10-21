//var missionDuration = "305:36:00";
//var durationHours = parseInt(missionDuration.substr(0,3));
//var durationMinutes = parseInt(missionDuration.substr(4,2));
//var durationSeconds = parseInt(missionDuration.substr(5,2));
//var missionDurationSeconds = (Math.abs(durationHours) * 60 * 60) + (durationMinutes * 60) + durationSeconds;
// 1100166

var mouseFollowPath = new paper.Path();
mouseFollowPath.strokeColor = 'white';

//"window" is the global variable scope
window.timelineWidth = paper.view.size.width - 1;
window.timelineHeight = paper.view.size.height - 1;
window.missionDurationSeconds = 1100166;

//console.log("parent" + parent.gTOCAll[0]);
window.xhrObj = new XMLHttpRequest();
window.xhrObj.open('GET', "../indexes/TOCall.csv", false);
window.xhrObj.send('');
window.TOCAll = window.xhrObj.responseText.split(/\r\n|\n/);;

var TOCGroup = new paper.Group;
drawTOC();

function onResize(event) {
    // Whenever the window is resized, recenter the path:
    TOCGroup.removeChildren();
    drawTOC();
    text.point = paper.view.center;
}

var text = new paper.PointText({
    point: paper.view.center,
    justification: 'center',
    fontSize: 12,
    fillColor: 'grey',
    content: 'Mission Timeline'
});

function onMouseMove(event) {
    mouseFollowPath.removeSegments();
    mouseFollowPath.add(event.point.x, 0);
    mouseFollowPath.add(event.point.x, window.timelineHeight);

    text.content = "Mission Timeline " + displayRolloverTime(event.point.x);
}

function onMouseUp(event) {
    //seekToTime("timeid-000100");
    var secondsPerPixel = window.missionDurationSeconds / window.timelineWidth;
    var mouseSeconds = event.point.x * secondsPerPixel;
    var timeStr = secondsToTimeStr(mouseSeconds);
    console.log("Timeline Clicked. Jumping to " + timeStr);
    parent.seekToTime("timeid" + timeStr.split(":").join(""));
}

function displayRolloverTime(mousex) {
    var secondsPerPixel = window.missionDurationSeconds / window.timelineWidth;
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
    var largeRect = new paper.Rectangle(1,1,window.timelineWidth, window.timelineHeight);
    var largeRectPath = paper.Path.Rectangle(largeRect);
    largeRectPath.strokeColor = 'grey';

    var missionDurationSeconds = 1100166;
    var pixelsPerSecond = (paper.view.bounds.width - 1) / missionDurationSeconds;
    for (var i = 0; i < window.TOCAll.length; i++) {
        var data = window.TOCAll[i].split('|');
        if (data[1] == "1") { //if level 1 TOC item
            var TOCItemLocX = Math.round(timeStrToSeconds(data[0]) * pixelsPerSecond);
            var topPoint = new paper.Point(TOCItemLocX, 0);
            var bottomPoint = new paper.Point(TOCItemLocX, largeRect.height);
            var aLine = new paper.Path.Line(topPoint, bottomPoint);
            aLine.strokeColor = '#333333';
            TOCGroup.addChild(aLine);
        }
    }
}

//var gridGroup = new paper.Group;
//drawGrid();

//The function that draws horizontal/vertical lines

function drawGridOnScreen() {

//Width/Height per cell on the grid variables

    var widthPerCell = 200;
    var heightPerCell = 20;

//Draw the grid lines and add them into the global group above that holds all the lines

    var drawGridLines = function(num_rectangles_wide, num_rectangles_tall, boundingRect) {

        for (var i = 0; i <= num_rectangles_wide; i++) {
            var correctedBoundingRectLeft = Math.ceil(boundingRect.left/widthPerCell) * widthPerCell;
            var xPos = correctedBoundingRectLeft + i * widthPerCell;
            var topPoint = new paper.Point(xPos, boundingRect.top);
            var bottomPoint = new paper.Point(xPos, boundingRect.bottom);
            var aLine = new paper.Path.Line(topPoint, bottomPoint);
            aLine.strokeColor = 'grey';
            gridGroup.addChild(aLine);
        }

        for (i = 0; i <= num_rectangles_tall; i++) {
            var correctedBoundingRectTop = Math.ceil(boundingRect.top/heightPerCell) * heightPerCell;
            var yPos = correctedBoundingRectTop + i * heightPerCell;
            var leftPoint = new paper.Point(boundingRect.left, yPos);
            var rightPoint = new paper.Point(boundingRect.right, yPos);
            var bLine = new paper.Path.Line(leftPoint, rightPoint);
            bLine.strokeColor = 'grey';
            gridGroup.addChild(bLine);
        }
    }
//Find out how many cells we need vertically/horizontally first and then call the ''grid maker'' function to draw them.

    var numberOfVerticalCells = paper.view.bounds.width / widthPerCell;
    var numberOfHorizontalCells = paper.view.bounds.height / heightPerCell;

    drawGridLines(numberOfVerticalCells, numberOfHorizontalCells, paper.view.bounds);
}

//This function gets called on each mouse zoom interval. If there is a previously drawn grid, delete it and start over.

function drawGrid(){

    if (gridGroup.isEmpty()) {
        drawGridOnScreen();
    }

    else {
        gridGroup.removeChildren();
        drawGridOnScreen();
    }

}