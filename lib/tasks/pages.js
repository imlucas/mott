"use strict";
var jade = require('jade'),
    fs = require('fs-extra'),
    async = require('async'),
    path = require('path');


module.exports = function(ctx, done){
    if(!ctx.pages){
        return done();
    }

    async.parallel(Object.keys(ctx.pages).map(function(src){
        return function(cb){
            var dest = ctx.pages[src].dest;
            async.waterfall([
                function prepare(callback){
                    fs.mkdirs(path.dirname(dest), callback);
                },
                function read(_, callback){
                    fs.readFile(src, 'utf-8', callback);
                },
                function render(buf, callback){
                    var opts = {
                        'filename': src,
                        'url': function(p){
                            return ctx.config.url + p;
                        }
                    };
                    jade.render(buf, opts, callback);
                },
                function write(buf, callback){
                    fs.writeFile(dest, buf, callback);
                }
            ], cb);
        };
    }), done);
};
