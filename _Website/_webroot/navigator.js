//var missionDuration = "305:36:00";
//var durationHours = parseInt(missionDuration.substr(0,3));
//var durationMinutes = parseInt(missionDuration.substr(4,2));
//var durationSeconds = parseInt(missionDuration.substr(5,2));
//var gMissionDurationSeconds = (Math.abs(durationHours) * 60 * 60) + (durationMinutes * 60) + durationSeconds;
// 1100166

var gMissionDurationSeconds = 1100166;
var gNavZoomFactor = 20;
var gMouseOnNavigator = false;

var gNavigatorWidth;
var gNavigatorHeight;

var gTier1Height;
var gTier2Height;
var gTier3Height;
var gTier1Top;
var gTier2Top;
var gTier3Top;
var gTierSpacing;

var gTier1Width;
var gTier2Width;
var gTier3Width;
var gTier1Left;
var gTier2Left;
var gTier3Left;

var gTier1Group;
var gTier1NavGroup;
var gTier2Group;
var gTier2NavGroup;
var gTier3Group;
var gCursorGroup;
var gNavCursorGroup;

var gTier1NavBoxLocX;
var gTier2NavBoxLocX;

var gLastTier1TextPosition;
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

var gTOCTextColor = "grey";
var gTOCStrokeColor = "grey";

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
        if (event.point.y < gTier1Top + gTier1Height + gTierSpacing) { //if in tier1
            mouseXSeconds = (event.point.x - gTier1Left) * gTier1SecondsPerPixel;
            //console.log(mouseXSeconds);
            drawTier1NavBox(mouseXSeconds);
            drawTier2();
            drawTier2NavBox(mouseXSeconds);
            drawTier3();
        } else if (event.point.y >= gTier1Top + gTier1Height + gTierSpacing && event.point.y < gTier2Top + gTier2Height + gTierSpacing) {// if in tier2
            mouseXSeconds = ((event.point.x - gTier2Left) * gTier2SecondsPerPixel) + gTier2StartSeconds;
            drawTier2NavBox(mouseXSeconds);
            drawTier3();
        } else if (event.point.y > gTier2Top + gTier2Height + gTierSpacing) { //if in tier3
            mouseXSeconds = ((event.point.x - gTier3Left) * gTier3SecondsPerPixel) + gTier3StartSeconds;
        }
        drawCursor(timeStrToSeconds(gCurrMissionTime));
        drawNavCursor(mouseXSeconds);
    };

    tool.onMouseUp = function (event) {
        var mouseXSeconds;
        if (event.point.y < gTier1Top + gTier1Height + gTierSpacing) { //if tier1 clicked
            console.log("Tier1 clicked");
            mouseXSeconds = event.point.x * gTier1SecondsPerPixel;
        } else if (event.point.y >= gTier1Top + gTier1Height + gTierSpacing && event.point.y < gTier2Top + gTier2Height + gTierSpacing) {// if tier2 clicked
            console.log("Tier2 clicked");
            mouseXSeconds = ((event.point.x - gTier2Left) * gTier2SecondsPerPixel) + gTier2StartSeconds;
        } else { //tier3 clicked
            console.log("Tier3 clicked");
            mouseXSeconds = ((event.point.x - gTier3Left) * gTier3SecondsPerPixel) + gTier3StartSeconds;
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

    gTierSpacing = 8;

    gTier1Height = Math.round(gNavigatorHeight / 3) - 20;
    gTier2Height = Math.round(gNavigatorHeight / 3) - 10;
    gTier3Height = Math.round(gNavigatorHeight / 3) + 15;
    //gTier1Height = Math.round(gNavigatorHeight / 3) - 5;
    //gTier2Height = Math.round(gNavigatorHeight / 3) - 5;
    //gTier3Height = Math.round(gNavigatorHeight / 3) - 5;
    gTier1Top = 1;
    gTier2Top = gTier1Height + gTierSpacing;
    gTier3Top = gTier2Top + gTier2Height + gTierSpacing;

    gTier1Width = paper.view.size.width - (paper.view.size.width * 0.2);
    gTier2Width = paper.view.size.width - (paper.view.size.width * 0.1);
    gTier3Width = paper.view.size.width;
    //gTier1Width = paper.view.size.width;
    //gTier2Width = paper.view.size.width;
    //gTier3Width = paper.view.size.width;

    gTier1Left = (gNavigatorWidth - gTier1Width) / 2;
    gTier2Left = (gNavigatorWidth - gTier2Width) / 2;
    gTier3Left = (gNavigatorWidth - gTier3Width) / 2;


    gTier1PixelsPerSecond = gTier1Width / gMissionDurationSeconds;
    gTier1SecondsPerPixel = gMissionDurationSeconds / gTier1Width;
    gTier2PixelsPerSecond = gTier2Width / (gMissionDurationSeconds / gNavZoomFactor);
    gTier2SecondsPerPixel = (gMissionDurationSeconds / gNavZoomFactor) / gTier2Width;
    gTier3PixelsPerSecond = gTier3Width / (gMissionDurationSeconds / gNavZoomFactor / gNavZoomFactor);
    gTier3SecondsPerPixel = (gMissionDurationSeconds / gNavZoomFactor / gNavZoomFactor) / gTier3Width;
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
    var tierBottom = gTier1Height;

    var cursorLocX = gTier1Left + (seconds * gTier1PixelsPerSecond);
    var topPoint = new paper.Point(cursorLocX, gTier1Top);
    var bottomPoint = new paper.Point(cursorLocX, tierBottom);
    var aLine = new paper.Path.Line(topPoint, bottomPoint);
    aLine.strokeColor = 'red';
    gCursorGroup.addChild(aLine);

    // tier2
    tierBottom = gTier2Height + gTier2Top;
    cursorLocX = gTier2Left + ((seconds - gTier2StartSeconds) * gTier2PixelsPerSecond);
    topPoint = new paper.Point(cursorLocX, gTier2Top);
    bottomPoint = new paper.Point(cursorLocX, tierBottom);
    aLine = new paper.Path.Line(topPoint, bottomPoint);
    aLine.strokeColor = 'red';
    gCursorGroup.addChild(aLine);

    // tier3
    tierBottom = gTier3Height + gTier3Top;
    cursorLocX = gTier3Left + ((seconds - gTier3StartSeconds) * gTier3PixelsPerSecond);
    topPoint = new paper.Point(cursorLocX, gTier3Top);
    bottomPoint = new paper.Point(cursorLocX, tierBottom);
    aLine = new paper.Path.Line(topPoint, bottomPoint);
    aLine.strokeColor = 'red';
    gCursorGroup.addChild(aLine);

    var timeText = new paper.PointText({
        justification: 'left',
        fontWeight: 'bold',
        fontSize: 14,
        fillColor: 'red'
    });
    timeText.content = secondsToTimeStr(seconds);
    timeText.point = new paper.Point(cursorLocX - timeText.bounds.width / 2 , gTier3Top + 14);
    var timeTextRect = new paper.Path.Rectangle(timeText.bounds);
    timeTextRect.strokeColor = "red";
    timeTextRect.fillColor = "black";
    timeTextRect.scale(1.1, 1);
    gCursorGroup.addChild(timeTextRect);
    gCursorGroup.addChild(timeText);
}

function drawNavCursor(seconds) {
    gNavCursorGroup.removeChildren();
    // tier1
    var tierBottom = gTier1Height;
    var cursorLocX = gTier1Left + (seconds * gTier1PixelsPerSecond);
    var topPoint = new paper.Point(cursorLocX, gTier1Top);
    var bottomPoint = new paper.Point(cursorLocX, tierBottom);
    var aLine = new paper.Path.Line(topPoint, bottomPoint);
    aLine.strokeColor = 'yellow';
    gNavCursorGroup.addChild(aLine);

    // tier2
    tierBottom = gTier2Height + gTier2Top;
    cursorLocX = gTier2Left + ((seconds - gTier2StartSeconds) * gTier2PixelsPerSecond);
    topPoint = new paper.Point(cursorLocX, gTier2Top);
    bottomPoint = new paper.Point(cursorLocX, tierBottom);
    aLine = new paper.Path.Line(topPoint, bottomPoint);
    aLine.strokeColor = 'yellow';
    gNavCursorGroup.addChild(aLine);

    // tier3
    tierBottom = gTier3Height + gTier3Top;
    cursorLocX = gTier3Left + ((seconds - gTier3StartSeconds) * gTier3PixelsPerSecond);
    topPoint = new paper.Point(cursorLocX, gTier3Top);
    bottomPoint = new paper.Point(cursorLocX, tierBottom);
    aLine = new paper.Path.Line(topPoint, bottomPoint);
    aLine.strokeColor = 'yellow';
    gNavCursorGroup.addChild(aLine);

    // tier3 cursor time text
    var timeText = new paper.PointText({
        justification: 'left',
        fontWeight: 'bold',
        fontSize: 14,
        fillColor: 'yellow'
    });
    timeText.content = secondsToTimeStr(seconds);
    timeText.point = new paper.Point(cursorLocX - timeText.bounds.width / 2 , gTier3Top + 14);
    var timeTextRect = new paper.Path.Rectangle(timeText.bounds);
    timeTextRect.strokeColor = "yellow";
    timeTextRect.fillColor = "black";
    timeTextRect.scale(1.1, 1);
    gNavCursorGroup.addChild(timeTextRect);
    gNavCursorGroup.addChild(timeText);
}

function drawTier1() {
    gTier1Group.removeChildren();
    var tierBottom = gTier1Top + gTier1Height;
    var tierRect = new paper.Rectangle(gTier1Left, gTier1Top, gTier1Width, gTier1Height);
    var tierRectPath = paper.Path.Rectangle(tierRect);
    tierRectPath.strokeColor = 'grey';
    gTier1Group.addChild(tierRectPath);

    // draw mission stages boxes
    for (var i = 0; i < gMissionStages.length; i++) {
        var rectStartX = gTier1Left + timeStrToSeconds(gMissionStages[i][0]) * gTier1PixelsPerSecond;
        var rectWidth;
        if (i != gMissionStages.length - 1) {
            rectWidth = (timeStrToSeconds(gMissionStages[i + 1][0]) - timeStrToSeconds(gMissionStages[i][0])) * gTier1PixelsPerSecond;
        } else {
            rectWidth = (gMissionDurationSeconds - timeStrToSeconds(gMissionStages[i][0])) * gTier1PixelsPerSecond;
        }
        var stageRect = new paper.Path.Rectangle(rectStartX, gTier1Top, rectWidth, gTier1Top + gTier1Height / 2);
        stageRect.strokeColor = 'grey';
        stageRect.fillColor = "black";
        //if (i % 2 == 0) {
        //    stageRect.fillColor = "white";
        //} else {
        //    stageRect.fillColor = "black";
        //}
        //stageRect.fillColor = '#222222';
        gTier1Group.addChild(stageRect);
        var stageText = new paper.PointText({
            justification: 'left',
            fontSize: 8,
            fillColor: "grey"
        });
        var textTop = gTier1Top + (gTier1Height / 2) - 3;
        stageText.point = new paper.Point(rectStartX , textTop);
        stageText.content = gMissionStages[i][1];
        gTier1Group.addChild(stageText);
    }

    //for (var i = 0; i < gTOCAll.length; i++) {
    //    //if (gLastTier1TextPosition == 1 || gLastTier1TextPosition == "") {
    //    //    var textPosition = 2;
    //    //} else if (gLastTier1TextPosition == 2) {
    //    //    textPosition = 3;
    //    //} else {
    //    //    textPosition = 1;
    //    //}
    //    //gLastTier1TextPosition = textPosition;
    //    if (gTOCAll[i][1] == "1") { //if level 1 TOC item
    //        var itemLocX = gTier1Left + timeStrToSeconds(gTOCAll[i][0]) * gTier1PixelsPerSecond;
    //        var topPoint = new paper.Point(itemLocX, gTier1Top);
    //        var bottomPoint = new paper.Point(itemLocX, tierBottom);
    //        var aLine = new paper.Path.Line(topPoint, bottomPoint);
    //        aLine.strokeColor = gTOCStrokeColor;
    //        gTier1Group.addChild(aLine);
    //        //if (gTOCAll[i][1] == "1") { //if level 1 TOC item
    //        //    var itemText = new paper.PointText({
    //        //        justification: 'left',
    //        //        fontSize: 10,
    //        //        strokeColor: gTOCTextColor
    //        //    });
    //        //    var textTop = tierBottom - textPosition * (gTier1Height / 3) + 9;
    //        //    itemText.point = new paper.Point(itemLocX , textTop);
    //        //    itemText.content = gTOCAll[i][2];
    //        //    gTier1Group.addChild(itemText);
    //        //}
    //    }
    //}
    //display photo ticks
    for (i = 0; i < gPhotoList.length; i++) {
        if (gPhotoList[i][2] != "") {
            itemLocX = gTier1Left + timeStrToSeconds(gPhotoList[i][2]) * gTier1PixelsPerSecond;
            var barHeight = gTier1Height / 4;
            var barTop = tierBottom - barHeight;
            var topPoint = new paper.Point(itemLocX, barTop);
            var bottomPoint = new paper.Point(itemLocX, tierBottom);
            var aLine = new paper.Path.Line(topPoint, bottomPoint);
            aLine.strokeColor = 'green';
            gTier1Group.addChild(aLine);
        }
    }
    //display time ticks
    var missionDurationStr = secondsToTimeStr(gMissionDurationSeconds);
    var missionDurationHours = parseInt(missionDurationStr.substr(0,3));

    for (i = 0; i < missionDurationHours; i++) {
        var itemLocX = gTier1Left + (i * 60 * 60) * gTier1PixelsPerSecond;
        barHeight = gTier1Height / 15;
        barTop = tierBottom - barHeight;
        topPoint = new paper.Point(itemLocX, barTop);
        bottomPoint = new paper.Point(itemLocX, tierBottom);
        aLine = new paper.Path.Line(topPoint, bottomPoint);
        aLine.strokeColor = 'orange';
        gTier1Group.addChild(aLine);
    }
}

function drawTier1NavBox(seconds) {
    gTier1NavGroup.removeChildren();

    var locX = gTier1Left + (seconds * gTier1PixelsPerSecond);
    var navBoxWidth = Math.round(gTier1Width / gNavZoomFactor);
    gTier1NavBoxLocX = locX - (navBoxWidth / 2);
    if (gTier1NavBoxLocX < gTier1Left) {
        gTier1NavBoxLocX = gTier1Left;
    } else if (gTier1NavBoxLocX + navBoxWidth > gTier1Left + gTier1Width) {
        gTier1NavBoxLocX = (gTier1Left + gTier1Width) - navBoxWidth;
    }
    var navBoxRect = new paper.Rectangle(gTier1NavBoxLocX, gTier1Top, navBoxWidth, gTier1Height);
    var navBoxRectPath = paper.Path.Rectangle(navBoxRect);
    navBoxRectPath.strokeColor = 'white';
    gTier1NavGroup.addChild(navBoxRectPath);

    var leftGradient = new paper.Point(gTier2Left, gTier2Top);
    var rightGradient = new paper.Point(gTier1NavBoxLocX, gTier1Top);
    var zoomRect = new Path({
        segments:   [
            [gTier1NavBoxLocX, gTier1Top],
            [gTier1NavBoxLocX, (gTier1Top + gTier1Height)],
            [gTier2Left, (gTier2Top + gTier2Height)],
            [gTier2Left, gTier2Top]
        ],
        //strokeColor: 'white',
        strokeColor: {
            gradient: {
                stops: ['black', 'white']
            },
            origin: leftGradient,
            destination: rightGradient
        },
        closed: true,
        strokeWidth: 1,
        strokeJoin: 'round',
        //fillColor: "white",
        fillColor: {
            gradient: {
                stops: ['black', 'white']
            },
            origin: leftGradient,
            destination: rightGradient
        },
        opacity: 0.2
    });
    gTier1NavGroup.addChild(zoomRect);
    leftGradient = new paper.Point(gTier1NavBoxLocX + navBoxWidth, gTier1Top);
    rightGradient = new paper.Point(gTier2Left + gTier2Width, gTier2Top + gTier2Height);
    zoomRect = new Path({
        segments: [
            [gTier1NavBoxLocX + navBoxWidth, gTier1Top],
            [gTier1NavBoxLocX + navBoxWidth, (gTier1Top + gTier1Height)],
            [gTier2Left + gTier2Width, gTier2Top + gTier2Height],
            [gTier2Left + gTier2Width, gTier2Top]
        ],
        //strokeColor: 'white',
        strokeColor: {
            gradient: {
                stops: ['black', 'white']
            },
            origin: leftGradient,
            destination: rightGradient
        },
        closed: true,
        strokeWidth: 1,
        strokeJoin: 'round',
        //fillColor: "white",
        fillColor: {
            gradient: {
                stops: ['white', 'black']
            },
            origin: leftGradient,
            destination: rightGradient
        },
        opacity: 0.2
    });
    gTier1NavGroup.addChild(zoomRect);
    //var zoomRect = new Path({
    //    segments:   [
    //        [gTier1NavBoxLocX + navBoxWidth, gTier1Top + gTier1Height],
    //        [gTier2Left + gTier2Width, gTier2Top + gTier2Height],
    //        [gTier2Left, gTier2Top + gTier2Height],
    //        [gTier1NavBoxLocX, gTier1Top + gTier1Height]
    //    ],
    //    strokeColor: 'white',
    //    closed: true,
    //    strokeWidth: 1,
    //    strokeJoin: 'round',
    //    fillColor: "white",
    //    opacity: 0.3
    //});
    //gTier1NavGroup.addChild(zoomRect);
}

function drawTier2() {
    gTier2Group.removeChildren();

    var tierBottom = gTier2Height + gTier2Top;
    var tierRect = new paper.Rectangle(gTier2Left, gTier2Top, gTier2Width, gTier2Height);
    var tierRectPath = paper.Path.Rectangle(tierRect);
    tierRectPath.fillColor = "black";
    tierRectPath.strokeColor = 'grey';
    gTier2Group.addChild(tierRectPath);

    gTier2StartSeconds = gTier1SecondsPerPixel * (gTier1NavBoxLocX - gTier1Left);
    var secondsOnTier2 = gTier2SecondsPerPixel * gTier2Width;

    // draw mission stages boxes
    for (var i = 0; i <= gMissionStages.length - 1; i++) {
        //draw if stage start is before end of viewport, and stage end is after start of viewport
        if (timeStrToSeconds(gMissionStages[i][0]) <= gTier2StartSeconds + secondsOnTier2 && timeStrToSeconds(gMissionStages[i][3]) >= gTier2StartSeconds) {
            var rectStartX = gTier2Left + (timeStrToSeconds(gMissionStages[i][0]) - gTier2StartSeconds) * gTier2PixelsPerSecond;
            var rectWidth;
            if (i != gMissionStages.length - 1) {
                rectWidth = (timeStrToSeconds(gMissionStages[i + 1][0]) - timeStrToSeconds(gMissionStages[i][0])) * gTier2PixelsPerSecond;
            } else {
                rectWidth = (gMissionDurationSeconds - timeStrToSeconds(gMissionStages[i][0])) * gTier2PixelsPerSecond;
            }
            if (rectStartX < gTier2Left + 1) {
                rectStartX = gTier2Left + 1;
            }
            if (rectWidth > gTier2Width - rectStartX - 1) {
                rectWidth = gTier2Width - rectStartX + gTier2Left - 1;
            }
            var stageRect = new paper.Path.Rectangle(rectStartX, gTier2Top, rectWidth, (gTier2Height / 2) - 3);
            stageRect.strokeColor = '#222222';
            stageRect.fillColor ='black';
            //if (i % 2 == 0) {
            //    stageRect.fillColor = "white";
            //} else {
            //    stageRect.fillColor = "black";
            //}
            gTier2Group.addChild(stageRect);
            var stageText = new paper.PointText({
                justification: 'left',
                fontWeight: 'bold',
                fontSize: 11,
                fillColor: "grey"
            });
            var textTop = gTier2Top + (gTier2Height / 2) - 5;
            stageText.point = new paper.Point(rectStartX , textTop);
            stageText.content = gMissionStages[i][1];
            gTier2Group.addChild(stageText);
        }
    }

    //draw TOC items
    gLastTier2TextPosition = 1;
    for (var i = 0; i < gTOCAll.length; i++) {
        //if (gLastTier2TextPosition == 1 || gLastTier2TextPosition == "") {
        //    var textPosition = 2;
        //} else if (gLastTier2TextPosition == 2) {
        //    textPosition = 3;
        //} else {
        //    textPosition = 1;
        //}
        //gLastTier2TextPosition = textPosition;
        var textPosition = 1;
        var itemSecondsFromTierStart = timeStrToSeconds(gTOCAll[i][0]) - gTier2StartSeconds;
        if (itemSecondsFromTierStart >= 0 && itemSecondsFromTierStart <= secondsOnTier2) {
            var itemLocX = gTier2Left + itemSecondsFromTierStart * gTier2PixelsPerSecond;
            var barHeight = gTier2Height / parseInt(gTOCAll[i][1]);
            var barTop = tierBottom - barHeight;
            var topPoint = new paper.Point(itemLocX, barTop);
            var bottomPoint = new paper.Point(itemLocX, tierBottom);
            var aLine = new paper.Path.Line(topPoint, bottomPoint);
            aLine.strokeColor = gTOCStrokeColor;
            gTier2Group.addChild(aLine);
            if (gTOCAll[i][1] == "1") { //if level 1 TOC item
                var itemText = new paper.PointText({
                    justification: 'left',
                    fontSize: 10,
                    fillColor: gTOCTextColor
                });
                var textTop = tierBottom - textPosition * (gTier2Height / 3) + 6;
                itemText.point = new paper.Point(itemLocX , textTop);
                itemText.content = gTOCAll[i][2];
                var itemTextRect = new paper.Path.Rectangle(itemText.bounds);
                itemTextRect.strokeColor = "black";
                itemTextRect.fillColor = "black";
                gTier2Group.addChild(itemTextRect);
                gTier2Group.addChild(itemText);
            }
        }
    }

    //display photo ticks
    for (var i = 0; i < gPhotoList.length; i++) {
        if (gPhotoList[i][2] != "") {
            itemSecondsFromTierStart = timeStrToSeconds(gPhotoList[i][2]) - gTier2StartSeconds;
            if (itemSecondsFromTierStart >= 0  && itemSecondsFromTierStart <= secondsOnTier2) {
                itemLocX = gTier2Left + itemSecondsFromTierStart * gTier2PixelsPerSecond;
                barHeight = gTier2Height / 3;
                barTop = tierBottom - barHeight;
                topPoint = new paper.Point(itemLocX, barTop);
                bottomPoint = new paper.Point(itemLocX, tierBottom);
                aLine = new paper.Path.Line(topPoint, bottomPoint);
                aLine.strokeColor = 'green';
                gTier2Group.addChild(aLine);
            }
        }
    }
    //display time ticks
    var missionDurationStr = secondsToTimeStr(gMissionDurationSeconds);
    var missionDurationHours = parseInt(missionDurationStr.substr(0,3));

    for (var i = 0; i < missionDurationHours * 2; i++) {
        itemSecondsFromTierStart = (i * 60 * 60) / 2 - gTier2StartSeconds;
        if (itemSecondsFromTierStart >= 0 && itemSecondsFromTierStart <= secondsOnTier2) {
            itemLocX = gTier2Left + itemSecondsFromTierStart * gTier2PixelsPerSecond;
            barHeight = gTier2Height / 8;
            barTop = tierBottom - barHeight;
            topPoint = new paper.Point(itemLocX, barTop);
            bottomPoint = new paper.Point(itemLocX, tierBottom);
            aLine = new paper.Path.Line(topPoint, bottomPoint);
            aLine.strokeColor = 'orange';
            gTier2Group.addChild(aLine);
        }
    }
}

function drawTier2NavBox(seconds) {
    gTier2NavGroup.removeChildren();

    var locX = gTier2Left + ((seconds - gTier2StartSeconds) * gTier2PixelsPerSecond);
    var navBoxWidth = Math.round(gTier2Width / gNavZoomFactor);
    gTier2NavBoxLocX = locX - (navBoxWidth / 2);
    if (gTier2NavBoxLocX < gTier2Left) {
        gTier2NavBoxLocX = gTier2Left;
    } else if (gTier2NavBoxLocX + navBoxWidth > gTier2Left + gTier2Width) {
        gTier2NavBoxLocX = (gTier2Left + gTier2Width) - navBoxWidth;
    }

    var navBoxRect = new paper.Rectangle(gTier2NavBoxLocX, gTier2Top, navBoxWidth, gTier2Height);
    var navBoxRectPath = paper.Path.Rectangle(navBoxRect);
    navBoxRectPath.strokeColor = 'white';
    gTier2NavGroup.addChild(navBoxRectPath);

    var leftGradient = new paper.Point(gTier3Left, gTier3Top);
    var rightGradient = new paper.Point(gTier2NavBoxLocX, gTier2Top);
    var zoomRect = new Path({
        segments:   [[gTier2NavBoxLocX, gTier2Top],
            [gTier2NavBoxLocX, (gTier2Top + gTier2Height)],
            [gTier3Left, (gTier3Top + gTier3Height)],
            [gTier3Left, gTier3Top]],
        //strokeColor: 'white',
        strokeColor: {
            gradient: {
                stops: ['black', 'white']
            },
            origin: leftGradient,
            destination: rightGradient
        },
        closed: true,
        strokeWidth: 1,
        strokeJoin: 'round',
        //fillColor: "white",
        fillColor: {
            gradient: {
                stops: ['black', 'black', 'white']
            },
            origin: leftGradient,
            destination: rightGradient
        },
        opacity: 0.2
    });
    gTier2NavGroup.addChild(zoomRect);

    leftGradient = new paper.Point(gTier2NavBoxLocX + navBoxWidth, gTier1Top);
    rightGradient = new paper.Point(gTier3Left + gTier3Width, gTier3Top + gTier3Height);
    zoomRect = new Path({
        segments:   [[gTier2NavBoxLocX + navBoxWidth, gTier2Top],
            [gTier2NavBoxLocX + navBoxWidth, (gTier2Top + gTier2Height)],
            [gTier3Left + gTier3Width, (gTier3Top + gTier3Height)],
            [gTier3Left + gTier3Width, gTier3Top]],
        //strokeColor: 'white',
        strokeColor: {
            gradient: {
                stops: ['white', 'black']
            },
            origin: leftGradient,
            destination: rightGradient
        },
        closed: true,
        strokeWidth: 1,
        strokeJoin: 'round',
        //fillColor: "white",
        fillColor: {
            gradient: {
                stops: ['white', 'black', 'black']
            },
            origin: leftGradient,
            destination: rightGradient
        },
        opacity: 0.2
    });
    gTier2NavGroup.addChild(zoomRect);
}

function drawTier3() {
    gTier3Group.removeChildren();

    var tierBottom = gTier3Height + gTier3Top;
    var tierRect = new paper.Rectangle(1, gTier3Top, gNavigatorWidth - 1, gTier3Height);
    var tierRectPath = paper.Path.Rectangle(tierRect);
    tierRectPath.fillColor = 'black';
    tierRectPath.strokeColor = 'grey';
    gTier3Group.addChild(tierRectPath);

    gTier3StartSeconds = ((gTier2NavBoxLocX - gTier2Left) * gTier2SecondsPerPixel) + gTier2StartSeconds;
    var secondsOnTier3 = gTier3SecondsPerPixel * gTier3Width;

    // draw mission stages boxes
    for (var i = 0; i <= gMissionStages.length - 1; i++) {
        //draw if stage start is before end of viewport, and stage end is after start of viewport
        if (timeStrToSeconds(gMissionStages[i][0]) <= gTier3StartSeconds + secondsOnTier3 && timeStrToSeconds(gMissionStages[i][3]) >= gTier3StartSeconds) {
            var rectStartX = gTier3Left + (timeStrToSeconds(gMissionStages[i][0]) - gTier3StartSeconds) * gTier3PixelsPerSecond;
            var rectWidth;
            if (i != gMissionStages.length - 1) {
                rectWidth = (timeStrToSeconds(gMissionStages[i + 1][0]) - timeStrToSeconds(gMissionStages[i][0])) * gTier3PixelsPerSecond;
            } else {
                rectWidth = (gMissionDurationSeconds - timeStrToSeconds(gMissionStages[i][0])) * gTier3PixelsPerSecond;
            }
            if (rectStartX < gTier3Left + 2) {
                rectStartX = gTier3Left + 2;
            }
            if (rectWidth > gTier3Width - rectStartX - 1) {
                rectWidth = gTier3Width - rectStartX + gTier3Left - 1;
            }
            var stageRect = new paper.Path.Rectangle(rectStartX, gTier3Top, rectWidth, gTier3Height / 3);
            stageRect.strokeColor = '#222222';
            stageRect.fillColor ='black';
            //if (i % 2 == 0) {
            //    stageRect.fillColor = "white";
            //} else {
            //    stageRect.fillColor = "black";
            //}
            gTier3Group.addChild(stageRect);
            var stageText = new paper.PointText({
                justification: 'left',
                fontWeight: 'bold',
                fontSize: 14,
                fillColor: "grey"
            });
            var textTop = gTier3Top + (gTier3Height / 3) - 3;
            stageText.point = new paper.Point(rectStartX , textTop);
            stageText.content = gMissionStages[i][1];
            gTier3Group.addChild(stageText);
        }
    }

    //display time ticks
    var missionDurationStr = secondsToTimeStr(gMissionDurationSeconds);
    var missionDurationHours = parseInt(missionDurationStr.substr(0,3));

    for (var i = 0; i < missionDurationHours * 2; i++) {
        itemSecondsFromLeft = (i * 60 * 60) / 2 - gTier3StartSeconds;
        if (itemSecondsFromLeft >= 0 && itemSecondsFromLeft <= secondsOnTier3) {
            itemLocX = gTier3Left + (itemSecondsFromLeft * gTier3PixelsPerSecond);
            barHeight = gTier3Height / 8;
            barTop = tierBottom - barHeight;
            topPoint = new paper.Point(itemLocX, barTop);
            bottomPoint = new paper.Point(itemLocX, tierBottom);
            aLine = new paper.Path.Line(topPoint, bottomPoint);
            aLine.strokeColor = 'orange';
            gTier3Group.addChild(aLine);
        }
    }
    //display photo ticks
    for (var i = 0; i < gPhotoList.length; i++) {
        if (gPhotoList[i][2] != "") {
            itemSecondsFromLeft = timeStrToSeconds(gPhotoList[i][2]) - gTier3StartSeconds;
            if (itemSecondsFromLeft >= 0  && itemSecondsFromLeft <= secondsOnTier3) {
                itemLocX = gTier3Left + (itemSecondsFromLeft * gTier3PixelsPerSecond);
                barHeight = gTier3Height / 2;
                barTop = tierBottom - barHeight;
                topPoint = new paper.Point(itemLocX, barTop);
                bottomPoint = new paper.Point(itemLocX, tierBottom);
                aLine = new paper.Path.Line(topPoint, bottomPoint);
                aLine.strokeColor = 'green';
                gTier3Group.addChild(aLine);
            }
        }
    }
    //display utterance ticks
    //for (var i = 0; i < gUtteranceData.length; i++) {
    //    if (gUtteranceData[i][0] != "") {
    //        itemSecondsFromLeft = Math.round(timeStrToSeconds(gUtteranceData[i][0])) - gTier3StartSeconds;
    //        if (itemSecondsFromLeft >= 0  && itemSecondsFromLeft <= secondsOnTier3) {
    //            itemLocX = itemSecondsFromLeft * gTier3PixelsPerSecond;
    //            barHeight = gTier3Height / 8;
    //            var barBottom = gTier3Top + barHeight;
    //            topPoint = new paper.Point(itemLocX, gTier3Top);
    //            bottomPoint = new paper.Point(itemLocX, barBottom);
    //            aLine = new paper.Path.Line(topPoint, bottomPoint);
    //            aLine.strokeColor = 'CadetBlue';
    //            gTier3Group.addChild(aLine);
    //        }
    //    }
    //}
    //display TOC ticks and text
    gLastTier3TextPosition = 1;
    //display TOC ticks at varying heights
    for (var i = 0; i < gTOCAll.length; i++) {
        if (gLastTier3TextPosition == 1 || gLastTier3TextPosition == "") {
            var textPosition = 2;
        //} else if (gLastTier3TextPosition == 2) {
        //    textPosition = 3;
        } else {
            textPosition = 1;
        }
        gLastTier3TextPosition = textPosition;
        var itemSecondsFromLeft = timeStrToSeconds(gTOCAll[i][0]) - gTier3StartSeconds;
        if (itemSecondsFromLeft >= 0 && itemSecondsFromLeft <= secondsOnTier3) {
            var itemLocX = gTier3Left + (itemSecondsFromLeft * gTier3PixelsPerSecond);
            //var barHeight = gTier3Height / parseInt(gTOCAll[i][1]);
            var barHeight = gTier3Height / 4;
            var itemTop = tierBottom - textPosition * (gTier3Height / 4) + 10;
            var topPoint = new paper.Point(itemLocX - 2, itemTop - barHeight);
            var bottomPoint = new paper.Point(itemLocX - 2, itemTop);
            var aLine = new paper.Path.Line(topPoint, bottomPoint);
            aLine.strokeColor = gTOCStrokeColor;
            gTier3Group.addChild(aLine);
            //if (gTOCAll[i][1] == "1") { //if level 1 TOC item

            var itemText = new paper.PointText({
                justification: 'left',
                fontSize: 12,
                fillColor: gTOCTextColor
            });
            itemText.point = new paper.Point(itemLocX , itemTop);
            itemText.content = gTOCAll[i][2];
            var itemTextRect = new paper.Path.Rectangle(itemText.bounds);
            itemTextRect.strokeColor = "black";
            itemTextRect.fillColor = "black";
            gTier2Group.addChild(itemTextRect);
            gTier3Group.addChild(itemText);
            //}
        }
    }
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