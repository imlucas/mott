"use strict";
var fs = require('fs-extra'),
    glob = require('glob'),
    crypto = require('crypto'),
    async = require('async'),
    path = require('path'),
    zlib = require('zlib'),
    mime = require('mime');


mime.define({
    'application/xml': ['plist']
});

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
    this.baseDir = process.cwd();

    this.filesTouched = {};
}

Context.prototype.toKey = function(src){
    return src.replace(this.path('build/'), '');
};

Context.prototype.path = function(src){
    var args = Array.prototype.slice.call(arguments, 0);
    // return path.resolve(this.baseDir, path.join(args));
    return path.resolve(this.baseDir, src);
};

Context.prototype.dest = function(key, src){
    return this[key][src].dest;
};

Context.prototype.writeFile = function(path, buf, done){
    var self = this;

    fs.writeFile(path, buf, function(err){
        self.filesTouched[path] = buf;
        done(err);
    });
    return this;
};

Context.prototype.readFile = function(src, done){
    var self = this;

    // if(self.filesTouched[path]){
    //     return done(undefined, self.filesTouched[path]);
    // }
    fs.readFile(src, function(err, buf){
        done(err, buf);
    });
    return this;
};

Context.prototype.copyFile = function(src, dest, done){
    var self = this;
    fs.mkdirs(path.dirname(dest), function(err){
        if(err){
            return done(err);
        }
        fs.copy(src, dest, function(err){
            self.filesTouched[dest] = true;
            done(err);
        });
    });
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
            var hash = crypto.createHash('md5').update(data);

            stats.mime = mime.lookup(src);
            stats.body = data;
            stats.md5 =  crypto.createHash('md5').update(data).digest('hex');
            stats.contentMD5 = crypto.createHash('md5').update(data).digest('base64');

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

    (this['export config'] || []).map(function(key){
        o[key] = self[key];
    });
    o.environment = this.environment;
    return o;
};

Context.prototype.prepare = function(done){
    var self = this,
        tasks = [];

    tasks = this.keys.map(function(key){
        // @todo (lucas) This should check if its a path that needs expanded or not.
        // for example, could just be a string like `native path`, which we
        // actually do want to be expanded out, but currently it does not.
        if(Array.isArray(self[key]) || self[key] !== Object(self[key])){
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
