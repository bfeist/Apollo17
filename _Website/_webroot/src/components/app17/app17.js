
//vary the load requirements by device, screen-size, ?


var appConfig = {
    waitFor: [
        'loadWebFonts',
        'loadVideo'
    ]
};

// var webFonts = {
//     scripts: [
//         'lib/webfontloader.js',
//         'src/webfonts.js'
//     ]
// }

var App17 = {
    init: function (config) {
        var waitFunctionCalls = _.map(config.waitFor, function(funcName) {
            return window[funcName]();
        });

        trace('waitFunctionCalls, ', waitFunctionCalls);

        $.when.apply(this, waitFunctionCalls)
            .progress(function () {
                // trace('# App17 - progress... arguments: ', arguments);
            })
            .done(function () {
                trace('# App17 init complete; arguments: ', arguments);
                var event = {
                    type: "App17.ready"
                }

                _.each(arguments, function(result) {
                    console.log('result: ', result);
                    switch (result.component) {
                        case 'video' : {
                            event.player = result.player;
                            break;
                        }
                        default : {
                            trace('no handler for result: ', result);
                            break;
                        }
                    }
                });

                $.event.trigger(event);
            })
            .fail(function () {
                trace('# App17 - something broke; arguments: ', arguments);
            })
            .always(function () {
                // trace('# App17 - always... arguments: ', arguments);
            });
    },
    state: {

    }
}

// wait for document to be ready so we have access to the full DOM before we act
// between loading as many scripts as we can async, and appending them to the body, we can render the initial screen as quickly as possible
$(document).ready(function(){
    App17.init(appConfig);
});
