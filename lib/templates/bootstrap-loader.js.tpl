function addScript(src, callback){
    console.log('Add script ' + src);
    callback = callback || function(){};

    var s = document.createElement('script');
    s.src = src;
    s.type = 'text/javascript';
    s.onreadystatechange = s.onload = function(){
        var state = s.readyState;
        if (!callback.done && (!state || /loaded|complete/.test(state))) {
            callback.done = true;
            callback();
        }
    };

    document.head.appendChild(s);
}

function addCss(url){
    var c = document.createElement('link');
    c.rel = 'stylesheet';
    c.type = 'text/css';
    c.href = url;
    document.head.appendChild(c);
}

function onBootstrap(data){
    // Add app js
    if(data.env === 'development'){
        data.js.src = data.js.src + "?" + Math.random();
        data.css.src = data.css.src + "?" + Math.random();
    }

    addScript(data.js.src);

    // Add app css
    addCss(data.css.src);

    // Add socket.io reloader code.
    if(data.hasOwnProperty('socketio') && data.socketio !== ''){
        addScript(data.socketio + 'socket.io/socket.io.js', function(){
            console.log('Adding socket.io refresh binding...');
            var socket = io.connect(data.socketio);
                socket.on('reload', function (data) {
                    console.log('Got reload from socketio: ' + JSON.stringify(data));
                    window.location.reload(true);
                });
        });
    }

    // Add weinre
    if(data.hasOwnProperty('weinre') && data.weinre !== ''){
        addScript(data.weinre);
    }
}

var bootstrapUrl;
// Allow forcing the bootstrap for CI.
if(window.location.hash && window.location.hash.indexOf('#bootstrap=') > -1){
    bootstrapUrl = window.location.hash.replace('#bootstrap=', '');
}
else{
    bootstrapUrl = localStorage.bootstrapUrl || 'BASEURL/PLATFORM/bootstrap.js?' + Math.random();
}
console.log('Using boostrap URL', bootstrapUrl);
addScript(bootstrapUrl);