"use strict";
var aws = require('aws-sdk'),
    async = require('aysnc'),
    fs = require('fs');

module.exports = function(ctx, done){
    // aws.config.loadFromPath('./path/to/credentials.json');
    async.parallel(ctx.files(), function(file, callback){
        ctx.getFileInfo(file, function(err, info){
            var s3 = new aws.S3({'Bucket': '', 'Key': ''}),
                opts = {
                    'Body': '',
                    'Expires': '',
                    'ContentMD5': info.md5,
                    'ContentType': ''
                };

            s3.putObject(opts, callback);
        });
    }, function(err){
        done(err);
    });
};