
var debug = true;

var logger = debug 
    ? {
        log: console.log.bind(console),
        info: console.info.bind(console),
        warn: console.warn.bind(console),
        error: console.error.bind(console)
    }
    : {
        log: function() {},
        info: function() {},
        warn: function() {},
        error: function() {}
    };

window.trace = logger.log;

function getUrlVars() {
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for (var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = decodeURIComponent(hash[1]);
    }
    return vars;
}

function getUrlVar(name) {
    return getUrlVars()[name];
}