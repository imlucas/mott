"use strict";

var allFileInfo = {},
    when = require('when'),
    fs = require('fs'),
    crypto = require('crypto'),
    path = require('path'),
    mime = require('mime'),
    nconf = require('nconf'),
    zlib = require('zlib'),
    common = require('./common');


function compressData(data){
    var d = when.defer();
    zlib.gzip(data, function(err, buff){
        if(err){
            return d.reject(err);
        }
        d.resolve(buff);
    });
    return d.promise;
}

module.exports = function(filePath){
    var sha,
        fullPath = path.resolve(filePath),
        compress = nconf.get('COMPRESS') &&
            (filePath.indexOf('.css') > -1 || filePath.indexOf('.js') > -1);

    return common.readFile(filePath).then(function(data){
        sha = crypto.createHash('sha1').update(data).digest('hex');
        return data;
    }).then(function(data){
        if(!compress){
            return data;
        }
        common.log('Compressing ' + filePath + '...');
        return compressData(data);
    }).then(function(data){
        var name = filePath.split('/assets/')[1],
            parts = name.split('.'),
            s3Key = parts[0] + "." + sha + "." + parts[1];
        return {
                'path': filePath,
                'sha': sha,
                'data': data,
                'mime': mime.lookup(filePath),
                'compressed': compress,
                's3Key': s3Key,
                'url': nconf.get('BASE_URL') + "/" + s3Key,
                'cannonicalUrl': nconf.get('BASE_URL') + "/" + parts[0] + "." + parts[1],
                'cannonicalKey': parts[0] + "." + parts[1]
            };
    });
};