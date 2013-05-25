"use strict";
var Context = require('./context'),
    Cookbook = require('./cookbook'),
    async = require('async'),
    util = require('util');

function RecipeInTheOven(metadata, recipe){
    metadata = metadata || {};

    this.recipe = recipe;
    this.ctx = new Context(metadata);
    this.metadata = metadata;
}

RecipeInTheOven.prototype.prepare = function(done){
    return this.ctx.prepare(done);
};

RecipeInTheOven.prototype.runTask = function(taskName, done, isChild){
    if(!this.recipe.tasks[taskName]){
        return done(new Error('"' + taskName + '" task not registered'));
    }


    var spaces = (isChild) ? '    ' : '',
        self = this,
        tasks = [];

    console.log(spaces + 'start task `'+taskName+'`');

    if(isChild){
        console.log(spaces + '<=== `' + taskName + '` is running as a child ===>');
    }
    this.recipe.tasks[taskName].map(function(task){
        task.steps.map(function(step){
            console.log(spaces + '    processing step: ' + taskName + '.' + step);
            var func = self.recipe.steps[step];
            if(!func && step !== taskName){ // Its another task.
                console.log(spaces + '        step ' + step + ' is actually another task.');
                tasks.push(function(callback){
                    self.runTask(step, function nestedTask(){
                        callback();
                    }, true);
                });
            }
            else{
                tasks.push.apply(tasks, func.map(function(_){
                    return function(cb){
                        console.log(spaces + '    running: ' + taskName, '=>', step);
                        _(self.ctx, function(err){
                            console.log(spaces + '        completed: ' + taskName, '=>', step);
                            cb(err);
                        });
                    };
                }));
            }
        });
    });

    console.log(spaces + 'calling '+ tasks.length +' tasks for ' + taskName + '...');
    async.series(tasks, function(){
        console.log(spaces + 'finshed task `' + taskName + '`');
        done();
    });
};

RecipeInTheOven.prototype.cook = function(){
    var cookbook = new Cookbook({
        'apps': {
            'default': this.recipe.configure(this.metadata)
        },
        'config': {}
    });
    return cookbook;
};

RecipeInTheOven.prototype.cli = function(){
    return this.cook().cli();
};


function defaultDict(dict, key){
    if(!dict[key]){
        dict[key] = [];
    }
    return dict[key];
}

function Recipe(){
    this.steps = {};
    this.tasks = {};
    this.providesConfig = {};
    this.providesMetadata = {};
}


Recipe.prototype.step = function(name, func){
    defaultDict(this.steps, name).push(func);
    return this;
};

// Declare a task.
Recipe.prototype.task = function(name, steps, mode){
    mode = mode || 'sequential';
    steps = (Array.isArray(steps) ? steps : [steps]);

    defaultDict(this.tasks, name).push({steps: steps, mode: mode});
    return this;
};

// Extend config.
Recipe.prototype.provide = function(what, data){
    if(what === 'config'){
        util._extend(this.providesConfig, data);
    }
    else {
        util._extend(this.providesMetadata, data);
    }
    return this;
};

Recipe.prototype.configure = function(metadata){
    metadata = util._extends(this.providesMetadata, metadata);
    return new RecipeInTheOven(metadata, this);
};

Recipe.prototype.cli = function(){
    return this.configure().cli();
};

Recipe.prototype.use = function(otherRecipes){
    otherRecipes = (Array.isArray(otherRecipes) ? otherRecipes : [otherRecipes]);
    var self = this;
    otherRecipes.map(function(recipe){
        util._extend(self.providesConfig, recipe.providesConfig);
        util._extend(self.providesMetadata, recipe.providesMetadata);
    });
    return self;
};

module.exports = Recipe;
