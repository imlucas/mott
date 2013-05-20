"use strict";

var Recipe = require('./recipe');

module.exports = function(name){
    return new Recipe(name)
        .register('make build dir', require('./lib/tasks/make-build-dir'))
        .register('copy includes', require('./lib/tasks/copy-includes'))
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
