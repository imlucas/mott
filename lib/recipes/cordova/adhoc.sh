#!/bin/bash

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

VERSION=`defaults read $PWD/$APP/Info.plist CFBundleShortVersionString`

cd "$PROJECT_PATH"

#todo (lucas) This only needs to happen on jenkins?
# security unlock-keychain -p $USER ~/Library/Keychains/login.keychain

xcodebuild -project $PROJECT_NAME.xcodeproj \
    -arch i386 \
    -target $PROJECT_NAME \
    -configuration Release \
    -sdk $SDK clean build \
    VALID_ARCHS="i386" \
    CONFIGURATION_BUILD_DIR="$PROJECT_PATH/build"

xcrun -sdk iphoneos PackageApplication -v $APP \
    -o $PWD/$APP.$VERSION.ipa \
    -embed $PWD/$APP.dSYM

