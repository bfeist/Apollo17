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
var gFontScaleFactor;

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

var gLastTier2TextPosition;

var gTier2StartSeconds;
var gTier3StartSeconds;

var gTier1PixelsPerSecond;
var gTier1SecondsPerPixel;
var gTier2PixelsPerSecond;
var gTier2SecondsPerPixel;
var gTier3PixelsPerSecond;
var gTier3SecondsPerPixel;

var gColorTierBoxStroke = "lightgrey";
var gColorMissionStageBox = "grey";
var gColorMissionStageText = "lightgrey";
var gColorZoomFillLight = 'white';
var gColorZoomFillDark = 'black';
var gColorZoomStrokeLight = 'white';
var gColorZoomStrokeDark = 'lightgrey';
var gColorVideoRegionBackground =  '#010047';
var gColorVideoRegionStroke =  'blue';
var gColorTOCText = "grey";
var gColorTOCStroke = "lightgrey";
var gColorPhotoTicks = 'green';
var gColorTimeTicks = 'orange';
var gColorUtteranceTicks = 'CadetBlue';
var gColorCursor = 'red';
var gColorNavCursor = 'yellow';

var gNaxBoxZoomFadeOpacity = 0.2;

var gHeightTimeTickDenominator = 7;
var gHeightPhotoTickDenominator = 8;
var gHeightUtteranceTickDenominator = 14;
var gHeightVideoRectDenominator = 6;

paper.install(window);

$(document).ready(function() {
    paper.setup('myCanvas');

    //init navigator
    gCurrMissionTime = timeIdToTimeStr(gDefaultStartTimeId); //set clock to start time; //TODO make this handle t parameter time
    initNavigator();
    gApplicationReady += 1;
    console.log("APPREADY: NAV: Navigator ready: " + gApplicationReady);

    $("#myCanvas").mouseleave(function() {
        onMouseOutHandler();
    });
    //TODO fix this mouseleave to it doesn't always fire when the mouse leaves any element
    $(document).bind("mouseleave",function(event) {
        //console.log("$(document)mouseleave triggered");
        onMouseOutHandler();
        //console.log("left window");
    });
});

function initNavigator() {
    console.log("NAV: initNavigator");

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
    paper.view.onResize = function () {
        redrawAll();
    };

    tool.onMouseMove = function (event) {
        //console.log("on mouse move");
        if (gIntroInterval == null) { //only freeze navigator if initial modal isn't up
            gMouseOnNavigator = true;
        }
        var mouseXSeconds;
        gNavCursorGroup.removeChildren();
        if (event.point.y < gTier1Top + gTier1Height + gTierSpacing) { //if in tier1
            mouseXSeconds = ((event.point.x - gTier1Left) * gTier1SecondsPerPixel) - gCountdownSeconds;
            if (mouseXSeconds < gCountdownSeconds * -1) {
                mouseXSeconds = gCountdownSeconds * -1;
            } else if (mouseXSeconds > gMissionDurationSeconds) {
                mouseXSeconds = gMissionDurationSeconds;
            }
            //console.log(mouseXSeconds);
            drawTier1NavBox(mouseXSeconds);
            drawTier2();
            drawTier2NavBox(mouseXSeconds);
            drawTier3();
        } else if (event.point.y >= gTier1Top + gTier1Height + gTierSpacing && event.point.y < gTier2Top + gTier2Height + gTierSpacing) {// if in tier2
            mouseXSeconds = (event.point.x - gTier2Left) * gTier2SecondsPerPixel + gTier2StartSeconds;
            drawTier2NavBox(mouseXSeconds);
            drawTier3();
        } else if (event.point.y > gTier2Top + gTier2Height + gTierSpacing) { //if in tier3
            mouseXSeconds = (event.point.x - gTier3Left) * gTier3SecondsPerPixel + gTier3StartSeconds;
        }
        drawCursor(timeStrToSeconds(gCurrMissionTime));
        drawNavCursor(mouseXSeconds);

        // draw navigator key
        var navigatorKey = $('#navigatorKey');
        var topSectionLeftWidth = $('.headerBlock').width() - gNavigatorWidth;
        navigatorKey.css('display', 'inline');
        navigatorKey.css('top', gNavigatorHeight);
        navigatorKey.css('left', (gNavigatorWidth / 4) + topSectionLeftWidth);
        navigatorKey.css('width', gNavigatorWidth / 2);

    };

    tool.onMouseUp = function (event) {
        var mouseXSeconds;
        if (event.point.y < gTier1Top + gTier1Height + gTierSpacing) { //if tier1 clicked
            console.log("NAV: Tier1 clicked");
            mouseXSeconds =( (event.point.x - gTier1Left) * gTier1SecondsPerPixel) - gCountdownSeconds;
        } else if (event.point.y >= gTier1Top + gTier1Height + gTierSpacing && event.point.y < gTier2Top + gTier2Height + gTierSpacing) {// if tier2 clicked
            console.log("NAV: Tier2 clicked");
            mouseXSeconds = (event.point.x - gTier2Left) * gTier2SecondsPerPixel + gTier2StartSeconds;
        } else { //tier3 clicked
            console.log("NAV: Tier3 clicked");
            mouseXSeconds = (event.point.x - gTier3Left) * gTier3SecondsPerPixel + gTier3StartSeconds;
        }
        gCurrMissionTime = secondsToTimeStr(mouseXSeconds);
        //redrawAll();
        console.log("NAV: Jumping to " + gCurrMissionTime);
        seekToTime("timeid" + gCurrMissionTime.split(":").join(""));
    };
}

