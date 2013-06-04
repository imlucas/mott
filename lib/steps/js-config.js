"use strict";

var fs = require('fs');

module.exports = function(ctx, done){
    var buf = ("module.exports = process.env = " +
        JSON.stringify(ctx.getConfig(), null, 4) + ';'),
        dest = ctx['js config path'] || './config.js';
    fs.writeFile(ctx.path(dest), buf, done);
};