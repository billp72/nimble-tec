//constants
var data = {
    firstname: '',
    tel: '',
    email: '',
    about: '',
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

module.exports = {'data': data, 'empty': empty};