"use strict";

var Q = require('q');

function Cookbook(opts){
    this.config = opts.config;
    this.apps = opts.apps;
}

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

Cookbook.prototype.exec = function(stepName, done){
    var self = this,
        names = [];

    // @todo (lucas) Decorate context more based on selected environment, rebuild config, etc.
    Q.all(Object.keys(this.apps).filter(function(name){
        return ['web'].indexOf(name) > -1;
    }).map(function(name){
        return self.runStepOnApp(self.apps[name], stepName);
    })).then(function(){
        done();
    })
    .done();
};

module.exports = Cookbook;
