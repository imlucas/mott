"use strict";
var aws = require('aws-sdk'),
    async = require('async'),
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
                    opts = {
                        'Bucket': data.bucket,
                        'Key': data.key + ctx.toKey(file),
                        'Body': info.body,
                        // 'Expires': '',
                        'ContentMD5': info.md5,
                        'ContentType': info.mime
                    };
                console.log(opts);
                s3.putObject(opts, cb);
            });
        };
    }), function(err){
        console.log(arguments);
        done(err);
    });
};

function parse(uri){
    var r = /s3\:\/\/(\w+)\:(\w+)@([\w\.]+)(.*)?/i,
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

