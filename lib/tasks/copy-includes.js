"use strict";
var fs = require('fs'),
    async = require('async');


module.exports = function(ctx, done){
    if(!ctx.includes || ctx.includes.length === 0){
        return done();
    }
    async.parallel(Object.keys(ctx.includes).map(function(src){
        return function(cb){
            var rs = fs.createReadStream(ctx.path(src)),
                ws = fs.createWriteStream(ctx.dest('includes', src));

            rs.pipe(ws);
            rs.once('end', function(){
                cb();
            });
        };
    }), done);
};