"use strict";

var Q = require('q'),
    util = require('util');

function Cookbook(opts){
    this.config = opts.config;
    this.apps = opts.apps;
}

Cookbook.prototype.runStepOnApp = function(app, stepName){
    return Q();
    // return Q.all(app.steps[stepName].map(function(step){
    //     var d = Q.defer();

    //     step(app.ctx, function(err, res){
    //         if(err){
    //             return d.reject(err);
    //         }
    //         return d.resolve(res);
    //     });
    //     return d.promise;
    // }));
};

Cookbook.prototype.exec = function(appNames, taskName, done){
    var self = this,
        names = [];

    // @todo (lucas) Decorate context more based on selected environment, rebuild config, etc.
    Q.all(Object.keys(this.apps).filter(function(name){
        return ['web', 'all', 'ios'].indexOf(name) > -1;
    }).map(function(name){
        return self.runStepOnApp(self.apps[name], taskName);
    })).then(function(){
        done();
    })
    .done();
};


Cookbook.prototype.run = function(taskName, done){

};

Cookbook.prototype.prepare = function(done){
    var self = this;

    Q.all(Object.keys(this.apps).map(function(app){
        return self.apps[app].prepare();
    })).then(function(){
        console.log(util.inspect(self.apps, true, 10, true));
        done();
    }).done();
};

Cookbook.prototype.cli = function(){
    this.prepare(function(){
        console.log('prepared.');
    });
};

module.exports = Cookbook;
