"use strict";

var fs = require('fs');

module.exports = function(ctx, done){
    var lock = false;
    fs.watch(ctx.baseDir, function(event, filename){
        if(!lock){
            lock = true;
            console.log(event, filename);
            ctx.runTask('build', function(){
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
