"use strict";

var fs = require('fs');

module.exports = function(ctx, done){
    var buf = ("module.exports = process.env = " +
        JSON.stringify(ctx.getConfig(), null, 4) + ';');
    fs.writeFile(ctx.path('config.js'), buf, done);
};