function onMouseOutHandler() {
    gMouseOnNavigator = false;
    //console.log("mycanvas mouseleave");

    $('#navigatorKey').css('display', '');
    if (typeof gNavCursorGroup != "undefined") {
        gNavCursorGroup.removeChildren();
    }
   redrawAll();
}

function setDynamicWidthVariables() {
    gNavigatorWidth = paper.view.size.width;
    gNavigatorHeight = paper.view.size.height;
    //var navigatorDiv = $('#navigator');
    //gNavigatorWidth = navigatorDiv.width;
    //gNavigatorHeight = navigatorDiv.height;

    gFontScaleFactor = Math.floor(gNavigatorHeight * .020) - 1;

    gTierSpacing = gNavigatorHeight * .05; //counted twice - one for each space

    gTier1Height = gNavigatorHeight * .17;
    gTier2Height = gNavigatorHeight * .23;
    gTier3Height = (gNavigatorHeight * .50);

    gTier1Top = 1;
    gTier2Top = gTier1Height + gTierSpacing;
    gTier3Top = gTier2Top + gTier2Height + gTierSpacing;

    gTier1Width = paper.view.size.width - (paper.view.size.width * 0.1);
    gTier2Width = paper.view.size.width - (paper.view.size.width * 0.05);
    gTier3Width = paper.view.size.width;

    gTier1Left = (gNavigatorWidth - gTier1Width) / 2;
    gTier2Left = (gNavigatorWidth - gTier2Width) / 2;
    gTier3Left = (gNavigatorWidth - gTier3Width) / 2;

    gTier1PixelsPerSecond = gTier1Width / (gMissionDurationSeconds + gCountdownSeconds);
    gTier1SecondsPerPixel = (gMissionDurationSeconds + gCountdownSeconds) / gTier1Width;
    gTier2PixelsPerSecond = gTier2Width / ((gMissionDurationSeconds + gCountdownSeconds) / gNavZoomFactor);
    gTier2SecondsPerPixel = ((gMissionDurationSeconds + gCountdownSeconds) / gNavZoomFactor) / gTier2Width;
    gTier3PixelsPerSecond = gTier3Width / ((gMissionDurationSeconds + gCountdownSeconds) / gNavZoomFactor / gNavZoomFactor);
    gTier3SecondsPerPixel = ((gMissionDurationSeconds + gCountdownSeconds) / gNavZoomFactor / gNavZoomFactor) / gTier3Width;
}

function redrawAll() {
    //console.log("redrawAll()");
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

    var cursorLocX = gTier1Left + ((seconds + gCountdownSeconds) * gTier1PixelsPerSecond);
    var topPoint = new paper.Point(cursorLocX, gTier1Top);
    var bottomPoint = new paper.Point(cursorLocX, tierBottom);
    var aLine = new paper.Path.Line(topPoint, bottomPoint);
    aLine.strokeColor = gColorCursor;
    gCursorGroup.addChild(aLine);

    // tier2
    tierBottom = gTier2Height + gTier2Top;
    cursorLocX = gTier2Left + ((seconds - gTier2StartSeconds) * gTier2PixelsPerSecond);
    topPoint = new paper.Point(cursorLocX, gTier2Top);
    bottomPoint = new paper.Point(cursorLocX, tierBottom);
    aLine = new paper.Path.Line(topPoint, bottomPoint);
    aLine.strokeColor = gColorCursor;
    gCursorGroup.addChild(aLine);

    // tier3
    tierBottom = gTier3Height + gTier3Top;
    cursorLocX = gTier3Left + ((seconds - gTier3StartSeconds) * gTier3PixelsPerSecond);
    topPoint = new paper.Point(cursorLocX, gTier3Top);
    bottomPoint = new paper.Point(cursorLocX, tierBottom);
    aLine = new paper.Path.Line(topPoint, bottomPoint);
    aLine.strokeColor = gColorCursor;
    gCursorGroup.addChild(aLine);

    var timeText = new paper.PointText({
        justification: 'left',
        fontWeight: 'bold',
        fontSize: 14 + gFontScaleFactor,
        fillColor: gColorCursor
    });
    timeText.content = secondsToTimeStr(seconds);
    timeText.point = new paper.Point(cursorLocX - timeText.bounds.width / 2 , gTier3Top + 14);
    var timeTextRect = new paper.Path.Rectangle(timeText.bounds);
    timeTextRect.strokeColor = gColorCursor;
    timeTextRect.fillColor = "black";
    //timeTextRect.opacity = 0.5;
    timeTextRect.scale(1.1, 1);
    gCursorGroup.addChild(timeTextRect);
    gCursorGroup.addChild(timeText);
}

