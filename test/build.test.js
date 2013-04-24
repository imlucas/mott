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
        it("should add helpers", function(){
            var helpers = build.findHelpers('web');
            assert(helpers[0][1].indexOf('/common/js/helpers/t.js') > -1,
                'Should find translation helper in common');
        });

        it("should add partials", function(){
            var partials = build.findPartials('web');
            assert(partials[0][1].indexOf('/common/templates/partials/item.html') > -1,
                'Should find item partial in common');
        });

        it("should find handlebars environment", function(){
            var env = build.getHandlebarsEnvironment('web');
            assert(env.indexOf("Handlebars.registerPartial('item'") > -1,
                "Should register item partial");
            assert(env.indexOf("Handlebars.registerHelper('t'") > -1,
                "Should register translation helper");
        });
    });

    describe("JS", function(){
        it("should do it", function(done){
            build.js(config.get('PLATFORMS')).then(function(){
                done();
            });
        });
    });
});