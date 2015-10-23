//var missionDuration = "305:36:00";
//var durationHours = parseInt(missionDuration.substr(0,3));
//var durationMinutes = parseInt(missionDuration.substr(4,2));
//var durationSeconds = parseInt(missionDuration.substr(5,2));
//var gMissionDurationSeconds = (Math.abs(durationHours) * 60 * 60) + (durationMinutes * 60) + durationSeconds;
// 1100166

var gMissionDurationSeconds = 1100166;
var gMissionDays = 12;
var gDaySelected = 1;

var gNavigatorWidth;
var gNavigatorHeight;
var gTierHeight;

var gTier1Group;
var gTier1NavGroup;
var gTier2Group;
var gTier2NavGroup;
var gTier3Group;
var gTier3NavGroup;

var gTier1NavBoxLocX;
var gTier2NavBoxLocX;

var gTier2StartSeconds;

var gTier1PixelsPerSecond;
var gTier1SecondsPerPixel;
var gTier2PixelsPerSecond;
var gTier2SecondsPerPixel;
var gTier3PixelsPerSecond;
var gTier3SecondsPerPixel;

paper.install(window);
onload = function() {
    console.log("NAV: Navigator ready");
    gApplicationReady += 1;
}

function initNavigator() {
    console.log("NAV: initNavigator called");
    paper.setup('myCanvas');

    gTier1Group = new paper.Group;
    gTier1NavGroup = new paper.Group;
    gTier2Group = new paper.Group;
    gTier2NavGroup = new paper.Group;
    gTier3Group = new paper.Group;
    var tool = new paper.Tool();

    //DRAW ----------------
    //var text = new paper.PointText({
    //    point: paper.view.center,
    //    justification: 'center',
    //    fontSize: 12,
    //    fillColor: 'grey',
    //    content: 'Mission Timeline'
    //});

    redrawAll();

    // paperscript handlers
    paper.view.onResize = function (event) {
        text.point = paper.view.center;
        redrawAll();
    };

    tool.onMouseMove = function (event) {
        if (event.point.y < gTierHeight) { //if in tier1
            drawTier1NavBox(event.point.x);
            drawTier2();
            drawTier3();
        } else if (event.point.y > (gNavigatorHeight / 3) && event.point.y < (gNavigatorHeight / 3) * 2) {// if in tier2
            drawTier2NavBox(event.point.x);
            drawTier3();
        } else { //if in tier3

        }
        //text.content = "Mission Timeline " + displayRolloverTime(event.point.x);
    };

    tool.onMouseUp = function (event) {
        //seekToTime("timeid-000100");
        //var secondsPerPixel = gMissionDurationSeconds / gNavigatorWidth;
        //var mouseSeconds = event.point.x * secondsPerPixel;
        //var timeStr = secondsToTimeStr(mouseSeconds);
        //console.log("Timeline Clicked. Jumping to " + timeStr);
        //parent.seekToTime("timeid" + timeStr.split(":").join(""));
        if (event.point.y < gTierHeight) { //if tier1 clicked
            console.log("Tier1 clicked");
            //detect day clicked
            var dayBoxWidth = Math.round(gNavigatorWidth / gMissionDays);
            gDaySelected = Math.floor(event.point.x / dayBoxWidth) + 1;
            console.log("Day clicked: " + gDaySelected);
        } else if (event.point.y > (gNavigatorHeight / 3) && event.point.y < (gNavigatorHeight / 3) * 2) {// if tier2 clicked
            console.log("Tier2 clicked");
        } else { //tier3 clicked
            console.log("Tier3 clicked");
        }
        redrawAll();
    };
}

function redrawAll() {
    setDynamicWidthVariables();

    gTier1Group.removeChildren();
    gTier1NavGroup.removeChildren();
    gTier2Group.removeChildren();
    gTier3Group.removeChildren();
    drawTier1();
    drawTier2();
    drawTier3();
    //render navigator
    paper.view.draw();
}

function setDynamicWidthVariables() {
    gNavigatorWidth = paper.view.size.width;
    gNavigatorHeight = paper.view.size.height;
    gTierHeight = Math.round(gNavigatorHeight / 3) - 4;

    gTier1PixelsPerSecond = gNavigatorWidth / gMissionDurationSeconds;
    gTier1SecondsPerPixel = gMissionDurationSeconds / gNavigatorWidth;
    gTier2PixelsPerSecond = gNavigatorWidth / (gMissionDurationSeconds / gMissionDays);
    gTier2SecondsPerPixel = (gMissionDurationSeconds / gMissionDays) / gNavigatorWidth;
    gTier3PixelsPerSecond = gNavigatorWidth / (gMissionDurationSeconds / gMissionDays / gMissionDays);
    gTier3SecondsPerPixel = (gMissionDurationSeconds / gMissionDays / gMissionDays) / gNavigatorWidth;
}

function drawTier1() {
    var tier1Top = 0;
    var tier1bottom = gTierHeight;
    var tier1Rect = new paper.Rectangle(1, tier1Top, gNavigatorWidth, gTierHeight);
    var tier1RectPath = paper.Path.Rectangle(tier1Rect);
    tier1RectPath.strokeColor = 'grey';
    gTier1Group.addChild(tier1RectPath);

    var pixelsPerSecond = gNavigatorWidth  / gMissionDurationSeconds;
    for (var i = 0; i < gTOCAll.length; i++) {
        var data = gTOCAll[i].split('|');
        if (data[1] == "1") { //if level 1 TOC item
            var TOCItemLocX = Math.round(timeStrToSeconds(data[0]) * pixelsPerSecond);
            var topPoint = new paper.Point(TOCItemLocX, tier1Top);
            var bottomPoint = new paper.Point(TOCItemLocX, tier1bottom);
            var aLine = new paper.Path.Line(topPoint, bottomPoint);
            aLine.strokeColor = '#444444';
            gTier1Group.addChild(aLine);
        }
    }
}

