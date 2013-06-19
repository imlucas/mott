"use strict";

var aws = require('aws-sdk'),
    async = require('async'),
    debug = require('debug')('mott:deploy:opsworks');

module.exports = function deployopsworksStack(ctx, done){
    if(!ctx['opsworks stack']){
        return done(new Error('must specify `opsworks stack`'));
    }

    ctx['opsworks comment'] = ctx['opsworks comment'] ? ctx['opsworks comment'] : 'From mott yo.  Wouldnt a pull request link be great here?';
    ctx['opsworks data'] = ctx['opsworks data'] ? ctx['opsworks data'] : {};

    module.exports.stack(ctx, function(err, stack){
        if(err) return done(err);

        var ow = new aws.OpsWorks(),
            params = {
                'StackId': stack.StackId,
                'AppId': stack.app.AppId,
                'InstanceIds': stack.instances.map(function(instance){
                    return instance.InstanceId;
                }),
                'Command': {
                    'Name': 'deploy'
                },
                'Comment': ctx['opsworks comment'],
                'CustomJson': JSON.stringify(ctx['opsworks data'])
            };

        async.waterfall([
            function deploy(callback){
                ow.createDeployment(params, callback);
            },
            function getDeployDetails(data, callback){
                ow.describeDeployments({'DeploymentIds': [data.DeploymentId]}, function(err, data){
                    if(err) return callback(err);
                    ctx.lastDeploy = data.Deployments[0];
                    callback();
                });
            }
        ], done);
    });
};

module.exports.stack = function(ctx, done){
    var ow = new aws.OpsWorks(),
        stack = {};

    async.series([
        function getStack(callback){
            debug('getting stack', ctx['opsworks stack']);
            ow.describeStacks({}, function(err, res){
                if(err) return callback(err);
                var stacks = res.Stacks.filter(function(s){
                    return ctx['opsworks stack'] === s.Name;
                });
                if(stacks.length === 0){
                    return callback(new Error('couldnt find a stack named ' +
                        ctx['opsworks stack']));
                }
                stack = stacks[0];
                callback();
            });
        },
        function getLayers(callback){
            ow.describeLayers({'StackId': stack.StackId}, function(err, res){
                if(err) return callback(err);
                var layers = [];

                layers = res.Layers;

                if(layers.length === 0){
                    return callback(new Error('no layers for stack' +
                        ctx['opsworks stack']));
                }

                if(layers.length === 0){
                    return callback(new Error('specify a layer name, yo'));
                }

                stack.layer = layers[0];
                callback();
            });
        },
        function getInstances(callback){
            var params = {
                'LayerId': stack.layer.LayerId
            };

            ow.describeInstances(params, function(err, res){
                if(err) return callback(err);
                stack.instances = res.Instances;
                callback();
            });
        },
        function getApps(callback){
            var params = {
                'StackId': stack.StackId
            };

            ow.describeApps(params, function(err, res){
                if(err) return callback(err);
                stack.app = res.Apps[0];
                callback();
            });
        }

    ], function(err){
        if(err){
            return done(err);
        }
        done(null, stack);
    });
};