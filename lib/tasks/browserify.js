"use strict";

var browserify = require('browserify'),
    async = require('async'),
    fs = require('fs'),
    through = require('through');
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
                var bundle = browserify(src),
                    data = ctx.js[src],
                    debug = data.debug || ctx.environment !== 'production';


                // @todo (lucas) Support for client side templates.  HBS first.
                bundle.bundle({'debug': debug}, function(err, buf){
                    if(err){
                        return cb(err);
                    }

                    fs.writeFile(ctx.js[src].dest, buf, function(err){
                        cb(err);
                    });
                });
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

module.exports.handlebarsTransform = function(file){
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