var lt_client = require('localtunnel').client,
    nconf = require('nconf'),
    common = require('./common');

module.exports = function tunnel(grunt){
    grunt.registerTask('tunnel', 'Start a localtunnel', function(){
        var done = this.async();
        return grunt.helper('tunnel');
    });
    grunt.registerHelper('tunnel', function(platform){
        var opt = {
            'host': nconf.get('TUNNEL_SERVER'),
            'port': nconf.get('PORT'),
            'subdomain': nconf.get('TUNNEL_SUBDOMAIN')
        };
        return lt_client.connect(opt).on('url', function(url) {
            common.success('You can access this from anywhere at ' + url);
        }).on('error', function(err) {
            common.warn(err.message + '.  Will try to reconnect in a sec.');
        });
    });
};