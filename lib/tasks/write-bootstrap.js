"use strict";
var async = require('async'),
    fs = require('fs');

module.exports = function(ctx, done){
    var files = [];

    ['less', 'js'].forEach(function(key){
        files.push.apply(files, Object.keys(ctx[key]).map(function(src){
            return 'build/' + ctx[key][src].dest;
        }));
    });

    async.map(files, ctx.getFileInfo, function(err, res){
        var bootstrap = ctx.getConfig();

        res.map(function(file){
            bootstrap[file.dest] = file.md5;
        });
        fs.writeFile('build/bootstrap.js', JSON.stringify(bootstrap, null, 4), function(err){
            done(err);
        });
    });
};