#!/usr/bin/env node
"use strict";

var mott = require('../../'),
    recipe = mott.starter();

// This is the mott quickstart.
// There are much more interesting things you can do
// with mott to get work done quickly.
// Have a look at http://imlucas.github.io/mott/ for more info
// or just ask me @__lucas.  Thanks for trying this out.

var cookbook = new mott.Cookbook({
    'apps': {
        'web': recipe.configure({
            'js': {
                // Add a main.js file and use browserify
                './main.js': 'app.js'
            },
            'less': {
                // LESS your heart out.
                './main.less': 'app.css'
            },
            'pages': {
                // You know how to specify pages like this.
                './index.jade': 'index.html',
                // You can also use regex for simple routing.
                './pages/*.jade': '$1.html'
            },
            'includes': {
                'node_modules/bootstrap/img/*.png': 'img/$1.png'
            }
        })
    },
    'config': {
        // Specify config values like so.
        'api_key': '123',
        'my_special_key': 'secret',
        // Specify what config values should be available on the front end.
        'export': ['api_key']
    }
});


// You can add custom steps for your process like deploying to github pages
recipe.register('deploy to github', mott.tasks['deploy-to-github']);
// And then combine steps or other tasks into hand command line calls
recipe.task('deploy', ['build', 'deploy to github']);


recipe.register('fix bootstrap css paths', function(ctx, done){
    var async = require('async'),
        fs = require('fs');

    async.parallel(Object.keys(ctx.less).map(function(src){
        return function(callback){
            var dest = ctx.dest('less', src);
            async.waterfall([
                function read(callback){
                    fs.readFile(dest, 'utf-8', callback);
                },
                function transform(buf, callback){
                    fs.writeFile(dest, buf.replace(/\.\.\/img\//g, 'img/'), callback);
                }
            ], function(err){
                callback(err);
            });
        };
    }), done);
}).task('build', ['fix bootstrap css paths']);

// Start the cli for your new cookbook.
cookbook.cli();
// Now run ./mott.js run to develop your app.
// When you're ready, run ./mott.js deploy to deploy your app to github pages.