function drawNavCursor(seconds) {
    gNavCursorGroup.removeChildren();
    // tier1
    var tierBottom = gTier1Height;
    var cursorLocX = gTier1Left + ((seconds + gCountdownSeconds) * gTier1PixelsPerSecond);
    var topPoint = new paper.Point(cursorLocX, gTier1Top);
    var bottomPoint = new paper.Point(cursorLocX, tierBottom);
    var aLine = new paper.Path.Line(topPoint, bottomPoint);
    aLine.strokeColor = gColorNavCursor;
    gNavCursorGroup.addChild(aLine);

    // tier2
    tierBottom = gTier2Height + gTier2Top;
    cursorLocX = gTier2Left + ((seconds - gTier2StartSeconds) * gTier2PixelsPerSecond);
    topPoint = new paper.Point(cursorLocX, gTier2Top);
    bottomPoint = new paper.Point(cursorLocX, tierBottom);
    aLine = new paper.Path.Line(topPoint, bottomPoint);
    aLine.strokeColor = gColorNavCursor;
    gNavCursorGroup.addChild(aLine);

    // tier3
    tierBottom = gTier3Height + gTier3Top;
    cursorLocX = gTier3Left + ((seconds - gTier3StartSeconds) * gTier3PixelsPerSecond);
    topPoint = new paper.Point(cursorLocX, gTier3Top);
    bottomPoint = new paper.Point(cursorLocX, tierBottom);
    aLine = new paper.Path.Line(topPoint, bottomPoint);
    aLine.strokeColor = gColorNavCursor;
    gNavCursorGroup.addChild(aLine);

    // tier3 cursor time text
    var timeText = new paper.PointText({
        justification: 'left',
        fontWeight: 'bold',
        fontSize: 14 + gFontScaleFactor,
        fillColor: gColorNavCursor
    });
    timeText.content = secondsToTimeStr(seconds);
    timeText.point = new paper.Point(cursorLocX - timeText.bounds.width / 2 , gTier3Top + 14);
    if (timeText.point.x < 5) {
        timeText.point.x = 5;
    } else if (timeText.point.x > gNavigatorWidth - timeText.bounds.width - 5) {
        timeText.point.x = gNavigatorWidth - timeText.bounds.width - 5;
    }
    var timeTextRect = new paper.Path.Rectangle(timeText.bounds);
    timeTextRect.strokeColor = gColorNavCursor;
    timeTextRect.fillColor = 'black';
    //timeTextRect.opacity = 0.5;
    timeTextRect.scale(1.1, 1);
    gNavCursorGroup.addChild(timeTextRect);
    gNavCursorGroup.addChild(timeText);
}

