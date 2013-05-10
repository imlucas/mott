"use strict";
var Q = require('q');

var log = {
    'debug': console.log,
    'error': console.error
};

function Recipe(){
    this.steps = {};
}

Recipe.prototype.use = function(step, func){
    log.debug('add `' + step + '` step: ', func);
    if(!this.steps[step]){
        this.steps[step] = [];
    }
    this.steps[step].push(func);
    return this;
};

Recipe.prototype.context = function(tpl){
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

Cookbook.prototype.cli = function(){
    log.debug('starting CLI');
};

Cookbook.prototype.runStepOnApp = function(app, stepName){
    return Q.all(app.steps[stepName].map(function(step){
        var d = Q.defer();
        step({}, function(err, res){
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
    .use('build', function(ctx, done){
            log.debug('inline build step');
            done();
        }
    );

new Cookbook({
    'apps': {'web': recipe.context({
        'js': {
            'js/main.js': 'app.js'
        },
        'less': {
            'less/main.less': 'app.css'
        },
        'pages': {
            'index.html': 'index.html'
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
