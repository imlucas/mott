"use strict";

var nconf = require('nconf'),
    plog = require('plog'),
    aws = require('plata');


nconf.argv().env().use('memory');

module.exports = new require('events').EventEmitter();

module.exports.connect = function(cb){
    if(!cb){
        aws.connect(nconf.get('AWS'));
        module.exports.emit('connected');
    }
    cb(function(res){
        nconf.overrides(res);
        aws.connect(nconf.get('AWS'));
        module.exports.emit('connected');
    });
};

module.exports.config = nconf;