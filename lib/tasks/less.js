"use strict";

var Q = require('q'),
    fs = require('fs'),
    readFile = Q.denodeify(fs.readFile);

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

    Q.all(Object.keys(ctx.less).map(function(src){
        return readFile(src, 'utf-8').then(function(buf){
            var d = Q.defer();
            new less.Parser({
                'paths': [path.dirname(src)],
                'optimizations': opts.optimizations,
                'filename': src,
                'strictImports': opts.strictImports
            }).parse(buf, function(err, tree){
                if(err){
                    return d.reject(err);
                }
                var buf = tree.toCSS({
                    'compress': opts.compress,
                    'yuicompress': opts.yuicompress
                });
                fs.writeFile(ctx.less[src].dest, buf, function(err){
                    d.resolve({'src': src, 'buf': buf, 'dest': ctx.less[src]});
                });
            });
            return d.promise;
        });
    })).then(function(){
        done();
    }, function(err){
        done(err);
    }).done();
};
