var gLastTimeIdMarker = '';
var gLastTOCTimeId = '';
var gLastTOCTimeIdMarker = '';
var gLastCommentaryTimeId = '';
var gLastCommentaryTimeIdMarker = '';
var gLastTimeIdChecked = '';
var gCurrMissionTime = '';
var gCurrMissionDate = null;
var gIntervalID = null;
var gYTList = [];
var gTOCIndex = [];
var gUtteranceIndex = [];
var gCommentaryIndex = [];
var gPhotoList = [];
var gPhotoIndex = [];
var gCurrentPhotoTimestamp = "initial";
var gCurrVideoStartSeconds = -9442;
var gCurrVideoEndSeconds = 0;
var gPlaybackState = "normal";
var gNextVideoStartTime = -1; //used to track when one video ends to ensure next plays from 0 (needed because youtube bookmarks where you left off in videos without being asked to)
var gMissionTimeParamSent = 0;
var player;


$(document).ready(function() {
    if (typeof $.getUrlVar('t') != "undefined") {
        $("#outer-north").isLoading({ text: "Loading", position: "overlay" });
        gMissionTimeParamSent = 1;
        console.log("Loading overlay on");
    } else {
        gMissionTimeParamSent = 0;
    }

    $(".middle-east").tabs();
    $(".middle-west").tabs();

    // OUTER-LAYOUT
    $('body').layout({
        center__paneSelector:	".outer-center"
        ,   north__paneSelector:     ".outer-north"
        ,   south__paneSelector:     ".outer-south"
        ,   north__togglerLength_open: 0
        ,   south__togglerLength_open: 0
        ,	north__maxSize:			"55%"
        ,   north__minSize:         "55%"
        ,	south__maxSize:			100
        ,   south__minSize:			100
        ,	spacing_open:			5  // ALL panes
        ,	spacing_closed:			12 // ALL panes
        ,
        // NORTH-LAYOUT (child of outer-north-pane)
        north__childOptions: {

            center__paneSelector:	".north-center"
            ,   north__paneSelector:    ".north-north"
            ,   north_size:             50
            ,	west__paneSelector:		".north-west"
            ,	west__size:				"60%"
            ,	spacing_open:			5  // ALL panes
            ,	spacing_closed:			12 // ALL panes
            ,   west__togglerLength_open: 0
            ,   center__togglerLength_open: 0
            ,   north__togglerLength_open:  0
        },
        // CENTER-LAYOUT (child of outer-center-pane)
        center__childOptions: {
            center__paneSelector:	".middle-center"
            ,	west__paneSelector:		".middle-west"
            ,	east__paneSelector:		".middle-east"
            ,	west__size:				"45%"
            ,	east__size:				"45%"
            ,	spacing_open:			5  // ALL panes
            ,	spacing_closed:			12 // ALL panes
            ,   west__togglerLength_open: 0
            ,   center__togglerLength_open: 0
            ,   east__togglerLength_open: 0
        }
    });
});