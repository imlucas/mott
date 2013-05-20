"use strict";

var express = require('express');

module.exports = function(ctx, done){
    var app = express();

    app.use(express.static(ctx.path('build')));

    app.get('/', function(req, res){
        return res.sendfile(ctx.path('build/index.html'));
    });

    ctx.server = app.listen(8080, function(){
        ctx.app = app;
        console.log('dev server running at http://localhost:8080');
        done();
    });
};
