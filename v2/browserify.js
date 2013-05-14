"use strict";

var browserify = require('browserify'),
    Q = require('q'),
    fs = require('fs'),
    writeFile = Q.denodeify(fs.writeFile);

module.exports = function(ctx, done){
    Q.all(Object.keys(ctx.js).map(function(src){
        var bundle = browserify(src),
            d = Q.defer();

        // @todo (lucas) Support for client side templates.  HBS first.
        bundle.bundle({'debug': false}, function(err, buf){
            fs.writeFile('build/' + ctx.js[src], buf, function(err){
                d.resolve({'src': src, 'buf': buf, 'dest': ctx.js[src]});
            });
        });
        return d.promise;
    })).then(function(){
        done();
    }, done).done();
};
