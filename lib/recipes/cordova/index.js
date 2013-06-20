"use strict";

var Recipe = require('../../recipe'),
    async = require('async'),
    glob = require('glob'),
    fs = require('fs-extra'),
    path = require('path'),
    plist = require('plist'),
    child_process = require('child_process');

module.exports = function(){
    return new Recipe()
        .task('cordova build', [updateVersion, build])
        .task('cordova run', [updateVersion, run, tail])
        .task('cordova emulator', ['run', 'cordova build', 'cordova run'])
        .task('cordova ipa', [loadProjectInfo, copyBuild, ipa])
        .provide('metadata', {
            'native path': './native/ios',
            'version': '0.0.0'
        });
};

function copyBuild(ctx, done){
    var debug = require('debug')('mott:cordova.build'),
        ignores = ['cordova/console.log'];

    // // Copy all the build resources to native/ios
    async.parallel(ctx.files().map(function(file){
        return function(callback){
            var dest = ctx.path(ctx['native path'] + '/www' + ctx.toKey(file));
            ignores.push('www' + ctx.toKey(file));
            fs.mkdirs(path.dirname(dest), function(){
                ctx.copyFile(file, dest, callback);
            });
        };
    }), function(err){
        if(err) return done(err);

        // Add all of our built files to gitignore to try and remove some
        // confusion of what should actually be there.
        fs.writeFile(ctx.path(ctx['native path'] + '/.gitignore'), ignores.join('\n'), function(err){
            if(err) return done(err);
            done();
        });
    });
}

function updateVersion(ctx, done){
    glob(ctx['native path'] + '/**/*.plist', function(err, matches){
        if(err){
            return done(err);
        }
        matches = matches.filter(function(m){
            return m.indexOf('-Info.plist') > -1;
        });

        fs.readFile(matches[0], function(err, data){
            if(err){
                return done(err);
            }
            var obj = plist.parseStringSync(data.toString());
            obj.CFBundleShortVersionString = obj.CFBundleVersion = ctx.version;
            fs.writeFile(matches[0], plist.build(obj).toString(), done);
        });
    });
}

function build(ctx, done){
    var debug = require('debug')('mott:cordova.build'),
        ignores = ['cordova/console.log'];

    // // Copy all the build resources to native/ios
    async.parallel(ctx.files().map(function(file){
        return function(callback){
            var dest = ctx.path(ctx['native path'] + '/www' + ctx.toKey(file));
            ignores.push('www' + ctx.toKey(file));
            fs.mkdirs(path.dirname(dest), function(){
                ctx.copyFile(file, dest, callback);
            });
        };
    }), function(err){
        if(err) return done(err);

        // Add all of our built files to gitignore to try and remove some
        // confusion of what should actually be there.
        fs.writeFile(ctx.path(ctx['native path'] + '/.gitignore'), ignores.join('\n'), function(err){
            if(err) return done(err);

            var proc = child_process.spawn('bash', ['./cordova/build'], {'cwd': ctx.path(ctx['native path'])});
            proc.stdout.on('data', function (data){
                debug('stdout', data.toString());
            });

            proc.stderr.on('data', function (data){
                debug('stderr', data.toString());
            });

            proc.on('close', function (code){
                if(code !== 0){
                    return done(new Error('cordova.build exited with ' + code));
                }
                done();
            });
        });
    });
}

function tail(ctx, done){
    var debug = require('debug')('mott:cordova.tail'),
        proc = child_process.spawn('tail', ['-f', './cordova/console.log'], {'cwd': ctx.path(ctx['native path'])});

    proc.stdout.on('data', function (data){
        debug('stdout', data.toString());
    });

    proc.stderr.on('data', function (data){
        debug('stderr', data.toString());
    });
    done();
}

function run(ctx, done){
    var debug = require('debug')('mott:cordova.run'),
        proc = child_process.spawn('bash', ['./cordova/run'], {'cwd': ctx.path(ctx['native path'])});

    proc.stdout.on('data', function (data){
        debug('stdout', data.toString());
    });

    proc.stderr.on('data', function (data){
        debug('stderr', data.toString());
    });

    proc.on('close', function (code){
        if(code !== 0){
            return done(new Error('cordova.run exited with ' + code));
        }
        done();
    });
}

function release(ctx, done){
    var debug = require('debug')('mott:cordova.run'),
        proc = child_process.spawn('bash', ['./cordova/release'], {'cwd': ctx.path(ctx['native path'])});
    debug('running build for Release...');
    proc.stdout.on('data', function (data){
        // debug('stdout', data.toString());
    });

    proc.stderr.on('data', function (data){
        // debug('stderr', data.toString());
    });

    proc.on('close', function (code){
        if(code !== 0){
            return done(new Error('cordova.run exited with ' + code));
        }
        debug('Release build finished');
        done();
    });
}

