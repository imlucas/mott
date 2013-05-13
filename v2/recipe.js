"use strict";

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

// Register a transform callback.
// Recipe.prototype.transform = function(name, cb){
//     return this;
// };

Recipe.prototype.context = function(tpl){
    this.ctx.extend(tpl);
    return this;
};
module.exports = Recipe;
