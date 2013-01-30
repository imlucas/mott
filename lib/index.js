"use strict";

var nconf = require('nconf'),
    tunnel = require('../lib/tunnel'),
    watch = require('../lib//watch'),
    build = require('../lib//build'),
    server = require('../lib//server'),
    crunch = require('../lib//image-crunch'),
    deploy = require('../lib//deploy'),
    fs = require('fs');

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
        'description': 'Generate gitignore',
        'target': function(){
            var paths = ['assets/common/js/strings.js'];
            nconf.get('PLATFORMS').forEach(function(platform){
                ['app.css', 'js/config.js', 'templates.js', 'js/bootstrap.js'].forEach(function(f){
                    paths.push('assets/' + platform + '/' + f);
                });
            });
            console.log(paths.join("\n"));
        }
    },
    'add': {
        'description': 'Generate scafold for new platform',
        'target': function(name){
            if(!name){
                throw new Error('Specify a name arg.');
            }
            [
                nconf.get('ASSETS') + '/' + name,
                nconf.get('ASSETS') + '/' + name + '/js',
                nconf.get('ASSETS') + '/' + name + '/less',
                nconf.get('ASSETS') + '/' + name + '/templates',
            ].forEach(function(dir){
                fs.mkdirSync(dir);
                console.log('Create ' + dir);
            });
            fs.writeFileSync(nconf.get('ASSETS') + '/' + name + '/js/main.js', "// Add your JS here.");
            fs.writeFileSync(nconf.get('ASSETS') + '/' + name + '/less/main.less', "/* Add your LESS here. */");
            fs.writeFileSync(nconf.get('ASSETS') + '/' + name + '/bootstrap.tpl',
                fs.readFileSync(__dirname +'/templates/bootstrap.tpl'));
            fs.writeFileSync(nconf.get('ASSETS') + '/' + name + '/bootstrap-loader.js',
                fs.readFileSync(__dirname + '/templates/bootstrap-loader.js.tpl').toString()
                    .replace('BASEURL', nconf.get('BASE_URL'))
                    .replace('PLATFORM', name));

            fs.writeFileSync(nconf.get('ASSETS') + '/' + name + '/index.html',
                fs.readFileSync(__dirname + '/templates/index.html.tpl').toString()
                    .replace('BASEURL', nconf.get('BASE_URL')));

            console.log('Add ' + name + ' to your mott config.');
            build(name);
        }
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
