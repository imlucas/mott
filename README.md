# mott

A build tool for writing awesome multiplatform apps in Javascript and HTML.

[![Build Status](https://secure.travis-ci.org/exfm/mott.png)](http://travis-ci.org/imlucas/mott)

This is still a very early release as we're still doing some housekeeping but have a
look at the [example](https://github.com/imlucas/mott/tree/master/examples) for usage.


In the mean time, more info is available on the [Phonegap Blog](http://phonegap.com/blog/2013/04/23/story-behind-exfm/)


## What does it do?

 * Use browserify to simplify dependecy management
 * Handlebars for real templating
 * Use `lang.json` files for i18n support
 * Compress your png assets
 * Incremental deploys to S3
 * Smoke test your app before deploying with PhantomJS
 * Built in tools for debugging your apps with [Weinre](http://debug.phonegap.com/)
 * Rebuild/reload on change


## Examples

 * exfm [web](http://assets.extension.fm) [ios](https://itunes.apple.com/us/app/exfm/id440394777?mt=8)

## Install

     npm install mott

## Usage

    mkdir project
    cd project
    npm install mott
    <add mott file>
    ./mott

## Running the example app

install dependencies

    cd example
    npm install

display list of commands

    ./mott

run the app

    ./mott run:web

open browser and go to http://localhost:3000

## Optional dependencies

* To use `./mott crunch` you'll need to install pngcrush and optipng
* To use `./mott smoke` you'll need to install phantomjs
