require("dotenv").config();const accountSid=process.env.ACCOUNTSIDLOCALTWILIO||process.env.ACCOUNTSIDTWILIO,authToken=process.env.AUTHTOKENLOCALTWILIO||process.env.AUTHTOKENTWILIO,port=process.env.PORT||process.env.PORTLOCAL,http=require("http"),express=require("express"),session=require("express-session"),cors=require("cors"),MongoClient=require("mongodb").MongoClient,client=require("twilio")(accountSid,authToken),bcrypt=require("bcrypt"),generator=require("generate-password"),exporter=require("./vars"),app=express();app.use("/",express.static(__dirname+"/../public")),app.use(express.urlencoded({extended:!0})),app.use(express.json()),app.set("view engine","ejs"),app.use(session({secret:process.env.SESSIONSECRETELOCAL||process.env.SESSIONSECRETE,resave:!0,saveUninitialized:!0})),app.use(cors());var base64={encode:function(e){try{return encodeURIComponent(JSON.stringify(e))}catch(e){return{error:e}}},decode:function(e){try{return decodeURIComponent(e)}catch(e){return{error:e}}}};const url=process.env.DEV_MONGODB||process.env.LOCALMONGODB,dbName="applicants_db",mongoClient=new MongoClient(url,{useUnifiedTopology:!0,useNewUrlParser:!0});mongoClient.connect(e=>{createValidated(mongoClient.db(dbName),function(){mongoClient.close()})});var db_queries={search:function(e,s,r){e.collection("applicants").find({primary:new RegExp(s,"i")}).toArray(function(e,s){r(s,e)})},createUser:function(e,s,r){e.collection("auth").insertOne(s,function(e,s){r(s.ops[0],e)})},saveUserForm:function(e,s,r){var n={userid:s.userid};e.collection("applicants").createIndexes({primary:s.inputSkill,distance:s.distance},function(){e.collection("applicants").replaceOne(n,{$set:s},{upsert:!0,returnNewDocument:!0},function(e,s){r(s,e)})})},findOne:function(e,s,r,n,t){criteria={},criteria[n]=s.user,e.collection(r).findOne(criteria,function(e,s){t(s,e)})}};function createUser(e,s,r){bcrypt.genSalt(10).then(s=>bcrypt.hash(e.body.password,s)).then(n=>{var t={password:n,user:e.body.username};db_queries.findOne(r,t,"auth","username",function(n,i){n?(e.app.locals.specialContext=Object.assign(exporter.data,{err:"that username is already taken"}),s.redirect(e.get("referer"))):db_queries.createUser(r,t,function(r,n){n||(r?(e.session.userid=r._id.toString(),e.session.role=r.role||"",e.session.role?(e.app.locals.specialContext=Object.assign(exporter.data,e.body),s.redirect("/admin-home")):(e.app.locals.specialContext=Object.assign(exporter.data,e.body),s.redirect("/applicant"))):s.status(500).end("Whoops. The account was not created "+n))})})})}function createValidated(e,s){e.createCollection("applicants",{validator:{$jsonSchema:{bsonType:"object",required:["userid","phone","firstname","zip","distance","primary","subscribed"],properties:{userid:{bsonType:"string",description:"must be a string and is required"},phone:{bsonType:"string",description:"must be a string and is required"},email:{bsonType:"string",pattern:"@mongodb.com$",description:"must be a string and match the regular expression pattern"},firstname:{bsonType:"string",description:"must be a string and is required"},zip:{bsonType:"string",description:"must be a string"},distance:{bsonType:"string",description:"must be a string"},experience:{bsonType:"string",description:"must be a string"},about:{bysonType:"string",description:"must be string text"},$or:[{primary:{bsonType:"string",description:"must be a string and is required"}},{secondary:{bsonType:"string",description:"must be a string"}},{hobby:{bsonType:"string",description:"must be a string"}}],subscribed:{bsonType:"bool",description:"when this is true a user is subscribed"},status:{enum:["Unknown","Incomplete"],description:"can only be one of the enum values"}}}},validationAction:"warn"},function(e,r){console.log("Collection created."),s()})}var password=generator.generate({length:10,numbers:!0});app.get("/thejob",function(e,s,r){if("object"==typeof JSON.parse(Object.keys(e.query)[0])){let r=JSON.parse(Object.keys(e.query)[0]);r.err="",r.userid=e.session.userid?e.session.userid:"",exporter.buildGoogleMap({origin:"07060",destination:"10002",mode:"driving"},function(e){if("object"==typeof e){var n=e.requestUrl.replace("directions/json","js");r.map=n+"&callback=initMap",console.log(r),s.render(__dirname+"/../views/pages/applicant-job",r)}else r.map="",s.render(__dirname+"/../views/pages/applicant-job",r)})}else s.render(__dirname+"/../views/pages/applicant-job",{err:"something went wrong. contact the admin if it happens again."})}),app.get("/**",function(e,s,r){const n=mongoClient.db(dbName);var t=e.app.locals.specialContext?e.app.locals.specialContext:exporter.empty(exporter.data);if(e.app.locals.specialContext=null,e.session.userid||"/"!=e.url||(t.password=password,s.render(__dirname+"/../views/pages/login",t)),e.session&&e.session.userid){if("/applicant"==e.url){if(t.firstName)s.render(__dirname+"/../views/pages/applicant-form",t);else{var i,o={user:e.session.userid};db_queries.findOne(n,o,"applicants","userid",function(e,r){i=e?Object.assign(exporter.data,e):t,s.render(__dirname+"/../views/pages/applicant-form",i)})}return}"/"==e.url&&(t.hidden="invisible",s.render(__dirname+"/../views/pages/login",t))}return e.session&&"admin"===e.session.role&&("/admin-search"==e.url&&s.render(__dirname+"/../views/pages/admin-search",t),"/admin-jobform"==e.url&&s.render(__dirname+"/../views/pages/admin-jobform",t),"/admin-home"==e.url&&(t.msg="Admin Panel",s.render(__dirname+"/../views/pages/admin-home",t))),r()}),app.post("/submit-applicant",function(e,s,r){const n=mongoClient.db(dbName);e.body.userid=e.session.userid;var t=exporter.trimObjStrings(e.body);console.log(t),db_queries.saveUserForm(n,t,function(e,r){r?s.status(500).send("Something went wrong, "+r):s.status(200).send("You're information has been submitted, "+e.ops[0].$set.firstName+'. <br />To unsubscribe from Nimble Tec\'s list, text "unsubscribe" to 1(908) 356-5955')})}),app.post("/admin-search-results",function(e,s,r){if("admin"===e.session.role){const r=mongoClient.db(dbName);db_queries.search(r,e.body.primary,function(e,r){e?s.send(e):(r&&s.status(500).send("something went wrong"),s.status(200).send("no results found"))})}else s.redirect("/")}),app.post("/submit-auth",function(e,s,r){const n=mongoClient.db(dbName);if(e.body.new)createUser(e,s,n);else{var t={user:e.body.username};db_queries.findOne(n,t,"auth","username",function(r,t){r?bcrypt.compare(e.body.password,r.password,function(t,i){if(i){if(e.session.userid=r._id.toString(),e.session.role=r.role||"","admin"===e.session.role&&e.session.userid)e.app.locals.specialContext=Object.assign(exporter.data,{msg:"Admin Console"}),s.redirect("/admin-home");else if(e.session.userid){var o={user:e.session.userid};db_queries.findOne(n,o,"applicants","userid",function(r,n){e.app.locals.specialContext=Object.assign(exporter.data,r),s.redirect("/applicant")})}}else t?(e.app.locals.specialContext=Object.assign(exporter.data,{err:"something went wrong "+t}),s.status(500).redirect(e.get("referer"))):(e.app.locals.specialContext=Object.assign(exporter.data,{err:"wrong password or username"}),s.status(500).redirect(e.get("referer")))}):t?(e.app.locals.specialContext=Object.assign(exporter.data,{err:"something blew up "+t}),s.status(500).redirect(e.get("referer"))):(e.app.locals.specialContext=Object.assign(exporter.data,{err:"wrong password or username"}),s.status(200).redirect(e.get("referer")))})}}),app.post("/submit-jobform",function(e,s,r){if("object"!=typeof base64.encode(e.body)){let r="https://nimble-tec.herokuapp.com/thejob?"+base64.encode(e.body);e.app.locals.specialContext=Object.assign(exporter.data,{url:r}),s.redirect(e.get("referer"))}else e.app.locals.specialContext=Object.assign(exporter.data,{msg:"something went wrong "+base64.encode(e.body).error}),s.redirect(e.get("referer"))}),app.post("/submit-sms",function(e,s){var r=e.body.textmessage,n=e.body.sms;n.forEach(function(e){client.messages.create({body:"Nimble Tec: "+r,from:"+19083565955",to:"+1"+e.tel}).then(e=>{var r=n.length>1?"Your message has been sent to "+n.length+" people":"Your message has been sent to "+n.length+" person";s.status(200).send(r),e.sid})})}),http.createServer(app).listen(port,()=>{console.log("Express server listening on port "+port)});