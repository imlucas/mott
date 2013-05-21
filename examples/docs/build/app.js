;(function(e,t,n){function r(n,i){if(!t[n]){if(!e[n]){var s=typeof require=="function"&&require;if(!i&&s)return s(n,!0);throw new Error("Cannot find module '"+n+"'")}var o=t[n]={exports:{}};e[n][0](function(t){var i=e[n][1][t];return r(i?i:t)},o,o.exports)}return t[n].exports}for(var i=0;i<n.length;i++)r(n[i]);return r})({1:[function(require,module,exports){
"use strict";

var socket = io.connect("http://localhost:8080");
socket.on("change", function(data){
    console.log("Got change from server.");
    // You could add some custom code here to reinitialize your
    // app instead if you'd like or do something nice like
    // have a reload on change checkbox preference saved in
    // local storage.
    window.location.reload();
});
},{}]},{},[1])
;