
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
