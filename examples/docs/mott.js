#!/usr/bin/env node
var mott = require('../../'),
    recipe = mott.starter();

// This is the mott quickstart.
// There are much more interesting things you can do
// with mott to get work done quickly.
// Have a look at http://imlucas.github.io/mott/ for more info
// or just ask me @__lucas.  Thanks for trying this out.

// Quickstart: This is as basic as it gets.
// recipe.configure({'pages': {'./index.jade': 'index.html'}}).cook();

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
// Start the cli for your new cookbook.
cookbook.cli();
// Now run ./mott.js run to develop your app.
// When you're ready, run ./mott.js deploy to deploy your app to github pages.