"use strict";

var async = require('async'),
    fs = require('fs-extra');

module.exports = function(ctx, done){
    if(!ctx.less){
        return done();
    }

    var less = require('less'),
        path = require('path'),
        opts = {
            'compress': false,
            'yuicompress': false,
            'optimization': 1,
            'strictImports': false
        };

    async.parallel(Object.keys(ctx.less).map(function(src){
        return function(cb){
            async.waterfall([
                function read(callback){
                    fs.readFile(src, 'utf-8', function(err, data){
                        if(err){
                            err = new Error('Did you forgot to create `'+src+'`?');
                        }
                        callback(err, data);
                    });
                },
                function compile(buf, callback){
                    new less.Parser({
                        'paths': [path.dirname(src)],
                        'optimizations': opts.optimizations,
                        'filename': src,
                        'strictImports': opts.strictImports
                    }).parse(buf, callback);
                },
                function write(tree, callback){
                    var buf = tree.toCSS({
                        'compress': opts.compress,
                        'yuicompress': opts.yuicompress
                    });

                    fs.writeFile(ctx.less[src].dest, buf, callback);
                }
            ], cb);
        };
    }), done);
};
