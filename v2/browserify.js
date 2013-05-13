"use strict";

var browserify = require('browserify');

module.exports = function(ctx, done){
    Object.keys(ctx.js).map(function(src){
        var bundle = browserify();
        // @todo (lucas) Support for client side templates.  HBS first.
        bundle.bundle({'debug': false}, function(err, src){
            //
        });
    });
};
