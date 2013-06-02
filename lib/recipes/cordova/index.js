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
        .task('emulator', ['run', 'cordova build', 'cordova run'])
        .task('ipa', ipa)
        .provide('metadata', {
            'nativePath': './native/ios'
        })
        .provide('config', {
            'version': '0.0.0'
        });
};

function updateVersion(ctx, done){
    glob(ctx.nativePath + '/**/*.plist', function(err, matches){
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
            obj.CFBundleShortVersionString = obj.CFBundleVersion = ctx.config.version;
            fs.writeFile(matches[0], plist.build(obj).toString(), done);
        });
    });
}

// @todo (lucas) Should have deploy or something task that runs cdordova/release
// and IPA gets uploaded to S3.  Or should it upload to phonegap build???
function build(ctx, done){
    var debug = require('debug')('mott:cordova.build'),
        ignores = ['cordova/console.log'];



    // // Copy all the build resources to native/ios
    async.parallel(ctx.files().map(function(file){
        return function(callback){
            var dest = ctx.path(ctx.nativePath + '/www' + ctx.toKey(file));
            ignores.push('www' + ctx.toKey(file));
            fs.mkdirs(path.dirname(dest), function(){
                ctx.copyFile(file, dest, callback);
            });
        };
    }), function(err){
        if(err) return done(err);

        // Add all of our built files to gitignore to try and remove some
        // confusion of what should actually be there.
        fs.writeFile(ctx.path(ctx.nativePath + '/.gitignore'), ignores.join('\n'), function(err){
            if(err) return done(err);

            var proc = child_process.spawn('bash', ['./cordova/build'], {'cwd': ctx.path(ctx.nativePath)});
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
        proc = child_process.spawn('tail', ['-f', './cordova/console.log'], {'cwd': ctx.path(ctx.nativePath)});

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
        proc = child_process.spawn('bash', ['./cordova/run'], {'cwd': ctx.path(ctx.nativePath)});

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
        proc = child_process.spawn('bash', ['./cordova/release'], {'cwd': ctx.path(ctx.nativePath)});
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

function getProjectName(ctx, done){
    if(ctx.projectName){
        return done();
    }

    fs.readdir(ctx.path(ctx.nativePath), function(err, files){
        if(err){
            return done(err);
        }

        ctx.projectName = files
            .filter(function(f){return f.indexOf('.xcodeproj') > -1;})
            .map(function(f){
                return path.basename(f, '.xcodeproj');
            })[0];
        done();
    });
}

function ipa(ctx, done){
    var debug = require('debug')('mott:cordova.ipa');

    getProjectName(ctx, function(err){
        if(err){
            return done(err);
        }
        debug('building ipa for', ctx.projectName);

        var appPath = 'build/'+ctx.projectName+'.app',
            dsymPath = appPath + '.dSYM',
            ipaPath = ctx.path(ctx.nativePath + '/build/' + ctx.projectName +
                '-' + ctx.config.version + '.ipa');

        async.series([
            function(callback){ // Build as Release.
                // @todo (lucas) is this the wrong command?  shenzen ends up having archives available in xcode organizer?
                release(ctx, callback);
            },
            function(callback){
                //  %{xcrun -sdk iphoneos PackageApplication -v "#{@app_path}" -o "#{@ipa_path}" --embed "#{@dsym_path}"

                var cmd = [
                    'xcrun -sdk iphoneos PackageApplication',
                    '-v ' + appPath,
                    '-o ' + ipaPath
                ].join(' ');

                console.log(cmd);

                child_process.exec(cmd, {'cwd': ctx.path(ctx.nativePath)}, function(err, stdout, stderr){
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
            //         'zip -r ' + dsymPath  + '-' + ctx.config.version + '.zip ' + dsymPath,
            //         'rm -rf ' + dsymPath
            //     ].join(' && ');

            //     child_process.exec(cmd, {'cwd': ctx.path(ctx.nativePath)}, function(err, stdout, stderr){
            //         if(err){
            //             return callback(err);
            //         }
            //         ctx.dsymPath = ctx.path(dsymPath  + '-' + ctx.config.version + '.zip');
            //         debug('debug symbols zipped to', ctx.dsymPath);
            //         callback();
            //     });
            // }
        ], done);
    });
}
