"use strict";

var mottjsTpl = [
    "#!/usr/bin/env node",
    "var mott = require('mott'),",
    "    recipe = mott.starter();",
    "",
    "// This is the mott quickstart.",
    "// There are much more interesting things you can do",
    "// with mott to get work done quickly.",
    "// Have a look at http://imlucas.github.io/mott/ for more info",
    "// or just ask me @__lucas.  Thanks for trying this out.",
    "",
    // @todo (lucas) Add a commented out recipe.use(mott.Tutorial())
    // that is mainly just docs walking through things step be step.
    "// Quickstart: This is as basic as it gets.",
    "recipe.configure({'pages': {'./index.jade': 'index.html'}}).cook();",
    "",
    "// ",
    "// var cookbook = new mott.Cookbook({",
    "//     'apps': {",
    "//         'web': recipe.configure({",
    "//             'js': {",
    "//                 // Add a main.js file and use browserify",
    "//                 './main.js': 'app.js'",
    "//             },",
    "//             'less': {",
    "//                 // LESS your heart out.",
    "//                 './main.less': 'app.css'",
    "//             },",
    "//             'pages': {",
    "//                 // You know how to specify pages like this.",
    "//                 './index.jade': 'index.html', ",
    "//                 // You can also use regex for simple routing.",
    "//                 './pages/*.jade': '$1.html'",
    "// ",
    "//             }",
    "//         })",
    "//     },",
    "//     'config': {",
    "//         // Specify config values like so.",
    "//         'api_key': '123',  ",
    "//         'my_special_key': 'secret',",
    "//         // Specify what config values should be available on the front end.",
    "//         'export': ['api_key']  ",
    "//     }",
    "// });",
    "// // You can add custom steps for your process like deploying to github pages",
    "// recipe.register('deploy to github', mott.tasks['deploy-to-github'])",
    "// // And then combine steps or other tasks into hand command line calls",
    "// recipe.task('deploy', ['build', 'deploy to github'])",
    "// // Start the cli for your new cookbook.",
    "// cookbook.cli();",
    "// // Now run ./mott.js run to develop your app.",
    "// // When you're ready, run ./mott.js deploy to deploy your app to github pages.",
],
indexTpl = [
    "html",
    "    head",
    "        title mott - get things done.",
    "    body",
    "        h1 What would be good here?"
];



var fs = require('fs'),
    async = require('async'),
    child_process = require('child_process');

module.exports = function(){
    async.waterfall([
        checkFiles,
        createFiles,
        // install,
        woosh
    ], function(err){
        if(err){
            console.log(err.message);
        }
    });
};

function checkFiles(done){
    async.map(['./index.jade', './mott.js'], fs.exists, function(res){
        if(res){
            return done(new Error('./index.jade or ./mott.js already exists.  You probably dont want quickstart right now.'));
        }
        done();
    });
}

function createFiles(done){
    fs.writeFile('./mott.js', mottjsTpl.join('\n'), function(err){
        if(err) return done(err);
        fs.chmod('./mott.js', 511, function(){
            fs.writeFile('./index.jade', indexTpl.join('\n'), function(err){
                if(err) return done(err);
                done();
            });
        });
    });
}

function install(done){
    child_process.exec('npm install mott --save', done);
}

function woosh(){
    console.log('woooosshh');
    console.log('You\'re all set.  Run ./mott.js run to get started.');
}