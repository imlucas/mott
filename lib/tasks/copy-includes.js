"use strict";
var fs = require('fs-extra'),
    async = require('async');


module.exports = function(ctx, done){
    if(!ctx.includes || ctx.includes.length === 0){
        return done();
    }

    async.parallel(Object.keys(ctx.includes).map(function(src){
        return function(cb){
            fs.copy(src, ctx.dest('includes', src), cb);
        };
    }), done);
};