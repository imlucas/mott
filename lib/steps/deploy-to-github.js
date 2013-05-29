"use strict";

var child_process = require('child_process'),
    async = require('async'),
    fs = require('fs-extra');

module.exports = function(ctx, done){
    async.series([
        getRemoteUrl,
        getLastCommitMessage
    ], function(err, res){
        var repoUrl = res[0],
                message = res[1],
                tasks = [
                'git init',
                'git add .',
                'git commit -m "' + message + '"',
                'git push --force ' + repoUrl + ' master:gh-pages'
            ].map(function(cmd){
                return function(cb){
                    child_process.exec(cmd, {'cwd': ctx.path('build')}, function(err, stdout, stderr){
                        cb(err);
                    });
                };
            });

        async.series(tasks, function(err){
            fs.remove(ctx.path('build/.git'), function(err){
                done();
            });
        });
    });
};

function getRemoteUrl(cb){
    child_process.exec('git config remote.origin.url', function(err, stdout, stderr){
        if(err){
            return cb(err);
        }
        cb(null, stdout.replace('\n', ''));
    });
}

function getLastCommitMessage(cb){
    child_process.exec('git log --oneline', function(err, stdout, stderr){
        if(err){
            return cb(err);
        }
        cb(null, stdout.split('\n')[0]);
    });
}