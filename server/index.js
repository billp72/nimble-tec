// Download the helper library from https://www.twilio.com/docs/node/install
// Your Account Sid and Auth Token from twilio.com/console
// DANGER! This is insecure. See http://twil.io/secure
require('dotenv').config();

const accountSid = process.env.ACCOUNTSIDLOCALTWILIO || process.env.ACCOUNTSIDTWILIO;
const authToken  = process.env.AUTHTOKENLOCALTWILIO || process.env.AUTHTOKENTWILIO;
const port       = process.env.PORT || process.env.PORTLOCAL;
const http                           = require('http');
const express                        = require('express');
const session                        = require('express-session');
const cors                           = require('cors');
//const { body,validationResult }    = require('express-validator/check');
//const { sanitizeBody }             = require('express-validator/filter');
const MongoClient                    = require('mongodb').MongoClient;
const client                         = require('twilio')(accountSid, authToken);
const bcrypt                         = require('bcrypt');
const generator                      = require('generate-password');
const exporter                       = require('./vars');
//const config                         = require('../config/keys')
/*
EXPRESS STUFF
*/
const app = express();
app.use('/', express.static(__dirname + '/../public'));
app.use(express.urlencoded({extended: true})); 
app.use(express.json());
app.set('view engine', 'ejs');
app.use(session({
    secret: process.env.SESSIONSECRETELOCAL || process.env.SESSIONSECRETE,
    resave: true,
    saveUninitialized: true
}));
app.use(cors());
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
/*
DATABASE STUFF
*/
const url = process.env.DEV_MONGODB || process.env.LOCALMONGODB;
const dbName = 'applicants_db';
const mongoClient = new MongoClient(
    url, 
    { 
        useUnifiedTopology: true,
        useNewUrlParser: true  
    }
);

mongoClient.connect(err => {
        //assert.equal(null, err);
        const db = mongoClient.db(dbName);
        createValidated(db, function(){
          mongoClient.close();
    }); 
});

var db_queries = {
    search: function(db, skill, callback){
        db.collection('applicants').find({'primary': skill}).toArray(function(error, response){
            callback(response, error);
       });
    },
    createUser: function(db, cred, callback){
       
        db.collection('auth').insertOne(cred, function(error, response){
            callback(response.ops[0], error); 
        });       
    },
    saveUserForm: function(db, objectToInsert, callback){
        
        var filter = {
            'userid':objectToInsert.userid
        }
        db.collection('applicants').replaceOne(filter, {$set: objectToInsert}, 
            {upsert: true, returnNewDocument: true}, function(error, response){
            callback(response, error);
        });
    },
    findOne: function(db, cred, collection, key, callback){
        criteria = {};
        criteria[key] = cred.user;
        db.collection(collection).findOne(criteria,function(err, username){
            callback(username, err);
        });
    }
}
function helpers(req, res, db){

    bcrypt.genSalt(10)
      .then(salt => {
        return bcrypt.hash(req.body.password, salt);
      })
      .then(hash => {
          var cred = {'password':hash, 'user': req.body.username}
          db_queries.findOne(db, cred, 'auth', 'username', function(user, err){
            if(!user){
                db_queries.createUser(db, cred, function(response, error){
                    if(error) {return};
                    if(response){
                       req.session.userid = response._id.toString();
                       req.session.role = response.role || '';
                       if(req.session.role){
                          req.app.locals.specialContext = Object.assign(exporter.data, req.body);
                          res.redirect('/admin-home'); 
                       }else{
                           req.app.locals.specialContext = Object.assign(exporter.data, req.body);
                           res.redirect('/applicant'); 
                       }  
                     }else{
                       res.status(500).end('Whoops. The account was not created ' + error);
                     }
                 });
             }else{
                req.app.locals.specialContext = Object.assign(exporter.data, 
                {'err':'that username is already taken'});
                res.redirect(req.get('referer'));
             }  
        });
    }); 
}

