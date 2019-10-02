//constants
var data = {
    firstName: '',
    tel: '',
    email: '',
    about: '',
    zip: '',
    distance: '',
    inputSkill: '',
    inputSkill1: '',
    inputSkill2: '',
    msg: '',
    hidden: '',
    password: '',
    err: '',
    url: ''
}

var empty = function(object) {
    Object.keys(object).forEach(function (k){
        if (object[k] && typeof object[k] === 'object') {
            return empty(object[k]);
        }
        object[k] = '';
    });
    return object;
}

var trimObjStrings = function(context) {
    var trimmedContext = {};
    for(var prop in context){
        if(typeof context[prop] === 'string'){
            trimmedContext[prop] = context[prop].trim();
        }
    }

    return typeof trimmedContext === 'object' ? trimmedContext : context;
}

module.exports = {'data': data, 'empty': empty, 'trimObjStrings': trimObjStrings};