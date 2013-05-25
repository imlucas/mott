"use strict";

var assert = require('assert'),
    util = require('util');

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

    it("should be able to provide config", function(){
        var r = new Recipe()
            .provide('config', {'hello': 'world'});
        assert.deepEqual(r.providesConfig, {'hello': 'world'});
    });

    it("should be able to provide extra metadata", function(){
        var r = new Recipe()
            .provide('metadata', {'include': {'index.jade': 'index.html'}});

        assert.deepEqual(r.providesMetadata, {'include': {'index.jade': 'index.html'}});
    });

    it("should return a recipe in the oven after calling configure", function(){
        var r = new Recipe(),
            i = r.configure();
        assert.equal(i.constructor.name, 'RecipeInTheOven');
    });
});