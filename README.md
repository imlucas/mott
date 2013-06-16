# mott

A build tool for writing awesome multiplatform apps in Javascript and HTML.

[![Build Status](https://secure.travis-ci.org/imlucas/mott.png)](http://travis-ci.org/imlucas/mott)

This is still a very early release as we"re still doing some housekeeping but have a
look at the [example](https://github.com/imlucas/mott/tree/master/examples) for usage.


In the mean time, more info is available on the [Phonegap Blog](http://phonegap.com/blog/2013/04/23/story-behind-exfm/)

## Examples

 * exfm [web](http://assets.extension.fm) [ios](https://itunes.apple.com/us/app/exfm/id440394777?mt=8)

## Features

* deploy an opsworks stack
* deploy to S3
* deploy to github pages
* build and run phongap apps

## Notes

    // multiple recipes?
    "mott": {
        "recipes": [
            {
                "ios": {
                    "build": ["js config", "js", "less"],
                    "run": ["build", "watch"],
                    "use": ["lucas-special-brew", "mr-cordova"],
                    "ipa": ["deploy to s3"],
                    "metadata": {
                        "js": {
                            "./app/js/main.js": {
                                "dest": "app.js",
                                "templating": {
                                    "engine": "handlebars",
                                    "partials": [],
                                    "helpers": []
                                }
                            },
                            "./app/js/sterno.js": "sterno.js"
                        },
                        "less": {
                            "./app/less/main.less": "app.css",
                            "./app/less/install.less": "install.css"
                        },
                        "config.js": "./app/config.js"
                    }
                },
                "marketing-site": {
                    "use": ["lucas-static-site", "mr-mandril-subscriber"]
                    "metadata": {
                        "pages": {
                            "./marketing/index.jade": "index.html",
                            "./marketing/signup.jade": "signup.html",
                            "./marketing/thanks.jade": "thanks.html"
                        },
                        "less": {
                            "./marketing/marketing.less": "marketing.css"
                        }
                    }
                }
            }
        ],
        "development": {
            "url": "http://localhost:8080"
        },
        "beta": {
            "url": "http://beta.mysite.com"
        },
        "production": {
           "url": "http://prod.mysite.com"
        }
    }
