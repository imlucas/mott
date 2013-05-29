"use strict";

var Recipe = require('../recipe'),
    async = require('async'),
    glob = require('glob'),
    fs = require('fs-extra'),
    path = require('path'),
    plist = require('plist'),
    child_process = require('child_process');

module.exports = function(){
    return new Recipe()
        .task('cordova build', build)
        .task('cordova run', [run, tail])
        .task('emulator', ['run', 'cordova build', 'cordova run'])
        .provide('metadata', {
            'nativePath': './native/ios'
        });
};

function updateVersion(ctx, done){
    glob(ctx.path(ctx.nativePath) + '/**/*.plist', function(matches){
        if(!matches){
            return done();
        }
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
