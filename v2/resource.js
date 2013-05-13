"use strict";

function Resource(src, dest, buf, opts){
    this.src = src;
    this.dest = dest;
    this.buf = buf;
    this.opts = opts;
    this.flushes = 0;
}

// Write buf to disk
Resource.prototype.flush = function(){
    this.flushes++;
};

module.exports = Resource;
