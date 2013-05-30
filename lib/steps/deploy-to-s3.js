"use strict";
var aws = require('aws-sdk'),
    async = require('async'),
    debug = require('debug')('mott:deploy to s3'),
    fs = require('fs');

module.exports = function(ctx, done){
    var data = parse(ctx.config.deploy);
    if(!data){
        return done(new Error(ctx.config.deploy + ' is not a valid S3 URI.' +
            ' Please set config.deploy s3://accessKeyId:secretAccessKey@bucket'));
    }

    aws.config.update({
        'accessKeyId': data.accessKey,
        'secretAccessKey': data.secret
    });

    async.parallel(ctx.files().map(function(file){
        return function(cb){
            ctx.getFileInfo(file, function(err, info){
                var s3 = new aws.S3(),
                    key = data.key + ctx.toKey(file),
                    opts = {
                        'Bucket': data.bucket,
                        'Key': (key.charAt(0) === '/') ? key.replace('/', ''): key,
                        'Body': info.body,
                        // 'Expires': '',
                        'ContentMD5': info.contentMD5,
                        'ContentType': info.mime,
                        'ACL': 'public-read'
                    };
                debug('put', opts.Bucket, opts.Key);
                s3.putObject(opts, function(err){
                    debug('complete', opts.Bucket, opts.Key);
                    cb(err);
                });
            });
        };
    }), function(err){
        done(err);
    });
};

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

