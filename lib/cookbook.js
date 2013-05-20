"use strict";

var Q = require('q'),
    util = require('util'),
    async = require('async'),
    argv = require('optimist').argv;

function Cookbook(opts){
    this.config = opts.config;
    this.apps = opts.apps;
}

Cookbook.prototype.exec = function(taskName, opts, done){
    var self = this,
        names = [],
        appNames = opts.apps || 'all',
        allAppNames = Object.keys(this.apps),
        tasks = allAppNames.filter(function(name){
            if(appNames === 'all'){
                return true;
            }
            return allAppNames.indexOf(name) > -1;
        }).map(function(name){
            return function(cb){
                console.log('Running ' + taskName + '.' + name + '...');
                self.apps[name].ctx.environment = opts.environment;
                self.apps[name].ctx.config = self.config;
                self.apps[name].runTask(taskName, cb);
            };
        });

    async.series(tasks, done);
};

Cookbook.prototype.prepare = function(done){
    var self = this;
    async.parallel(Object.keys(this.apps).map(function(app){
        self.apps[app].ctx.cookbook = self;
        return function(cb){
            console.log('here');
            self.apps[app].prepare(function(){
                console.log(arguments);
                cb();
            });
        };
    }), done);
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
        opts = {},
        appNames = (argv.apps || argv.app || '').split(',');

    if(appNames.length === 0){
        appNames = 'all';
    }

    opts.apps = appNames;
    opts.environment = process.NODE_ENV || argv.env || argv.environment || 'development';

    self.prepare(function(){
        if(argv.l || argv.list || argv._[0] === 'list'){
            return self.list();
        }
        self.exec(argv._[0], opts, function(err){
            if(err){
                console.error(err);
                return process.exit(1);
            }
            console.log('complete');
        });
    });
};

module.exports = Cookbook;
