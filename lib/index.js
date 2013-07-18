"use strict";

var Recipe = require('./recipe'),
    Cookbook = require('./cookbook'),
    debug = require('debug')('mott:index');

// map humanized step names to their actual caller functions
// for easier access.
//
// @todo (lucas) Still not sure things should work this way for much longer.
//               This is really just hang over from the initial hack out.
//
// @todo (lucas) Need a better way to expose what steps and recipes are
//               available for use, what extra context they provide,
//               what they're good for, and just their docs in general
//               without running into the `grunt-*` million tiny
//               packages problem.
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
        'write bootstrap': './steps/write-bootstrap',
        'make build dir': './steps/make-build-dir',
        'copy includes': './steps/copy-includes',
        'localip': './steps/localip',
        'add license': './steps/add-license'
    };

// supply a getter for `steps` to lazy require them
Object.keys(stepMap).map(function(stepName){
    Object.defineProperty(steps, stepName, {
        'get': function(){
            return require(stepMap[stepName]);
        }
    });
});

// builtin recipes that are available.
//
// @todo (lucas) cordova -> phonegap?
// @todo (lucas) again, how to document and actually work on these?
// @todo (lucas) Yeah this really shouldn't be in the main package anymore.
var recipes = {
    'cordova': require('./recipes/cordova')
};

// a default recipe that provides the basic `build task`:
//
// * make sure `./build` exists
// * copy files specified by `ctx.includes`
module.exports = function(){
    return new Recipe()
        .task('build', [steps['make build dir'], steps['copy includes']]);
};

module.exports.Recipe = Recipe;
module.exports.Cookbook = Cookbook;

module.exports.steps = steps;
module.exports.recipes = recipes;

// mott quickstart ->
// * set up package.json
// * add index.html
// * add simple mott.js
//
// @todo (lucas) Should be moved out. https://github.com/imlucas/mott/issues/34
module.exports.starter = function(){
    return module.exports('mott starter')
        .task('build', [steps['js config'], steps.js, steps.less, steps.pages])
        .task('run', ['build', steps['dev server'], steps.watch])

        .provide('config', {
            'url': 'http://localhost:8080'
        });
};

// require one of the built in steps or recipes
// @todo (lucas) This gets way simpler with https://github.com/imlucas/mott/issues/43
//               and could instead just be the builtin require.
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
