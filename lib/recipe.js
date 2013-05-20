"use strict";
var Context = require('./context'),
    async = require('async'),
    util = require('util'),
    Q = require('q');

function RecipeInTheOven(tpl, recipe){
    this.recipe = recipe;
    this.ctx = new Context(tpl);
}

RecipeInTheOven.prototype.prepare = function(){
    return this.ctx.prepare();
};

RecipeInTheOven.prototype.runTask = function(taskName, done){
    if(!this.recipe.tasks[taskName]){
        done(new Error('"' + taskName + '" task not registered'));
    }
    var self = this,
        tasks = [];

    this.recipe.tasks[taskName].map(function(task){
        task.steps.map(function(step){
            var func = self.recipe.steps[step];
            if(!func && step !== taskName){ // Its another task.
                return tasks.push(function(cb){
                    self.runTask(step, cb);
                });
            }

            tasks.push.apply(tasks, func.map(function(_){
                return function(cb){
                    console.log('running: ' + taskName, '=>', step);
                    _(self.ctx, cb);
                };
            }));
        });
    });

    async.series(tasks, done);
};


function Recipe(name){
    this.steps = {};
    this.tasks = {};
    this.befores = {};
    this.afters = {};

    this.name = name;
}

// @todo (lucas) Keep a mapping so we can fire callbacks when particular
// steps are called to do other things, ie transform.
Recipe.prototype.register = function(name, func){
    if(!this.steps[name]){
        this.steps[name] = [];
    }

    this.steps[name].push(func);
    return this;
};

Recipe.prototype.after = function(name, func){
    if(!this.afters[name]){
        this.afters[name] = [];
    }

    this.afters[name].push(func);
    return this;
};

Recipe.prototype.before = function(name, func){
    if(!this.befores[name]){
        this.befores[name] = [];
    }

    this.befores[name].push(func);
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
Recipe.prototype.transform = function(name, done){
    return this;
};

Recipe.prototype.configure = function(tpl){
    return new RecipeInTheOven(tpl, this);
};

module.exports = Recipe;
