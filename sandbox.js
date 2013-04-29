"use strict";

var util = require('util'),
    Q = require('q'),
    browserify = require('browserify'),
    nconf = require('nconf'),
    fs = require('fs'),
    uglify = require('uglify-js'),
    writeFile = Q.denodeify(fs.writeFile);

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
        if(nconf.get('MINIFY')){
            buffer = uglify(buffer);
        }
        writeFile(self.dest, buffer).then(function(){
            d.resolve(self);
        });
    });
    return d.promise;
};

function Recipe(tpl, ctx){
    this.tpl = tpl;
    this.ctx = ctx;
}
Recipe.prototype.getJSON = function(){
    return JSON.parse(JSON.stringify(this.tpl).replace(/{{app}}/g, this.ctx.app));
};

var tpl = {
    "js": {
        "{{app}}/js/main.js": {
            "dest": "{{app}}/app.js",
            "templating": {
                "engine": "handlebars",
                "helpers": [
                    "common/js/helpers/*.js",
                    "{{app}}/js/helpers/*.js"
                ],
                "partials": [
                    "common/js/partials/*.html",
                    "{{app}}/js/partials/*.html"
                ]
            }
        },
        "{{app}}/js/bootstrap-loader.js": "{{app}}/bootstrap-loader.js"
    },
    "less": {
        "{{app}}/less/main.less": "{{app}}/app.css"
    },
    "pages": {
        "{{app}}/index.html": "/index.html",
        "{{app}}/pages/(.*).html": "/page/$1"
    },
    "assets": [
        "common/*"
    ]
};

var webRecipe = new Recipe(tpl, {'app': 'web'}),
    iphoneRecipe = new Recipe(tpl, {'app': 'iphone'});

var config = {
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
};

console.log(util.inspect(config, false, 10, true));

// function PageGenerator(src, dest){
//     this.src = src;
//     this.dest = dest;
//     this.inputFormat = 'md';
//     this.outputFormat = 'html';
// }

// PageGenerator.prototype.transform = function(){
//     var d = Q.defer();
//     return Q.promise;
// };

// PageGenerator.prototype.run = function(){};
