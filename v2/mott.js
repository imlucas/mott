"use strict";
var Q = require('q'),
    fs = require('fs'),
    md = require( "markdown" ).markdown,
    readFile = Q.denodeify(fs.readFile),
    writeFile = Q.denodeify(fs.writeFile),
    Cookbook = require('./cookbook'),
    Resource = require('./resource'),
    Recipe = require('./recipe');


// @todo (lucas) Could context hold open resources that can be flushed to
// disk after a step is completed?
function Context(){
    this.resources = {};
}

// Transform globs / and regexes.
Context.prototype.expand = function(){};

Context.prototype.getResource = function(src, dest, buf){
    if(!this.resources[src]){
        this.resources[src] = new Resource(src, dest, buf);
    }
    return this.resources[src];
};

Context.prototype.extend = function(o){
    for(var key in o){
        this[key] = o[key];
    }
    return this;
};

var recipe = new Recipe()
    .register('less', require('./less'))
    .register('js', require('./browserify'))
    .task('build', ['js', 'less'], 'parallel')
    .task('run', ['build', 'run', 'watch'])
    .task('deploy', ['build', 'deploy']);

// Minify yo.
// .transform('build:browserify', function(buf, done){});
new Cookbook({
    'apps': {
        'web': recipe.configure({
            'js': {
                'js/main.js': 'app.js'
            },
            'less': {
                'less/main.less': 'app.css'
            },
            'pages': {
                'index.jade': 'index.html'
            }
        })
    },
    'config': {
        'api_key': '123',
        'export': ['api_key']
    }
}).exec('build', function(){
    console.log('build done');
});