function drawTier1() {
    if (typeof gTier1Group !== "undefined") {
        gTier1Group.removeChildren();
    }
    var tierBottom = gTier1Top + gTier1Height;
    var tierRect = new paper.Rectangle(gTier1Left, gTier1Top, gTier1Width, gTier1Height);
    var tierRectPath = paper.Path.Rectangle(tierRect);
    tierRectPath.strokeColor = gColorTierBoxStroke;
    gTier1Group.addChild(tierRectPath);

    // draw mission stages boxes
    for (var i = 0; i < gMissionStages.length; i++) {
        var rectStartX = gTier1Left + (timeStrToSeconds(gMissionStages[i][0]) + gCountdownSeconds) * gTier1PixelsPerSecond;
        var rectWidth;
        if (i != gMissionStages.length - 1) {
            rectWidth = (timeStrToSeconds(gMissionStages[i + 1][0]) - timeStrToSeconds(gMissionStages[i][0])) * gTier1PixelsPerSecond;
        } else {
            rectWidth = (gMissionDurationSeconds - timeStrToSeconds(gMissionStages[i][0])) * gTier1PixelsPerSecond;
        }
        var stageRect = new paper.Path.Rectangle(rectStartX, gTier1Top, rectWidth, gTier1Top + gTier1Height / 2);
        stageRect.strokeColor = gColorMissionStageBox;
        stageRect.fillColor = "black";
        gTier1Group.addChild(stageRect);

        var stageText = new paper.PointText({
            justification: 'left',
            fontSize: 8 + gFontScaleFactor,
            fillColor: gColorMissionStageText
        });
        var textTop = gTier1Top + (gTier1Height / 2) - 3;
        stageText.point = new paper.Point(rectStartX + 2 , textTop);
        stageText.content = gMissionStages[i][1];
        gTier1Group.addChild(stageText);
    }

    // draw video segments boxes
    for (i = 0; i < gVideoSegments.length; i++) {
        rectStartX = gTier1Left + 2 + (timeStrToSeconds(gVideoSegments[i][0]) + gCountdownSeconds) * gTier1PixelsPerSecond;
        rectWidth = (timeStrToSeconds(gVideoSegments[i][1]) - timeStrToSeconds(gVideoSegments[i][0])) * gTier1PixelsPerSecond;
        var rectTop = (gTier1Top + gTier1Height) - gTier1Height / gHeightVideoRectDenominator;
        var rectHeight = gTier1Height / gHeightVideoRectDenominator;
        var vidRect = new paper.Path.Rectangle(rectStartX, rectTop, rectWidth, rectHeight);
        vidRect.strokeColor = 'blue';
        vidRect.fillColor = 'blue';
        gTier1Group.addChild(vidRect);
    }

    //display photo ticks
    var tempGroup = new paper.Group;
    for (i = 0; i < gPhotoList.length; i++) {
        if (gPhotoList[i][0] != "") {
            itemLocX = gTier1Left + (timeIdToSeconds(gPhotoList[i][0]) + gCountdownSeconds) * gTier1PixelsPerSecond;
            var barHeight = gTier1Height / gHeightPhotoTickDenominator;
            var barTop = tierBottom - barHeight;
            var topPoint = new paper.Point(itemLocX, barTop);
            var bottomPoint = new paper.Point(itemLocX, tierBottom);
            var aLine = new paper.Path.Line(topPoint, bottomPoint);
            aLine.strokeColor = gColorPhotoTicks;
            tempGroup.addChild(aLine);
        }
    }
    var t1PhotoTicksRaster = tempGroup.rasterize();
    tempGroup.remove();
    tempGroup = null;
    gTier1Group.addChild(t1PhotoTicksRaster);

    //display time ticks
    tempGroup = new paper.Group;
    var missionDurationStr = secondsToTimeStr(gMissionDurationSeconds + gCountdownSeconds);
    var missionDurationHours = parseInt(missionDurationStr.substr(0,3));
    for (i = 0; i < missionDurationHours; i++) {
        var itemLocX = gTier1Left + (i * 60 * 60) * gTier1PixelsPerSecond;
        barHeight = gTier1Height / gHeightTimeTickDenominator;
        barTop = tierBottom - barHeight;
        topPoint = new paper.Point(itemLocX, barTop);
        bottomPoint = new paper.Point(itemLocX, tierBottom);
        aLine = new paper.Path.Line(topPoint, bottomPoint);
        aLine.strokeColor = gColorTimeTicks;
        tempGroup.addChild(aLine);
    }
    var t1TimeTicksRaster = tempGroup.rasterize();
    tempGroup.remove();
    tempGroup = null;
    gTier1Group.addChild(t1TimeTicksRaster);
}

