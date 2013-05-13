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

function Recipe(){
    this.steps = {};
    this.nameToStep = {};
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

// Declare a task.
Recipe.prototype.task = function(){
    return this;
};

// Register a transform callback
Recipe.prototype.transform = function(){
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
