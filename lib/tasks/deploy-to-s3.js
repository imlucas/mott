"use strict";
var aws = require('aws-sdk'),
    async = require('aysnc');

module.exports = function(ctx, done){
    // aws.config.loadFromPath('./path/to/credentials.json');
    var files = [];
    async.parallel(files, function(callback){
        var s3 = new aws.S3({'Bucket': '', 'Key': ''});
        s3.putObject({'Body': '', 'Expires': '', 'ContentMD5': '', 'ContentType': ''}, callback);
    }, function(err){
        done(err);
    });
};