#!/bin/bash

#
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
#  KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
#

#
# compile and launch a Cordova/iOS project to the simulator
#
# See http://blog.octo.com/en/automating-over-the-air-deployment-for-iphone/
# http://nachbaur.com/blog/building-ios-apps-for-over-the-air-adhoc-distribution
# http://stackoverflow.com/questions/2664885/xcode-build-and-archive-from-command-line
set -e

XCODE_VER=$(xcodebuild -version | head -n 1 | sed -e 's/Xcode //')
XCODE_MIN_VERSION="4.5"

if [[ "$XCODE_VER" < "$XCODE_MIN_VERSION" ]]; then
    echo "Cordova can only run in Xcode version $XCODE_MIN_VERSION or greater."
    exit 1
fi

CORDOVA_PATH=$( cd "$( dirname "$0" )" && pwd -P)
PROJECT_PATH="$(dirname "$CORDOVA_PATH")"
XCODEPROJ=$( ls "$PROJECT_PATH" | grep .xcodeproj  )
PROJECT_NAME=$(basename "$XCODEPROJ" .xcodeproj)
APP=build/$PROJECT_NAME.app
SDK=`xcodebuild -showsdks | grep Sim | tail -1 | awk '{print $6}'`
DSYM=$PWD/$APP.dSYM
DSYM_FILENAME=build/$PROJECT_NAME.app.dSYM
VERSION=`defaults read $PWD/$APP/Info.plist CFBundleShortVersionString`
BUNDLE_ID=`defaults read $PWD/$APP/Info.plist CFBundleIdentifier`
# CODE_SIGNING_IDENTITY=`security find-identity -p codesigning -v`

cd "$PROJECT_PATH"

#todo (lucas) This only needs to happen on jenkins?
security unlock-keychain -p $USER ~/Library/Keychains/login.keychain

xcodebuild -project $PROJECT_NAME.xcodeproj \
    -arch i386 -target $PROJECT_NAME \
    -configuration Release \
    -sdk $SDK clean build \
    VALID_ARCHS="i386" \
    CONFIGURATION_BUILD_DIR="$PROJECT_PATH/build" \
    CODE_SIGN_IDENTITY="iPhone Developer: Daniel Kantor (YJ8ZYE8592)"

xcrun -sdk iphoneos PackageApplication \
    -v $APP \
    -o $PWD/$APP.$VERSION.ipa \
    -embed $DSYM_FILENAME

cp -r $DSYM .
zip -r $DSYM_FILENAME.$VERSION.zip $DSYM_FILENAME
rm -rf $DSYM_FILENAME