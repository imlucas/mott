"use strict";

var browserify = require('browserify'),
    async = require('async'),
    fs = require('fs');

module.exports = function(ctx, done){
    if(!ctx.js){
        return done();
    }
    async.parallel(Object.keys(ctx.js).map(function(src){
        return function(cb){
            fs.exists(src, function(exists){
                if(!exists){
                    return cb(new Error(src + ' doesn\'t exist.  Did you forget to create it?'));
                }
                var bundle = browserify(src);

                // @todo (lucas) Support for client side templates.  HBS first.
                bundle.bundle({'debug': false}, function(err, buf){
                    if(err) return cb(err);

                    fs.writeFile(ctx.js[src].dest, buf, function(err){
                        if(err) return cb(err);
                        cb();
                    });
                });
            });
        };
    }), done);
};
