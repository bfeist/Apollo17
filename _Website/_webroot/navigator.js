var gNavZoomFactor = 25;
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

var graphFontFamily = 'Roboto Mono';

var gColorTier1BoxStroke = '#507a9b'; //"lightgrey";
var gColorTier2BoxStroke = '#588caf'; //"lightgrey"; #84b8d9
var gColorTier3BoxStroke = '#84b8d9'; //"lightgrey"; #5E92A6
var gColorTier1Text = "#eeeeee"; //'#999999';
var gColorMissionStageStroke = "grey";
var gColorMissionStageText = "lightgrey";
var gColorZoomFillLight = 'white';
var gColorZoomFillDark = 'black';
var gColorZoomStrokeLight = 'white';
var gColorZoomStrokeDark = 'lightgrey';
var gColorVideoRegionBackground =  '#010047';
var gColorVideoRegionStroke =  'blue';
var gColorVideo3DRenderRegionBackground =  '#270047';
var gColorVideo3DRenderRegionStroke =  '#4D0062';
var gColorTOCText = "#999999";
var gColorTOCStroke = "orange";
var gColorPhotoTicks = '#00C000'; //'green';
var gColorTimeTicks = '#333333';
var gColorUtteranceTicksPAO = 'grey';
var gColorUtteranceTicksCrew = 'CadetBlue';
var gColorUtteranceTicksCC = 'lightgrey';

var gColorZoomPane1Border = '#5E92A6';
var gColorZoomPane2Border = '#84b8d9';

var gColorCursor = 'red';
var gColorNavCursor = '#5E92A6'; //'yellow';

var gNaxBoxZoomFadeOpacity = 0.2;
var gAlphaRectOpacity = 0.4;

var gHeightTimeTickDenominator = 1;
var gHeightPhotoTickDenominator = 6;
var gHeightUtteranceTickDenominator = 14;
var gHeightVideoRectDenominator = 6;

function initNavigator() {
    trace("NAV: initNavigator");

    paper.install(window);
    paper.setup('myCanvas');
    //init navigator
    gCurrMissionTime = timeIdToTimeStr(gDefaultStartTimeId); //set clock to start time; //TODO make this handle t parameter time

    gTier1Group = new paper.Group;
    gTier1NavGroup = new paper.Group;
    gTier2Group = new paper.Group;
    gTier2NavGroup = new paper.Group;
    gTier3Group = new paper.Group;
    gCursorGroup = new paper.Group;
    gNavCursorGroup = new paper.Group;
    var tool = new paper.Tool();

    redrawAll();

    gApplicationReady += 1;
    trace("APPREADY: NAV: Navigator ready: " + gApplicationReady);

    // paperscript handlers
    paper.view.onResize = $.throttle(function() {
            redrawAll();
        }, 250);


    tool.onMouseMove = function (event) {
        //trace("on mouse move");
        gMouseOnNavigator = true;

        var mouseXSeconds;
        gNavCursorGroup.removeChildren();
        if (event.point.y < gTier1Top + gTier1Height + gTierSpacing) { //if in tier1
            mouseXSeconds = ((event.point.x - gTier1Left) * gTier1SecondsPerPixel) - gCountdownSeconds;
            if (mouseXSeconds < gCountdownSeconds * -1) {
                mouseXSeconds = gCountdownSeconds * -1;
            } else if (mouseXSeconds > gMissionDurationSeconds) {
                mouseXSeconds = gMissionDurationSeconds;
            }
            //trace(mouseXSeconds);
            drawTier1NavBox(mouseXSeconds);
            drawTier2();
            drawTier2NavBox(mouseXSeconds);
            drawTier3();
        } else if (event.point.y >= gTier1Top + gTier1Height + gTierSpacing && event.point.y < gTier2Top + gTier2Height + gTierSpacing) {// if in tier2
            mouseXSeconds = (event.point.x - gTier2Left) * gTier2SecondsPerPixel + gTier2StartSeconds;
            if (mouseXSeconds < gTier2StartSeconds) {
                mouseXSeconds = gTier2StartSeconds;
            } else if (mouseXSeconds > gTier2StartSeconds + (gTier2Width * gTier2SecondsPerPixel)) {
                mouseXSeconds = gTier2StartSeconds + (gTier2Width * gTier2SecondsPerPixel);
            }
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
            trace("NAV: Tier1 clicked");
            ga('send', 'event', 'navigator', 'click', 'tier1');
            mouseXSeconds =( (event.point.x - gTier1Left) * gTier1SecondsPerPixel) - gCountdownSeconds;
        } else if (event.point.y >= gTier1Top + gTier1Height + gTierSpacing && event.point.y < gTier2Top + gTier2Height + gTierSpacing) {// if tier2 clicked
            trace("NAV: Tier2 clicked");
            ga('send', 'event', 'navigator', 'click', 'tier2');
            mouseXSeconds = (event.point.x - gTier2Left) * gTier2SecondsPerPixel + gTier2StartSeconds;
        } else { //tier3 clicked
            trace("NAV: Tier3 clicked");
            ga('send', 'event', 'navigator', 'click', 'tier3');
            mouseXSeconds = (event.point.x - gTier3Left) * gTier3SecondsPerPixel + gTier3StartSeconds;
        }
        gCurrMissionTime = secondsToTimeStr(mouseXSeconds);
        redrawAll();
        trace("NAV: Jumping to " + gCurrMissionTime);
        seekToTime(timeStrToTimeId(gCurrMissionTime));
    };

    $('#myCanvas').mouseleave(function() {
        onMouseOutHandler();
    });

    $(document).bind("mouseleave",function(event) {
        //trace("$(document)mouseleave triggered");
        onMouseOutHandler();
        //trace("left window");
    });
}

