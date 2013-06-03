"use strict";
var aws = require('aws-sdk'),
    async = require('async'),
    debug = require('debug')('mott:deploy'),
    fs = require('fs');

module.exports = function(ctx, done){
    var data = parse(ctx.config.deploy);
    if(!data){
        return done(new Error(ctx.config.deploy + ' is not a valid S3 URI.' +
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
                var key = data.key + ctx.toKey(file),
                    opts = {
                        'Body': info.body,
                        'ContentMD5': info.contentMD5,
                        'ContentType': info.mime
                    };

                // Upload 2 keys.  A cannonical and versioned, ie
                // app.js and app.js/hash
                async.parallel([
                    function uploadCannonical(callback){
                        upload(data.bucket, key, opts, callback);
                    },
                    function uploadVersioned(callback){
                        upload(data.bucket, key + "/" + info.md5, opts, callback);
                    }
                ], done);
            });
        };
    }), function(err){
        debug('complete');
        done(err);
    });
};

function upload(bucket, key, opts, done){
    key = (key.charAt(0) === '/') ? key.replace('/', ''): key;
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
    var r = /s3\:\/\/(\w+)\:([\w\+\=]+)@([\w\.]+)(.*)?/i,
        matches = r.exec(uri);
    if(!matches){
        return null;
    }

    return {
        'bucket': matches[3],
        'key': matches[4] || '',
        'secret': matches[2],
        'accessKey': matches[1]
    };
}

