var gHoveredUtteranceArray = [];

window.onload = function() {
    //add an onclick function to all utterances. function calls parent of his iFrame to seek video to that time.
    $( "tr.utterance" ).click(function(){
        parent.seekToTime($(this).attr('id'));
    });
};

$(document).ready(function(){
    $('.utterancetable').delegate('.utterance', 'mouseenter', function() {
        var loctop = $(this).position().top;
        var locright = $(this).position().left + $(this).width() - 28;
        $('.share-button').animate({top: loctop, left: locright}, 0);
        var hoveredUtteranceText = $(this).text().replace(/\n/g, "|");
        hoveredUtteranceText = hoveredUtteranceText.replace(/  /g, "");
        gHoveredUtteranceArray = hoveredUtteranceText.split("|");
    });

    new Share(".share-button", {
        ui: {
            flyout: "middle left",
            button_text: ""
        },
        networks: {
            google_plus: {
                enabled: "false",
                before: function(element) {
                    this.url = "http://apollo17.org?t=" + gHoveredUtteranceArray[1];
                },
                after: function() {
                    console.log("User shared google plus: ", this.url);
                    ga('send', 'event', 'share', 'click', 'google plus');
                }
            },
            facebook: {
                app_id: "1639595472942714",
                before: function(element) {
                    //this.url = element.getAttribute("data-url");
                    this.title = "Apollo 17 in Real-time - Moment: " + gHoveredUtteranceArray[1];
                    this.url = "http://apollo17.org?t=" + gHoveredUtteranceArray[1];
                    this.description = gHoveredUtteranceArray[1] + " " + gHoveredUtteranceArray[2] + ": " + gHoveredUtteranceArray[3];
                    this.image = "http://apollo17.org/mission_images/img/72-H-1454.jpg";
                },
                after: function() {
                    console.log("User shared facebook: ", this.url);
                    ga('send', 'event', 'share', 'click', 'facebook');
                }
            },
            twitter: {
                before: function(element) {
                    //this.url = element.getAttribute("data-url");
                    this.url = "http://apollo17.org?t=" + gHoveredUtteranceArray[1];
                    this.description = "%23Apollo17 in Real-time: " + gHoveredUtteranceArray[1] + " " + gHoveredUtteranceArray[2] + ": " + gHoveredUtteranceArray[3].substr(0, 68) + "... %23NASA";
                },
                after: function() {
                    console.log("User shared twitter: ", this.url);
                    ga('send', 'event', 'share', 'click', 'twitter');
                }
            },
            pinterest: {
                enabled: "false",
                before: function(element) {
                    //this.url = element.getAttribute("data-url");
                    this.url = "http://apollo17.org?t=" + gHoveredUtteranceArray[1];
                    this.description = gHoveredUtteranceArray[1] + " " + gHoveredUtteranceArray[2] + ": " + gHoveredUtteranceArray[3];
                    this.image = "http://apollo17.org/mission_images/img/72-H-1454.jpg";
                },
                after: function() {
                    console.log("User shared pinterest: ", this.url);
                    ga('send', 'event', 'share', 'click', 'pinterest');
                }
            },
            email: {
                before: function(element) {
                    //this.url = element.getAttribute("data-url");
                    this.title = "Apollo 17 in Real-time: " + gHoveredUtteranceArray[1];
                    this.description = gHoveredUtteranceArray[2] + ": " + gHoveredUtteranceArray[3] + "     " + "http://apollo17.org?t=" + gHoveredUtteranceArray[1];
                },
                after: function() {
                    console.log("User shared email: ", this.title);
                    ga('send', 'event', 'share', 'click', 'email');
                }
            }
        }
    });
});