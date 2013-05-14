"use strict";
var Context = require('./context'),
    Q = require('q');

function RecipeInTheOven(tpl, recipe){
    this.recipe = recipe;
    this.ctx = new Context(tpl);
}
RecipeInTheOven.prototype.prepare = function(){
    return this.ctx.prepare();
};

RecipeInTheOven.prototype.runTask = function(taskName){
    if(!this.recipe.tasks[taskName]){
        throw new Error('"' + taskName + '" task not registered');
    }
    var self = this;

    this.recipe.tasks[taskName].map(function(task){
        // if(task.mode === 'sequential'){
            var p = Q();
            task.steps.map(function(step){
                p.then(function(){
                    return Q.all(self.recipe.steps[step].map(function(_){
                        var d = Q.defer();
                        _(self.ctx, function(err, res){
                            if(err){
                                return d.reject(err);
                            }
                            return d.resolve(res);
                        });
                        return d.promise;
                    }));
                });
            });
            return p.done();
        // }
        // else {
        //     return Q.all(task.steps.map(function(step){
        //         var d = Q.defer();
        //         step(self.ctx, function(err, res){
        //             if(err){
        //                 return d.reject(err);
        //             }
        //             return d.resolve(res);
        //         });
        //         return d.promise;
        //     }));
        // }
    });
};


function Recipe(name){
    this.steps = {};
    this.tasks = {};

    this.name = name;
}

// @todo (lucas) Keep a mapping so we can fire callbacks when particular
// steps are called to do other things, ie transform.
Recipe.prototype.register = function(name, func){
    if(!this.steps[name]){
        this.steps[name] = [];
    }

    this.steps[name].push(func);
    console.log('registered ', name, func);
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

// Register a transform callback.
// Recipe.prototype.transform = function(name, cb){
//     return this;
// };

Recipe.prototype.configure = function(tpl){
    return new RecipeInTheOven(tpl, this);
};

module.exports = Recipe;
