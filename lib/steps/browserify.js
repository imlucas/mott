"use strict";

var browserify = require('browserify'),
    async = require('async'),
    fs = require('fs'),
    through = require('through'),
    glob = require('glob'),
    Handlebars = require("handlebars");

module.exports = function(ctx, done){
    if(!ctx.js){
        return done();
    }
    async.parallel(Object.keys(ctx.js).map(function(src){
        return function(cb){
            fs.exists(src, function(exists){
                if(!exists){
                    return cb(new Error(src + ' doesn\'t exist.  Did you forget to create it?'));
                }

                var bundle,
                    files = [src],
                    data = ctx.js[src],
                    debug = data.debug || ctx.environment === 'development';


                function writeBundle(callback){
                    bundle.on('error', callback);
                    bundle.bundle({'debug': debug}, function(err, buf){
                        if(err){
                            return callback(err);
                        }
                        ctx.writeFile(ctx.js[src].dest, buf, callback);
                    });
                }

                if(!data.templating){
                    bundle = browserify(files);
                    return writeBundle(cb);
                }
                if(data.templating.engine === 'handlebars'){

                    // Collect up all of our partials and helpers
                    // to build the initial handlebars environment
                    // instead of doing any crazy AST parsing
                    // and writing custom environments per template.
                    async.parallel([['partials', 'html'], ['helpers', 'js']].map(function(f){
                        return function(callback){
                            findNamedFiles(data.templating[f[0]].map(function(p){
                                // expand paths
                                return ctx.path(p);
                            }), f[1], callback);
                        };
                    }), function(err, res){
                        var partials = res[0] || [],
                            helpers = res[1] || [],
                            s = ["var Handlebars = require('handlebars-runtime');"];

                        partials.forEach(function(p){
                            s.push("Handlebars.registerPartial('"+p[0]+"', require('"+p[1]+"'));");
                        });

                        helpers.forEach(function(h){
                            s.push("Handlebars.registerHelper('"+h[0]+"', require('"+h[1]+"'));");
                        });

                        fs.writeFile(ctx.path('build/handlebars-env.js'), s.join("\n"), function(err){
                            if(err){
                                return cb(err);
                            }
                            // The handlebars env needs to be evaluated first
                            // by browserify before our main app js
                            // because of the dependency tree.
                            files.unshift(ctx.path('build/handlebars-env.js'));

                            bundle = browserify(files);
                            // Register the transform so that required .hbs or .html
                            // files get procompiled.
                            bundle.transform(handlebarsTransform);

                            writeBundle(function(err){
                                fs.unlink(ctx.path('build/handlebars-env.js'), function(){
                                    cb(err);
                                });
                            });
                        });
                    });

                }
                else {
                    return cb(new Error("Don't know how to handle engine " + data.templating.engine));
                }
            });
        };
    }), done);
};

function handlebarsTransform(file){
    if(!/\.hbs/.test(file) && !/\.html/.test(file)){
        return through();
    }

    var buffer = "";
    return through(function(chunk) {
        buffer += chunk.toString();
    },
    function() {
        var js = Handlebars.precompile(buffer),
            compiled = "var Handlebars = require('handlebars-runtime');\n";

        compiled += "module.exports = Handlebars.template(" + js.toString() + ");\n";
        this.queue(compiled);
        this.queue(null);
    });
}

function findNamedFiles(globs, ext, done){
    async.parallel(globs.map(function(p){
        return function(callback){
            glob(p, function(err, matches){
                callback(err, matches);
            });
        };
    }), function(err, results){
        if(err){
            return done(err);
        }
        if(results.length === 0){
            return done(null, []);
        }
        done(null, results.reduce(function(a, b){
                return a.concat(b);
            }).map(function(res){
                return [new RegExp('[^/]*$', 'g').exec(res)[0].replace('.'+ ext, ''), res];
            })
        );
    });
}