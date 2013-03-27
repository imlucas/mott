"use strict";

var lt_client = require('localtunnel').client,
    nconf = require('nconf'),
    common = require('./common');

module.exports = function tunnel(){
    var opt = {
        'host': nconf.get('TUNNEL_SERVER'),
        'port': nconf.get('PORT'),
        'subdomain': nconf.get('TUNNEL_SUBDOMAIN')
    };
    return lt_client.connect(opt).on('url', function(url) {
        common.success('<= you can access this from anywhere at ' + url);
    }).on('error', function(err) {
        common.warn(err.message + '.  will try to reconnect in a sec.');
    });
};