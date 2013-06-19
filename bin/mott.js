#!/usr/bin/env node

"use strict";
var mott,
    fs = require('fs-extra'),
    argv = require('optimist').argv,
    path = require('path');

try{
    mott = require('../');
}
catch(e){
    mott = require(__dirname + '/../mott');
}
require.paths.push(path.resolve(__dirname + '/../mott/node_modules'));
console.error(require.paths);

if(argv._[0] === 'new'){
    var path = require('path'),
        async = require('async'),
        child_process = require('child_process'),
        recipe = mott(),
        name = argv._[1],
        _uses = ((Array.isArray(argv.use) ? argv.use : (argv.use) ? [argv.use] : []));

    if(!name){
        var parts = path.resolve('./').split(path.sep);
        name = parts[parts.length - 1];
    }
    // @todo (lucas) If no name, use cwd name.
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
                        "js": {},
                        "less": {},
                        "includes": {},
                        'deploy': '',
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
                if(!argv._[1]){
                    return callback();
                }
                fs.mkdirs('./' + name, callback);
                ctx.baseDir = path.resolve('./' + name);
            },
            function (callback){
                fs.writeFile(ctx.path('package.json'),
                    JSON.stringify(ctx.packageJson, null, 4), callback);
            }
        ], function(){
            child_process.exec('npm link mott', {'cwd': ctx.baseDir}, done);
        });

        // @todo (lucas) Should be moved out to its own recipe.
        // function (callback){
        //     fs.copy(__dirname + '/../assets/Makefile.tpl', ctx.path('Makefile'), callback);
        // },
        // function (callback){
        //     fs.copy(__dirname + '/../assets/index.html.tpl', ctx.path('index.html'), callback);
        // },
        // function (callback){
        //     fs.copy(__dirname + '/../assets/index.js.tpl', ctx.path('index.js'), callback);
        // },
        // function (callback){
        //     fs.copy(__dirname + '/../assets/index.less.tpl', ctx.path('index.less'), callback);
        // }
    });
    _uses.map(function(_use){
        // @todo (lucas) npm install
        if(_use.indexOf('https://') > -1){
            _use = _use.replace('https://', 'git://');
            if(_use.indexOf('.git') === -1){
                _use = _use + '.git';
            }
        }
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
