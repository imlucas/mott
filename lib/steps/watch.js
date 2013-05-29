"use strict";

var fs = require('fs'),
    debug = require('debug')('mott:watch');

module.exports = function(ctx, done){
    var lock = false;
    fs.watch(ctx.baseDir, function(event, filename){
        if(!lock){
            lock = true;
            debug(filename, event);
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
    });
    done();
};