function onMouseOutHandler() {
    gMouseOnNavigator = false;
    //trace("mycanvas mouseleave");

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
    //gNavigatorWidth = navigatorDiv.width();
    //gNavigatorHeight = navigatorDiv.height();

    gFontScaleFactor = Math.floor(gNavigatorHeight * .020) - 1;

    gTierSpacing = gNavigatorHeight * .05; //counted twice - one for each space

    gTier1Height = gNavigatorHeight * .17;
    gTier2Height = gNavigatorHeight * .23;
    gTier3Height = (gNavigatorHeight * .50);

    gTier1Top = 1;
    gTier2Top = gTier1Height + gTierSpacing;
    gTier3Top = gTier2Top + gTier2Height + gTierSpacing;

    gTier1Width = gNavigatorWidth - (gNavigatorWidth * 0.06);
    gTier2Width = gNavigatorWidth - (gNavigatorWidth * 0.03);
    gTier3Width = gNavigatorWidth;

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
    //trace("redrawAll()");
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

function updateNavigator() {
    //trace("updateNavigator()");
    setDynamicWidthVariables();

    //draw tiers at different steps in time given the resolution in seconds
    var curSeconds = timeStrToSeconds(gCurrMissionTime);
    if (curSeconds % parseInt(gTier2SecondsPerPixel) == 0) { //redraw when time has move one tier2 pixel
        //trace("updateNavigator():redraw tier 1");
        drawTier1();
    }
    //always redraw tier2 and 3 to make tier3 scroll (once per second)
    drawTier1NavBox(curSeconds);
    drawTier2();
    drawTier2NavBox(curSeconds);
    drawTier3();
    drawCursor(curSeconds);

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
        fontFamily: graphFontFamily,
        fontSize: 11 + gFontScaleFactor,
        fillColor: gColorCursor
    });
    timeText.content = secondsToTimeStr(seconds);
    timeText.point = new paper.Point(cursorLocX - timeText.bounds.width / 2 , gTier3Top + 12.5);
    var cornerSize = new paper.Size(3, 3);
    var timeTextRect = new paper.Path.RoundRectangle(timeText.bounds, cornerSize);
    //var timeTextRect = new paper.Path.Rectangle(timeText.bounds);
    timeTextRect.strokeColor = gColorCursor;
    timeTextRect.fillColor = "black";
    //timeTextRect.opacity = 0.5;
    timeTextRect.scale(1.1, 1.2);
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
        fontFamily: graphFontFamily,
        fontSize: 11 + gFontScaleFactor,
        fillColor: gColorNavCursor
    });
    timeText.content = secondsToTimeStr(seconds);
    timeText.point = new paper.Point(cursorLocX - timeText.bounds.width / 2 , gTier3Top + 12.5);
    if (timeText.point.x < 5) {
        timeText.point.x = 5;
    } else if (timeText.point.x > gNavigatorWidth - timeText.bounds.width - 5) {
        timeText.point.x = gNavigatorWidth - timeText.bounds.width - 5;
    }
    var cornerSize = new paper.Size(3, 3);
    var timeTextRect = new paper.Path.RoundRectangle(timeText.bounds, cornerSize);
    //var timeTextRect = new paper.Path.Rectangle(timeText.bounds);
    timeTextRect.strokeColor = gColorNavCursor;
    timeTextRect.fillColor = 'black';
    //timeTextRect.opacity = 0.5;
    timeTextRect.scale(1.1, 1.2);
    gNavCursorGroup.addChild(timeTextRect);
    gNavCursorGroup.addChild(timeText);
}

