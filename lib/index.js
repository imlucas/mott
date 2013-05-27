"use strict";

var Recipe = require('./recipe');

module.exports = function(){
    return new Recipe()
        .step('make build dir', require('./tasks/make-build-dir'))
        .step('copy includes', require('./tasks/copy-includes'))
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
        .step('less', require('./tasks/less'))
        .step('js', require('./tasks/browserify'))
        .step('watch', require('./tasks/watch'))
        .step('run', require('./tasks/dev-server.js'))
        .step('pages', require('./tasks/pages.js'))

        .task('build', ['js', 'less', 'pages'])
        .task('run', ['build', 'run', 'watch']);
};

module.exports.tasks = {
    'deploy-to-github': require('./tasks/deploy-to-github.js')
};

// var recipe = mott.recipe('single-page');
// New mini:
// var mott = require('mott');
// new mott.Cookbook({apps: {'web': mott.recipe('single-pager').configure()}}).cli();

// Ideal mini?
// require('mott').cli();
