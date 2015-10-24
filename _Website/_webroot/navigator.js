//var missionDuration = "305:36:00";
//var durationHours = parseInt(missionDuration.substr(0,3));
//var durationMinutes = parseInt(missionDuration.substr(4,2));
//var durationSeconds = parseInt(missionDuration.substr(5,2));
//var gMissionDurationSeconds = (Math.abs(durationHours) * 60 * 60) + (durationMinutes * 60) + durationSeconds;
// 1100166

var gMissionDurationSeconds = 1100166;
var gNavZoomFactor = 25;
var gMouseOnNavigator = false;

var gNavigatorWidth;
var gNavigatorHeight;
var gTierHeight;

var gTier1Group;
var gTier1NavGroup;
var gTier2Group;
var gTier2NavGroup;
var gTier3Group;
var gCursorGroup;
var gNavCursorGroup;

var gTier1NavBoxLocX;
var gTier2NavBoxLocX;

var gLastTier2TextPosition;
var gLastTier3TextPosition;

var gTier2StartSeconds;
var gTier3StartSeconds;

var gTier1PixelsPerSecond;
var gTier1SecondsPerPixel;
var gTier2PixelsPerSecond;
var gTier2SecondsPerPixel;
var gTier3PixelsPerSecond;
var gTier3SecondsPerPixel;

paper.install(window);

$(document).ready(function() {
    console.log("NAV: Navigator ready");
    gApplicationReady += 1;
    $("#myCanvas").mouseleave(function() {
        onMouseOutHandler()
    });
    //$("*").mouseover(function(event) {
    //    if (this.id != "navigator" && this.id != "myCanvas") {
    //        onMouseOutHandler();
    //    }
    //    //console.log("over something: " + this.id);
    //});
    $(window).mouseleave(function() {
        onMouseOutHandler();
        //console.log("left window");
    });
});

function initNavigator() {
    console.log("NAV: initNavigator called");
    paper.setup('myCanvas');

    gTier1Group = new paper.Group;
    gTier1NavGroup = new paper.Group;
    gTier2Group = new paper.Group;
    gTier2NavGroup = new paper.Group;
    gTier3Group = new paper.Group;
    gCursorGroup = new paper.Group;
    gNavCursorGroup = new paper.Group;
    var tool = new paper.Tool();

    redrawAll();
    //pollForMissionTime();

    // paperscript handlers
    paper.view.onResize = function (event) {
        redrawAll();
    };

    tool.onMouseMove = function (event) {
        gMouseOnNavigator = true;
        var mouseXSeconds;
        gNavCursorGroup.removeChildren();
        if (event.point.y < (gNavigatorHeight / 3)) { //if in tier1
            mouseXSeconds = Math.round(event.point.x * gTier1SecondsPerPixel);
            drawTier1NavBox(mouseXSeconds);
            drawTier2();
            drawTier2NavBox(mouseXSeconds);
            drawTier3();
        } else if (event.point.y > (gNavigatorHeight / 3) && event.point.y <= (gNavigatorHeight / 3) * 2) {// if in tier2
            mouseXSeconds = Math.round(event.point.x * gTier2SecondsPerPixel) + gTier2StartSeconds;
            drawTier2NavBox(mouseXSeconds);
            drawTier3();
        } else if (event.point.y > (gNavigatorHeight / 3) * 2) { //if in tier3
            mouseXSeconds = (event.point.x * gTier3SecondsPerPixel) + gTier3StartSeconds;
        }
        drawCursor(timeStrToSeconds(gCurrMissionTime));
        drawNavCursor(mouseXSeconds);
    };

    tool.onMouseUp = function (event) {
        var mouseXSeconds;
        if (event.point.y < gTierHeight) { //if tier1 clicked
            console.log("Tier1 clicked");
            mouseXSeconds = event.point.x * gTier1SecondsPerPixel;
        } else if (event.point.y > (gNavigatorHeight / 3) && event.point.y < (gNavigatorHeight / 3) * 2) {// if tier2 clicked
            console.log("Tier2 clicked");
            mouseXSeconds = (event.point.x * gTier2SecondsPerPixel) + gTier2StartSeconds;
        } else { //tier3 clicked
            console.log("Tier3 clicked");
            mouseXSeconds = (event.point.x * gTier3SecondsPerPixel) + gTier3StartSeconds;
        }
        var timeStr = secondsToTimeStr(mouseXSeconds);
        console.log("Timeline Clicked. Jumping to " + timeStr);
        seekToTime("timeid" + timeStr.split(":").join(""));
    };
}

