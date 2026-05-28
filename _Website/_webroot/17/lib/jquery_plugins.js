//jQuery plugin function to check if a content item exists
$.fn.exists = function () {
    return this.length !== 0;
}

$.extend({
    getUrlVars: function(){
        var vars = [], hash;
        var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
        for(var i = 0; i < hashes.length; i++)
        {
            hash = hashes[i].split('=');
            vars.push(hash[0]);
            vars[hash[0]] = hash[1];
        }
        return vars;
    },
    getUrlVar: function(name){
        return $.getUrlVars()[name];
    }
});

//throttle from mekwall/jquery-throttle
(function(window) {
    var $ = window.jQuery || window.me || (window.me = {}),
        throttle = function(fn, timeout, callback, delayed, trailing, debounce) {
            timeout || (timeout = 100);
            var timer = false,
                lastCall = false,
                hasCallback = (typeof callback === "function"),
                startTimer = function(wrapper, args) {
                    timer = setTimeout(function(){
                        timer = false;
                        if (delayed || trailing) {
                            fn.apply(wrapper, args);
                            if (trailing) { lastCall = +new Date(); }
                        }
                        if (hasCallback) { callback.apply(wrapper, args); }
                    }, timeout);
                },
                wrapper = function(){
                    if (timer && !debounce) { return; }
                    if (!timer && !delayed) {
                        if (!trailing || (+new Date()-lastCall) > timeout) {
                            fn.apply(this, arguments);
                            if (trailing) { lastCall = +new Date(); }
                        }
                    }
                    if (debounce || !trailing) { clearTimeout(timer); }
                    startTimer(this, arguments);
                }
            if ($.guid) { wrapper.guid = fn.guid = fn.guid || $.guid++; }
            return wrapper;
        };
    $.throttle = throttle;
    $.debounce = function(fn, timeout, callback, delayed, trailing) {
        return throttle(fn, timeout, callback, delayed, trailing, true);
    };
})(this);
