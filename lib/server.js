"use strict";


var BUILD_LOCK = false,
    nconf = require('nconf'),
    common = require('./common'),
    when = require('when');

module.exports = function(grunt){
    var server = require(nconf.get('SERVER'));
    grunt.registerTask('run', 'Run a local server serves files, recompiles on change.', function(){
            // grunt.helper('tunnel');
            // if(!nconf.get('TUNNEL_SUBDOMAIN')){
            //     common.warn('Looks like your dont have a tunnel subdomain set.');
            //     common.warn('Tunnel will still work, but you\'ll get a random');
            //     common.warn('subdomain every time you run grunt.');
            //     common.warn('Its recommended to add "TUNNEL_SUBDOMAIN": "YOUR NAME"');
            // }
            grunt.helper('watch', function(what, f){
                if(BUILD_LOCK === false){
                    common.log('file ' + f + ' ' + what + '.  Rebuilding...');
                    BUILD_LOCK = true;
                    grunt.helper('build').then(function(){
                        if(nconf.get('SOCKETIO')){
                            server.onChange();
                        }

                        grunt.helper('stopServer', server);
                        grunt.helper('startServer', server);

                        setTimeout(function(){
                            BUILD_LOCK = false;
                        }, 1000);
                    });
                }
            });

            grunt.helper('startServer', server);

            this.async(); // Run forever
    });

    grunt.registerHelper('startServer', function(){
        var port = nconf.get('PORT'),
            d = when.defer();

        server.listen(port, function(){
            common.log('Server listening on ' + port);
            d.resolve(port);
        });
        return d.promise;
    });

    grunt.registerHelper('stopServer', function(){
        server.close();
    });
};