var Handlebars = require('handlebars');

module.exports = function(s){
    return s;
};

Handlebars.registerHelper('t', module.exports);