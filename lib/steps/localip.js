"use strict";

var dns = require('dns'),
    os = require('os');

// Because localtunnel doesn't work reliably enough,
// hack the config to point at the local ip.
module.exports = function(ctx, done){
    if(ctx.environment !== 'development'){
        // Only run this hack in dev for real.
        return done();
    }

    dns.lookup(os.hostname(), function (err, add, fam){
        ctx.url = 'http://' + add + ':8080';
        done();
    });
};