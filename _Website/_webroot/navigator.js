//var missionDuration = "305:36:00";
//var durationHours = parseInt(missionDuration.substr(0,3));
//var durationMinutes = parseInt(missionDuration.substr(4,2));
//var durationSeconds = parseInt(missionDuration.substr(5,2));
//var gMissionDurationSeconds = (Math.abs(durationHours) * 60 * 60) + (durationMinutes * 60) + durationSeconds;
// 1100166

var gNavigatorWidth;
var gNavigatorHeight;
var gTierHeight;

var gTier1Group;
var gTier2Group;
var gTier3Group;

var gMissionDurationSeconds = 1100166;
var gMissionDays = 12;
var gDaySelected = 1;

paper.install(window);
onload = function() {
    console.log("NAV: Navigator ready");
    gApplicationReady += 1;
}

function initNavigator() {
    console.log("NAV: initNavigator called");
    paper.setup('myCanvas');

    gTier1Group = new paper.Group;
    gTier2Group = new paper.Group;
    gTier3Group = new paper.Group;
    var tool = new paper.Tool();

    gNavigatorWidth = paper.view.size.width - 1;
    gNavigatorHeight = paper.view.size.height - 1;
    gTierHeight = Math.round(gNavigatorHeight / 3) - 4;

    //DRAW ----------------
    var text = new paper.PointText({
        point: paper.view.center,
        justification: 'center',
        fontSize: 12,
        fillColor: 'grey',
        content: 'Mission Timeline'
    });

    var mouseFollowPath = new paper.Path();
    mouseFollowPath.strokeColor = 'white';

    redrawAll();

    // paperscript handlers
    paper.view.onResize = function (event) {
        gNavigatorWidth = paper.view.size.width - 1;
        gNavigatorHeight = paper.view.size.height - 1;
        text.point = paper.view.center;
        redrawAll();
    };

    tool.onMouseMove = function (event) {
        mouseFollowPath.removeSegments();
        mouseFollowPath.add(event.point.x, 0);
        mouseFollowPath.add(event.point.x, gNavigatorHeight);

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
    gTier1Group.removeChildren();
    gTier2Group.removeChildren();
    gTier3Group.removeChildren();
    drawTier1();
    drawTier2();
    drawTier3();
    //render navigator
    paper.view.draw();
}

function drawTier1() {
    var tier1Top = 1;
    var tier1bottom = Math.round(gNavigatorHeight / 3);
    var tier1Rect = new paper.Rectangle(1, tier1Top, gNavigatorWidth, gTierHeight);
    var tier1RectPath = paper.Path.Rectangle(tier1Rect);
    tier1RectPath.strokeColor = 'grey';
    gTier1Group.addChild(tier1RectPath);

    //draw day boxes
    var dayBoxWidth = Math.round(gNavigatorWidth / gMissionDays);
    for (var i = 0; i <= 12; i++) {
        var dayBoxX = dayBoxWidth * i;
        var dayBoxRect = new paper.Rectangle(dayBoxX, tier1Top, dayBoxWidth, gTierHeight);
        var dayBoxRectPath = paper.Path.Rectangle(dayBoxRect);
        dayBoxRectPath.strokeColor = '#444444';
        gTier1Group.addChild(dayBoxRectPath);

        var dayBoxText = new paper.PointText({
            justification: 'center',
            fontSize: 10,
            fillColor: '#444444'
        });
        dayBoxText.point = new paper.Point(dayBoxX + (dayBoxWidth / 2), tier1Top + (gTierHeight / 2) + 2);
        dayBoxText.content = "Day " + (i + 1);
        gTier1Group.addChild(dayBoxText);
    }
    //draw selected box
    var selectedDayBoxX = dayBoxWidth * (gDaySelected - 1);
    var selectedDayBoxRect = new paper.Rectangle(selectedDayBoxX, tier1Top, dayBoxWidth, gTierHeight);
    var selectedDayBoxRectPath = paper.Path.Rectangle(selectedDayBoxRect);
    selectedDayBoxRectPath.strokeColor = 'white';
    gTier1Group.addChild(selectedDayBoxRectPath);
}

function drawTier2() {
    var tier2Top = Math.round(gNavigatorHeight / 3);
    var tier2bottom = gTierHeight + tier2Top;
    var tier2Rect = new paper.Rectangle(1, tier2Top, gNavigatorWidth, gTierHeight);
    var tier2RectPath = paper.Path.Rectangle(tier2Rect);
    tier2RectPath.strokeColor = 'grey';
    gTier2Group.addChild(tier2RectPath);

    var pixelsPerSecond = gNavigatorWidth / (gMissionDurationSeconds / gMissionDays);
    var startSeconds = Math.round(gMissionDurationSeconds / gMissionDays) * (gDaySelected - 1);
    var endSeconds = Math.round(gMissionDurationSeconds / gMissionDays) * gDaySelected;
    for (var i = 0; i < gTOCAll.length; i++) {
        var data = gTOCAll[i].split('|');
        if (data[1] == "1") { //if level 1 TOC item
            var itemSeconds = Math.round(timeStrToSeconds(data[0])) - startSeconds;
            var TOCItemLocX = itemSeconds * pixelsPerSecond;

            var topPoint = new paper.Point(TOCItemLocX, tier2Top);
            var bottomPoint = new paper.Point(TOCItemLocX, tier2bottom);
            var aLine = new paper.Path.Line(topPoint, bottomPoint);
            aLine.strokeColor = '#444444';
            gTier2Group.addChild(aLine);

            var itemText = new paper.PointText({
                justification: 'left',
                fontSize: 10,
                fillColor: '#444444'
            });
            itemText.point = new paper.Point(TOCItemLocX , tier2Top + (gTierHeight / 2) + 2);
            itemText.content = data[2];
            gTier2Group.addChild(itemText);
        }
    }
}

function drawTier3() {
    var tier3Top = Math.round(gNavigatorHeight / 3) * 2;
    var tier3bottom = gNavigatorHeight;
    var tier3Rect = new paper.Rectangle(1, tier3Top, gNavigatorWidth, gTierHeight);
    var tier3RectPath = paper.Path.Rectangle(tier3Rect);
    tier3RectPath.strokeColor = 'grey';
    gTier3Group.addChild(tier3RectPath);

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