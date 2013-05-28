"use strict";
var fs = require('fs'),
    glob = require('glob'),
    crypto = require('crypto'),
    async = require('async'),
    path = require('path'),
    zlib = require('zlib');

function isGlob(s){
    return s.indexOf('/*') > -1;
}

function globToRegex(s){
    return new RegExp(s.replace(/\*?\*/, '(.*)'));
}

// Temp.
function compressData(data, done){
    zlib.gzip(data, done);
}

// @todo (lucas) Could context hold open resources that can be flushed to
// disk after a step is completed?
function Context(metadata){
    this.ready = false;
    this.keys = [];
    if(metadata){
        this.extend(metadata);
    }
    this.baseDir = path.dirname(process.argv[1]);

    this.filesTouched = {};
}

Context.prototype.path = function(src){
    var args = Array.prototype.slice.call(arguments, 0);
    // return path.resolve(this.baseDir, path.join(args));
    return path.resolve(this.baseDir, src);
};

Context.prototype.dest = function(key, src){
    return this[key][src].dest;
};

Context.prototype.writeFile = function(path, buf, done){
    fs.writeFile(path, buf, function(err){
        // @todo (lucas) Update filesTouched
        done(err);
    });
    return this;
};

Context.prototype.readFile = function(path, done){
    // @todo (lucas) If in memory return now.
    fs.readFile(path, function(err, buf){
        done(err, buf);
    });
    return this;
};

Context.prototype.copyFile = function(src, dest, done){
    // @todo (lucas) Update filesTouched
    return this;
};

// Return paths to build files this context produced.
Context.prototype.files = function(){
    return Object.keys(this.filesTouched);
};

Context.prototype.getFileInfo = function(src, done){
    fs.stat(src, function(err, stats){
        if(err) {
            return done(err);
        }

        stats.src = src;
        if(!stats.isFile()){
            return done(null, stats);
        }
        fs.readFile(src, function(err, data){
            if(err) {
                return done(err);
            }

            stats.md5 =  crypto.createHash('md5').update(data).digest('hex');
            return done(null, stats);
        });
    });
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

Context.prototype.prepare = function(done){
    var self = this,
        tasks = [];

    tasks = this.keys.map(function(key){
        if(self[key] !== Object(self[key])){
            return null;
        }
        return function(callback){


            var v = Object.keys(self[key]);
            async.parallel(v.map(function(src){
                return function(cb){
                    var dest = self.path('build/' + (self[key][src].dest || self[key][src]));
                    if(isGlob(src)){
                        new glob.Glob(self.path(src), {'mark': true}, function(err, matches){
                            if(err){
                                return cb(err);
                            }
                            var re = globToRegex(self.path(src));

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
                            cb();
                        });
                    }
                    else {
                        if(self[key][src] !== Object(self[key][src])){
                            self[key][self.path(src)] = {};
                        }
                        else {
                            self[key][self.path(src)] = self[key][src];
                        }

                        self[key][self.path(src)].dest = dest;
                        delete self[key][src];
                        cb();
                    }
                };
            }), callback);
        };
    }).filter(function(r){
        return r !== null;
    });
    async.parallel(tasks, function(err){
        if(err){
            return done(err);
        }
        self.ready = true;
        done();
    });
};

Context.prototype.runTask = function(name, done){
    return this.cookbook.exec(name, {}, done);
};

module.exports = Context;
