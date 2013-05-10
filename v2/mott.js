"use strict";
var Q = require('q'),
    fs = require('fs'),
    md = require( "markdown" ).markdown,
    readFile = Q.denodeify(fs.readFile),
    writeFile = Q.denodeify(fs.writeFile);

var log = {
    'debug': console.log,
    'error': console.error
};

function Context(){}
Context.prototype.extend = function(o){
    for(var key in o){
        this[key] = o[key];
    }
    return this;
};

function Recipe(){
    this.steps = {};
    this.nameToStep = {};

    this.ctx = new Context();
}

// @todo (lucas) Keep a mapping so we can fire callbacks when particular
// steps are called to do other things, ie transform.
Recipe.prototype.use = function(step, name, func){
    log.debug('add `' + step + '` step: ', func);
    if(!this.steps[step]){
        this.steps[step] = [];
    }

    this.steps[step].push(func);
    return this;
};

// Register a transform callback.
Recipe.prototype.transform = function(name, cb){
    return this;
};

Recipe.prototype.context = function(tpl){
    this.ctx.extend(tpl);
    return this;
};

function Cookbook(opts){
    this.config = opts.config;
    this.apps = opts.apps;
}

Cookbook.prototype.build = function(app, done){
    var apps = [];

    if(!done && app){
        done = app;
        apps = ['web'];
    }
    else {
        apps = [app];
    }

    log.debug('build called');
    this.exec(apps, 'build', function(err){
        if(err){
            done(err);
            return log.error(err);
        }
        log.debug('build done');
        done();
    });
};

Cookbook.prototype.runStepOnApp = function(app, stepName){
    return Q.all(app.steps[stepName].map(function(step){
        var d = Q.defer();

        step(app.ctx, function(err, res){
            if(err){
                return d.reject(err);
            }
            return d.resolve(res);
        });
        return d.promise;
    }));
};

Cookbook.prototype.exec = function(appNames, stepName, done){
    var self = this,
        names = [];
    // @todo (lucas) Decorate context more based on selected environment, rebuild config, etc.

    log.debug('exec step `'+stepName+'`');
    Q.all(Object.keys(this.apps).filter(function(name){
        return appNames.indexOf(name) > -1;
    }).map(function(name){
        return self.runStepOnApp(self.apps[name], stepName);
    })).then(function(){
        done();
    })
    .done();
};

var recipe = new Recipe()
.use('build', 'just a test', function(ctx, done){
        log.debug('inline build step', ctx);
        done();
    }
)
.use('build', 'build less', function(ctx, done){
    if(!ctx.less){
        return done();
    }

    var less = require('less'),
        path = require('path'),
        opts = {
            'compress': false,
            'yuicompress': false,
            'optimization': 1,
            'strictImports': false
        };

    Q.all(Object.keys(ctx.less).map(function(src){
        return readFile(src, 'utf-8').then(function(buf){
            // @todo (lucas) Replace with Q.fncall?
            var d = Q.defer();
            new less.Parser({
                'paths': [path.dirname(src)],
                'optimizations': opts.optimizations,
                'filename': src,
                'strictImports': opts.strictImports
            }).parse(buf, function(err, tree){
                if(err){
                    return d.reject(err);
                }

                // @todo (lucas) Need a common way to yield a result
                d.resolve({
                    'data': tree.toCSS({
                        'compress': opts.compress,
                        'yuicompress': opts.yuicompress
                    }),
                    'path': src
                });
            });
            return d.promise;
        });
    })).then(function(){
        done();
    }, function(err){
        done(err);
    }).done();
})
.use('build', 'browserify', function(ctx, done){
    var browserify = require('browserify');

    Object.keys(ctx.js).map(function(src){
        var bundle = browserify();
        // @todo (lucas) Support for client side templates.  HBS first.
        bundle.bundle({'debug': false}, function(err, src){
            //
        });
    });
});

// Minify yo.
// .transform('build:browserify', function(buf, done){});
new Cookbook({
    'apps': {'web': recipe.context({
        'js': {
            'js/main.js': 'app.js'
        },
        'less': {
            'less/main.less': 'app.css'
        },
        'pages': {
            'index.jade': 'index.html'
        }
    })},
    'config': {
        'api_key': '123',
        'export': ['api_key']
    },
    // 'environments': {
    //     'production': {
    //         'api_key': '456'
    //     }
    // }
}).build(function(){
    log.debug('build done');
});