function drawTier1NavBox(locX) {
    gTier1NavGroup.removeChildren();
    var tier1Top = 0;
    var navBoxWidth = Math.round(gNavigatorWidth / gMissionDays);
    gTier1NavBoxLocX = locX - (navBoxWidth / 2);
    if (gTier1NavBoxLocX < 0) {
        gTier1NavBoxLocX = 0;
    } else if (gTier1NavBoxLocX + navBoxWidth > gNavigatorWidth) {
        gTier1NavBoxLocX = gNavigatorWidth - navBoxWidth;
    }
    var navBoxRect = new paper.Rectangle(gTier1NavBoxLocX, tier1Top, navBoxWidth, gTierHeight);
    var navBoxRectPath = paper.Path.Rectangle(navBoxRect);
    navBoxRectPath.strokeColor = 'white';
    gTier1NavGroup.addChild(navBoxRectPath);

    //var navBoxText = new paper.PointText({
    //    justification: 'center',
    //    fontSize: 10,
    //    fillColor: '#444444'
    //});
    //navBoxText.point = new paper.Point(locX + (dayBoxWidth / 2), tier1Top + (gTierHeight / 2) + 2);
    //navBoxText.content = "Day " + (i + 1);
    //gTier1Group.addChild(navBoxText);
}

function drawTier2() {
    gTier2Group.removeChildren();

    var tier2Top = Math.round(gNavigatorHeight / 3);
    var tier2bottom = gTierHeight + tier2Top;
    var tier2Rect = new paper.Rectangle(1, tier2Top, gNavigatorWidth, gTierHeight);
    var tier2RectPath = paper.Path.Rectangle(tier2Rect);
    tier2RectPath.strokeColor = 'grey';
    gTier2Group.addChild(tier2RectPath);

    gTier2StartSeconds = gTier1SecondsPerPixel * gTier1NavBoxLocX;
    for (var i = 0; i < gTOCAll.length; i++) {
        var data = gTOCAll[i].split('|');
        var itemSeconds = Math.round(timeStrToSeconds(data[0])) - gTier2StartSeconds;
        var tier2ItemLocX = itemSeconds * gTier2PixelsPerSecond;
        var barHeight = gTierHeight / parseInt(data[1]);
        var barTop = tier2bottom - barHeight;
        var topPoint = new paper.Point(tier2ItemLocX, barTop);
        var bottomPoint = new paper.Point(tier2ItemLocX, tier2bottom);
        var aLine = new paper.Path.Line(topPoint, bottomPoint);
        aLine.strokeColor = '#444444';
        if (data[1] == "1") { //if level 1 TOC item
            var itemText = new paper.PointText({
                justification: 'left',
                fontSize: 10,
                strokeColor: '#444444'
            });
            itemText.point = new paper.Point(tier2ItemLocX , tier2Top + (gTierHeight / 2) + 2);
            itemText.content = data[2];
            gTier2Group.addChild(itemText);
        }
        gTier2Group.addChild(aLine);
    }
}

function drawTier2NavBox(locX) {
    gTier2NavGroup.removeChildren();

    var tier2Top = Math.round(gNavigatorHeight / 3);
    var navBoxWidth = Math.round(gNavigatorWidth / gMissionDays);
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

    var tier3Top = Math.round(gNavigatorHeight / 3) * 2;
    var tier3bottom = gTierHeight + tier3Top;
    var tier3Rect = new paper.Rectangle(1, tier3Top, gNavigatorWidth, gTierHeight);
    var tier3RectPath = paper.Path.Rectangle(tier3Rect);
    tier3RectPath.strokeColor = 'grey';
    gTier3Group.addChild(tier3RectPath);

    var startSeconds = (gTier2SecondsPerPixel * gTier2NavBoxLocX) + gTier2StartSeconds;
    for (var i = 0; i < gTOCAll.length; i++) {
        var data = gTOCAll[i].split('|');
        var itemSeconds = Math.round(timeStrToSeconds(data[0])) - startSeconds;
        var tier3ItemLocX = itemSeconds * gTier3PixelsPerSecond;
        var barHeight = gTierHeight / parseInt(data[1]);
        var barTop = tier3bottom - barHeight;
        var topPoint = new paper.Point(tier3ItemLocX, barTop);
        var bottomPoint = new paper.Point(tier3ItemLocX, tier3bottom);
        var aLine = new paper.Path.Line(topPoint, bottomPoint);
        aLine.strokeColor = '#444444';
        if (data[1] == "1") { //if level 1 TOC item
            var itemText = new paper.PointText({
                justification: 'left',
                fontSize: 10,
                strokeColor: '#444444'
            });
            itemText.point = new paper.Point(tier3ItemLocX , tier3Top + (gTierHeight / 2) + 2);
            itemText.content = data[2];
            gTier3Group.addChild(itemText);
        }
        gTier3Group.addChild(aLine);
    }
}

function displayRolloverTime(mousex) {
    var secondsPerPixel = gMissionDurationSeconds / gNavigatorWidth;
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