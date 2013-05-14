"use strict";

var Recipe = require('./recipe'),
    fs = require('fs'),
    Glob = require('glob').Glob,
    Q = require('q');

module.exports = function(name){
    return new Recipe(name)
        .register('make build dir', function(ctx, done){
            fs.exists('build', function(exists){
                if(exists){
                    return done();
                }
                fs.mkdir('build', done);
            });
        })
        .register('copy includes', function(ctx, done){
            if(!ctx.includes || ctx.includes.length === 0){
                return done();
            }
            var seen = [];
            Q.all(ctx.includes.map(function(include){
                var d = Q.defer();
                new Glob(include, {match: true}, function(matches){
                    matches.map(function(match){
                        if(seen.indexOf(match) === -1){
                            seen.push(match);
                        }
                    });
                    d.resolve();
                });
                return d.promise;
            })).then(function(){
                return Q.all(seen.map(function(src){
                    var d = Q.defer(),
                        readStream = fs.createReadStream(src),
                        writeStream = fs.createWriteStream('build/' + src);

                    readStream.pipe(writeStream);
                    readStream.once('end', function(){
                        d.resolve();
                    });
                    return d.promise;
                }));
            }).then(function(){
                done();
            }).done();
        })
        .task('build', ['make build dir', 'copy includes']);
};

module.exports.Recipe = Recipe;
module.exports.Cookbook = require('./cookbook');
// var recipe = mott.recipe('single-page');

// New mini:
// var mott = require('mott');
// new mott.Cookbook({apps: {'web': mott.recipe('single-pager').configure()}}).cli();

// Ideal mini?
// require('mott').cli();
