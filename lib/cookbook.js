"use strict";

var fs = require('fs-extra'),
    util = require('util'),
    async = require('async'),
    argv = require('optimist').argv,
    debug = require('debug')('mott:cookbook');

function Cookbook(opts){
    var self = this;

    this.config = opts.config || {};
    this.environments = opts.environments || {};
    this.recipes = opts.recipes;
    this.environment = undefined;

    Object.keys(this.recipes).map(function(recipeName){
        self.config = util._extend(self.recipes[recipeName].recipe.providesConfig, self.config);
    });
}

Cookbook.prototype.exec = function(taskName, opts, done){
    debug('exec ' + taskName);
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
            debug('running ' + taskName + '.' + name + '...');
            self.recipes[name].runTask(taskName, function(err){
                var key = name + '.' + taskName;
                if(completed[name]){
                    console.trace(key + ' was already called.  Is one of your tasks calling done more than once?');
                }
                completed[name] = true;
                cb(err);
            });
        };
    });

    async.waterfall(tasks, function(err){
        if(err){
            debug(err);
        }
        debug(taskName, 'completed');
        done(err);
    });
};

Cookbook.prototype.prepare = function(done){
    var self = this;

    fs.readJson('./settings.json', function(err, data){
        if(!err){
            debug('mixing in settings.json');
            self.config = util._extend(data.config, self.config);
            self.environments = util._extend(data.environments, self.environments);
        }

        // Apply environment specific config keys.
        if(self.environments[self.environment]){
            Object.keys(self.environments[self.environment]).map(function(key){
                self.config[key] = self.environments[self.environment][key];
            });
        }

        async.parallel(Object.keys(self.recipes).map(function(name){
            self.recipes[name].ctx.cookbook = self;
            self.recipes[name].ctx.environment = self.environment;
            self.recipes[name].ctx.config = self.config;
            return function(cb){
                self.recipes[name].prepare(cb);
            };
        }), done);
    });
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
    self.environment = process.NODE_ENV || argv.env || argv.environment || 'development';

    debug('environment', self.environment);

    self.prepare(function(){
        if(argv.l || argv.list || argv._[0] === 'list'){
            return self.list();
        }
        self.exec(argv._[0], opts, function(err){
            if(err){
                console.error(err);
                return process.exit(1);
            }
        });
    });
};

module.exports = Cookbook;
