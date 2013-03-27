"use strict";

var assert = require('assert'),
    build = require('../lib/build'),
    config = require('../').config;

config.set('ASSETS', __dirname + '/../example/assets');
config.set('PLATFORMS', ['iphone', 'web']);
config.set('VERSION', '1.0.0');
config.set('VERSION_CODE', 1000);
config.set('BASE_URL', 'localhost:8080');

describe("Build", function(){
    describe("Handlebars", function(){
        it("should add helpers", function(done){
            var helpers = build.findHelpers('web');
            // assert.deepEqual(helpers, [['t', '/common/js/helpers/t.js']]);
            done();
        });

        it("should add partials", function(done){
            var partials = build.findPartials('web');
            // assert.deepEqual(partials, [['item', '/common/templates/partials/item.html' ]]);
            done();
        });

        it("should find handlebars environment", function(done){
            var env = build.getHandlebarsEnvironment('web');
            // assert.equal(env, "var Handlebars = require('handlebars-runtime');\n"+
            //     "Handlebars.registerPartial('item', require('/common/templates/partials/item.html'));\n"+
            //     "Handlebars.registerHelper('t', require('/common/js/helpers/t.js'));");
            done();
        });
    });

    describe("JS", function(){
        it("should do it", function(done){
            build.js().then(function(){
                done();
            });
        });
    });
});