function loadProjectInfo(ctx, done){
    if(ctx.projectName){
        return done();
    }

    fs.readdir(ctx.path(ctx['native path']), function(err, files){
        if(err){
            return done(err);
        }

        ctx.projectName = files
            .filter(function(f){return f.indexOf('.xcodeproj') > -1;})
            .map(function(f){
                return path.basename(f, '.xcodeproj');
            })[0];
        ctx.workspace = ctx.projectName + '.xcodeproj/project.xcworkspace';
        done();
    });
}

function getXcodeBuildSettings(ctx, done){
    child_process.exec('xcodebuild -showBuildSettings', {'cwd': ctx.path(ctx['native path']), 'maxBuffer': 1024*1024*1024}, function(err, stdout, stderr){
        var lines = stdout.toString().split('\n'),
            settings = {};
        lines.shift();
        lines.map(function(line){
            var data = line.trim().split(' = ');
            settings[data[0]] = data[1];
        });
        done(null, settings);
    });
}

function xcodebuild(action, ctx, done){
    var debug = require('debug')('mott:cordova.'+action),
        cmd = [
            "xcodebuild",
            "-sdk iphoneos",
            "-project " + ctx.projectName + '.xcodeproj',
            "-scheme " + ctx.projectName,
            "-configuration Debug",
            action
        ],
        opts = {
            'cwd': ctx.path(ctx['native path']),
            'maxBuffer': 1024*1024*1024
        };
    debug('running', cmd.join(' '));
    child_process.exec(cmd.join(' '), opts, function(err, stdout, stderr){
        debug('stdout', stdout);
        debug('stderr', stderr);

        if(err){
            return done(err);
        }
        debug('completed', cmd.join(' '));
        done();
    });
}

function ipa(ctx, done){
    getXcodeBuildSettings(ctx, function(err, settings){
        var appPath = settings.BUILT_PRODUCTS_DIR.replace('Release', 'Debug') + '/'+ctx.projectName+'.app',
            dsymPath = appPath + '.dSYM',
            ipaPath = ctx.path(ctx['native path'] + '/build/' + ctx.projectName +
                '-' + ctx.version + '.ipa'),
            debug = require('debug')('mott:cordova.ipa');

        debug('building ipa for', ctx.projectName);

        async.series([
            // function(callback){
            //     xcodebuild('clean', ctx, callback);
            // },
            function(callback){
                xcodebuild('clean build archive', ctx, callback);
            },
            // function(callback){
            //     xcodebuild('archive', ctx, callback);
            // },
            function(callback){
                //  %{xcrun -sdk iphoneos PackageApplication -v "#{@app_path}" -o "#{@ipa_path}" --embed "#{@dsym_path}"

                var cmd = [
                    'xcrun -sdk iphoneos PackageApplication',
                    '-v ' + appPath,
                    '-o ' + ipaPath,
                    '--embed ' + dsymPath
                ].join(' ');

                console.log(cmd);

                child_process.exec(cmd, {'cwd': ctx.path(ctx['native path'])}, function(err, stdout, stderr){
                    if(err){
                        return callback(err);
                    }
                    debug('ipa built to', ipaPath);
                    debug('stdout', stdout);
                    debug('stderr', stderr);
                    ctx.ipaPath = ipaPath;
                    callback();
                });
            },
            // function(callback){
            //     var cmd = [
            //         'cp -r ' + dsymPath + ' .',
            //         'zip -r ' + dsymPath  + '-' + ctx.version + '.zip ' + dsymPath,
            //         // 'rm -rf ' + dsymPath
            //     ].join(' && ');

            //     child_process.exec(cmd, {'cwd': ctx.path(ctx['native path'])}, function(err, stdout, stderr){
            //         if(err){
            //             return callback(err);
            //         }
            //         ctx.dsymPath = ctx.path(dsymPath  + '-' + ctx.version + '.zip');
            //         debug('debug symbols zipped to', ctx.dsymPath);
            //         callback();
            //     });
            // }
            // cp -r "/Users/dankantor/Library/Developer/Xcode/DerivedData/joydot-evwzgxalddqtyfhlehzamukggbzs/Build/Products/Debug-iphoneos/joydot.app.dSYM" . && zip -r "joydot.app.dSYM.zip" "joydot.app.dSYM" >/dev/null && rm -rf "joydot.app.dSYM"

        ], done);
    });
}
