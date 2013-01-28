"use strict";

var when = require('when'),
    moment = require('moment'),
    aws = require('plata'),
    nconf = require('nconf'),
    common = require('./common'),
    child_process = require('child_process'),
    _ = require('underscore'),
    findit = require('findit'),
    crypto = require('crypto'),
    fs = require('fs'),
    _ = require('underscore'),
    server = require('./server'),
    build = require('./build'),
    fileInfo = require('./file-info');

function upload(items){
    function uploadItem(item){
        var d = when.defer();
        aws.onConnected(function(){
            aws.s3.put(nconf.get('S3_BUCKET'), item.s3Key, item.data, item.headers).then(function(){
                d.resolve(item);
            });
        });
        return d.promise;
    }
    return when.all(items.map(uploadItem));
}

function getLatestManifest(){
    var d = when.defer();
        aws.onConnected(function(){
            aws.s3.get(nconf.get('S3_BUCKET'), 'deploy-manifest/'+nconf.get('NODE_ENV')+'.json').then(function(res){
                d.resolve(JSON.parse(res.body));
            }, function(err){
                common.log('No manifest exists yet or we\'re doing a complete rebuild.');
                d.resolve({
                    'created': 0,
                    'files': {},
                    'new': [],
                    'changed': [],
                    'removed': []
                });
            });
        });
    return d.promise;
}

function setTargetConfigValues(target){
    if(target === 'beta'){
        // @ todo (lucas) There has to be a short hand for this shit.
        nconf.set('NODE_ENV', 'beta');
        nconf.set('BASE_URL', '');
        nconf.set('API_URL', '');
        nconf.set('WEINRE', 'mott');
        nconf.set('S3_BUCKET', '');
        nconf.set('SOCKETIO', false);
        nconf.set('MINIFY', true);
        nconf.set('COMPRESS', true);
    }
}

function getLastModifiedTimes(paths){
    return when.all(paths.map(function(p){
        return common.stat(nconf.get('ASSETS') + '/' + p).then(function(stats){
            return {'path': p, 'mtime': stats.mtime.getTime()};
        }, function(err){
            return {'path': p, 'mtime': 0};
        });
    }));
}

function copyFile(file, target) {
    var d = when.defer(),
        readStream = fs.createReadStream(file),
        writeStream = fs.createWriteStream(target);

    readStream.pipe(writeStream);
    readStream.once('end', function(){
        d.resolve(file);
    });
    return d.promise;
}

// @todo (lucas) Allow deploying single platform.
module.exports = function(target){
    var details = {
            'version': Date.now(),
            'files': {},
            'changed': {},
            'added': {},
            'removed': {},
            'unchanged': {}
        },
        start = new Date();

    target = target || 'beta';

    setTargetConfigValues(target);

    common.log('Building....');
    return build().then(function(){
    //     return module.exports.smoke();
    // }).then(function(){
        common.log('Getting last manifest...');
        return getLatestManifest();
    }).then(function(man){
        // Try and figure out which files are new or have actually changed
        // since getting the full file info is actually quite expesive.
        var pRegex = new RegExp(nconf.get('PLATFORMS').join('|') + '|common'),
            // Get all the deployable files, ie app.css, app.js, bootstrap.js,
            // index.html for each platform and all images and fonts.
            allPaths = findit.sync(nconf.get('ASSETS')).filter(function(p){
                var i = p.indexOf('.tpl') === -1 && p.indexOf('.less') === -1 &&
                p.indexOf('/js/') === -1 && p.indexOf('/templates/') === -1 &&
                p.indexOf('/lang/') === -1 && p.indexOf('templates.js') === -1 &&
                p.indexOf('.') > -1;
                if(!i){
                    return i;
                }
                i = pRegex.test(p);
                return i;
            }).map(function(f){
                return f.replace(nconf.get('ASSETS') + '/', '');
            });


        return getLastModifiedTimes(allPaths).then(function(res){
            return res.filter(function(p){
                if(p.mtime === 0){
                    details.removed[p.path] = p.mtime;
                    return false;
                }
                if(!man.files.hasOwnProperty(p.path)){
                    details.added[p.path] = p.mtime;
                    return true;
                }

                var hasChanged = p.mtime > man.files[p.path];

                if(hasChanged === true){
                    details.changed[p.path] = p.mtime;
                }
                else{
                    details.unchanged[p.path] = p.mtime;
                }
                return hasChanged;
            }).map(function(f){
                return f.path;
            });
        }).then(function(paths){
            common.log('`'+Object.keys(details.changed).length+'` files changed.');
            common.log('`'+Object.keys(details.added).length+'` files added.');
            common.log('`'+Object.keys(details.removed).length+'` files removed.');
            common.log('`'+Object.keys(details.unchanged).length+'` files unchanged.');
            return when.all(paths.map(function(p){
                return fileInfo(nconf.get('ASSETS') + '/' + p);
            }));
        }).then(function(results){
            common.log('Building S3 put requests...');
            var items = [];
            results.map(function(file){
                if(file.data.length === 0){
                    common.fatal('File length of 0 for ' + file.cannonicalKey + '.  Bailing on deploy.  Try again.');
                }
                var headers = {
                        'Content-Type': file.mime,
                        'x-amz-acl': 'public-read',
                        'Content-Length': file.data.length,
                        'Expires': moment(new Date(details.version)).add('years', 5)
                            .format('ddd, D MMM YYYY, HH:mm:ss [GMT]'),
                        'Content-MD5': crypto.createHash('md5')
                            .update(file.data).digest('base64')
                    };

                if(file.compressed){
                    headers['Content-Encoding'] = 'gzip';
                }

                if(file.cannonicalKey.indexOf('.css') > -1 || file.cannonicalKey.indexOf('.js') > -1){
                    items.push({
                        'headers': headers,
                        's3Key': file.s3Key,
                        'data': file.data
                    });
                }

                if(file.cannonicalKey.indexOf('bootstrap.js') > -1){
                    delete headers.Expires;
                    headers['Cache-Control'] = 'max-age=0';
                }

                items.push({
                    'headers': headers,
                    's3Key': file.cannonicalKey,
                    'data': file.data
                });

                if(file.cannonicalKey === 'web/index.html'){
                    items.push({
                    'headers': headers,
                        's3Key': 'index.html',
                        'data': file.data
                    });
                }
            });

            common.log('Uploading ' + items.length + ' keys (cannonical and hashed) ...');
            return upload(items);
        }).then(function(){
            var manifestData = {
                'version': details.version,
                'files': {},
                'removed': Object.keys(details.removed),
                'added': Object.keys(details.added),
                'changed': Object.keys(details.changed),
                'unchanged': Object.keys(details.unchanged),
            },
            headers,
            items = [];

            ['added', 'changed', 'unchanged'].forEach(function(op){
                Object.keys(details[op]).forEach(function(key){
                    manifestData.files[key] = details[op][key];
                });
            });

            manifestData = JSON.stringify(manifestData);
            headers = {
                'Content-Type': 'application/json',
                'x-amz-acl': 'public-read',
                'Content-Length': manifestData.length,
                'Expires': moment(new Date(details.version)).add('years', 5)
                    .format('ddd, D MMM YYYY, HH:mm:ss [GMT]'),
                'Content-MD5': crypto.createHash('md5')
                    .update(manifestData).digest('base64')
            };

            items.push({
                'headers': headers,
                's3Key': 'deploy-manifest/'+nconf.get('NODE_ENV')+'.json',
                'data': manifestData
            });

            items.push({
                'headers': headers,
                's3Key': 'deploy-manifest/'+nconf.get('NODE_ENV')+'.'+details.version+'.json',
                'data': manifestData
            });

            common.log('Uploading ' + items.length + ' deploy manifest keys...');
            return upload(items);
        }).then(function(){
            var msg = ['Deployed mobile `'+details.version+'` to `'+nconf.get('NODE_ENV')+'`!'];
            msg.push.apply(msg, [
                '`'+Object.keys(details.changed).length+'` files changed.',
                '`'+Object.keys(details.added).length+'` files added.',
                '`'+Object.keys(details.removed).length+'` files removed.',
                '`'+Object.keys(details.unchanged).length+'` files unchanged.'
            ]);
            common.logStat('deploy', start, 10000);
            common.success(msg.join('\n'));
            return common.party('/me ' + msg.join('\n'));
        });
    });
};

