const googlemaps = process.env.GOOGLEMAPSAPIKEYLOCAL || process.env.GOOGLEMAPSAPIKEYPROS;
const googleMapsClient = require('@google/maps').createClient({
    key: googlemaps
});

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

var buildGoogleMap = function(req, callback){
    
        googleMapsClient.directions({
        origin: req.origin,
        destination: req.destination,
        mode: req.mode,
      
        }, function(err, response) {
            //console.log(err);
            //console.log(response);
          if (!err) { 
            callback(response);
          }
        });

}

 
module.exports = {'data': data, 'empty': empty, 'trimObjStrings': trimObjStrings, 'buildGoogleMap': buildGoogleMap};