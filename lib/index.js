"use strict";

var Recipe = require('./recipe'),
    debug = require('debug')('mott:index');

var steps = {},
    stepMap = {
        'deploy to github': './steps/deploy-to-github.js',
        'deploy to s3': './steps/deploy-to-s3.js',
        'deploy opsworks stack': './steps/deploy-opsworks-stack.js',
        'less': './steps/less',
        'js': './steps/browserify',
        'watch': './steps/watch',
        'dev server': './steps/dev-server.js',
        'pages': './steps/pages.js',
        'js config': './steps/js-config.js',
        'write bootstrap': './steps/write-bootstrap.js',
        'make build dir': './steps/make-build-dir',
        'copy includes': './steps/copy-includes',
        'localip': './steps/localip'
    };

Object.keys(stepMap).map(function(stepName){
    Object.defineProperty(steps, stepName, {
        'get': function(){
            return require(stepMap[stepName]);
        }
    });
});

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



module.exports.resolve = function(strings){
    strings = (Array.isArray(strings) ? strings : [strings]);
    return strings.map(function(string){
        if(steps.hasOwnProperty(string)){
            return steps[string];
        }
        else if(recipes.hasOwnProperty(string)){
            return recipes[string]();
        }
        else {
            if(string.indexOf('./') === 0){
                string = string.replace('./', process.cwd() + '/');
            }
            try{
                return require(string);
            }
            catch(e){
                debug('couldnt require ' + string + '.  Probably just another task.');
                return string;
            }
        }
    });
};
