"use strict";
var util = require('util'),
    assert = require('assert');

describe('Cookbook', function(){
    it("should actually mixin a package local config", function(){
        var environments = {
                'development': {
                    'a': 1,
                    'b': 1
                }
            },
            data = {
                'mott': {
                    'development': {
                        'a': 2,
                        'c': 2
                    }
                }
            };
        Object.keys(environments).map(function(key){
            if(data.mott[key]){
                util._extend(environments[key], data.mott[key]);
            }
        });

        assert.deepEqual(environments, {
            'development': {
                'a': 2,
                'b': 1,
                'c': 2
            }
        });
    });

    it('should be able to define new environments from local', function(){
        var environments = {
                'development': {
                    'a': 1,
                    'b': 1
                }
            },
            data = {
                'mott': {
                    'playground': {
                        'a': 2,
                        'b': 2
                    }
                }
            };

        Object.keys(environments).map(function(key){
            if(data.mott[key]){
                util._extend(environments[key], data.mott[key]);
            }
        });

        Object.keys(data.mott).map(function(key){
            if(!environments[key]){
                environments[key] = data.mott[key];
            }
        });



        assert.deepEqual(environments, {
            'development': {
                'a': 1,
                'b': 1
            },
            'playground': {
                'a': 2,
                'b': 2
            }
        });
    });
});