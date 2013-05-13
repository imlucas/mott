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
}

// Transform globs / and regexes.
Context.prototype.expand = function(done){
    this.keys.forEach(function(k){

    });
    return this;
};

Context.prototype.extend = function(o){
    for(var key in o){
        this[key] = o[key];
        this.keys.push(key);
    }
    return this;
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
                return Q();
            }
        });
    }));
};
module.exports = Context;
