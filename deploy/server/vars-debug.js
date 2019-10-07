const googlemapskey = process.env.GOOGLEMAPSAPIKEYLOCAL ?  process.env.GOOGLEMAPSAPIKEYLOCAL :  process.env.GOOGLEMAPSAPIKEYPROS
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

var base64 = {
    encode: function (unencoded) {
       try{
            return encodeURIComponent(JSON.stringify(unencoded))
        }catch(e){
            return {error: e};
        } 
    },
    decode: function (encoded) {
        try{
            return decodeURIComponent(encoded)
        }catch(e){
            return {error: e};
        } 
    }
};
var regEx = function(string){
    return string.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}
module.exports = {'data': data, 
                  'empty': empty, 
                  'trimObjStrings': trimObjStrings, 
                  'googlekey': googlemapskey,
                  'base64': base64,
                  'regEx':regEx
                };