"use strict";
var Cookbook = require('./cookbook'),
    Recipe = require('./recipe');

module.exports = function(name){
    return new Recipe(name)
    .step('less', require('./tasks/less'))
    .step('js', require('./tasks/browserify'))
    .step('watch', require('./tasks/watch'))
    .step('run', require('./tasks/dev-server.js'))
    .step('pages', require('./tasks/pages.js'))


    .task('build', ['js', 'less', 'pages'])
    .task('run', ['build', 'run', 'watch'])
    // .step('deploy', require('./tasks/deploy-to-s3.js'))
    // .task('deploy', ['build', 'deploy'])
    // .provides('config', {
    //     'deploy': 's3://key:secret@mybucket'
    // })
    .provides('metadata', {
        'js': {'js/main.js': 'app.js'},
        'less': {'less/main.less': 'app.css'},
        'pages': {'index.jade': 'index.html'},
        'includes': {'node_modules/bootstrap/img/*.png': 'img/$1.png'}
    });
};

// package.json
// {
//   "name": "mott-recipe-lucas-single-page-app",
//   "version": "0.0.1",
//   "dependencies": {
//     "twitter-bootstrap": "git://github.com/twitter/bootstrap.git"
//   }
// }
//
// I would like my mott file to look like:
// require('mott')
//     .use('mott-recipe-lucas-single-page-app')
//     .use('mott-step-deploy-to-s3')
//     .configure({
//         'config': {
//             'deploy': 's3://key:secret@some-app-experiment'
//         }
//     })
//     .cli();