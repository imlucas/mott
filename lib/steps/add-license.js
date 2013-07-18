"use strict";

var debug = require('plog')('mott:add-license'),
    licenses = ['mit'];

// use package.json data for creating a LICENSE file.
// the default (and only at this point) license is MIT.
// great for using with the `new` task.
// also works great when sprucing up old projects.
//
// http://choosealicense.com/
module.exports = function(ctx, done){
    var packageData,
        lic = 'mit';

    debug('getting module author name');
    ctx.readFile(ctx.path('./package.json'), function(err, data){
        if(err){
            return done(err);
        }

        try{
            packageData = JSON.parse(data);
        }
        catch(e){
            return done(e);
        }
        if(packageData.license &&
            licenses.indexOf(packageData.license.toLowerCase()) > -1){
            lic = packageData.license.toLowerCase();
        }

        ctx.readFile('../../assets/license.'+lic+'.tpl', function(err, data){
            debug('writing', ctx.path('./LICENSE'));

            var buf = data.toString();
            buf.replace('{{year}}', new Date().getFullYear());

            if(packageData.author){
                buf.replace('{{name}}', packageData.author);
            }
            else {
                debug.warn('you\'ll need to add you name to', ctx.path('./LICENSE'));
            }
            ctx.writeFile(ctx.path('./LICENSE'), buf, done);
        });
    });
};