"use strict";


var BUILD_LOCK = false,
    nconf = require('nconf'),
    common = require('./common'),
    when = require('when'),
    tunnel = require('./tunnel'),
    watch = require('./watch'),
    build = require('./build'),
    server;

module.exports = function(platform){
    var platforms = (platform) ? [platform] : nconf.get('PLATFORMS');

    tunnel();
    if(!nconf.get('TUNNEL_SUBDOMAIN')){
        common.warn('Looks like your dont have a tunnel subdomain set.');
        common.warn('Tunnel will still work, but you\'ll get a random');
        common.warn('subdomain every time you run grunt.');
        common.warn('Its recommended to add "TUNNEL_SUBDOMAIN": "YOUR NAME"');
    }
    watch(function(what, f){
        var server = require(nconf.get('SERVER'));
        if(BUILD_LOCK === false){
            common.success('<= file ' + f + ' ' + what + '.  rebuilding...');
            BUILD_LOCK = true;

            build(platforms).then(function(){
                if(nconf.get('SOCKETIO')){
                    server.onChange();
                }

                module.exports.stop();
                module.exports.start();

                setTimeout(function(){
                    BUILD_LOCK = false;
                }, 1000);
            });
        }
    });

    module.exports.start();
};

module.exports.start = function(){
    var port = nconf.get('PORT'),
        d = when.defer();
    server = require(nconf.get('SERVER'));

    server.listen(port, function(){
        common.success('<= server listening on ' + port);
        d.resolve(port);
    });
    return d.promise;
};

module.exports.stop = function(){
    server.close();
};