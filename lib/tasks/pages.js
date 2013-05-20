"use strict";
var jade = require('jade'),
    fs = require('fs'),
    Q = require('q'),
    mkdirp = require('mkdirp'),
    path = require('path');


module.exports = function(ctx, done){
    if(!ctx.pages){
        return done();
    }

    Q.all(Object.keys(ctx.pages).map(function(src){
        var dest = ctx.pages[src].dest,
            d = Q.defer();

        fs.readFile(src, 'utf-8', function(err, buf){
            jade.render(buf, {'filename': src}, function(err, data){
                if(err){
                    return d.reject(err);
                }

                mkdirp(path.dirname('build/' + dest), function(err){
                    if(err){
                        return d.reject(err);
                    }
                    fs.writeFile('build/' + dest, data, function(err){
                        if(err){
                            return d.reject(err);
                        }
                        d.resolve();
                    });
                });
            });
        });
        return d.promise;
    })).then(function(){
        done();
    }).done();
};