function onMouseOutHandler() {
    gMouseOnNavigator = false;
    //console.log("mycanvas mouseleave");

    gNavCursorGroup.removeChildren();
    drawTier1NavBox(timeStrToSeconds(gCurrMissionTime));
    drawTier2NavBox(timeStrToSeconds(gCurrMissionTime));
    redrawAll();
}

function setDynamicWidthVariables() {
    gNavigatorWidth = paper.view.size.width;
    gNavigatorHeight = paper.view.size.height;
    gTierHeight = Math.round(gNavigatorHeight / 3) - 4;

    gTier1PixelsPerSecond = gNavigatorWidth / gMissionDurationSeconds;
    gTier1SecondsPerPixel = gMissionDurationSeconds / gNavigatorWidth;
    gTier2PixelsPerSecond = gNavigatorWidth / (gMissionDurationSeconds / gNavZoomFactor);
    gTier2SecondsPerPixel = (gMissionDurationSeconds / gNavZoomFactor) / gNavigatorWidth;
    gTier3PixelsPerSecond = gNavigatorWidth / (gMissionDurationSeconds / gNavZoomFactor / gNavZoomFactor);
    gTier3SecondsPerPixel = (gMissionDurationSeconds / gNavZoomFactor / gNavZoomFactor) / gNavigatorWidth;
}

function redrawAll() {
    setDynamicWidthVariables();

    drawTier1();
    drawTier1NavBox(timeStrToSeconds(gCurrMissionTime));
    drawTier2();
    drawTier2NavBox(timeStrToSeconds(gCurrMissionTime));
    drawTier3();
    drawCursor(timeStrToSeconds(gCurrMissionTime));

    //render navigator
    paper.view.draw();
}

function drawCursor(seconds) {
    gCursorGroup.removeChildren();
    // tier1
    var tierTop = 0;
    var tierBottom = gTierHeight;

    var pixelsPerSecond = gNavigatorWidth  / gMissionDurationSeconds;
    var cursorLocX = seconds * pixelsPerSecond;
    var topPoint = new paper.Point(cursorLocX, tierTop);
    var bottomPoint = new paper.Point(cursorLocX, tierBottom);
    var aLine = new paper.Path.Line(topPoint, bottomPoint);
    aLine.strokeColor = 'red';
    gCursorGroup.addChild(aLine);

    // tier2
    tierTop = Math.round(gNavigatorHeight / 3);
    tierBottom = gTierHeight + tierTop;

    cursorLocX = (seconds - gTier2StartSeconds) * gTier2PixelsPerSecond;
    topPoint = new paper.Point(cursorLocX, tierTop);
    bottomPoint = new paper.Point(cursorLocX, tierBottom);
    aLine = new paper.Path.Line(topPoint, bottomPoint);
    aLine.strokeColor = 'red';
    gCursorGroup.addChild(aLine);

    // tier3
    tierTop = Math.round(gNavigatorHeight / 3) * 2;
    tierBottom = gTierHeight + tierTop;

    cursorLocX = (seconds - gTier3StartSeconds) * gTier3PixelsPerSecond;
    topPoint = new paper.Point(cursorLocX, tierTop);
    bottomPoint = new paper.Point(cursorLocX, tierBottom);
    aLine = new paper.Path.Line(topPoint, bottomPoint);
    aLine.strokeColor = 'red';
    gCursorGroup.addChild(aLine);

    var timeText = new paper.PointText({
        justification: 'left',
        fontSize: 9,
        strokeColor: 'red',
        content: ''
    });
    timeText.point = new paper.Point(cursorLocX , tierTop + 10);
    timeText.content = secondsToTimeStr(seconds);
    gCursorGroup.addChild(timeText);
}

