#!/usr/bin/env node

var mott = require('../'),
    fs = require('fs-extra');

// mott.quickstart();

// Parse package
fs.readJson('./package.json', console.log);
