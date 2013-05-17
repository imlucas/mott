"use strict";

var Q = require('q'),
    util = require('util'),
    argv = require('optimist').argv;

function Cookbook(opts){
    this.config = opts.config;
    this.apps = opts.apps;
}

Cookbook.prototype.exec = function(taskName, opts, done){
    var self = this,
        names = [],
        appNames = opts.apps || 'all',
        allAppNames = Object.keys(this.apps);

    // @todo (lucas) Decorate context more based on selected environment
    Q.all(allAppNames.filter(function(name){
        if(appNames === 'all'){
            return true;
        }
        return allAppNames.indexOf(name) > -1;
    }).map(function(name){
        self.apps[name].ctx.cookbook = self;
        return self.apps[name].runTask(taskName);
    })).then(function(){
        done();
    })
    .done();
};

Cookbook.prototype.prepare = function(done){
    var self = this;
    Q.all(Object.keys(this.apps).map(function(app){
        self.apps[app].ctx.cookbook = self;
        return self.apps[app].prepare();
    })).then(done).done();
};

Cookbook.prototype.list = function(){
    var self = this;
    Object.keys(this.apps).map(function(appName){
        console.log(appName);
        var tasks = self.apps[appName].recipe.tasks;
        Object.keys(tasks).map(function(taskName){
            console.log('  * ' + taskName);
        });
    });
};

Cookbook.prototype.cli = function(){
    var self = this,
        appNames = (argv.apps || argv.app || '').split(',');

    if(appNames.length === 0){
        appNames = 'all';
    }

    self.prepare(function(){
        if(argv.l || argv.list){
            return self.list();
        }
        self.exec(argv._[0], {'apps': appNames}, function(){
        });
    });
};

module.exports = Cookbook;