function drawNavCursor(seconds) {
    gNavCursorGroup.removeChildren();
    // tier1
    var tierTop = 0;
    var tierBottom = gTierHeight;

    var pixelsPerSecond = gNavigatorWidth  / gMissionDurationSeconds;
    var cursorLocX = seconds * pixelsPerSecond;
    var topPoint = new paper.Point(cursorLocX, tierTop);
    var bottomPoint = new paper.Point(cursorLocX, tierBottom);
    var aLine = new paper.Path.Line(topPoint, bottomPoint);
    aLine.strokeColor = 'yellow';
    gNavCursorGroup.addChild(aLine);

    // tier2
    tierTop = Math.round(gNavigatorHeight / 3);
    tierBottom = gTierHeight + tierTop;

    cursorLocX = (seconds - gTier2StartSeconds) * gTier2PixelsPerSecond;
    topPoint = new paper.Point(cursorLocX, tierTop);
    bottomPoint = new paper.Point(cursorLocX, tierBottom);
    aLine = new paper.Path.Line(topPoint, bottomPoint);
    aLine.strokeColor = 'yellow';
    gNavCursorGroup.addChild(aLine);

    // tier3
    tierTop = Math.round(gNavigatorHeight / 3) * 2;
    tierBottom = gTierHeight + tierTop;

    cursorLocX = (seconds - gTier3StartSeconds) * gTier3PixelsPerSecond;
    topPoint = new paper.Point(cursorLocX, tierTop);
    bottomPoint = new paper.Point(cursorLocX, tierBottom);
    aLine = new paper.Path.Line(topPoint, bottomPoint);
    aLine.strokeColor = 'yellow';
    gNavCursorGroup.addChild(aLine);

    var timeText = new paper.PointText({
        justification: 'left',
        fontSize: 9,
        strokeColor: 'yellow',
        content: ''
    });
    timeText.point = new paper.Point(cursorLocX , tierTop + 10);
    timeText.content = secondsToTimeStr(seconds);
    gNavCursorGroup.addChild(timeText);
}

function drawTier1() {
    gTier1Group.removeChildren();
    var tierTop = 0;
    var tierBottom = gTierHeight;
    var tierRect = new paper.Rectangle(1, tierTop, gNavigatorWidth, gTierHeight);
    var tierRectPath = paper.Path.Rectangle(tierRect);
    tierRectPath.strokeColor = 'grey';
    gTier1Group.addChild(tierRectPath);

    var pixelsPerSecond = gNavigatorWidth  / gMissionDurationSeconds;
    for (var i = 0; i < gTOCAll.length; i++) {
        if (gTOCAll[i][1] == "1") { //if level 1 TOC item
            var TOCItemLocX = Math.round(timeStrToSeconds(gTOCAll[i][0]) * pixelsPerSecond);
            var topPoint = new paper.Point(TOCItemLocX, tierTop);
            var bottomPoint = new paper.Point(TOCItemLocX, tierBottom);
            var aLine = new paper.Path.Line(topPoint, bottomPoint);
            aLine.strokeColor = '#444444';
            gTier1Group.addChild(aLine);
        }
    }
}