module.exports.smoke = function(){
    var d = when.defer();
    common.log('Running smoke test. Please be patient...');
    return server.start().then(function(port){
        var cmd = '/usr/local/bin/phantomjs ' + nconf.get('SMOKE_TEST') + ' http://localhost:'+port+'/#bootstrap=http://localhost:'+port+'/web/bootstrap.js';
        common.log(cmd);
        child_process.exec(cmd,
            function(err, stdout, stderr){
                console.log(stdout);
                if(err && err.code){
                    d.reject(new Error('Smoke test failed'));
                    return common.fatal('Smoke test failed.');
                }
                d.resolve();
            });
        return d.promise;
    // @todo (lucas) Run test suite here.
    }).then(function(){
        return server.stop();
    });
};

module.exports.chromeapp = function(){
    var nativeBase = 'native/chromeapp',
        dest = require('path')
            .resolve(nconf.get('ASSETS') + '/../' + nativeBase),
        pRegex = new RegExp('chromeapp|common'),
        // Get all the deployable files, ie app.css, app.js, bootstrap.js,
        // index.html for each platform and all images and fonts.
        allPaths = findit.sync(nconf.get('ASSETS')).filter(function(p){
            var i = p.indexOf('.tpl') === -1 && p.indexOf('.less') === -1 &&
            p.indexOf('/js/') === -1 && p.indexOf('/templates/') === -1 &&
            p.indexOf('/lang/') === -1 && p.indexOf('templates.js') === -1 &&
            p.indexOf('.') > -1 && p.indexOf('.md') === -1;
            if(!i){
                return i;
            }
            i = pRegex.test(p);
            return i;
        }).map(function(f){
            return f.replace(nconf.get('ASSETS') + '/', '');
        });

    // Which directories will we have?
    when.all(_.unique(allPaths.map(function(file){
        var p = file.split('/');
        return p.slice(0, p.length-1).join('/');
    })).filter(function(dir){
        return dir !== 'chromeapp';
    }).map(function(dir){
        var d = when.defer();
        fs.exists(dest + '/' + dir, function(exists){
            if(exists){
                return d.resolve(true);
            }
            var previous = dest;
            dir.split('/').forEach(function(c){
                try{
                    fs.mkdirSync(previous + '/' + c);
                }catch(e){}
                previous = (previous + '/' + c);
            });
            d.resolve(true);
        });

        return d.promise;
    })).then(function(){
        when.all(allPaths.map(function(file){
            common.log('Copying `'+file.replace('chromeapp/', '')+'` to `'+nativeBase+'`...');
            return copyFile(nconf.get('ASSETS') + '/' + file, dest + '/' + file.replace('chromeapp/', ''));
        }), function(){
            common.success('`' + nativeBase + '` ready!');
        });
    });

};
