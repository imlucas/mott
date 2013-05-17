"use strict";

var express = require('express');

module.exports = function(ctx, done){
    var app = express();

    app.use(express.static(__dirname + '/build'));

    app.get('/', function(req, res){
        return res.sendfile(__dirname + '/build/index.html');
    });

    ctx.server = app.listen(8080, function(){
        ctx.app = app;
        done();
    });
};