function drawTier1NavBox(seconds) {
    gTier1NavGroup.removeChildren();

    var locX = seconds * gTier1PixelsPerSecond;

    var tierTop = 0;
    var navBoxWidth = Math.round(gNavigatorWidth / gNavZoomFactor);

    gTier1NavBoxLocX = locX - (navBoxWidth / 2);
    if (gTier1NavBoxLocX < 0) {
        gTier1NavBoxLocX = 0;
    } else if (gTier1NavBoxLocX + navBoxWidth > gNavigatorWidth) {
        gTier1NavBoxLocX = gNavigatorWidth - navBoxWidth;
    }

    var navBoxRect = new paper.Rectangle(gTier1NavBoxLocX, tierTop, navBoxWidth, gTierHeight);
    var navBoxRectPath = paper.Path.Rectangle(navBoxRect);
    navBoxRectPath.strokeColor = 'white';
    gTier1NavGroup.addChild(navBoxRectPath);
}

function drawTier2() {
    gTier2Group.removeChildren();

    var tierTop = Math.round(gNavigatorHeight / 3);
    var tierBottom = gTierHeight + tierTop;
    var tierRect = new paper.Rectangle(1, tierTop, gNavigatorWidth, gTierHeight);
    var tierRectPath = paper.Path.Rectangle(tierRect);
    tierRectPath.strokeColor = 'grey';
    gTier2Group.addChild(tierRectPath);

    gTier2StartSeconds = gTier1SecondsPerPixel * gTier1NavBoxLocX;
    var secondsOnTier2 = gTier2SecondsPerPixel * gNavigatorWidth;

    gLastTier2TextPosition = 1;

    for (var i = 0; i < gTOCAll.length; i++) {
        var itemSecondsFromLeft = Math.round(timeStrToSeconds(gTOCAll[i][0])) - gTier2StartSeconds;
        if (gLastTier2TextPosition == 1 || gLastTier2TextPosition == "") {
            var textPosition = 2;
        } else if (gLastTier2TextPosition == 2) {
            textPosition = 3;
        } else {
            textPosition = 1;
        }
        gLastTier2TextPosition = textPosition;
        if (itemSecondsFromLeft >= 0 && itemSecondsFromLeft <= secondsOnTier2) {
            var itemLocX = itemSecondsFromLeft * gTier2PixelsPerSecond;
            var barHeight = gTierHeight / parseInt(gTOCAll[i][1]);
            var barTop = tierBottom - barHeight;
            var topPoint = new paper.Point(itemLocX, barTop);
            var bottomPoint = new paper.Point(itemLocX, tierBottom);
            var aLine = new paper.Path.Line(topPoint, bottomPoint);
            aLine.strokeColor = '#444444';
            if (gTOCAll[i][1] == "1") { //if level 1 TOC item
                var itemText = new paper.PointText({
                    justification: 'left',
                    fontSize: 10,
                    strokeColor: '#444444'
                });
                var textTop = tierBottom - textPosition * (gTierHeight / 3) + 9;
                itemText.point = new paper.Point(itemLocX , textTop);
                itemText.content = gTOCAll[i][2];
                gTier2Group.addChild(itemText);
            }
            gTier2Group.addChild(aLine);
        }
    }
    //display photo ticks
    for (var i = 0; i < gPhotoList.length; i++) {
        if (gPhotoList[i][2] != "") {
            itemSecondsFromLeft = Math.round(timeStrToSeconds(gPhotoList[i][2])) - gTier2StartSeconds;
            if (itemSecondsFromLeft >= 0  && itemSecondsFromLeft <= secondsOnTier2) {
                itemLocX = itemSecondsFromLeft * gTier2PixelsPerSecond;
                barHeight = gTierHeight / 2;
                barTop = tierBottom - barHeight;
                topPoint = new paper.Point(itemLocX, barTop);
                bottomPoint = new paper.Point(itemLocX, tierBottom);
                aLine = new paper.Path.Line(topPoint, bottomPoint);
                aLine.strokeColor = 'green';
                gTier2Group.addChild(aLine);
            }
        }
    }
}

