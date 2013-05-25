"use strict";

var Q = require('q'),
    util = require('util'),
    async = require('async'),
    argv = require('optimist').argv;

function Cookbook(opts){
    this.config = opts.config;
    this.recipes = opts.recipes;

    // @todo (lucas) Extract providesConfig from recipes,
    // copy into config, dont override existing keys.
}

Cookbook.prototype.exec = function(taskName, opts, done){
    console.log('exec ' + taskName);
    var self = this,
        names = [],
        completed = {},
        appNames = opts.recipes || 'all',
        allAppNames = Object.keys(this.recipes),
        tasks = [];

    tasks = allAppNames.filter(function(name){
        if(appNames === 'all'){
            return true;
        }
        return allAppNames.indexOf(name) > -1;
    }).map(function(name){
        return function(cb){
            console.log('Running ' + taskName + '.' + name + '...');
            self.recipes[name].ctx.environment = opts.environment;
            self.recipes[name].ctx.config = self.config;
            self.recipes[name].runTask(taskName, function(){
                var key = name + '.' + taskName;
                if(completed[name]){
                    console.trace(key + ' was already called.  Is one of your tasks calling done more than once?');
                }
                completed[name] = true;
                cb();
            });
        };
    });

    async.waterfall(tasks, function(err){
        console.log('finished exec `'+taskName+'`');
        done(err);
    });
};

Cookbook.prototype.prepare = function(done){
    var self = this;
    async.parallel(Object.keys(this.recipes).map(function(app){
        self.recipes[app].ctx.cookbook = self;
        return function(cb){
            self.recipes[app].prepare(cb);
        };
    }), done);
};

Cookbook.prototype.list = function(){
    var self = this;
    Object.keys(this.recipes).map(function(appName){
        console.log(appName);
        var tasks = self.recipes[appName].recipe.tasks;
        Object.keys(tasks).map(function(taskName){
            console.log('  * ' + taskName);
        });
    });
};

Cookbook.prototype.cli = function(){
    var self = this,
        opts = {},
        appNames = (argv.recipes || argv.app || '').split(',');

    if(appNames.length === 0){
        appNames = 'all';
    }

    opts.recipes = appNames;
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
            console.log('completed `'+argv._[0]+'`');
        });
    });
};

module.exports = Cookbook;