function drawTier1NavBox(seconds) {
    gTier1NavGroup.removeChildren();

    var locX = gTier1Left + ((seconds + gCountdownSeconds) * gTier1PixelsPerSecond);
    var navBoxWidth = gTier1Width / gNavZoomFactor;
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

    //add zoom fades
    var leftGradient = new paper.Point(gTier2Left, gTier2Top);
    var rightGradient = new paper.Point(gTier1NavBoxLocX, gTier1Top);
    var zoomRect = new Path({
        segments:   [
            [gTier1NavBoxLocX, gTier1Top],
            [gTier1NavBoxLocX, (gTier1Top + gTier1Height)],
            [gTier2Left, (gTier2Top + gTier2Height)],
            [gTier2Left, gTier2Top]
        ],
        strokeColor: {
            gradient: {
                stops: [gColorZoomStrokeDark, gColorZoomStrokeLight]
            },
            origin: leftGradient,
            destination: rightGradient
        },
        closed: true,
        strokeWidth: 1,
        strokeJoin: 'round',
        fillColor: {
            gradient: {
                stops: [gColorZoomFillDark, gColorZoomFillLight]
            },
            origin: leftGradient,
            destination: rightGradient
        },
        opacity: gNaxBoxZoomFadeOpacity
    });
    gTier1NavGroup.addChild(zoomRect);
    leftGradient = new paper.Point(gTier1NavBoxLocX + navBoxWidth, gTier1Top);
    rightGradient = new paper.Point(gTier2Left + gTier2Width, gTier2Top);
    zoomRect = new Path({
        segments: [
            [gTier1NavBoxLocX + navBoxWidth, gTier1Top],
            [gTier1NavBoxLocX + navBoxWidth, (gTier1Top + gTier1Height)],
            [gTier2Left + gTier2Width, gTier2Top + gTier2Height],
            [gTier2Left + gTier2Width, gTier2Top]
        ],
        strokeColor: {
            gradient: {
                stops: [gColorZoomStrokeLight, gColorZoomStrokeDark]
            },
            origin: leftGradient,
            destination: rightGradient
        },
        closed: true,
        strokeWidth: 1,
        strokeJoin: 'round',
        fillColor: {
            gradient: {
                stops: [gColorZoomFillLight, gColorZoomFillDark]
            },
            origin: leftGradient,
            destination: rightGradient
        },
        opacity: gNaxBoxZoomFadeOpacity
    });
    gTier1NavGroup.addChild(zoomRect);
}

