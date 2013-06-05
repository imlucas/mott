#!/usr/bin/env node

"use strict";

var mott = require('../'),
    fs = require('fs-extra'),
    argv = require('optimist').argv;


if(argv._[0] === 'new'){
    console.log(argv);
    var recipe = mott();

    ((Array.isArray(argv.use) ? argv.use : [argv.use]) || []).map(function(_use){
        // @todo (lucas) npm install
        recipe.use(mott.resolve(_use));
    });
    recipe.task('new', function(ctx, done){
        console.log('hi');
        done();
    });
    recipe.cook().exec('new', {}, function(err){
        console.log('done');
    });
    return;
}

// @todo (lucas) If a local mott exists, shell to that bin

fs.readJson('./package.json', function(err, data){
    if(err){
        console.log(err);
        return;
    }
    var environments = {},
        metadata,
        key,
        recipe;

    for(key in data.mott){
        if(key !== "recipe"){
            environments[key] = data.mott[key];
        }
    }

    recipe = mott();
    for(key in data.mott.recipe){
        if(key === "metadata"){
            metadata = data.mott.recipe.metadata;
        }
        else if(key === "use"){
            recipe.use(mott.resolve(data.mott.recipe[key]));
        }
        else {
            recipe.task(key, mott.resolve(data.mott.recipe[key]));
        }
    }
    recipe.cli(metadata, environments);
});
