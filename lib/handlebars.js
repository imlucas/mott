"use strict";

var through = require('through'),
  Handlebars = require("handlebars");

module.exports = function(file){
    if(!/\.hbs/.test(file) && !/\.html/.test(file)){
        return through();
    }

    var buffer = "";
    return through(function(chunk) {
        buffer += chunk.toString();
    },
    function() {

        var js = Handlebars.precompile(buffer),
            compiled = "var Handlebars = require('handlebars-runtime');\n";

        compiled += "module.exports = Handlebars.template(" + js.toString() + ");\n";
        this.queue(compiled);
        this.queue(null);
    });

};