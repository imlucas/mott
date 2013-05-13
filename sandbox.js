"use strict";

var util = require('util'),
    Q = require('q'),
    browserify = require('browserify'),
    nconf = require('nconf'),
    fs = require('fs'),
    uglify = require('uglify-js'),
    writeFile = Q.denodeify(fs.writeFile);


function Task(opts){}

function PageTask(opts){}

function JSTask(opts){}

function LessTask(opts){}


function DeployTask(opts){
    if(opts.uri.indexOf('s3://')){
        this.child = new DeployS3Task(opts);
    }
}
util.inherits(DeployTask, Task);

DeployTask.prototype.run = function(){
    return this.child.run();
};

function DeployS3Task(){}

function DeployGithubPagesTask(){}


// So things are sort of working now, but there is way too much cooked into the libs.
// It's so constrained that it makes a lot of functionality extremely brittle
// and not all the useful.  This needs to be corrected, along with better supporting
// a lot of cases we cludged our way around for the past few months.
// So here's some notes on ways to clean this up.
//
// ## 1. Cookbook
// * Defines the application configration
// * `Recipes` to configure each app (formerly platform)
// * `Environments` which override configuration keys
// * Generators handle recipes to prodive the final application.
// ## 2. Environment
//  * Pretty simple as per above.  Cases:
//  * You want to deploy to different S3 buckets for beta and prod
//  * Only gzip and crunch in production
// ## 3. Recipes
// * I don't like this "opinionated" configuration mott currently relies on.
// * You should be able to use something other than handlebars for front end templates.
// * Keeping all the configuration in static objects is going to be a nightmare for changing things and adding new features
// ## 4. Generators
// * There are lots of other things you want to do ie build static pages, MD->HTML
// * Splitting into generators cleans up a lot of code.


// 1. Cookbook wraps up config data, recipes and environments.
function Cookbook(data){
    this.config = data.config;
    this.environments = data.environments;
    this.appRecipes = data.apps;
}

// Run cli
Cookbook.prototype.cli = function(){};

// 2. Environment: should their be an environment object?

// 3. Recipes hold oonfiguration
function Recipe(tpl, ctx){
    this.tpl = tpl;
    this.ctx = ctx;
    this.config = {};
}

// Recipe can spit out templated object.
Recipe.prototype.getData = function(){
    return JSON.parse(JSON.stringify(this.tpl).replace(/{{app}}/g, this.ctx.app));
};


// 4. Generators
// Budle a browserify bundle.
function JSGenerator(src, dest){
    this.src = src;

    this.templatingEngine = null;
    this.templatingHelpers = [];
    this.templatingPartials = [];

    if(dest === Object(dest)){
        this.dest = dest.dest;
        this.templatingEngine = dest.templating.engine;
        this.templatingHelpers = dest.templating.helpers;
        this.templatingPartials = dest.templating.partials;
    }
    else {
        this.dest = dest;
    }
}
JSGenerator.prototype.run = function(){
    var d = Q.defer(),
        self = this,
        entryPoints = [this.src],
        bundle;

    bundle = browserify(entryPoints);

    bundle.bundle({debug: (nconf.get('NODE_ENV') === 'development')}, function(err, buffer){
        writeFile(self.dest, buffer).then(function(){
            d.resolve(self);
        });
    });
    return d.promise;
};

// Compile Less
function LessGenerator(){}
LessGenerator.prototype.transform = function(buffer, cb){};
LessGenerator.prototype.run = function(){};

// Markdown -> HTML
// Render some jade templates to HTML.
function PageGenerator(){}
PageGenerator.prototype.transform = function(buffer, cb){};
PageGenerator.prototype.run = function(){};





// Custom recipe.
// Should this also hold some package.json info?
function MyRecipe(ctx){
    var tpl = {
        js: {
            "{{app}}/js/main.js": {
                "dest": "{{app}}/app.js",
                "templating": {
                    engine: "handlebars",
                    helpers: [
                        "common/js/helpers/*.js",
                        "{{app}}/js/helpers/*.js"
                    ],
                    partials: [
                        "common/js/partials/*.html",
                        "{{app}}/js/partials/*.html"
                    ]
                }
            },
            "{{app}}/js/bootstrap-loader.js": "{{app}}/bootstrap-loader.js"
        },
        less: {
            "{{app}}/less/main.less": "{{app}}/app.css"
        },
        pages: {
            "{{app}}/index.html": "/index.html",
            "{{app}}/pages/*.html": "/page/$1"
        },
        include: [
            "common/*"
        ]
    };
    this.super_(tpl, ctx);
}
util.inherits(MyRecipe, Recipe);



var tpl = {
    'js': {
        'js/main.js': 'app.js'
    },
    'less': {
        'less/main.less': 'app.css'
    },
    'pages': {
        'index.html': 'index.html'
    }
};

var SimpleRecipe = Recipe.extend({});

new Cookbook({
    'apps': {'web': new SimpleRecipe(tpl)},
    'config': {
        'api_key': '123',
        'export': ['api_key']
    },
    'environments': {
        'production': {
            'api_key': '456'
        }
    }
}).cli();

function CordovaRecipe(){
    this.cordova = {
        build: function(){}
    };
}
util.inherits(CordovaRecipe, Recipe);

function IPhoneRecipe(){

}
util.inherits(IPhoneRecipe, CordovaRecipe);

IPhoneRecipe.prototype.build = function(){
    var self = this;

    return self.super.build().then(function(){
        return self.copyTo('./native/iphone');
    }).then(function(){
        return self.cordova.build('./native/iphone');
    });
};




// This is currently hardcoded in lib/build.  Recipes allow it to be moved out.
MyRecipe.prototype.transform = function(what, buffer, cb){
    if(what === 'css'){
        var regex = /url\(\/"?([\w\d\/\-\.\?\#\@]+)"?\)/g,
            replacement = (this.ctx.app === 'web' || this.ctx.app  === 'chromeapp') ?
                "url(/$1)" :  "url($1)";
        cb(null, buffer.replace(regex, replacement));
    }
};


function ExfmRecipe(){}

// Build configuration for a web app and an iphone app.
// Probably want a phonegap recipe?
var webRecipe = new MyRecipe({'app': 'web'}),
    iphoneRecipe = new MyRecipe({'app': 'iphone'});

// Above recipes specify a transform on their prototype.  Better as middleware style?
[webRecipe, iphoneRecipe].map(function(recipe){
    recipe.use(function(){
        return {
            transform: function(what, buffer, cb){

            }
        };
    });
});

// Make the cookbook
var cookbook = new Cookbook({
    "apps": {"web": webRecipe, "iphone": iphoneRecipe},
    "config": {
        "deploy": "s3://assets.extension.fm",
        "socketio": false
    },
    "environments": {
        "prod": {

        },
        "beta": {
            "deploy": "s3://beta-assets.extension.fm"
        },
        "development": {
            "deploy": "git://github.com/exfm/mott.git#gh-pages",
            "socketio": true
        }
    }
});

// Run a cli for this cookbook
cookbook.cli();

cookbook.smokeTest();

cookbook.test();

cookbook.deploy({environment: 'prod'});

console.log(util.inspect(cookbook, false, 10, true));
