"use strict";

var Recipe = require('./recipe');

module.exports = function(){
    return new Recipe()
        .step('copy includes', require('./tasks/copy-includes'))
        .step('make build dir', require('./steps/make-build-dir'))
        .task('build', ['make build dir', 'copy includes']);
};

module.exports.Recipe = Recipe;
module.exports.Cookbook = require('./cookbook');

// mott quickstart ->
 // * set up package.json
 // * add index.html
 // * add simple mott.js
module.exports.starter = function(){
    return module.exports('mott starter')
        .step('run', require('./tasks/dev-server.js'))
        .step('less', require('./steps/less'))
        .step('js', require('./steps/browserify'))
        .step('watch', require('./steps/watch'))
        .step('pages', require('./steps/pages.js'))
        .step('js config', function(ctx, done){
            var fs = require('fs'),
                buf = ("module.exports = process.env = " + JSON.stringify(ctx.getConfig(), null, 4) + ';');
            fs.writeFile(ctx.path('config.js'), buf, done);
        })

        .task('build', ['js config', 'js', 'less', 'pages'])
        .task('run', ['build', 'run', 'watch'])

        .provide('config', {
            'url': 'http://localhost:8080'
        });
};

module.exports.tasks = {
    'deploy to github': require('./tasks/deploy-to-github.js'),
    'deploy to s3': require('./tasks/deploy-to-s3.js'),
    'dev server': require('./tasks/dev-server.js'),
    'less': require('./steps/less'),
    'js': require('./steps/browserify'),
    'watch': require('./steps/watch'),
    'pages': require('./steps/pages.js'),
    'js config': function(ctx, done){
        var fs = require('fs'),
            buf = ("module.exports = process.env = " + JSON.stringify(ctx.getConfig(), null, 4) + ';');
        fs.writeFile(ctx.path('config.js'), buf, done);
    },
    'write bootstrap': require('./steps/write-bootstrap.js')
};

// var recipe = mott.recipe('single-page');
// New mini:
// var mott = require('mott');
// new mott.Cookbook({apps: {'web': mott.recipe('single-pager').configure()}}).cli();

// Ideal mini?
// require('mott').cli();
