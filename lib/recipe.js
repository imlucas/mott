"use strict";
var Context = require('./context'),
    Cookbook = require('./cookbook'),
    async = require('async'),
    util = require('util'),
    debug = require('debug')('mott:recipe');

function RecipeInTheOven(recipe){
    this.recipe = recipe;
    this.ctx = new Context(recipe.providesMetadata);
    this.metadata = recipe.providesMetadata;
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

    debug(spaces + taskName, 'running');

    if(isChild){
        debug(spaces + 'running as a child');
    }

    this.recipe.tasks[taskName].map(function(task){
        task.steps.map(function(step){
            // var func = self.recipe.steps[step];
            if ('function' !== typeof step){
                debug(spaces + '        step ' + step + ' is actually another task.');
                tasks.push(function(callback){
                    self.runTask(step, callback, true);
                });
            }
            else{
                tasks.push(function(cb){
                        step(self.ctx, function(err){
                            cb(err);
                        });
                    }
                );
            }
        });
    });

    debug(spaces + 'calling '+ tasks.length +' tasks for ' + taskName + '...');
    async.series(tasks, function(err){
        debug(spaces + taskName, 'completed');
        done(err);
    });
};

RecipeInTheOven.prototype.cook = function(){
    var cookbook = new Cookbook({
        'recipes': {
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
    this.tasks = {};
    this.providesConfig = {};
    this.providesMetadata = {};
    this.providesEnvironments = {};
}


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
    else if(what === 'environments'){
        util._extend(this.providesEnvironments, data);
    }
    else {
        util._extend(this.providesMetadata, data);
    }
    return this;
};

Recipe.prototype.configure = function(metadata, config, environments){

    return new RecipeInTheOven(this);
};

Recipe.prototype.cli = function(metadata, config, environments){
    return this.configure(metadata, config, environments).cli();
};

Recipe.prototype.use = function(otherRecipes){
    otherRecipes = (Array.isArray(otherRecipes) ? otherRecipes : [otherRecipes]);
    var self = this;
    otherRecipes.map(function(recipe){
        if(recipe.constructor.name === 'String'){
            recipe = require(recipe);
        }

        ['Config', 'Metadata', 'Environments'].map(function(key){
            key = 'provides' + key;
            self[key] = util._extend(self[key], recipe[key]);
        });

        Object.keys(recipe.tasks).map(function(taskName){
            recipe.tasks[taskName].map(function(step){
                self.task(taskName,step.steps, step.mode);
            });
        });
    });
    return self;
};

module.exports = Recipe;
