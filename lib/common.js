"use strict";

var when = require('when'),
    fs = require('fs'),
    ansi = require('ansi'),
    cursor = ansi(process.stdout),
    child_process = require('child_process'),
    request = require("superagent");

module.exports.whenify = function whenify(func){
    return function(){
        var d = when.defer(),
            args = Array.prototype.slice.call(arguments, 0);
        args.push(function(){

            var args = Array.prototype.slice.call(arguments, 0),
                err = args.shift();
                if(err){
                    return d.reject(err);
                }
                d.resolve.apply(this, args);
        });
        func.apply(this, args);
        return d.promise;
    };
};

module.exports.log = function(what){
    cursor.grey().write('    '+ what + '\n').reset();
};

module.exports.warn = function(what){
    cursor.yellow().write('    '+ what + '\n').reset();
};

module.exports.error = function(what){
    cursor.red().write('    Error:'+ what + '\n').reset();
};

module.exports.fatal = function(what){
    cursor.red().write('    FATAL:'+ what + '\n').reset();
    process.exit(1);
};

module.exports.success = function(what){
    cursor.green().write('    ' + what + '\n').reset();
};

module.exports.party = function(msg){
    var d = when.defer();
    request.post('http://partychat-hooks.appspot.com/post/p_mwjmzdcw')
        .send({'msg': msg})
        .type('form')
        .end(function(res){
            d.resolve(res);
        });
    return d.promise;
};


// @todo (lucas) Make this take a grouping or something so it draws a tree
module.exports.logStat = function(what, start, slow){
    var stat = new Date().getTime() - start.getTime(),
        method = (stat >= slow) ? 'red' : (stat >= (slow * 0.5)) ? 'yellow': 'grey';
    cursor[method]().write('    ' + what + ' took ' + stat + 'ms\n').reset();
};

module.exports.readdir = module.exports.whenify(fs.readdir);
module.exports.writeFile = module.exports.whenify(fs.writeFile);
module.exports.readFile = module.exports.whenify(fs.readFile);
module.exports.stat = module.exports.whenify(fs.stat);
module.exports.exec = module.exports.whenify(child_process.exec);
