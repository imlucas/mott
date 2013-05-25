"use strict";
var Recipe = require('./recipe');

var cordova = {
    build: function(cwd, done){
        // child exec cordova/build in cwd
        done();
    }
};

module.exports = new Recipe()
    .register('cordova', function(ctx, done){
        var dest = './native/' + ctx.platform;
        ctx.copyBuildTo(dest, function(){
            cordova.build(done);
        });
    })
    .task('build', ['cordova']);

module.exports.provide('config', {
    'native_path': './native/ios'
}).provide('metadata', {
    'includes': ''
});