function drawTier1() {
    gTier1Group.removeChildren();
    var tempGroup = new paper.Group;

    var tierBottom = gTier1Top + gTier1Height;
    var tierRect = new paper.Rectangle(gTier1Left, gTier1Top, gTier1Width, gTier1Height);
    var cornerSize = new paper.Size(2, 2);
    var tierRectPath = paper.Path.RoundRectangle(tierRect, cornerSize);
    //var tierRectPath = paper.Path.Rectangle(tierRect);
    tierRectPath.strokeColor = gColorTier1BoxStroke;
    tempGroup.addChild(tierRectPath);

    // draw mission stages boxes
    for (var i = 0; i < gMissionStages.length; i++) {
        var itemLocX = gTier1Left + (timeStrToSeconds(gMissionStages[i][0]) + gCountdownSeconds) * gTier1PixelsPerSecond;
        topPoint = new paper.Point(itemLocX, gTier1Top);
        bottomPoint = new paper.Point(itemLocX, gTier1Top + (gTier1Height / 2));
        var stageStroke = new paper.Path.Line(topPoint, bottomPoint);
        stageStroke.strokeColor = gColorMissionStageStroke;
        stageStroke.strokeWidth = 1;

        var stageText = new paper.PointText({
            justification: 'left',
            fontFamily: graphFontFamily,
            fontSize: 7 + gFontScaleFactor,
            fillColor: gColorTier1Text
        });
        var textTop = gTier1Top + (gTier1Height / 2);
        stageText.point = new paper.Point(itemLocX + 2 , textTop - 1);
        stageText.content = gMissionStages[i][1];
        //
        //var stageTickFade = new paper.Path.Rectangle(itemLocX - 10, gTier1Top, 10, gTier1Height / 2);
        //
        //var from = new paper.Point(itemLocX - 10, gTier1Top);
        //var to = new paper.Point(itemLocX, gTier2Top + (gTier1Height / 2));
        //var a = new RGBColor(255,255,255);
        //var b = new RGBColor(0,0,0);
        //var gradient = new paper.Gradient([a,b]);
        //var gradientColor = new GradientColor(gradient, from, to);
        //stageTickFade.fillColor = gradientColor;


        var stageTextRect = new paper.Path.Rectangle(stageText.bounds);
        stageTextRect.fillColor ='black';
        tempGroup.addChild(stageTextRect); //blank out area behind text
        //tempGroup.addChild(stageTickFade);
        tempGroup.addChild(stageStroke);
        tempGroup.addChild(stageText);
    }

    ////display time ticks
    //var missionDurationStr = secondsToTimeStr(gMissionDurationSeconds + gCountdownSeconds);
    //var missionDurationHours = parseInt(missionDurationStr.substr(0,3));
    //for (i = 0; i < missionDurationHours; i++) {
    //    var itemLocX = gTier1Left + (i * 60 * 60) * gTier1PixelsPerSecond;
    //    barHeight = gTier1Height / gHeightTimeTickDenominator;
    //    barTop = tierBottom - barHeight;
    //    topPoint = new paper.Point(itemLocX, barTop);
    //    bottomPoint = new paper.Point(itemLocX, tierBottom);
    //    aLine = new paper.Path.Line(topPoint, bottomPoint);
    //    aLine.strokeColor = gColorTimeTicks;
    //    tempGroup.addChild(aLine);
    //}

    // draw video segments boxes
    for (i = 0; i < gVideoSegments.length; i++) {
        var rectStartX = gTier1Left + (timeStrToSeconds(gVideoSegments[i][0]) + gCountdownSeconds) * gTier1PixelsPerSecond;
        var rectWidth = (timeStrToSeconds(gVideoSegments[i][1]) - timeStrToSeconds(gVideoSegments[i][0])) * gTier1PixelsPerSecond;
        var rectTop = (gTier1Top + gTier1Height) - gTier1Height / gHeightVideoRectDenominator;
        var rectHeight = gTier1Height / gHeightVideoRectDenominator;
        var vidRect = new paper.Path.Rectangle(rectStartX, rectTop, rectWidth, rectHeight);
        if (gVideoSegments[i][2] == "3D") {
            vidRect.fillColor = gColorVideo3DRenderRegionStroke;
            vidRect.strokeColor = gColorVideo3DRenderRegionStroke;
        } else {
            vidRect.fillColor = gColorVideoRegionStroke;
            vidRect.strokeColor = gColorVideoRegionStroke;
        }
        tempGroup.addChild(vidRect);
    }

    //display photo ticks
    for (i = 0; i < gPhotoData.length; i++) {
        if (gPhotoData[i][0] != "") {
            itemLocX = gTier1Left + (timeIdToSeconds(gPhotoData[i][0]) + gCountdownSeconds) * gTier1PixelsPerSecond;
            var barHeight = gTier1Height / gHeightPhotoTickDenominator;
            var barTop = tierBottom - barHeight;
            var topPoint = new paper.Point(itemLocX, barTop);
            var bottomPoint = new paper.Point(itemLocX, tierBottom);
            var aLine = new paper.Path.Line(topPoint, bottomPoint);
            aLine.strokeColor = gColorPhotoTicks;
            tempGroup.addChild(aLine);
        }
    }

    //display lunar orbit ticks
    for (i = 0; i < gOrbitData.length; i++) {
        itemLocX = gTier1Left + (timeStrToSeconds(gOrbitData[i][0]) + gCountdownSeconds) * gTier1PixelsPerSecond;
        barHeight = gTier1Height / gHeightPhotoTickDenominator;
        barTop = tierBottom - barHeight;
        topPoint = new paper.Point(itemLocX, barTop);
        bottomPoint = new paper.Point(itemLocX, tierBottom);
        aLine = new paper.Path.Line(topPoint, bottomPoint);
        aLine.strokeColor = gColorTOCStroke;
        tempGroup.addChild(aLine);
    }

    //rasterize temp group for entire tier
    if (tempGroup.children.length > 0) {
        var t1PhotoTicksRaster = tempGroup.rasterize();
        gTier1Group.addChild(t1PhotoTicksRaster);
    }
    tempGroup.remove();
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
    gTier2StartSeconds = (gTier1SecondsPerPixel * (gTier1NavBoxLocX - gTier1Left) - gCountdownSeconds);

    var navBoxRect = new paper.Rectangle(gTier1NavBoxLocX, gTier1Top, navBoxWidth, gTier1Height);
    var cornerSize = new paper.Size(2, 2);
    var navBoxRectPath = paper.Path.RoundRectangle(navBoxRect, cornerSize);
    //var navBoxRectPath = paper.Path.Rectangle(navBoxRect);
    navBoxRectPath.strokeColor = gColorZoomPane1Border;
    gTier1NavGroup.addChild(navBoxRectPath);

    var leftAlphaRect = new paper.Rectangle(gTier1Left, gTier1Top, gTier1NavBoxLocX - gTier1Left, gTier1Height);
    var leftAlphaRectPath = paper.Path.RoundRectangle(leftAlphaRect, cornerSize);
    leftAlphaRectPath.fillColor = new paper.RGBColor(0,0,0, gAlphaRectOpacity);
    gTier1NavGroup.addChild(leftAlphaRectPath);

    var rightAlphaRect = new paper.Rectangle(gTier1NavBoxLocX + navBoxWidth, gTier1Top, gTier1Width - gTier1NavBoxLocX + navBoxWidth , gTier1Height);
    var rightAlphaRectPath = paper.Path.RoundRectangle(rightAlphaRect, cornerSize);
    rightAlphaRectPath.fillColor = new paper.RGBColor(0,0,0, gAlphaRectOpacity);
    gTier1NavGroup.addChild(rightAlphaRectPath);

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
    var tempGroup = new paper.Group;

    var tierBottom = gTier2Height + gTier2Top;
    var tierRect = new paper.Rectangle(gTier2Left, gTier2Top, gTier2Width, gTier2Height);
    var cornerSize = new paper.Size(3, 3);
    var tierRectPath = paper.Path.RoundRectangle(tierRect, cornerSize);
    //var tierRectPath = paper.Path.Rectangle(tierRect);
    tierRectPath.fillColor = "black";
    tierRectPath.strokeColor = gColorTier2BoxStroke;
    tempGroup.addChild(tierRectPath);
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
            if (gVideoSegments[i][2] == "3D") {
                vidRect.fillColor = gColorVideo3DRenderRegionStroke;
                vidRect.strokeColor = gColorVideo3DRenderRegionStroke;
            } else {
                vidRect.fillColor = gColorVideoRegionBackground;
                vidRect.strokeColor = gColorVideoRegionStroke;
            }
            tempGroup.addChild(vidRect);
        }
    }

    //display photo ticks
    for (i = 0; i < gPhotoData.length; i++) {
        if (gPhotoData[i][0] != "") {
            itemSecondsFromLeft = timeIdToSeconds(gPhotoData[i][0]) - gTier2StartSeconds;
            if (itemSecondsFromLeft > secondsOnTier2)
                break;
            if (itemSecondsFromLeft >= 0) {
                itemLocX = gTier2Left + itemSecondsFromLeft * gTier2PixelsPerSecond;
                barHeight = gTier2Height / gHeightPhotoTickDenominator;
                barTop = tierBottom - barHeight;
                topPoint = new paper.Point(itemLocX, barTop);
                bottomPoint = new paper.Point(itemLocX, tierBottom);
                aLine = new paper.Path.Line(topPoint, bottomPoint);
                aLine.strokeColor = gColorPhotoTicks;
                tempGroup.addChild(aLine);
            }
        }
    }

    //display time ticks
    var missionDurationStr = secondsToTimeStr(gMissionDurationSeconds);
    var missionDurationHours = parseInt(missionDurationStr.substr(0,3));
    for (i = 0; i < missionDurationHours * 2; i++) {
        itemSecondsFromLeft = (i * 60 * 60) / 2 - gTier2StartSeconds;
        if (itemSecondsFromLeft > secondsOnTier2)
            break;
        if (itemSecondsFromLeft >= 0) {
            itemLocX = gTier2Left + itemSecondsFromLeft * gTier2PixelsPerSecond;
            barHeight = gTier2Height / gHeightTimeTickDenominator;
            barTop = tierBottom - barHeight;
            topPoint = new paper.Point(itemLocX, barTop);
            bottomPoint = new paper.Point(itemLocX, tierBottom);
            aLine = new paper.Path.Line(topPoint, bottomPoint);
            aLine.strokeColor = gColorTimeTicks;
            tempGroup.addChild(aLine);
        }
    }

    //draw TOC items
    gLastTier2TextPosition = 1;
    for (i = 0; i < gTOCData.length; i++) {
        var itemSecondsFromLeft = timeStrToSeconds(gTOCData[i][0]) - gTier2StartSeconds;
        if (itemSecondsFromLeft >= 0 && itemSecondsFromLeft <= secondsOnTier2) {
            var itemLocX = gTier2Left + itemSecondsFromLeft * gTier2PixelsPerSecond;
            var barHeight = gTier2Height / 3;
            var barTop = tierBottom - barHeight;
            var topPoint = new paper.Point(itemLocX, barTop);
            var bottomPoint = new paper.Point(itemLocX, tierBottom);
            var aLine = new paper.Path.Line(topPoint, bottomPoint);
            aLine.strokeColor = gColorTOCStroke;
            tempGroup.addChild(aLine);
            if (gTOCData[i][1] == "1") { //if level 1 TOC item
                var itemText = new paper.PointText({
                    justification: 'left',
                    fontFamily: graphFontFamily,
                    fontSize: 8 + gFontScaleFactor,
                    fillColor: gColorTOCText
                });
                textTop = barTop + 2;
                itemText.point = new paper.Point(itemLocX + 2 , textTop);
                itemText.content = gTOCData[i][2];
                var itemTextRect = new paper.Path.Rectangle(itemText.bounds);
                itemTextRect.strokeColor = "black";
                itemTextRect.fillColor = "black";
                tempGroup.addChild(itemTextRect);
                tempGroup.addChild(itemText);
            }
        }
    }

    // draw lunar orbits
    for (i = 0; i <= gOrbitData.length - 1; i++) {
        //draw if orbit start is before end of viewport, and stage end is after start of viewport
        if (timeStrToSeconds(gOrbitData[i][0]) <= gTier2StartSeconds + secondsOnTier2 && timeStrToSeconds(gOrbitData[i][2]) >= gTier2StartSeconds) {
            itemLocX = gTier2Left + (timeStrToSeconds(gOrbitData[i][0]) - gTier2StartSeconds) * gTier2PixelsPerSecond;

            var drawTick = true;
            if (itemLocX < gTier2Left + 1) {
                itemLocX = gTier2Left + 1;
                drawTick = false;
            }
            topPoint = new paper.Point(itemLocX, gTier2Top);
            bottomPoint = new paper.Point(itemLocX, gTier2Top + (gTier2Height / 3));

            if (drawTick) {
                var orbitStroke = new paper.Path.Line(topPoint, bottomPoint);
                orbitStroke.strokeColor = gColorTOCStroke;
                tempGroup.addChild(orbitStroke); // draw orange tick for stage
            }

            //var orbitText = new paper.PointText({
            //    justification: 'left',
            //    fontFamily: graphFontFamily,
            //    //fontWeight: 'bold',
            //    fontSize: 8 + gFontScaleFactor,
            //    fillColor: gColorTOCText
            //});
            //var textTop = gTier2Top + (gTier2Height / 2) - 3;
            //orbitText.point = new paper.Point(itemLocX + 2 , textTop);
            //orbitText.content = "Begin lunar orbit " + gOrbitData[i][1] + "/75";

            //var stageTextRect = new paper.Path.Rectangle(stageText.bounds);
            //stageTextRect.fillColor ='black';
            //tempGroup.addChild(stageTextRect); //blank out area behind text
            //tempGroup.addChild(orbitText); // text label
        }
    }

    // draw mission stages
    for (i = 0; i <= gMissionStages.length - 1; i++) {
        //draw if stage start is before end of viewport, and stage end is after start of viewport
        if (timeStrToSeconds(gMissionStages[i][0]) <= gTier2StartSeconds + secondsOnTier2 && timeStrToSeconds(gMissionStages[i][3]) >= gTier2StartSeconds) {
            itemLocX = gTier2Left + (timeStrToSeconds(gMissionStages[i][0]) - gTier2StartSeconds) * gTier2PixelsPerSecond;

            var drawStageTick = true;
            if (itemLocX < gTier2Left + 1) {
                itemLocX = gTier2Left + 1;
                drawStageTick = false;
            }
            topPoint = new paper.Point(itemLocX, gTier2Top);
            bottomPoint = new paper.Point(itemLocX, gTier2Top + (gTier2Height / 2));

            if (drawStageTick) {
                var stageStroke = new paper.Path.Line(topPoint, bottomPoint);
                stageStroke.strokeColor = gColorMissionStageStroke;
                tempGroup.addChild(stageStroke); // draw grey outline of stage segment
            }

            var stageText = new paper.PointText({
                justification: 'left',
                fontFamily: graphFontFamily,
                //fontWeight: 'bold',
                fontSize: 8 + gFontScaleFactor,
                fillColor: gColorMissionStageText
            });
            textTop = gTier2Top + (gTier2Height / 2) - 3;
            stageText.point = new paper.Point(itemLocX + 2 , textTop);
            stageText.content = gMissionStages[i][1];

            var stageTextRect = new paper.Path.Rectangle(stageText.bounds);
            stageTextRect.fillColor ='black';
            tempGroup.addChild(stageTextRect); //blank out area behind text
            tempGroup.addChild(stageText); // text label
        }
    }

    if (tempGroup.children.length > 0) {
        var t2Raster = tempGroup.rasterize();
        gTier2Group.addChild(t2Raster);
    }
    tempGroup.remove();
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
    gTier3StartSeconds = ((gTier2NavBoxLocX - gTier2Left) * gTier2SecondsPerPixel) + gTier2StartSeconds;

    var navBoxRect = new paper.Rectangle(gTier2NavBoxLocX, gTier2Top, navBoxWidth, gTier2Height);
    var cornerSize = new paper.Size(3, 3);
    var navBoxRectPath = paper.Path.RoundRectangle(navBoxRect, cornerSize);
    //var navBoxRectPath = paper.Path.Rectangle(navBoxRect);
    navBoxRectPath.strokeColor = gColorZoomPane2Border;
    gTier2NavGroup.addChild(navBoxRectPath);

    var leftAlphaRect = new paper.Rectangle(gTier2Left, gTier2Top, gTier2NavBoxLocX - gTier2Left, gTier2Height);
    var leftAlphaRectPath = paper.Path.RoundRectangle(leftAlphaRect, cornerSize);
    leftAlphaRectPath.fillColor = new paper.RGBColor(0, 0, 0, gAlphaRectOpacity);
    gTier2NavGroup.addChild(leftAlphaRectPath);

    var rightAlphaRect = new paper.Rectangle(gTier2NavBoxLocX + navBoxWidth, gTier2Top, gTier1Width - gTier2NavBoxLocX + navBoxWidth , gTier2Height);
    var rightAlphaRectPath = paper.Path.RoundRectangle(rightAlphaRect, cornerSize);
    rightAlphaRectPath.fillColor = new paper.RGBColor(0, 0, 0, gAlphaRectOpacity);
    gTier2NavGroup.addChild(rightAlphaRectPath);

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
    var tempGroup = new paper.Group;

    var tierBottom = gTier3Height + gTier3Top;
    var tierRect = new paper.Rectangle(1, gTier3Top, gNavigatorWidth - 1, gTier3Height);
    var cornerSize = new paper.Size(5, 5);
    var tierRectPath = paper.Path.RoundRectangle(tierRect, cornerSize);
    //var tierRectPath = paper.Path.Rectangle(tierRect);
    tierRectPath.fillColor = 'black';
    tierRectPath.strokeColor = gColorTier3BoxStroke;
    tempGroup.addChild(tierRectPath);

    var secondsOnTier3 = gTier3SecondsPerPixel * gTier3Width;

    // draw video segments boxes
    for (var i = 0; i <= gVideoSegments.length - 1; i++) {
        //draw if video segment start is before end of viewport, and video segment end is after start of viewport
        if (timeStrToSeconds(gVideoSegments[i][0]) <= gTier3StartSeconds + secondsOnTier3 && timeStrToSeconds(gVideoSegments[i][1]) >= gTier3StartSeconds) {
            var rectStartX = gTier3Left + (timeStrToSeconds(gVideoSegments[i][0]) - gTier3StartSeconds) * gTier3PixelsPerSecond;
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
            if (gVideoSegments[i][2] == "3D") {
                vidRect.fillColor = gColorVideo3DRenderRegionBackground;
                vidRect.strokeColor = gColorVideo3DRenderRegionStroke;
            } else {
                vidRect.fillColor = gColorVideoRegionBackground;
                vidRect.strokeColor = gColorVideoRegionStroke;
            }
            tempGroup.addChild(vidRect);
        }
    }

    //display time ticks
    var missionDurationStr = secondsToTimeStr(gMissionDurationSeconds);
    var missionDurationHours = parseInt(missionDurationStr.substr(0,3));
    for (i = 0; i < missionDurationHours * 2; i++) {
        itemSecondsFromLeft = (i * 60 * 60) / 2 - gTier3StartSeconds;
        if (itemSecondsFromLeft > secondsOnTier3)
            break;
        if (itemSecondsFromLeft >= 0) {
            var itemLocX = gTier3Left + itemSecondsFromLeft * gTier3PixelsPerSecond;
            barHeight = gTier3Height / gHeightTimeTickDenominator;
            barTop = tierBottom - barHeight;
            topPoint = new paper.Point(itemLocX, barTop);
            bottomPoint = new paper.Point(itemLocX, tierBottom);
            aLine = new paper.Path.Line(topPoint, bottomPoint);
            aLine.strokeColor = gColorTimeTicks;

            stageText = new paper.PointText({
                justification: 'left',
                fontFamily: graphFontFamily,
                //fontWeight: 'bold',
                fontSize: 9 + gFontScaleFactor,
                fillColor: gColorTimeTicks
            });
            textTop = gTier3Top + gTier3Height - 5;
            stageText.point = new paper.Point(itemLocX - 2 , textTop);
            stageText.rotate(-90);
            var tickTimeSeconds = (i / 2) * 60 * 60;
            stageText.content = secondsToTimeStr(tickTimeSeconds);

            tempGroup.addChild(stageText);
            tempGroup.addChild(aLine);
        }
    }

    // draw lunar orbits
    for (i = 0; i <= gOrbitData.length - 1; i++) {
        //draw if orbit start is before end of viewport, and stage end is after start of viewport
        if (timeStrToSeconds(gOrbitData[i][0]) <= gTier3StartSeconds + secondsOnTier3 && timeStrToSeconds(gOrbitData[i][2]) >= gTier3StartSeconds) {
            itemLocX = gTier3Left + (timeStrToSeconds(gOrbitData[i][0]) - gTier3StartSeconds) * gTier3PixelsPerSecond;

            var drawTick = true;
            if (itemLocX < gTier3Left + 1) {
                itemLocX = gTier3Left + 1;
                drawTick = false;
            }
            topPoint = new paper.Point(itemLocX, gTier3Top);
            bottomPoint = new paper.Point(itemLocX, gTier3Top + 12 + gFontScaleFactor);

            if (drawTick) {
                var orbitStroke = new paper.Path.Line(topPoint, bottomPoint);
                orbitStroke.strokeColor = gColorTOCStroke;
                tempGroup.addChild(orbitStroke); // draw orange tick for stage
            }

            var orbitText = new paper.PointText({
                justification: 'left',
                fontFamily: graphFontFamily,
                //fontWeight: 'bold',
                fontSize: 8 + gFontScaleFactor,
                fillColor: gColorTOCText
            });
            var textTop = gTier3Top + 10;
            orbitText.point = new paper.Point(itemLocX + 2 , textTop);
            orbitText.content = "Begin lunar orbit " + gOrbitData[i][1] + "/75";

            //var stageTextRect = new paper.Path.Rectangle(stageText.bounds);
            //stageTextRect.fillColor ='black';
            //tempGroup.addChild(stageTextRect); //blank out area behind text
            tempGroup.addChild(orbitText); // text label
        }
    }

    // draw mission stages
    for (i = 0; i <= gMissionStages.length - 1; i++) {
        //draw if stage start is before end of viewport, and stage end is after start of viewport
        if (timeStrToSeconds(gMissionStages[i][0]) <= gTier3StartSeconds + secondsOnTier3 && timeStrToSeconds(gMissionStages[i][3]) >= gTier3StartSeconds) {
            itemLocX = gTier3Left + (timeStrToSeconds(gMissionStages[i][0]) - gTier3StartSeconds) * gTier3PixelsPerSecond;

            var drawStageTick = true;
            if (itemLocX < gTier3Left + 1) {
                itemLocX = gTier3Left + 1;
                drawStageTick = false;
            }
            topPoint = new paper.Point(itemLocX, gTier3Top);
            bottomPoint = new paper.Point(itemLocX, gTier3Top + (gTier3Height / 3));

            if (drawStageTick) {
                var stageStroke = new paper.Path.Line(topPoint, bottomPoint);
                stageStroke.strokeColor = gColorMissionStageStroke;
                stageStroke.strokeWidth = 2;
                tempGroup.addChild(stageStroke); // draw grey outline of stage segment
            }

            var stageText = new paper.PointText({
                justification: 'left',
                fontFamily: graphFontFamily,
                //fontWeight: 'bold',
                fontSize: 10 + gFontScaleFactor,
                fillColor: gColorMissionStageText
            });
            textTop = gTier3Top + (gTier3Height / 3) - 5;
            stageText.point = new paper.Point(itemLocX + 2 , textTop);
            stageText.content = gMissionStages[i][1];

            var stageTextRect = new paper.Path.Rectangle(stageText.bounds);
            stageTextRect.fillColor ='black';
            tempGroup.addChild(stageTextRect); //blank out area behind text
            tempGroup.addChild(stageText); // text label
        }
    }

    //display photo ticks
    for (i = 0; i < gPhotoData.length; i++) {
        if (gPhotoData[i][0] != "") {
            itemSecondsFromLeft = timeIdToSeconds(gPhotoData[i][0]) - gTier3StartSeconds;
            if (itemSecondsFromLeft > secondsOnTier3)
                break;
            if (itemSecondsFromLeft >= 0) {
                itemLocX = gTier3Left + (itemSecondsFromLeft * gTier3PixelsPerSecond);
                barHeight = gTier3Height / gHeightPhotoTickDenominator;
                var barTop = tierBottom - barHeight;
                topPoint = new paper.Point(itemLocX, barTop);
                bottomPoint = new paper.Point(itemLocX, tierBottom);
                aLine = new paper.Path.Line(topPoint, bottomPoint);
                aLine.strokeColor = gColorPhotoTicks;
                aLine.strokeWidth = 1.5;
                tempGroup.addChild(aLine);
            }
        }
    }

    //display utterance ticks
    for (i = 0; i < gUtteranceData.length; i++) {
        itemSecondsFromLeft = timeIdToSeconds(gUtteranceData[i][0]) - gTier3StartSeconds;
        if (itemSecondsFromLeft > secondsOnTier3)
            break;
        if (itemSecondsFromLeft >= 0) {
            itemLocX = itemSecondsFromLeft * gTier3PixelsPerSecond;
            var barHeight = gTier3Height / gHeightUtteranceTickDenominator;
            if (gUtteranceData[i][1] == "PAO") {
                barHeight = barHeight * 1.5;
            }
            barTop = tierBottom - barHeight;
            topPoint = new paper.Point(itemLocX, barTop);
            bottomPoint = new paper.Point(itemLocX, tierBottom);
            aLine = new paper.Path.Line(topPoint, bottomPoint);
            if (gUtteranceData[i][1] == "PAO") {
                aLine.strokeColor = gColorUtteranceTicksPAO;
            } else if (gUtteranceData[i][1] == "CC") {
                aLine.strokeColor = gColorUtteranceTicksCC;
            } else {
                aLine.strokeColor = gColorUtteranceTicksCrew;
            }
            tempGroup.addChild(aLine);
        }
    }

    //display TOC ticks and text
    //display TOC ticks at varying heights
    for (i = 0; i < gTOCData.length; i++) {
        var textPosition = (i % 2) + 1;
        var itemSecondsFromLeft = timeStrToSeconds(gTOCData[i][0]) - gTier3StartSeconds;
        if (itemSecondsFromLeft >= 0 && itemSecondsFromLeft <= secondsOnTier3) {
            itemLocX = gTier3Left + (itemSecondsFromLeft * gTier3PixelsPerSecond);

            if (textPosition == 1) {
                barTop = gTier3Top + gTier3Height / 3;
            } else {
                barTop = gTier3Top + (gTier3Height / 3) + (gTier3Height / 4.2);
            }
            var barBottom = barTop + 12 + gFontScaleFactor;
            var topPoint = new paper.Point(itemLocX, barTop);
            var bottomPoint = new paper.Point(itemLocX, barBottom);
            var aLine = new paper.Path.Line(topPoint, bottomPoint);
            aLine.strokeColor = gColorTOCStroke;
            tempGroup.addChild(aLine);
            var itemText = new paper.PointText({
                justification: 'left',
                fontFamily: graphFontFamily,
                fontSize: 10 + gFontScaleFactor,
                fillColor: gColorTOCText
            });
            itemText.point = new paper.Point(itemLocX + 2 , barBottom - 2);
            itemText.content = gTOCData[i][2];
            tempGroup.addChild(itemText);
        }
    }
    if (tempGroup.children.length > 0) {
        var t3Raster = tempGroup.rasterize();
        gTier3Group.addChild(t3Raster);
    }
    tempGroup.remove();
}