#!/usr/bin/env node

"use strict";

var mott = require('../'),
    fs = require('fs-extra'),
    argv = require('optimist').argv;


if(argv._[0] === 'new'){
    var path = require('path'),
        async = require('async'),
        child_process = require('child_process'),
        recipe = mott(),
        name = argv._[1],
        _uses = ((Array.isArray(argv.use) ? argv.use : (argv.use) ? [argv.use] : []));

    recipe.task('new', function(ctx, done){
        ctx.projectName = name;
        ctx.packageJson = {
            'name': name,
            'version': '0.0.0',
            'dependencies': {},
            'devDependencies': {
                'mott': 'git://github.com/imlucas/mott.git'
                // @todo (lucas) include anything from uses
            },
            'mott': {
                'recipe': {
                    'build': ["js", "less", "pages"],
                    'run': ["build", "dev server", "watch"],
                    'metadata': {
                        "js": {
                            "./index.js": "index.js"
                        },
                        "less": {
                            "./index.less": "index.css"
                        },
                        "includes": {
                            "./index.html": "index.html"
                        },
                        'deploy': 'github',
                        'export config': ['url']
                    }
                },
                'development': {
                    'url': 'http://localhost:8080'
                },
                'production': {}
            }
        };
        async.parallel([
            function (callback){
                fs.mkdirs('./' + name, callback);
                ctx.baseDir = path.resolve('./' + name);
            },
            function (callback){
                fs.writeFile('./' + name + '/package.json',
                    JSON.stringify(ctx.packageJson, null, 4), callback);
            },
            function (callback){
                fs.copy(__dirname + '/../assets/Makefile.tpl', ctx.path('Makefile'), callback);
            },
            function (callback){
                fs.copy(__dirname + '/../assets/index.html.tpl', ctx.path('index.html'), callback);
            },
            function (callback){
                fs.copy(__dirname + '/../assets/index.js.tpl', ctx.path('index.js'), callback);
            },
            function (callback){
                fs.copy(__dirname + '/../assets/index.less.tpl', ctx.path('index.less'), callback);
            }
        ], function(){
            child_process.exec('npm link mott', {'cwd': ctx.baseDir}, done);
        });
    });
    _uses.map(function(_use){
        // @todo (lucas) npm install
        recipe.use(mott.resolve(_use));
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
