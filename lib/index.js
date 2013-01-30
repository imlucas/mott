"use strict";

var nconf = require('nconf'),
    tunnel = require('../lib/tunnel'),
    watch = require('../lib//watch'),
    build = require('../lib//build'),
    server = require('../lib//server'),
    crunch = require('../lib//image-crunch'),
    deploy = require('../lib//deploy');

module.exports.tasks = {
    'run': {
        'description': 'Run a local server serves files, recompiles on change.',
        'target': server
    },
    'crunch': {
        'description': 'Squeeze images assets.',
        'target': crunch.png
    },
    'build': {
        'description': 'Compile all JS and LESS.',
        'target': build
    },
    'smoke': {
        'description': 'Smoke test your shit.',
        'target': function(){
            build().then(function(){
                return deploy.smoke();
            });
        }
    },
    'deploy': {
        'description': 'Build and up to S3',
        'target': function(env){
            if(!env){
                throw new Error('Specify an env, like `beta`');
            }
            deploy(env);
        }
    },
    'deploy.chromeapp': {
        'description': 'Build and copy to native/chromeapp',
        'target': deploy.chromeapp
    },
    'clean': {
        'description': 'Clear generated files'
    },
    'gitignore': {
        'desciption': 'Generate gitignore'
    }



    // nconf.get('PLATFORMS').forEach(function(platform){
    //     grunt.registerTask('build.' + platform, 'Compile all JS and LESS for '+platform+'.', function(){
    //         var done = this.async();
    //         build(platform).then(function(){
    //             done();
    //         });
    //     });
    // });
};