function createValidated(db, callback) {
    db.createCollection( 'applicants', {
        validator: { $jsonSchema: {
           bsonType: 'object',
           required: [ 'userid', 'phone', 'firstname', 'zip', 'distance', 'skill1', 'subscribed' ],
           properties: {
              userid: {
                 bsonType: 'string',
                 description: 'must be a string and is required'
              },
              phone: {
                 bsonType: 'string',
                 description: 'must be a string and is required'
              },
              email: {
                 bsonType: 'string',
                 pattern: '@mongodb\.com$',
                 description: 'must be a string and match the regular expression pattern'
              },
              firstname: {
                 bsonType: 'string',
                 description: 'must be a string and is required'
              },
              zip: {
                 bsonType: 'string',
                 description: 'must be a string'
              },
              distance: {
                bsonType: 'string',
                description: 'must be a string'
             },
             about: {
                 bysonType: 'string',
                 description: 'must be string text'
             },
              $or: [
              {
                skill1: {
                    bsonType: 'string',
                    description: 'must be a string and is required'
              }},{
                skill2: {
                    bsonType: 'string',
                    description: 'must be a string'
              }},{
                skill3: {
                    bsonType: 'string',
                    description: 'must be a string'
                }}
              ],
              subscribed: {
                bsonType: 'bool',
                description: 'when this is true a user is subscribed'
              },
              status: {
                 enum: [ 'Unknown', 'Incomplete' ],
                 description: 'can only be one of the enum values'
              }
           }
        } },
        validationAction: 'warn'
       },
       function(err, results) {
             console.log('Collection created.');
             callback();
       });
  };
  var password = generator.generate({
    length: 10,
    numbers: true
  });
/*
END POINTS
*/

//GET
app.get('/thejob', function(req, res, next){

   if(typeof JSON.parse(Object.keys(req.query)[0]) === 'object'){
        let obj = JSON.parse(Object.keys(req.query)[0]);
        obj.err = '';
        res.render(__dirname + '/../views/pages/applicant-job', obj);      
   }else{
        res.render(__dirname + '/../views/pages/applicant-job', 
        {'err':'something went wrong. contact the admin if it happens again.'});
   }

    return next();
});

app.get('/**', function(req, res, next){
    const db = mongoClient.db(dbName);
    var context = req.app.locals.specialContext ? 
        req.app.locals.specialContext : exporter.empty(exporter.data); 
        req.app.locals.specialContext = null;
 
    if(!req.session.userid && req.url == '/'){
        context.password = password;
        res.render(__dirname + '/../views/pages/login', context);
    }

    if(req.session && req.session.userid){

        if(req.url == '/applicant'){
            
            if(!context.firstName){
                var contextRefresh
                var cred = {'user': req.session.userid}
                db_queries.findOne(db, cred, 'applicants', 'userid', function(user, err){
                    if(user){
                        contextRefresh = Object.assign(exporter.data, user);
                        contextRefresh = exporter.trimObjStrings(contextRefresh);
                    }else{
                        contextRefresh = context;
                    }            
                    res.render(__dirname + '/../views/pages/applicant-form', contextRefresh);
                });
           }else{
                res.render(__dirname + '/../views/pages/applicant-form', context);
            }

            return;
        }
     
        if(req.url == '/'){
            context.hidden = 'invisible';
            res.render(__dirname + '/../views/pages/login', context);
        }
    }

    if(req.session && req.session.role === 'admin'){

        if(req.url == '/admin-search'){
            res.render(__dirname + '/../views/pages/admin-search', context);
        }
        
        if(req.url == '/admin-jobform'){
            res.render(__dirname + '/../views/pages/admin-jobform', context);
        }
        
        if(req.url == '/admin-home'){
            context.msg = 'Admin Panel';
            res.render(__dirname + '/../views/pages/admin-home', context);
        }
    }
 
    return next(); 
});

//POST REQUESTS

