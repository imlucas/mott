"use strict";

var async = require('async'),
    fs = require('fs');

module.exports = function(ctx, done){
    async.parallel(Object.keys(ctx.less).map(function(src){
        return function(callback){
            var dest = ctx.dest('less', src);
            async.waterfall([
                function read(callback){
                    fs.readFile(dest, 'utf-8', callback);
                },
                function transform(buf, callback){
                    fs.writeFile(dest, buf.replace(/\.\.\/img\//g, 'img/'), callback);
                }
            ], function(err){
                callback(err);
            });
        };
    }), done);
};