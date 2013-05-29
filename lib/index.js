"use strict";

var Recipe = require('./recipe');

var steps = {
    'deploy to github': require('./steps/deploy-to-github.js'),
    'deploy to s3': require('./steps/deploy-to-s3.js'),
    'less': require('./steps/less'),
    'js': require('./steps/browserify'),
    'watch': require('./steps/watch'),
    'dev server': require('./steps/dev-server.js'),
    'pages': require('./steps/pages.js'),
    'js config': require('./steps/js-config.js'),
    'write bootstrap': require('./steps/write-bootstrap.js'),
    'make build dir': require('./steps/make-build-dir'),
    'copy includes': require('./steps/copy-includes'),
    'localip': require('./steps/localip')
};

var recipes = {
    'cordova': require('./recipes/cordova')
};

module.exports = function(){
    return new Recipe()
        .task('build', [steps['make build dir'], steps['copy includes']]);
};

module.exports.Recipe = Recipe;
module.exports.Cookbook = require('./cookbook');

module.exports.steps = steps;
module.exports.recipes = recipes;

// mott quickstart ->
 // * set up package.json
 // * add index.html
 // * add simple mott.js
module.exports.starter = function(){
    return module.exports('mott starter')
        .task('build', [steps['js config'], steps.js, steps.less, steps.pages])
        .task('run', ['build', steps['dev server'], steps.watch])

        .provide('config', {
            'url': 'http://localhost:8080'
        });
};

// var recipe = mott.recipe('single-page');
// New mini:
// var mott = require('mott');
// new mott.Cookbook({apps: {'web': mott.recipe('single-pager').configure()}}).cli();

// Ideal mini?
// require('mott').cli();
