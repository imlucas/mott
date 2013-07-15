# mott

<div id="build-status">
    <a href="http://travis-ci.org/imlucas/mott"><img src="https://secure.travis-ci.org/imlucas/mott.png" /></a>
</div>
<p id="readme-intro">
    This is still a very early release as we"re still doing some housekeeping but have a
    look at the <a href="https://github.com/imlucas/mott/tree/master/examples">example</a> for usage.
    In the mean time, more info is available on the <a href="http://phonegap.com/blog/2013/04/23/story-behind-exfm/">Phonegap Blog</a>
</p>



## huh?  what is it good for?

* build and run phonegap apps
* browserify
* less
* rebuild on change
* build pages with jade
* appcache
* deploy an opsworks stack
* deploy to S3
* deploy to github pages

## getting started

    # install mott from npm
    npm install -g mott
    &nbsp;
    # initialize a new project
    mott new my-app
    &nbsp;
    cd my-app;
    # starts a local development server on localhost:8080
    npm start
    &nbsp;
    # setup repo
    git init
    git remote add origin https://github.com/your-username/my-app.git
    git add package.json
    git commit -m "Initial commit."
    &nbsp;
    # deploy to github pages
    npm run-script deploy

to add to an existing project, create or add this to package.json

    "dependencies": {
        "mott": "0.1.x",
        "mott-starter": "0.0.x"
    },
    "mott": {
        "recipe": {
            "use": "mott-starter",
            "metadata": {}
        }
    }

## package.json

so how does mott find out about all of this stuff?
the world doesnt need another configuration file or
format.  we already have a package.json file
and so mott just uses that.

    {
        "name": "my-app",
        "version": "0.0.0",
        "scripts": {
            "start": "DEBUG=mott:* ./node_modules/.bin/mott run",
            "deploy": "DEBUG=mott:* ./node_modules/.bin/mott deploy"
        }
        "dependencies": {
            "mott": "0.1.0",
            "mott-starter": "0.0.1"
        },
        "mott": {
            "recipe": {
                "use": "mott-starter"
            }
        }
    }

all keys specified in mott.recipe above are specific to
your application.  the special key mott.recipe.metadata
contains your setup, described in more detail below.
another special key is use, which allows you to specify
one of more recipes to inherit from.  all other keys
of mott.recipe.* are task declarations, which again you
can find more about below.

all keys specified in mott.*, excluding mott.recipe,
are environments you can create. for example

    ...
    "mott": {
        "recipe": {
            "use": "mott-starter"
        },
        "production": {
           "url": "http://ex.fm",
           "deploy": "s3://myaccessid:secretkey@bucketname/subkey"
        }
    }
    ...

so when you specify NODE_ENV or --env from the command line,
these values will override values in mott.recipe.metadata.

## package-local.json

sometimes you have values you don't want to be checked in
to your repository;  for example, AWS API credentials.
for those types of cases, mott supports a package-local.json
file you can use to specify those values.

    {
        "mott": {
            "production": {
                "deploy": "s3://myaccessid:secretkey@bucketname/subkey"
            }
        }
    }

## deploying with [wercker](http://wercker.com)
set up your repo as a wercker application and use the below
as your wercker.yml

    # mott wercker.yml
    box: wercker/nodejs
    build:
      steps:
        - npm-install
    deploy:
      steps:
        -  script:
            name: mott-deploy
            code: |-
              npm run-script deploy

## versioning with [sterno](http://github.com/imlucas/node-sterno)

sterno provides a simple way to manage versioning
for mobile deployments.  if appcache worked, sterno wouldn't
need to exist.  mott has a built-in step for generating
sterno bootstrap files.

    ...
    "mott": {
        "recipe": {
            "use": "mott-starter",
            "build": ["write bootstrap"]
        }
    }
    ...

## adhoc steps

