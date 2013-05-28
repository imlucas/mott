"use strict";

require('./config.js');

var socket = io.connect("http://localhost:8080");
socket.on("change", function(data){
    console.log("Got change from server.");
    // You could add some custom code here to reinitialize your
    // app instead if you'd like or do something nice like
    // have a reload on change checkbox preference saved in
    // local storage.
    window.location.reload();
});