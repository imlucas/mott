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
    this.ready = false;
}

// Transform globs / and regexes.
Context.prototype.expand = function(done){};

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
                'js/main.js': 'app.js',
                'js/bootstrap-loader.js': 'bootstrap-loader.js'
            },
            'less': {
                'less/main.less': 'app.css'
            }
        })
    },
    'config': {
        'api_key': '123',
        'export': ['api_key']
    }
}).run('build', function(){
    console.log('build done');
});

// mott deploy.production --apps web,ios

new Cookbook({
    'apps': {
        'ios': recipe.configure({
            'js': {
                'js/main.js': 'app.js',
                'js/bootstrap-loader.js': 'bootstrap-loader.js'
            },
            'less': {
                'less/main.less': 'app.css'
            },
            'platform': 'ios'
        }).use(require('./cordova'))
    },
    'config': {
        'api_key': '123',
        'export': ['api_key']
    }
}).run('build', function(){
    // will execute recipe.build then cordova.build.
    console.log('build done');
});


new Cookbook({
    'apps': {
        'ios': recipe.configure({
            'js': {
                'ios/js/main.js': 'ios/app.js',
                'ios/js/bootstrap-loader.js': 'ios/bootstrap-loader.js'
            },
            'less': {
                'less/main.less': 'ios/app.css'
            },
            'platform': 'ios'
        }).use(require('./cordova')),
        'web': recipe.configure({
            'js': {
                'js/main.js': 'app.js',
                'js/bootstrap-loader.js': 'bootstrap-loader.js'
            },
            'less': {
                'less/main.less': 'app.css'
            }
        })
    },
    'config': {
        'api_key': '123',
        'export': ['api_key']
    }
}).run('build', function(){
    // will execute recipe.build then cordova.build.
    console.log('build done');
});