app.post('/submit-applicant', function(req, res, next){
    const db = mongoClient.db(dbName); 
    req.body.userid = req.session.userid;
    db_queries.saveUserForm(db, req.body, function(results, error){
       if(!error){
            res.status(200).send('You\'re information has been submitted, ' 
            + results.ops[0].$set.firstName + '. <br />To unsubscribe from Nimble '
            + 'Tec\'s list, text "unsubscribe" to 1(908) 356-5955');
        }else{ 
            res.status(500).send('Something went wrong, ' + error);
       }      
    }); 
});

app.post('/admin-search-results', function(req, res, next){
    if(req.session.role === 'admin'){
            //db_queries['search'](db, req.query.skill, function(result, error){
               // if(error && !result){
                    let response = [
                        {
                            name: 'bill',
                            age: 37,
                            phone: '908-531-5329',
                            primary: 'java'
                        },
                       {
                            name: 'joe',
                            age: 44,
                            phone: '908-531-5320',
                            primary: 'java'
                        }
                    ]
         
                    res.json(response);
                //}else{
                  //  res.send(error);
               // }
                
            //});
        }else{
            res.redirect('/');
        }
});


app.post('/submit-auth', function(req, res, next){
    const db = mongoClient.db(dbName);  
    if(req.body.new){
      helpers(req, res, db);
      return;
    }
    var cred = {'user': req.body.username}
    db_queries.findOne(db, cred,'auth', 'username', function(result, error){
        if(result){
            bcrypt.compare(req.body.password, result.password, function(err, response) {
                if(response){
                    req.session.userid = result._id.toString();
                    req.session.role = result.role || '';    
                    if(req.session.role === 'admin' && 
                       req.session.userid){
                       req.app.locals.specialContext = Object.assign(exporter.data, 
                       {'msg':'Admin Console'});
                       res.redirect('/admin-home');
                    }else if(req.session.userid){
                        var cred = {'user': req.session.userid}
                        db_queries.findOne(db, cred, 'applicants', 'userid', function(user, err){                
                            req.app.locals.specialContext = Object.assign(exporter.data, user);
                            res.redirect('/applicant'); 
                        });
                    } 
                }else{
                    if(err){
                      req.app.locals.specialContext = Object.assign(exporter.data, 
                      {'err':'something went wrong '+ err});
                      res.status(500).redirect(req.get('referer'));
                    }else{
                      req.app.locals.specialContext = Object.assign(exporter.data, 
                      {'err':'wrong password or username'});
                      res.status(500).redirect(req.get('referer'));
                   }
                }
            });
        }else{
            if(error){
              req.app.locals.specialContext = Object.assign(exporter.data, 
              { 'err': 'something blew up ' + error });
              res.status(500).redirect(req.get('referer'));
            }else{
              req.app.locals.specialContext = Object.assign(exporter.data, 
              {'err':'wrong password or username'});
              res.status(200).redirect(req.get('referer'));
            } 
        }
    });
   return;
});

app.post('/submit-jobform', function(req, res, next){
    //must authorize
    if(typeof base64.encode(req.body) !== 'object'){
        let URL = 'https://nimble-tec.herokuapp.com/thejob?' + base64.encode(req.body);
        req.app.locals.specialContext = Object.assign(exporter.data, {'url':URL});
        res.redirect(req.get('referer'));
    }else{
        req.app.locals.specialContext = Object.assign(exporter.data, 
        {'msg':'something went wrong ' + base64.encode(req.body).error});
        res.redirect(req.get('referer'));
    }
   
    return;
});

app.post('/submit-sms', (req, res) => {
    //must authorize
    var msg = req.body.message,
        sms = req.body.sms;
    sms.forEach(function(sms){
      client.messages
      .create({
          body: 'Nimble Tec: ' + sms.firstname + ', ' + msg,
          from: '+19083565955',
          to: '+1' + sms.tel
      })
      .then(message =>  message.sid);
    });
    res.end(sms.length + ' messages sent');
  });
 
http.createServer(app).listen(port, () => {
  console.log('Express server listening on port ' + port);
});


