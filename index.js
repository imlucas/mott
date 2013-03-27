"use strict";

var nconf = require('nconf'),
    plog = require('plog'),
    aws = require('plata'),
    common = require('./lib/common'),
    EventEmitter = require('events').EventEmitter;


nconf.argv().env().use('memory');

module.exports = new EventEmitter();
module.exports.tasks = {};
module.exports.on('connected', function(){
    module.exports.tasks = require('./lib').tasks;
    module.exports.emit('ready');
});

module.exports.connect = function(cb){
    if(!cb){
        aws.connect(nconf.get('AWS'));
        module.exports.emit('connected');
    }
    else{
        cb(function(res){
            nconf.overrides(res);
            aws.connect(nconf.get('AWS'));
            module.exports.emit('connected');
        });
    }
    return module.exports;
};

module.exports.config = nconf;
module.exports.common = common;