function drawTier2() {
    gTier2Group.removeChildren();

    var tierBottom = gTier2Height + gTier2Top;
    var tierRect = new paper.Rectangle(gTier2Left, gTier2Top, gTier2Width, gTier2Height);
    var tierRectPath = paper.Path.Rectangle(tierRect);
    tierRectPath.fillColor = "black";
    tierRectPath.strokeColor = gColorTierBoxStroke;
    gTier2Group.addChild(tierRectPath);

    gTier2StartSeconds = (gTier1SecondsPerPixel * (gTier1NavBoxLocX - gTier1Left) - gCountdownSeconds);
    var secondsOnTier2 = gTier2SecondsPerPixel * gTier2Width;

    // draw video segments boxes
    for (var i = 0; i < gVideoSegments.length; i++) {
        //draw if video segment start is before end of viewport, and video segment end is after start of viewport
        if (timeStrToSeconds(gVideoSegments[i][0]) <= gTier2StartSeconds + secondsOnTier2 && timeStrToSeconds(gVideoSegments[i][1]) >= gTier2StartSeconds) {
            var rectStartX = gTier2Left + (timeStrToSeconds(gVideoSegments[i][0]) - gTier2StartSeconds) * gTier2PixelsPerSecond;
            var rectWidth = (timeStrToSeconds(gVideoSegments[i][1]) - timeStrToSeconds(gVideoSegments[i][0])) * gTier2PixelsPerSecond;
            if (rectStartX < 0) {
                rectWidth -= Math.abs(rectStartX);
            }
            if (rectStartX < gTier2Left + 1) {
                rectStartX = gTier2Left + 1;
            }
            if (rectWidth > gTier2Width - rectStartX - 1) {
                rectWidth = gTier2Width - rectStartX + gTier2Left - 1;
            }
            var rectTop = (gTier2Top + gTier2Height) - gTier2Height / gHeightVideoRectDenominator;
            var rectHeight = gTier2Height / gHeightVideoRectDenominator - 2;
            var vidRect = new paper.Path.Rectangle(rectStartX, rectTop, rectWidth, rectHeight);
            vidRect.fillColor = gColorVideoRegionBackground;
            vidRect.strokeColor = gColorVideoRegionStroke;
            gTier2Group.addChild(vidRect);
        }
    }

    // draw mission stages boxes
    for (i = 0; i <= gMissionStages.length - 1; i++) {
        //draw if stage start is before end of viewport, and stage end is after start of viewport
        if (timeStrToSeconds(gMissionStages[i][0]) <= gTier2StartSeconds + secondsOnTier2 && timeStrToSeconds(gMissionStages[i][3]) >= gTier2StartSeconds) {
            rectStartX = gTier2Left + (timeStrToSeconds(gMissionStages[i][0]) - gTier2StartSeconds) * gTier2PixelsPerSecond;
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
            stageRect.strokeColor = gColorMissionStageBox;
            //stageRect.fillColor ='black';

            var stageText = new paper.PointText({
                justification: 'left',
                fontWeight: 'bold',
                fontSize: 11 + gFontScaleFactor,
                fillColor: gColorMissionStageText
            });
            var textTop = gTier2Top + (gTier2Height / 2) - 5;
            stageText.point = new paper.Point(rectStartX + 2 , textTop);
            stageText.content = gMissionStages[i][1];

            var stageTextRect = new paper.Path.Rectangle(stageText.bounds);
            stageTextRect.fillColor ='black';
            gTier2Group.addChild(stageTextRect); //blank out area behind text
            gTier2Group.addChild(stageRect); // draw grey outline of stage segment
            gTier2Group.addChild(stageText); // text label
        }
    }

    //display photo ticks
    var tempGroup = new paper.Group;
    for (i = 0; i < gPhotoList.length; i++) {
        if (gPhotoList[i][0] != "") {
            itemSecondsFromTierStart = timeIdToSeconds(gPhotoList[i][0]) - gTier2StartSeconds;
            if (itemSecondsFromTierStart >= 0  && itemSecondsFromTierStart <= secondsOnTier2) {
                itemLocX = gTier2Left + itemSecondsFromTierStart * gTier2PixelsPerSecond;
                barHeight = gTier2Height / gHeightPhotoTickDenominator;
                barTop = tierBottom - barHeight;
                topPoint = new paper.Point(itemLocX, barTop);
                bottomPoint = new paper.Point(itemLocX, tierBottom);
                aLine = new paper.Path.Line(topPoint, bottomPoint);
                aLine.strokeColor = 'green';
                tempGroup.addChild(aLine);
            }
        }
    }
    var t2PhotoTicksRaster = tempGroup.rasterize();
    tempGroup.remove();
    tempGroup = null;
    gTier2Group.addChild(t2PhotoTicksRaster);

    //display time ticks
    var missionDurationStr = secondsToTimeStr(gMissionDurationSeconds);
    var missionDurationHours = parseInt(missionDurationStr.substr(0,3));

    for (i = 0; i < missionDurationHours * 2; i++) {
        itemSecondsFromTierStart = (i * 60 * 60) / 2 - gTier2StartSeconds;
        if (itemSecondsFromTierStart >= 0 && itemSecondsFromTierStart <= secondsOnTier2) {
            itemLocX = gTier2Left + itemSecondsFromTierStart * gTier2PixelsPerSecond;
            barHeight = gTier2Height / gHeightTimeTickDenominator;
            barTop = tierBottom - barHeight;
            topPoint = new paper.Point(itemLocX, barTop);
            bottomPoint = new paper.Point(itemLocX, tierBottom);
            aLine = new paper.Path.Line(topPoint, bottomPoint);
            aLine.strokeColor = 'orange';
            gTier2Group.addChild(aLine);
        }
    }

    //draw TOC items
    gLastTier2TextPosition = 1;
    for (i = 0; i < gTOCAll.length; i++) {
        var textPosition = 1;
        var itemSecondsFromTierStart = timeStrToSeconds(gTOCAll[i][0]) - gTier2StartSeconds;
        if (itemSecondsFromTierStart >= 0 && itemSecondsFromTierStart <= secondsOnTier2) {
            var itemLocX = gTier2Left + itemSecondsFromTierStart * gTier2PixelsPerSecond;
            var barHeight = gTier2Height / parseInt(gTOCAll[i][1]);
            var barTop = tierBottom - barHeight;
            var topPoint = new paper.Point(itemLocX, barTop);
            var bottomPoint = new paper.Point(itemLocX, tierBottom);
            var aLine = new paper.Path.Line(topPoint, bottomPoint);
            aLine.strokeColor = gColorTOCStroke;
            gTier2Group.addChild(aLine);
            if (gTOCAll[i][1] == "1") { //if level 1 TOC item
                var itemText = new paper.PointText({
                    justification: 'left',
                    fontSize: 10 + gFontScaleFactor,
                    fillColor: gColorTOCText
                });
                textTop = tierBottom - textPosition * (gTier2Height / 3) + 3;
                itemText.point = new paper.Point(itemLocX + 2 , textTop);
                itemText.content = gTOCAll[i][2];
                var itemTextRect = new paper.Path.Rectangle(itemText.bounds);
                itemTextRect.strokeColor = "black";
                itemTextRect.fillColor = "black";
                gTier2Group.addChild(itemTextRect);
                gTier2Group.addChild(itemText);
            }
        }
    }
}

