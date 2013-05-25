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

    it("should mixin config and metadata from another recipe", function(){
        var r = new Recipe();
        r.use(new Recipe()
            .provide('config', {'hello': 'world'})
            .provide('metadata', {'include': {'index.jade': 'index.html'}})
        );
        assert.deepEqual(r.providesMetadata, {'include': {'index.jade': 'index.html'}});
    });

    it("should have config copied into cookbook", function(){
        var cookbook = new Recipe().use(
            new Recipe().provide('config', {'hello': 'world'})
        ).configure().cook();

        assert.deepEqual(cookbook.config, {'hello': 'world'});
    });

    it("should be able to override config", function(){
        var cookbook = new Recipe().use(
            new Recipe().provide('config', {'hello': 'world'})
        ).configure({}, {'hello': 'baz'}).cook();

        assert.deepEqual(cookbook.config, {'hello': 'baz'});
    });

});