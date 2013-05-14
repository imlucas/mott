"use strict";

var Q = require('q'),
    util = require('util');

function Cookbook(opts){
    this.config = opts.config;
    this.apps = opts.apps;
}

Cookbook.prototype.exec = function(taskName, opts, done){
    var self = this,
        names = [],
        appNames = opts.apps || 'all',
        allAppNames = Object.keys(this.apps);
    // @todo (lucas) Decorate context more based on selected environment,
    // rebuild config, etc.
    Q.all(allAppNames.filter(function(name){
        if(appNames === 'all'){
            return true;
        }
        return ['web', 'all', 'ios'].indexOf(name) > -1;
    }).map(function(name){
        return self.apps[name].runTask(taskName);
    })).then(function(){
        done();
    })
    .done();
};

Cookbook.prototype.prepare = function(done){
    var self = this;
    Q.all(Object.keys(this.apps).map(function(app){
        return self.apps[app].prepare();
    })).then(done).done();
};

Cookbook.prototype.cli = function(){
    var self = this;

    self.prepare(function(){
        console.log('prepared.');
        self.exec('build', {}, function(){
            console.log('build done');
        });
    });
};

module.exports = Cookbook;
