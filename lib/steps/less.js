"use strict";

var async = require('async'),
    fs = require('fs-extra'),
    less = require('less'),
    path = require('path'),
    debug = require('plog')('mott:less');

module.exports = function(ctx, done){
    if(!ctx.less){
        return done();
    }

    if(ctx['last changed less'] === undefined){
        ctx.on('file changed', function(file){
            ctx['last changed less'] = (file.indexOf('.css') > -1 || file.indexOf('.less') > -1);
        });
    }

    if(ctx['last changed less'] === false){
        debug('not rebuilding because last file changed wasnt less related.');
        return done();
    }

    ctx['last changed less'] = false;

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

            if(ctx.environment === 'development'){
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

                    ctx.writeFile(ctx.less[src].dest, buf, callback);
                }
            ], cb);
        };
    }), done);
};
