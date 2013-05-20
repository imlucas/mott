"use strict";
var Q = require('q'),
    glob = require('glob');

function isGlob(s){
    return s.indexOf('/*') > -1;
}

function globToRegex(s){
    return new RegExp(s.replace(/\*?\*/, '(.*)'));
}

// @todo (lucas) Could context hold open resources that can be flushed to
// disk after a step is completed?
function Context(tpl){
    this.ready = false;
    this.keys = [];
    if(tpl){
        this.extend(tpl);
    }
    this.baseDir = process.cwd();
}
Context.prototype.buildPath = function(dest){
    return this.path('build/' + dest);
};
Context.prototype.path = function(src){
    return this.baseDir + '/' + src;
};

Context.prototype.dest = function(key, src){
    return this[key][src].dest;
};

Context.prototype.extend = function(o){
    for(var key in o){
        this[key] = o[key];
        this.keys.push(key);
    }
    return this;
};

Context.prototype.getConfig = function(){
    var o = {},
        self = this;

    (this.config.export || Object.keys(this.config)).map(function(key){
        o[key] = self.config[key];
    });
    o.environment = this.environment;
    return o;
};

Context.prototype.prepare = function(){
    var self = this;

    return Q.all(this.keys.map(function(key){
        if(self[key] !== Object(self[key])){
            return Q();
        }

        var v = Object.keys(self[key]);
        v.map(function(src){
            if(isGlob(src)){
                var dest = self[key][src].hasOwnProperty('dest') ?
                    self[key][src].dest : self[key][src],
                    d = Q.defer();

                new glob.Glob(src, {'mark': true, 'sync': true}, function(err, matches){
                    if(err){
                        return d.reject(err);
                    }
                    var re = globToRegex(src);

                    matches.map(function(match){
                        self[key][match] = {};

                        // Now for fun...
                        // Handle pages/*.jade: pages/$1.html
                        if(dest.indexOf('$') > -1){
                            self[key][match].dest = match.replace(re, dest);
                        }
                        else{
                            self[key][match].dest = dest;
                        }
                    });

                    delete self[key][src];

                    d.resolve();
                });
                return d.promise;
            }
            else {
                self[key][src] = {'dest': self[key][src]};
            }
        });
    })).then(function(){
        self.ready = true;
    });
};

Context.prototype.runTask = function(name, done){
    return this.cookbook.exec(name, {}, done);
};

module.exports = Context;
