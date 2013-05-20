"use strict";

var browserify = require('browserify'),
    async = require('async'),
    fs = require('fs');

module.exports = function(ctx, done){
    async.parallel(Object.keys(ctx.js).map(function(src){
        return function(cb){
            var bundle = browserify(src);

            // @todo (lucas) Support for client side templates.  HBS first.
            bundle.bundle({'debug': false}, function(err, buf){
                if(err) return cb(err);

                fs.writeFile(ctx.js[src].dest, buf, function(err){
                    if(err) return cb(err);
                    cb();
                });
            });
        };
    }), done);
};
