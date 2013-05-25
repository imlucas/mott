"use strict";

var assert = require('assert');

var Recipe = require('../lib/recipe');

describe("Recipe", function(){
    it("should register a step", function(){
        var func = function(ctx, cb){
                cb();
            },
            r = new Recipe()
                .step('t', func);

        assert.deepEqual(r.steps, {'t': [func]});
    });
});