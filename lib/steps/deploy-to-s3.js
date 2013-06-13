"use strict";
var aws = require('aws-sdk'),
    async = require('async'),
    debug = require('debug')('mott:deploy'),
    fs = require('fs');

module.exports = function(ctx, done){
    var data = parse(ctx.deploy),
        bucket = data.bucket;

    if(!data){
        return done(new Error(ctx.deploy + ' is not a valid S3 URI.' +
            ' Please set config.deploy s3://accessKeyId:secretAccessKey@bucket'));
    }

    debug('deploying...');

    aws.config.update({
        'accessKeyId': data.accessKey,
        'secretAccessKey': data.secret
    });

    async.parallel(ctx.files().map(function(file){
        return function(cb){
            ctx.getFileInfo(file, function(err, info){
                var key = sanitizeKey(data.key + ctx.toKey(file));
                hasKeyChanged(bucket, key, info.md5, function(err, changed){
                    if(err){
                        return cb(err);
                    }
                    if(!changed){
                        debug('unchanged', key);
                        return cb();
                    }
                    var opts = {
                        'Body': info.body,
                        'ContentMD5': info.contentMD5,
                        'ContentType': info.mime,
                        'Metadata': {
                            'md5': info.md5
                        }
                    };

                    // Upload 2 keys.  A cannonical and versioned, ie
                    // app.js and app.js/hash
                    async.parallel([
                        function uploadCannonical(callback){
                            upload(bucket, key, opts, callback);
                        },
                        function uploadVersioned(callback){
                            upload(bucket, key + "/" + info.md5, opts, callback);
                        }
                    ], cb);
                });
            });
        };
    }), done);
};

function hasKeyChanged(bucket, key, md5, done){
    var s3 = new aws.S3(),
        opts = {
            'Bucket': bucket,
            'Key': key
        };
    s3.headObject(opts, function(err, res){
        if(err){
            if(err.code === 'NotFound'){
                return done(null, true);
            }
            return done(err);
        }
        done(null, res.Metadata.md5 && res.Metadata.md5 !== md5);
    });
}

function sanitizeKey(key){
    return (key.charAt(0) === '/') ? key.replace('/', ''): key;
}

function upload(bucket, key, opts, done){
    opts.Bucket = bucket;
    opts.Key = key;
    opts.ACL = 'public-read';
    var s3 = new aws.S3();

    debug('put', opts.Bucket, opts.Key);
    s3.putObject(opts, function(err){
        debug('complete', opts.Key);
        done(err);
    });
}

function parse(uri){
    var r = /s3\:\/\/(\w+)\:([\w\+\=]+)@([\w\.\-]+)(.*)?/i,
        matches = r.exec(uri);

    if(!matches){

        if(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY){
            matches = /s3\:\/\/([\w\.\-]+)(.*)?/.exec(uri);
            if(!matches){
                return null;
            }
            return {
                'bucket': matches[1],
                'key': matches[2] || '',
                'secret': process.env.AWS_SECRET_ACCESS_KEY,
                'accessKey': process.env.AWS_ACCESS_KEY_ID
            };
        }
        return null;
    }

    return {
        'bucket': matches[3],
        'key': matches[4] || '',
        'secret': matches[2],
        'accessKey': matches[1]
    };
}

