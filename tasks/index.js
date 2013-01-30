"use strict";

var nconf = require('nconf'),
    tunnel = require('./tunnel'),
    watch = require('./watch'),
    build = require('./build'),
    server = require('./server'),
    crunch = require('./image-crunch'),
    deploy = require('./deploy');

module.exports = function(grunt){
    grunt.registerTask('tunnel', 'Start a localtunnel', function(){
        this.async();
        return tunnel();
    });

    grunt.registerTask('run', 'Run a local server serves files, recompiles on change.', function(){
        server();
        this.async();
    });

    grunt.registerTask('crunch', 'Squeeze images assets.', function(){
        var done = this.async();
        crunch.png().then(function(){
            done();
        });
    });

    grunt.registerTask('build', 'Compile all JS and LESS.', function(){
        var done = this.async();
        build().then(function(){
            done();
        });
    });

    nconf.get('PLATFORMS').forEach(function(platform){
        grunt.registerTask('build.' + platform, 'Compile all JS and LESS for '+platform+'.', function(){
            var done = this.async();
            build(platform).then(function(){
                done();
            });
        });
    });

    grunt.registerTask('smoke', function(){
        var done = this.async();
        build().then(function(){
            return deploy.smoke();
        }).then(function(){
            done();
        });
    });

    grunt.registerTask('deploy.beta', function(){
        var done = this.async();
        deploy('beta').then(function(){
            done();
        });
    });

    grunt.registerTask('deploy.prod', function(){
        var done = this.async();
        deploy('beta').then(function(){
            done();
        });
    });

    grunt.registerTask('deploy.chromeapp', function(){
        var done = this.async();
        deploy.chromeapp().then(function(){
            done();
        });
    });
};
