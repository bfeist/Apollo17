(function () {

// window.loadVideo = function() {

    // return _deferred.promise();
// }

window.loadWebFonts = function() {
    trace('loadWebFonts');
    var _deferred = $.Deferred();

    var script = document.createElement('script');
    script.onload = onGoogleFontsReady.bind(this, _deferred);
    script.onerror = onGoogleFontsError.bind(this, _deferred);
    script.src = 'lib/webfontloader.js';
    document.getElementsByTagName('head')[0].appendChild(script);

    return _deferred.promise();
}

function onGoogleFontsError(d) {
    trace('onGoogleFontsError');
    // d.reject({
    d.resolve({
        status: 'error'
    });
}

function onGoogleFontsReady(d) {
    trace('onGoogleFontsReady');

    var families = [
        'Michroma',
        'Oswald:300,400,700',
        'Roboto Mono:200,400,500,700',
        'Roboto Slab:300'
    ];
    var loaded = 0;
    var numFonts = families.join(',').split(',').length;

    WebFont.load({
        google: {
            families: families
        },
        fontloading: function(font, weight) {
            // trace('loadWebFonts; font loaded; font: ' + font + '; weight: ' + parseInt(weight.match(/\d/)) * 100);

            d.notify({
                status: 'loading',
                progress: parseFloat((++loaded / numFonts).toFixed(2)),
                font: font,
                weight: parseInt(weight.match(/\d/)) * 100 // they use a weird format for weight: n[first digit of weight]; e.g., 'n3' equals a weight of '300'
            });
        },
        active: function() {
            // trace('loadWebFonts; all fonts loaded; args: ', arguments);
            d.resolve({
                status: 'success'
            });
        },
        inactive: function() {
            // trace('loadWebFonts; load error; args: ', arguments);
            //TODO - what happens if they don't load (or other requirements fail? general error message? proceed if not fatal? ??)
            // d.reject({
            d.resolve({
                status: 'error'
            });
        }
    });
}

})();