a step does not have to be defined in a recipe to be used by your app.  you can just include a path to a script like
[this site does](https://github.com/imlucas/mott/blob/master/examples/docs/mott/fix-bootstrap-img-paths.js)

    ...
    "mott": {
        "recipe": {
            "use": "mott-starter",
            "build": ["./mott/fix-bootstrap-img-paths.js"]
        }
    }
    ...

## cordova

mott was built specifically for working with phonegap/cordova apps so it has
pretty extensive integration out of the box.  wouldn't it be nice if
you could run one command, build your app, create a binary distribution and
a manifest to install it, create a nice looking install page to send users to
and upload it all to S3?  mott can do this for cordvoa.

 * simple add on to build step for copying to `www` in your native directory
 * generate PLIST and IPA files for adhoc distribution
 * launch app in the emulator

### ipa

### build for ipa


## about

mott was originally created to help build the exfm phonegap
app.  it started out as a dozen or so grunt.js tasks.
after open sourcing it, i realized there was a lot about
that code that stunk; too fragile, too coupled to the
exfm architecture, not reusable.  It could do more.

originally i didn't want mott.  i justed wanted something
that fit my work flow.  after months of bending other tools,
i took some time to tear the original code down and
figure out what it was i actually wanted.

 * reuse amazing modules
 * make the configuration as reusable as any other module
 * composable configuration

the features i originally wanted

 * browserify to simplify dependecy management
 * robust client side templating
 * `lang.json` support
 * compress design assets
 * incremental deploys to S3
 * smoke test before deploying with `PhantomJS`
 * helpers for debugging, particularly on mobile (`weinre`, `chrome debugger`)
 * rebuild/reload on change

the point here is not just to create make in javascript.
there are plenty of solutions that already do that.
the raison d'etre of mott is to modularize the
boilerplate and the configuration of that boilerplate.
mott works great when used with make, grunt, jake, or
any of the other make improvements.  i've actually
added a few things already and removed them because they're
just better in make or bash.

## the works

so, how does it all work?
it may sound like a lot, but it's really not.
the amount of code here is really reall tiny.
it just provides an environment to play in.
almost all of the action happens in steps.
the basic unit is a step,
say run browserify on some js files.  each step is
assumed to be async and is as simple as a name and
a callback.  the callback gets two arguments: a
context, more on that later,
and a done callback.

i've already written some, in lib/steps
to take care of my workflow.  these should probably
be moved out of the main package but i digress.
steps can then be bundled up
into tasks.
tasks and steps can be packaged up into nice little
recipes; use requirejs and sass for this client,
less and browserify and dust.js for this other guy,
this one should be a phonegap app, etc, etc.

### recipe.metadata

metadata is the
runtime configuration for a recipe.
your metadata is what
specifies the tooling configuration for project.
for example, to tell mott
copy these png's from node_modules
(node_modules/my-app-design-aseets/**/*.png)
and put them in /images/$1/$2.png (see what i did
there?), run js/main.js through browserify and spit
that out as app.js you would want metadata like

    {
        ...
        "mott": {
            "recipe": {
                "metadata": {
                    "js": {
                        "./main.js": "./app.js"
                    },
                    "includes": {
                        "node_modules/bootstrap/img/*.png": "img/$1.png"
                    }
                }
            }
        }
        ...
    }

### recipe.environments

you can also specify
different environments that override
config values (deploy to this S3 bucket for
production, and this one for staging).  steps can
also as expected easily do different things for
different environments; add sourcemaps to
browserify'd files in development,
minfiy css for production.

### recipe.cookbook

cookbooks bring it all together and are an api for
working with your project (note: a project could
have many recipes, ie mobile web and phonegap ios and
chrome package app.  i like modularization a lot,
but you shouldn't have to use it for all your
recipes. a common folder is the best sometimes.)
cookbook.exec() will run a task with some options,
cookbook.cli() will run as a cli.

the cookbook prepares your metadata and environment
to create a context and takes care of things like
expanding globs you specify in your metadata.


### recipe.ctx

environments override metadata to create a context.
the context is like a request object in express or
the env object if your coming from fabric and python.
ctx can be decorated with functions by recipes and steps.

ctx also contains a few helper functions that make
writing steps much easier.  you can find more
on that in the Context documentation.


## compare

### app assemblers

 * [brunch](http://brunch.io) &mdash; A lightweight approach to building HTML5 applications with an emphasis on elegance and simplicity
 * [recipe.js](https://github.com/buildjs/recipe) &mdash; Web Component Recipe Helpers
 * [assemble](http://assemble.io) &mdash; Grunt.js plugin. Assemble makes it dead simple to build modular sites, documentation and components from reusable templates and data
 * [mimosa](http://mimosajs.com) &mdash; A modern browser development toolkit

## api

@todo

## examples

 * exfm [web](http://assets.extension.fm) [ios](https://itunes.apple.com/us/app/exfm/id440394777?mt=8)

## blog posts

 * [Phonegap Blog](http://phonegap.com/blog/2013/04/23/story-behind-exfm/) &mdash; the story behind exfm
