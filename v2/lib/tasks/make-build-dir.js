"use strict";
var fs = require('fs');

// Make sure the build output directory exists.
module.exports = function(ctx, done){
    fs.exists(ctx.path('build'), function(exists){
        if(exists){
            return done();
        }
        fs.mkdir(ctx.path('build'), done);
    });
};