function drawTier2NavBox(seconds) {
    gTier2NavGroup.removeChildren();

    var locX = (seconds - gTier2StartSeconds) * gTier2PixelsPerSecond;

    var tier2Top = Math.round(gNavigatorHeight / 3);
    var navBoxWidth = Math.round(gNavigatorWidth / gNavZoomFactor);
    gTier2NavBoxLocX = locX - (navBoxWidth / 2);
    if (gTier2NavBoxLocX < 0) {
        gTier2NavBoxLocX = 0;
    } else if (gTier2NavBoxLocX + navBoxWidth > gNavigatorWidth) {
        gTier2NavBoxLocX = gNavigatorWidth - navBoxWidth;
    }

    var navBoxRect = new paper.Rectangle(gTier2NavBoxLocX, tier2Top, navBoxWidth, gTierHeight);
    var navBoxRectPath = paper.Path.Rectangle(navBoxRect);
    navBoxRectPath.strokeColor = 'white';
    gTier2NavGroup.addChild(navBoxRectPath);
}

function drawTier3() {
    gTier3Group.removeChildren();

    var tierTop = Math.round(gNavigatorHeight / 3) * 2;
    var tierBottom = gTierHeight + tierTop;
    var tierRect = new paper.Rectangle(1, tierTop, gNavigatorWidth, gTierHeight);
    var tierRectPath = paper.Path.Rectangle(tierRect);
    tierRectPath.strokeColor = 'grey';
    gTier3Group.addChild(tierRectPath);

    gTier3StartSeconds = (gTier2SecondsPerPixel * gTier2NavBoxLocX) + gTier2StartSeconds;
    var secondsOnTier3 = gTier3SecondsPerPixel * gNavigatorWidth;
    gLastTier3TextPosition = 1;
    //display TOC ticks at varying heights
    for (var i = 0; i < gTOCAll.length; i++) {
        var itemSecondsFromLeft = Math.round(timeStrToSeconds(gTOCAll[i][0])) - gTier3StartSeconds;
        if (gLastTier3TextPosition == 1 || gLastTier3TextPosition == "") {
            var textPosition = 2;
        } else if (gLastTier3TextPosition == 2) {
            textPosition = 3;
        } else {
            textPosition = 1;
        }
        gLastTier3TextPosition = textPosition;
        if (itemSecondsFromLeft >= 0 && itemSecondsFromLeft <= secondsOnTier3) {
            var itemLocX = itemSecondsFromLeft * gTier3PixelsPerSecond;
            var barHeight = gTierHeight / parseInt(gTOCAll[i][1]);
            var barTop = tierBottom - barHeight;
            var topPoint = new paper.Point(itemLocX, barTop);
            var bottomPoint = new paper.Point(itemLocX, tierBottom);
            var aLine = new paper.Path.Line(topPoint, bottomPoint);
            aLine.strokeColor = '#444444';
            //if (gTOCAll[i][1] == "1") { //if level 1 TOC item
            var itemText = new paper.PointText({
                justification: 'left',
                fontSize: 10,
                strokeColor: '#444444'
            });
            var textTop = tierBottom - textPosition * (gTierHeight / 3) + 10;
            itemText.point = new paper.Point(itemLocX , textTop);
            itemText.content = gTOCAll[i][2];
            gTier3Group.addChild(itemText);
            //}
            gTier3Group.addChild(aLine);
        }
    }
    //display photo ticks
    for (var i = 0; i < gPhotoList.length; i++) {
        if (gPhotoList[i][2] != "") {
            itemSecondsFromLeft = Math.round(timeStrToSeconds(gPhotoList[i][2])) - gTier3StartSeconds;
            if (itemSecondsFromLeft >= 0  && itemSecondsFromLeft <= secondsOnTier3) {
                itemLocX = itemSecondsFromLeft * gTier3PixelsPerSecond;
                barHeight = gTierHeight / 2;
                barTop = tierBottom - barHeight;
                topPoint = new paper.Point(itemLocX, barTop);
                bottomPoint = new paper.Point(itemLocX, tierBottom);
                aLine = new paper.Path.Line(topPoint, bottomPoint);
                aLine.strokeColor = 'green';
                gTier3Group.addChild(aLine);
            }
        }
    }
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