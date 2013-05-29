"use strict";

var when = require('when'),
    moment = require('moment'),
    aws = require('plata'),
    nconf = require('nconf'),
    common = require('./common'),
    child_process = require('child_process'),
    _ = require('underscore'),
    findit = require('findit'),
    which = require('which'),
    sequence = require('when/sequence');

var pngTools = [
    {
        'name': 'pngcrush',
        'flags': ['-reduce', '-brute', '-l', '9', '{{inputFile}}', '{{outputFile}}']
    },
    {
        'name': 'optipng',
        'flags': ['{{inputFile}}', '-out', '{{outputFile}}']
    }
];

function findExecutables(what){
    what.forEach(function(tool){
        try{
            tool.executable = which.sync(tool.name);
        }
        catch(e){
            common.warn(tool.name + ' does not seem to be installed.');
            process.exit(1);
        }
    });
}

findExecutables(pngTools);

module.exports = function(){
    common.log('Crunching PNGs. Go get a coffee and bring me a cortado.');
    var start = new Date(),
        paths = findit.sync(nconf.get('ASSETS')).filter(function(p){
            return p.indexOf('.png') > -1;
        }),
        newSizes = {};

    return when.all(paths.map(function(p){
        var startingSize,
            outPath = p + '.out';
        return common.stat(p).then(function(s){
            startingSize = s.size;
            return s;
        }).then(function(){
            return sequence(pngTools.map(function(tool){
                return function(){
                    var cmd = tool.executable + ' ' + tool.flags.join(' ');
                    cmd = cmd.replace('{{inputFile}}', p)
                        .replace('{{outputFile}}', outPath);
                    if(!newSizes.hasOwnProperty(tool.name)){
                        newSizes[tool.name] = {};
                    }
                    return common.exec(cmd).then(function(){
                        return common.exec('mv -f ' + outPath + ' ' + p);
                    }, function(err){
                        throw err;
                    }).then(function(){
                        return common.stat(p);
                    }).then(function(stat){
                        newSizes[tool.name][p] = {
                            'start': startingSize,
                            'end': stat.size
                        };
                        startingSize = stat.size;
                        return stat;
                    });
                };
            }));
        });
    })).then(function(){
        common.logStat('Crunched PNGs', start, 2000);
        common.log('Results:');
        var currentTool = null;
        Object.keys(newSizes).forEach(function(name){
            var totalSavings = 0,
                start = 0,
                end = 0;
            common.log('  ' + name);
            Object.keys(newSizes[name]).forEach(function(f){
                var v = newSizes[name][f];
                common.log('    ' + f.replace(nconf.get('ASSETS'), '') + ' ' + v.start +' => ' + v.end);
                start += v.start;
                end += v.end;
            });
            common.log('  ' + name + ' total savings: ' + (Math.round((start - end) / 1024)) + 'kb');
            common.log('  ' + (Math.round((start) / 1024))  + 'kb => ' + (Math.round((end) / 1024)) + 'kb (' + Math.round(((start - end) / start)  * 100, 2) + '%)');
        });
        return newSizes;
    });
};