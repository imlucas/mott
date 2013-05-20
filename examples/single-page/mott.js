#!/usr/bin/env node

"use strict";
var mott = require('../../lib'),
    Cookbook = mott.Cookbook;

var fs = require('fs');
var crypto = require('crypto');


// function deployAllToS3(ctx, done){
//     var Glob = require('glob').Glob,
//         async = require('async'),
//         files = [];

//     new Glob('build/**', {'match': true}, function(err, matches){
//         async.map(matches, getFileInfo, function(err, results){
//             results = results.filter(function(stat){
//                 return stat.isFile();
//             });
//             done();
//         });
//     });
// }

var recipe = mott()
    .register('less', require('../../lib/tasks/less'))
    .register('js', require('../../lib/tasks/browserify'))
    .register('watch', require('../../lib/tasks/watch'))
    .register('run', require('../../lib/tasks/dev-server.js'))
    .register('pages', require('../../lib/tasks/pages.js'))
    .register('write bootstrap', require('../../lib/tasks/write-bootstrap.js'))
    .task('build', ['js', 'less', 'pages', 'write bootstrap'])

    .task('run', ['build', 'run', 'watch'])

    .task('deploy', ['build', 'deploy'])

    .transform('js', function(ctx, resource, done){
        if(ctx.environment !== 'production'){
            return done();
        }
        // minify(resource, done);
    })
    .transform('less', function(ctx, resource, done){
        if(ctx.appName !== 'web'){
            return done();
        }
        // make CSS images absolute
    });


new Cookbook({
    'apps': {
        'web': recipe.configure({
            'js': {
                './js/main.js': 'app.js',
                './js/bootstrap-loader.js': 'bootstrap-loader.js'
            },
            'less': {
                'less/main.less': 'app.css'
            },
            'includes': {
                "index.html": "index.html"
            },
            'pages': {
                'pages/*.jade': 'page/$1.html'
            },
        })
    },
    'config': {
        'api_key': '123',
        'export': ['api_key']
    }
}).cli();

// // mott deploy.production --apps web,ios

// new Cookbook({
//     'apps': {
//         'ios': recipe.configure({
//             'js': {
//                 'js/main.js': 'app.js',
//                 'js/bootstrap-loader.js': 'bootstrap-loader.js'
//             },
//             'less': {
//                 'less/main.less': 'app.css'
//             },
//             'platform': 'ios'
//         }).use(require('./cordova'))
//     },
//     'config': {
//         'api_key': '123',
//         'export': ['api_key']
//     }
// }).run('build', function(){
//     // will execute recipe.build then cordova.build.
//     console.log('build done');
// });

// Use single page recipe for both a webapp and ios app and start the cli.
// new Cookbook({
//     'apps': {
//         'ios': recipe.configure({
//             'js': {
//                 'ios/js/main.js': 'ios/app.js',
//                 'ios/js/bootstrap-loader.js': 'ios/bootstrap-loader.js'
//             },
//             'less': {
//                 'less/main.less': 'ios/app.css'
//             },
//             'platform': 'ios'
//         }).use(require('./cordova')),
//         'web': recipe.configure({
//             'js': {
//                 'js/main.js': 'app.js',
//                 'js/bootstrap-loader.js': 'bootstrap-loader.js'
//             },
//             'less': {
//                 'less/main.less': 'app.css'
//             }
//         })
//     },
//     'config': {
//         'api_key': '123',
//         'export': ['api_key'],
//         'deploy': 's3://mybucketname'
//     }
// }).cli();

// Command line usage:
// Build -> (+ cordova.build for ios) -> upload to S3 -> (+ package ipa for ios)
// ./mott deploy.production
//
// Or just the web app
// ./mott deploy.production --apps web
