"use strict";

var assert = require('assert');

var Recipe = require('../lib/recipe');

var emptyStep = function(ctx, cb){
    cb();
};

describe("Recipe", function(){
    it("should register a step", function(){
        var r = new Recipe()
                .step('t', emptyStep);

        assert.deepEqual(r.steps, {'t': [emptyStep]});
    });

    it("should register a task", function(){
        var r = new Recipe()
            .step('t', emptyStep)
            .task('empty', 't');


        assert.deepEqual(r.tasks, {"empty":[{"steps":["t"],"mode":"sequential"}]});
    });
});