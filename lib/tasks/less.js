"use strict";

var async = require('async'),
    fs = require('fs-extra'),
    less = require('less'),
    path = require('path');

module.exports = function(ctx, done){
    if(!ctx.less){
        return done();
    }

    async.parallel(Object.keys(ctx.less).map(function(src){
        return function(cb){
            var opts = {
                    'compress': false,
                    'yuicompress': false,
                    'optimization': 1,
                    'strictImports': false,
                    'filename': src
                },
                paths = [path.dirname(src)];

            paths.push.apply(paths, process.mainModule.paths);

            opts.paths = paths;

            if(ctx.environment !== 'production'){
                opts.dumpLineNumbers = 'mediaquery';
            }

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
                    new less.Parser(opts).parse(buf, callback);
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
