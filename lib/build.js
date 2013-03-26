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
        common.log('Compiling Strings...');
        return compileStrings();
    }).then(function(){
        common.log('Building LESS and JS');
        return when.all([
            module.exports.js(),
            module.exports.less(),
        ]);
    }).then(function(){
        common.logStat('build', start, 2000);
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
            p = file.replace(assets + '/', './');
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
            p = file.replace(assets + '/', './');
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

// Use browserify and templatify to compile all of the JS.
module.exports.js = function(){
    var bundles,
        templateBundles = {},
        assets = nconf.get('ASSETS'),
        start = new Date();

    // nconf.get('PLATFORMS').forEach(function(platform){
    //     templateBundles[platform] = browserify().use(templatify('./', {
    //             'files': [
    //                 assets + '/common/templates/*.html',
    //                 assets + '/common/templates/partials/*.html',
    //                 assets + '/'+platform+'/templates/*.html',
    //                 assets + '/'+platform+'/templates/partials/*.html'
    //             ],
    //             'helpers': [
    //                 assets + '/'+platform+'/js/helpers/*.js',
    //                 assets + '/common/js/helpers/*.js'
    //             ]
    //         })
    //     );
    // });

    // return when.all(nconf.get('PLATFORMS').map(function(platform){
    return when.all(['web'].map(function(platform){
        var bundle = browserify();
        bundle.transform(require('./handlebars'));
        bundle.expose_all = true;
        // bundle.require(name, { expose: true, basedir: pubdir });
        // externals.push(name);
        // bundle.require(assets + '/../vendor/zepto.js', {expose: true});
        bundle.require(assets + '/../vendor/polyfills.js', {expose: true});
        // bundle.require(assets + '/../vendor/backbone.js', {expose: true});

        // bundle.add(assets + '/'+ platform +'/js/main.js');
        bundle.bundle({debug: false}, function(err, src) {
            console.log(src);
        });

        // var ignores = [],
        //     bundle,
        //     templatesJS = templateBundles[platform].bundle();
        common.log('Building ' + platform + ' JS...');

        // return common.writeFile(assets + '/' + platform + '/templates.js', templatesJS).then(function(){
        //     // Write our templates file and then we can generate our main
        //     // browserify bundle.
        //     // @todo (lucas) Would be nice if we didnt have to do this in two steps...

        //     if(templateBundles[platform].templatify){
        //         // Dont make browserify check for all of our tpl requires.
        //         Object.keys(templateBundles[platform].templatify).forEach(function(f){
        //             ignores.push(f);
        //         });
        //     }


        //     bundle = browserify({
        //         'require': [
        //             assets + '/common/js/strings.js',
        //             'util'
        //         ],
        //         'ignore': ignores,
        //         'debug': (nconf.get('NODE_ENV') === 'development'),
        //         'exports': ['process']
        //     });

        //     bundle.on('syntaxError', function(e){
        //         console.error('Bundle syntax error: ', e);
        //     });
        //     try{
        //         bundle.addEntry(assets + '/'+ platform +'/js/main.js');
        //     }
        //     catch (e){
        //         common.error(e);
        //         process.exit(1);
        //     }
        //     bundle.prepends.splice(0, 1);

        // }).then(function(){
        //     // Now that out bundle is ready, let's add our vendor files
        //     // to it so we dont have to require them all over the place.
        //     // @todo (lucas) Would be great if we could remove this step as well.
        //     // jquery-browserify and browserify-backbone do this successfully
        //     // for stormwatch.
        //     var files = [
        //         'zepto.js',
        //         'polyfills.js',
        //         'backbone.js'
        //     ];

        //     files.reverse();
        //     return require('when/sequence')(files.map(function(file){
        //         return function(){
        //             return common.readFile(assets + '/../vendor/' + file, 'utf-8').then(function(data){
        //                 bundle.prepend(data);
        //             });
        //         };
        //     }));
        // }).then(function(){
        //     // Generate the bundle source string
        //     // and run optionally run it through uglify for minification.
        //     bundle.prepend(templatesJS);
        //     var src = bundle.bundle();
        //     if(nconf.get('MINIFY')){
        //         src = uglify(src);
        //     }

        //     return common.writeFile(assets + '/'+ platform +'/app.js', src);
        // }).then(function(next){
        //     // Build our bootstrap.js file (see below).
        //     return module.exports.bootstrap(platform);
        // }).then(function(next){
        //     // All done!
        //     return platform;
        // });
    })).then(function(){
        common.logStat('build js', start, 1000);
    });
};

// Compiles less files for all platforms.
module.exports.less = function(){
    var options = {
            'compress': nconf.get('MINIFY'),
            'yuicompress': false,
            'optimization': 1,
            'strictImports': false
        },
        assets = nconf.get('ASSETS'),
        start = new Date();

    return when.all(nconf.get('PLATFORMS').map(function(platform){
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
                replacement = (platform === 'web') ? "url(/$1)" :  "url($1)";
                buffer = buffer.replace(regex, replacement);

            return common.writeFile(assets + '/' + platform + '/app.css', buffer,'utf-8');
        });
    })).then(function(){
        common.logStat('build less', start, 200);
    });
};

module.exports.bootstrap = function(platform){
    var template,
        tplsVars,
        assets = nconf.get('ASSETS'),
        socketioUrl = nconf.get('BASE_URL').replace(/\:\d+/, '') + ':7002/',
        version = nconf.get('VERSION'),
        versionCode = nconf.get('VERSION_CODE'),
        paths = [
            assets + '/' + platform + '/app.js',
            assets + '/' + platform + '/app.css'
        ];

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