"use strict";

var fs = require('fs');

module.exports = function(ctx, done){
    var lock = false;
    console.log('watch ', ctx.baseDir);
    fs.watch(ctx.baseDir, function(event, filename){
        if(!lock){
            lock = true;
            console.log(event, filename);
            ctx.runTask('build', function(){
                if(ctx.server){
                    console.log('restarting server');
                    ctx.server.close();
                    ctx.server = ctx.app.listen(8080, function(){
                        console.log('dev server listening');
                    });
                }
                setTimeout(function(){
                    lock = false;
                }, 200);
            });
        }
    });
    done();
};
