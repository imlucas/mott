"use strict";

var fs = require('fs'),
    glob = require('glob'),
    debug = require('debug')('mott:watch');

module.exports = function(ctx, done){
    var lock = false;
    function onWatchEvent(event, filename){
        if(!lock){
            lock = true;
            debug(filename, event);
            ctx.emit('file ' + event, filename);

            ctx.runTask('build', function(){
                debug('rebuild', 'completed');
                if(ctx.app){
                    ctx.app.emit('change');
                }
                setTimeout(function(){
                    lock = false;
                }, 200);
            });
        }
    }

    glob(ctx.baseDir + "/**/", {}, function (er, files){
        files.filter(function(file){
            return file.indexOf('node_modules') === -1;
        }).map(function(dir){
            fs.watch(dir, onWatchEvent);
        });
    });
    done();
};
