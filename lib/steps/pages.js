"use strict";
var jade = require('jade'),
    fs = require('fs-extra'),
    async = require('async'),
    path = require('path'),
    util = require('util');

jade.doctypes.plist = '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">';

module.exports = function(ctx, done){
    if(!ctx.pages){
        return done();
    }

    async.parallel(Object.keys(ctx.pages).map(function(src){
        return function(cb){
            module.exports.render(ctx, src, ctx.pages[src].dest, {}, cb);
        };
    }), done);
};

module.exports.render = function(ctx, src, dest, options, done){
    async.waterfall([
        function prepare(callback){
            fs.mkdirs(path.dirname(dest), callback);
        },
        function read(_, callback){
            fs.readFile(src, 'utf-8', callback);
        },
        function render(buf, callback){
            if(src.indexOf('.md') > -1){
                return callback(null, require('markdown-js').makeHtml(buf));
            }

            var opts = {
                'filename': src,
                'url': function(p){
                    return ctx.url + p;
                },
                'pretty': true
            };
            util._extend(opts, options);
            jade.render(buf, opts, callback);
        },
        function write(buf, callback){
            ctx.writeFile(dest, buf, callback);
        }
    ], done);
};