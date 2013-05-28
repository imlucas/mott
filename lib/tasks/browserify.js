"use strict";

var browserify = require('browserify'),
    async = require('async'),
    fs = require('fs'),
    through = require('through'),
    glob = require('glob');

function configTransform(ctx){
    return function (file){
        if(!/config\.js/.test(file)){
            return through();
        }
        var buffer = "";

        return through(function(chunk) {
            buffer += chunk.toString();
        },
        function() {
            this.queue("module.exports = process.env = " + JSON.stringify(ctx.getConfig(), null, 4));
            this.queue(null);
        });
    };
}

function collectFiles(paths, done){
    async.parallel(paths.map(function(p){
        return function(callback){
            glob(p, function(matches){
                callback(matches);
            });
        };
    }), function(err, res){

    });
}

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
                    buf = '',
                    files = [src],
                    data = ctx.js[src],
                    debug = data.debug || ctx.environment !== 'production',
                    partials = [],
                    helpers = [];


                function writeBundle(callback){
                    bundle = browserify(files);
                    bundle.bundle({'debug': debug}, function(err, buf){
                        if(err){
                            return callback(err);
                        }

                        fs.writeFile(ctx.js[src].dest, buf, function(err){
                            callback(err);
                        });
                    });
                }

                function createEnvAndBundle(){
                    var s = ["var Handlebars = require('handlebars-runtime');"];

                    partials.forEach(function(p){
                        s.push("Handlebars.registerPartial('"+p[0]+"', require('"+p[1]+"'));");
                    });

                    helpers.forEach(function(h){
                        s.push("Handlebars.registerHelper('"+h[0]+"', require('"+h[1]+"'));");
                    });
                    buf = s.join("\n");

                    fs.write(ctx.path('build/handlebars-env.js'), buf, function(err){
                        if(err){
                            return cb(err);
                        }
                        writeBundle(function(err){
                            fs.unlink(ctx.path('build/handlebars-env.js'), function(){
                                cb(err);
                            });
                        });
                    });
                }


                if(!data.templating){
                    return writeBundle(cb);
                }
                if(data.templating.engine === 'handlebars'){
                    // Register the transform so that required .hbs or .html
                    // files get procompiled.
                    bundle.transform(handlebarsTransform);

                    // Collect up all of our partials and helpers
                    // to build the initial handlebars environment
                    // instead of doing any crazy AST parsing
                    // and writing custom environments per template.



                }
                else {
                    return cb(new Error("Don't know how to handle engine " + data.templating.engine));
                }


            });
        };
    }), done);
};


module.exports.findHelpers = function(platform){
    var assets = path.resolve(nconf.get('ASSETS')),
        files = [],
        s = [];

    files.push.apply(files, glob.sync(assets + '/common/js/helpers/*.js'));
    files.push.apply(files, glob.sync(assets + '/'+platform+'/js/helpers/*.js'));

    files.forEach(function(file){
        var name = new RegExp('[^/]*$', 'g').exec(file)[0].replace('.js', ''),
            p = file;
        s.push([name, p]);
    });

    return s;
};

module.exports.findPartials = function(platform){
    var assets = path.resolve(nconf.get('ASSETS')),
        files = [],
        s = [];

    files.push.apply(files, glob.sync(assets + '/common/templates/partials/*.html'));
    files.push.apply(files, glob.sync(assets + '/'+platform+'/templates/partials/*.html'));

    files.forEach(function(file){
        var name = new RegExp('[^/]*$', 'g').exec(file)[0].replace('.html', ''),
            p = file;
        s.push([name, p]);
    });

    return s;
};

module.exports.getHandlebarsEnvironment = function(platform){
    var partials = module.exports.findPartials(platform),
        helpers = module.exports.findHelpers(platform),
        s = ["var Handlebars = require('handlebars-runtime');"];

    partials.forEach(function(p){
        s.push("Handlebars.registerPartial('"+p[0]+"', require('"+p[1]+"'));");
    });

    helpers.forEach(function(h){
        s.push("Handlebars.registerHelper('"+h[0]+"', require('"+h[1]+"'));");
    });
    return s.join("\n");
};

module.exports.createBundle = function(platform){
    var bundle,
        assets = path.resolve(nconf.get('ASSETS')),
        d = when.defer();
    common.log('writing '+platform+' bundle');

    bundle = browserify([
        assets + '/'+platform+'/handlebars-environment.js',
        assets + '/'+platform+'/js/main.js'
    ]);

    bundle.transform(require('./handlebars'));

    bundle.bundle({debug: (nconf.get('NODE_ENV') === 'development')}, function(err, src){
        if(err){
            common.error(err);
        }
        if(nconf.get('MINIFY')){
            src = uglify(src);
        }

        common.writeFile(assets + '/' + platform + '/app.js', src).then(function(){
            d.resolve(platform);
        });
    });
    return d.promise;
};

var through = require('through'),
  Handlebars = require("handlebars");

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
};