function drawTier2NavBox(seconds) {
    gTier2NavGroup.removeChildren();

    var locX = gTier2Left + ((seconds - gTier2StartSeconds) * gTier2PixelsPerSecond);
    var navBoxWidth = gTier2Width / gNavZoomFactor;
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

    //add zoom fades
    var leftGradient = new paper.Point(gTier3Left, gTier3Top);
    var rightGradient = new paper.Point(gTier2NavBoxLocX, gTier2Top);
    var zoomRect = new Path({
        segments:   [[gTier2NavBoxLocX, gTier2Top],
            [gTier2NavBoxLocX, (gTier2Top + gTier2Height)],
            [gTier3Left, (gTier3Top + gTier3Height)],
            [gTier3Left, gTier3Top]],
        strokeColor: {
            gradient: {
                stops: [gColorZoomStrokeDark, gColorZoomStrokeLight]
            },
            origin: leftGradient,
            destination: rightGradient
        },
        closed: true,
        strokeWidth: 1,
        strokeJoin: 'round',
        fillColor: {
            gradient: {
                stops: [gColorZoomFillDark, gColorZoomFillLight]
            },
            origin: leftGradient,
            destination: rightGradient
        },
        opacity: gNaxBoxZoomFadeOpacity
    });
    gTier2NavGroup.addChild(zoomRect);

    leftGradient = new paper.Point(gTier2NavBoxLocX + navBoxWidth, gTier2Top);
    rightGradient = new paper.Point(gTier3Left + gTier3Width, gTier3Top);
    zoomRect = new Path({
        segments:   [[gTier2NavBoxLocX + navBoxWidth, gTier2Top],
            [gTier2NavBoxLocX + navBoxWidth, (gTier2Top + gTier2Height)],
            [gTier3Left + gTier3Width, (gTier3Top + gTier3Height)],
            [gTier3Left + gTier3Width, gTier3Top]],
        strokeColor: {
            gradient: {
                stops: [gColorZoomStrokeLight, gColorZoomStrokeDark]
            },
            origin: leftGradient,
            destination: rightGradient
        },
        closed: true,
        strokeWidth: 1,
        strokeJoin: 'round',
        fillColor: {
            gradient: {
                stops: [gColorZoomFillLight, gColorZoomFillDark]
            },
            origin: leftGradient,
            destination: rightGradient
        },
        opacity: gNaxBoxZoomFadeOpacity
    });
    gTier2NavGroup.addChild(zoomRect);
}

