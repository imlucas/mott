"use strict";

var when = require('when'),
    browserify = require('browserify'),
    templatify = require('templatify'),
    common = require('./common'),
    sequence = require('sequence'),
    uglify = require('uglify-js'),
    nconf = require('nconf'),
    path = require('path'),
    less = require('less'),
    hbs = require('hbs'),
    compileStrings = require('./compile-strings'),
    generateConfig = require('./generate-config'),
    fileInfo = require('./file-info'),
    glob = require('glob');

// Compile all JS and LESS.
module.exports = function build(platform){
    var start = new Date(),
        platforms = (platform) ? [platform] : nconf.get('PLATFORMS');

    return when.all(platforms.map(function(platform){
        return generateConfig(platform);
    })).then(function(){
        return compileStrings();
    }).then(function(){
        return module.exports.js(platforms);
    }).then(function(){
        return module.exports.less(platforms);
    }).then(function(){
        common.logStat('build', start, 5000);
        common.success('<= built!');
    });
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
    // bundle.bundle({debug: false}, function(err, src){
        if(err){
            common.error(err);
        }
        if(nconf.get('MINIFY')){
            src = uglify.minify(src);
        }

        common.writeFile(assets + '/' + platform + '/app.js', src).then(function(){
            d.resolve(platform);
        });
    });
    return d.promise;
};

// Use browserify and templatify to compile all of the JS.
module.exports.js = function(platforms){
    var bundles,
        templateBundles = {},
        assets = path.resolve(nconf.get('ASSETS')),
        start = new Date();

    return when.all(platforms.map(function(platform){
        var hbsContent = module.exports.getHandlebarsEnvironment(platform);

        return common.writeFile(assets + '/' + platform + '/handlebars-environment.js', hbsContent).then(function(){
            return module.exports.createBundle(platform);
        }).then(function(){
            return module.exports.bootstrap(platform);
        });
    }), function(){
        common.logStat('build js', start, 5000);
    });
};

// Compiles less files for all platforms.
module.exports.less = function(platforms){
    var options = {
            'compress': nconf.get('MINIFY'),
            'yuicompress': false,
            'optimization': 1,
            'strictImports': false
        },
        assets = nconf.get('ASSETS'),
        start = new Date();

    return when.all(platforms.map(function(platform){
        var entrypoint = assets + '/' + platform + '/less/main.less';
        return common.readFile(entrypoint, 'utf-8').then(function(data){
            var p = when.defer();
            new less.Parser({
                paths: [path.dirname(entrypoint)],
                optimization: options.optimization,
                filename: entrypoint,
                strictImports: options.strictImports
            }).parse(data, function (err, tree) {
                if (err){
                    throw new Error(err);
                }
                p.resolve({
                    'path': entrypoint,
                    'data': data,
                    'css': tree.toCSS({
                        compress: options.compress,
                        yuicompress: options.yuicompress
                    })
                });
            });
            return p.promise;
        }).then(function(result){
            var buffer = result.css,
                regex = /url\(\/"?([\w\d\/\-\.\?\#\@]+)"?\)/g,
                replacement = (platform === 'web' || platform === 'chromeapp') ? "url(/$1)" :  "url($1)";
                buffer = buffer.replace(regex, replacement);

            return common.writeFile(assets + '/' + platform + '/app.css', buffer,'utf-8');
        });
    })).then(function(){
        common.logStat('build less', start, 1000);
    });
};

module.exports.bootstrap = function(platform){
    var template,
        tplsVars,
        assets = path.resolve(nconf.get('ASSETS')),
        socketioUrl = nconf.get('BASE_URL').replace(/\:\d+/, '') + ':7002/',
        version = nconf.get('VERSION'),
        versionCode = nconf.get('VERSION_CODE'),
        paths = [
            assets + '/' + platform + '/app.js',
            assets + '/' + platform + '/app.css'
        ];
    common.log('creating ' + platform + ' bootstrap');

    function writeBootstrap(){
        return common.readFile(assets + '/' + platform + '/bootstrap.tpl', 'utf-8').then(function(data){
            return hbs.handlebars.compile(data);
        }).then(function(template){
            return template(tplsVars);
        }).then(function(bootstrap){
            return common.writeFile(assets + '/' + platform + '/bootstrap.js', bootstrap);
        });
    }

    if(nconf.get('NODE_ENV') === 'development'){
        if(!nconf.get('SOCKETIO')){
            socketioUrl = null;
        }

        tplsVars = {
            'JSURL': nconf.get('BASE_URL') + '/' + platform + '/app.js',
            'JSVersion': '',
            'CSSURL': nconf.get('BASE_URL') + '/' + platform + '/app.css',
            'CSSVersion': '',
            'version': version,
            'versionCode': versionCode,
            'env': 'development',
            'socketio': socketioUrl,
            'weinre': nconf.get('WEINRE')
        };

        return when.all(paths.map(function(p){
            return fileInfo(p).then(function(info){
                if(p.indexOf('.css') > -1){
                    tplsVars.CSSVersion = info.sha;
                }
                else {
                    tplsVars.JSVersion = info.sha;
                }
            });
        })).then(function(){
            return writeBootstrap();
        });
    }

    tplsVars = {
        'JSURL': nconf.get('BASE_URL') + '/' + platform + '/app.js',
        'JSVersion': '',
        'CSSURL': nconf.get('BASE_URL') + '/' + platform + '/app.css',
        'CSSVersion': '',
        'version': version,
        'versionCode': versionCode,
        'env': nconf.get('NODE_ENV')
    };

    return when.all(paths.map(function(p){
        return fileInfo(p).then(function(info){
            if(p.indexOf('.css') > -1){
                tplsVars.CSSURL = info.url;
                tplsVars.CSSVersion = info.sha;
            }
            else{
                tplsVars.JSURL = info.url;
                tplsVars.JSVersion = info.sha;
            }
        });
    })).then(function(){
        return writeBootstrap();
    });
};