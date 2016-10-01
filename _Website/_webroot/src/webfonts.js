(function () {

// function loadFonts() {

//     var d = $.Deferred();

//     var script = document.createElement('script');
//     script.type = 'text/javascript';
//     script.async = true;
//     script.onload = this.onApiLoadSuccess.bind(this, d);
//     script.onerror = this.onApiLoadError.bind(this, d);
//     script.src = 'https://www.youtube.com/iframe_api';
//     document.getElementsByTagName('head')[0].appendChild(script);

//     return d.promise();
// }

window.loadWebFonts = function() {
    // trace('loadWebFonts');

    var d = $.Deferred();

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
        fontloading: function(font, weight) { //weight format: n[first digit of weight]; e.g., 'n3' (= 300)
            // trace('loadWebFonts; font loaded; font: ' + font + '; weight: ' + weight);

            d.notify({
                status: 'loading',
                progress: parseFloat((++loaded / numFonts).toFixed(2)),
                font: font,
                weight: weight
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

    return d.promise();
}
})();