function drawTier3() {
    gTier3Group.removeChildren();

    var tierBottom = gTier3Height + gTier3Top;
    var tierRect = new paper.Rectangle(1, gTier3Top, gNavigatorWidth - 1, gTier3Height);
    var tierRectPath = paper.Path.Rectangle(tierRect);
    tierRectPath.fillColor = 'black';
    tierRectPath.strokeColor = gColorTierBoxStroke;
    gTier3Group.addChild(tierRectPath);

    gTier3StartSeconds = ((gTier2NavBoxLocX - gTier2Left) * gTier2SecondsPerPixel) + gTier2StartSeconds;
    var secondsOnTier3 = gTier3SecondsPerPixel * gTier3Width;

    // draw video segments boxes
    for (var i = 0; i <= gVideoSegments.length - 1; i++) {
        //draw if video segment start is before end of viewport, and video segment end is after start of viewport
        if (timeStrToSeconds(gVideoSegments[i][0]) <= gTier3StartSeconds + secondsOnTier3 && timeStrToSeconds(gVideoSegments[i][1]) >= gTier3StartSeconds) {
            var rectStartX = gTier3Left + 3 + (timeStrToSeconds(gVideoSegments[i][0]) - gTier3StartSeconds) * gTier3PixelsPerSecond;
            var rectWidth = ((timeStrToSeconds(gVideoSegments[i][1]) - timeStrToSeconds(gVideoSegments[i][0])) * gTier3PixelsPerSecond);
            if (rectStartX < 0) {
                rectWidth -= Math.abs(rectStartX);
            }
            if (rectStartX < gTier3Left + 2) {
                rectStartX = gTier3Left + 2;
            }
            if (rectWidth > gTier3Width - rectStartX - 1) {
                rectWidth = gTier3Width - rectStartX + gTier3Left - 3;
            }
            var rectTop = (gTier3Top + gTier3Height) - gTier3Height / gHeightVideoRectDenominator;
            var rectHeight = gTier3Height / gHeightVideoRectDenominator - 2;
            var vidRect = new paper.Path.Rectangle(rectStartX, rectTop, rectWidth, rectHeight);
            vidRect.fillColor = gColorVideoRegionBackground;
            vidRect.strokeColor = gColorVideoRegionStroke;
            gTier3Group.addChild(vidRect);
        }
    }

    // draw mission stages boxes
    for (i = 0; i <= gMissionStages.length - 1; i++) {
        //draw if stage start is before end of viewport, and stage end is after start of viewport
        if (timeStrToSeconds(gMissionStages[i][0]) <= gTier3StartSeconds + secondsOnTier3 && timeStrToSeconds(gMissionStages[i][3]) >= gTier3StartSeconds) {
            rectStartX = gTier3Left + (timeStrToSeconds(gMissionStages[i][0]) - gTier3StartSeconds) * gTier3PixelsPerSecond;
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
            stageRect.strokeColor = 'grey';
            //stageRect.fillColor ='black';

            var stageText = new paper.PointText({
                justification: 'left',
                fontWeight: 'bold',
                fontSize: 14 + gFontScaleFactor,
                fillColor: "lightgrey"
            });
            var textTop = gTier3Top + (gTier3Height / 3) - 3;
            stageText.point = new paper.Point(rectStartX + 2 , textTop);
            stageText.content = gMissionStages[i][1];
            var stageTextRect = new paper.Path.Rectangle(stageText.bounds);
            stageTextRect.fillColor ='black';
            //stageTextRect.opacity = 0.5;
            gTier3Group.addChild(stageTextRect); //blank out area behind text
            gTier3Group.addChild(stageRect); // draw grey outline of stage segment
            gTier3Group.addChild(stageText); // text label
        }
    }

    //display photo ticks
    var tempGroup = new paper.Group;
    for (i = 0; i < gPhotoList.length; i++) {
        if (gPhotoList[i][0] != "") {
            itemSecondsFromLeft = timeIdToSeconds(gPhotoList[i][0]) - gTier3StartSeconds;
            if (itemSecondsFromLeft >= 0  && itemSecondsFromLeft <= secondsOnTier3) {
                itemLocX = gTier3Left + (itemSecondsFromLeft * gTier3PixelsPerSecond);
                barHeight = gTier3Height / gHeightPhotoTickDenominator;
                barTop = tierBottom - barHeight;
                topPoint = new paper.Point(itemLocX, barTop);
                bottomPoint = new paper.Point(itemLocX, tierBottom);
                aLine = new paper.Path.Line(topPoint, bottomPoint);
                aLine.strokeColor = 'green';
                tempGroup.addChild(aLine);
            }
        }
    }
    var t3PhotoTicksRaster = tempGroup.rasterize();
    tempGroup.remove();
    tempGroup = null;
    gTier3Group.addChild(t3PhotoTicksRaster);

    //display utterance ticks
    tempGroup = new paper.Group;
    for (i = 0; i < gUtteranceData.length; i++) {
        if (gUtteranceData[i][0] != "") {
            itemSecondsFromLeft = timeStrToSeconds(gUtteranceData[i][0]) - gTier3StartSeconds;
            if (itemSecondsFromLeft >= 0  && itemSecondsFromLeft <= secondsOnTier3) {
                itemLocX = itemSecondsFromLeft * gTier3PixelsPerSecond;
                var barHeight = gTier3Height / gHeightUtteranceTickDenominator;
                barTop = gTier3Top + gTier3Height / 3;
                var barBottom = barTop + barHeight;
                topPoint = new paper.Point(itemLocX, barTop);
                bottomPoint = new paper.Point(itemLocX, barBottom);
                aLine = new paper.Path.Line(topPoint, bottomPoint);
                aLine.strokeColor = gColorUtteranceTicks;
                tempGroup.addChild(aLine);
            }
        }
    }
    var t3UtteranceTicksRaster = tempGroup.rasterize();
    tempGroup.remove();
    tempGroup = null;
    gTier3Group.addChild(t3UtteranceTicksRaster);

    //display TOC ticks and text
    //display TOC ticks at varying heights
    for (i = 0; i < gTOCAll.length; i++) {
        var textPosition = (i % 2) + 1;
        var itemSecondsFromLeft = timeStrToSeconds(gTOCAll[i][0]) - gTier3StartSeconds;
        if (itemSecondsFromLeft >= 0 && itemSecondsFromLeft <= secondsOnTier3) {
            var itemLocX = gTier3Left + (itemSecondsFromLeft * gTier3PixelsPerSecond);
            barTop = gTier3Top + gTier3Height / 3;
            if (textPosition == 1) {
                barBottom = barTop + (gTier3Height / 4); //proportional bar heights
            } else {
                barBottom = barTop + (gTier3Height / 2.2);
            }
            var topPoint = new paper.Point(itemLocX, barTop);
            var bottomPoint = new paper.Point(itemLocX, barBottom);
            var aLine = new paper.Path.Line(topPoint, bottomPoint);
            aLine.strokeColor = gColorTOCStroke;
            gTier3Group.addChild(aLine);
            var itemText = new paper.PointText({
                justification: 'left',
                fontSize: 12 + gFontScaleFactor,
                fillColor: gColorTOCText
            });
            itemText.point = new paper.Point(itemLocX + 2 , barBottom);
            itemText.content = gTOCAll[i][2];
            gTier3Group.addChild(itemText);
        }
    }
}