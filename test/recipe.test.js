"use strict";

var assert = require('assert'),
    util = require('util');

var Recipe = require('../lib/recipe');

var emptyStep = function(ctx, cb){
    cb();
};

describe("Recipe", function(){
    it("should register a task", function(){
        var r = new Recipe()
            .task('empty', emptyStep);

        assert.deepEqual(r.tasks, {"empty":[{"steps":[emptyStep],"mode":"sequential"}]});
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

    it("should mixin metadata from another recipe", function(){
        var r = new Recipe();
        r.use(new Recipe()
            .provide('metadata', {'include': {'index.jade': 'index.html'}})
        );
        assert.deepEqual(r.providesMetadata, {'include': {'index.jade': 'index.html'}});
    });

    // it("should have metadata copied into cookbook", function(){
    //     var cookbook = new Recipe().use(
    //         new Recipe().provide('metadata', {'hello': 'world'})
    //     ).configure().cook();

    //     assert.deepEqual(cookbook.config, {'hello': 'world'});
    // });

    // it("should be able to override config", function(){
    //     var r = new Recipe().use(
    //             new Recipe().provide('config', {'hello': 'world'})
    //         ).configure({}, {'hello': 'baz'}, {});

    //     assert.deepEqual(r.recipe.providesEnvironments, {});
    //     assert.deepEqual(r.recipe.providesMetadata, {});
    //     assert.deepEqual(r.recipe.providesConfig, {'hello': 'baz'});
    // });

    it("should copy steps and tasks", function(){
        var otherRecipe = new Recipe().task('build task', [emptyStep]),
            r = new Recipe().use(otherRecipe);

        assert.deepEqual(r.tasks, otherRecipe.tasks);
    });

});