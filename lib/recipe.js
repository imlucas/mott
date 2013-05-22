"use strict";
var Context = require('./context'),
    Cookbook = require('./cookbook'),
    async = require('async'),
    util = require('util');

function RecipeInTheOven(tpl, recipe){
    this.recipe = recipe;
    this.ctx = new Context(tpl);
    this.tpl = tpl;
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
    var cookbook = new Cookbook({'apps': {'default': this.recipe.configure(this.tpl)}, 'config': {}});
    cookbook.cli();
    return cookbook;
};

function defaultDict(dict, key){
    if(!dict[key]){
        dict[key] = [];
    }
    return dict[key];
}

function Recipe(name){
    this.steps = {};
    this.tasks = {};
    this.transforms = {};
    this.name = name;
}

// @todo (lucas) Keep a mapping so we can fire callbacks when particular
// steps are called to do other things, ie transform.
Recipe.prototype.register = function(name, func){
    defaultDict(this.steps, name).push(func);
    return this;
};

// Declare a task.
Recipe.prototype.task = function(name, steps, mode){
    mode = mode || 'sequential';

    if(!this.tasks[name]){
        this.tasks[name] = [];
    }
    this.tasks[name].push({steps: steps, mode: mode});
    return this;
};

// Register a transform callback
Recipe.prototype.transform = function(name, func){
    defaultDict(this.transforms, name).push(func);
    return this;
};

Recipe.prototype.configure = function(tpl){
    return new RecipeInTheOven(tpl, this);
};

module.exports = Recipe;
