"use strict";
var async = require('async'),
    fs = require('fs');

module.exports = function(ctx, done){
    var files = [];



    async.map(ctx.files(), ctx.getFileInfo, function(err, res){
        var bootstrap = ctx.getConfig();

        res.map(function(file){

            var key = file.src.replace(ctx.path('build'), '');
            bootstrap[key] = file.md5;
        });
        ctx.writeFile(ctx.path('./build/sterno-bootstrap.json'), JSON.stringify(bootstrap, null, 4), function(err){
            done(err);
        });
    });
};