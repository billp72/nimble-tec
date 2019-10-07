require("dotenv").config();const accountSid=process.env.ACCOUNTSIDLOCALTWILIO||process.env.ACCOUNTSIDTWILIO,authToken=process.env.AUTHTOKENLOCALTWILIO||process.env.AUTHTOKENTWILIO,port=process.env.PORT||process.env.PORTLOCAL,http=require("http"),express=require("express"),session=require("express-session"),cors=require("cors"),MongoClient=require("mongodb").MongoClient,client=require("twilio")(accountSid,authToken),bcrypt=require("bcrypt"),generator=require("generate-password"),exporter=require("./vars");var password=generator.generate({length:10,numbers:!0});const app=express();app.use("/",express.static(__dirname+"/../public")),app.use(express.urlencoded({extended:!0})),app.use(express.json()),app.set("view engine","ejs"),app.use(session({secret:process.env.SESSIONSECRETELOCAL||process.env.SESSIONSECRETE,resave:!0,saveUninitialized:!0,rolling:!0,cookie:{httpOnly:!0,maxAge:36e5}})),app.use(cors());const url=process.env.DEV_MONGODB||process.env.LOCALMONGODB,dbName="applicants_db",mongoClient=new MongoClient(url,{useUnifiedTopology:!0,useNewUrlParser:!0});mongoClient.connect(e=>{createValidated(mongoClient.db(dbName),function(){mongoClient.close()})});var db_queries={search:function(e,s,r,t,n){e.collection("applicants").find({primary:new RegExp(s,"i")}).skip(t*r-t).limit(t).toArray(function(r,t){e.collection("applicants").find({primary:new RegExp(s,"i")}).count(function(e,s){n(t,s,r)})})},createUser:function(e,s,r){e.collection("auth").insertOne(s,function(e,s){r(s.ops[0],e)})},saveUserForm:function(e,s,r){var t={userid:s.userid};e.collection("applicants").createIndexes({primary:s.inputSkill,distance:s.distance},function(){e.collection("applicants").replaceOne(t,{$set:s},{upsert:!0,returnNewDocument:!0},function(e,s){r(s,e)})})},findOne:function(e,s,r,t,n){criteria={},criteria[t]=s.user,e.collection(r).findOne(criteria,function(e,s){n(s,e)})}};function createUser(e,s,r){bcrypt.genSalt(10).then(s=>bcrypt.hash(e.body.password,s)).then(t=>{var n={password:t,user:e.body.username};db_queries.findOne(r,n,"auth","username",function(t,i){t?(e.app.locals.specialContext=Object.assign(exporter.data,{err:"that username is already taken"}),s.redirect(e.get("referer"))):db_queries.createUser(r,n,function(r,t){t||(r?(e.session.userid=r._id.toString(),e.session.role=r.role||"",e.session.role?(e.app.locals.specialContext=Object.assign(exporter.data,e.body),s.redirect("/admin-home")):(e.app.locals.specialContext=Object.assign(exporter.data,e.body),s.redirect("/applicant"))):s.status(500).end("Whoops. The account was not created "+t))})})})}function createValidated(e,s){e.createCollection("applicants",{validator:{$jsonSchema:{bsonType:"object",required:["userid","phone","firstname","zip","distance","primary","subscribed"],properties:{userid:{bsonType:"string",description:"must be a string and is required"},phone:{bsonType:"string",description:"must be a string and is required"},email:{bsonType:"string",pattern:"@mongodb.com$",description:"must be a string and match the regular expression pattern"},firstname:{bsonType:"string",description:"must be a string and is required"},zip:{bsonType:"string",description:"must be a string"},distance:{bsonType:"string",description:"must be a string"},experience:{bsonType:"string",description:"must be a string"},about:{bysonType:"string",description:"must be string text"},$or:[{primary:{bsonType:"string",description:"must be a string and is required"}},{secondary:{bsonType:"string",description:"must be a string"}},{hobby:{bsonType:"string",description:"must be a string"}}],subscribed:{bsonType:"bool",description:"when this is true a user is subscribed"},status:{enum:["Unknown","Incomplete"],description:"can only be one of the enum values"}}}},validationAction:"warn"},function(e,r){console.log("Collection created."),s()})}app.get("/thejob",function(e,s,r){if("object"==typeof JSON.parse(Object.keys(e.query)[0])){let r=JSON.parse(Object.keys(e.query)[0]);r.err="",r.userid=e.session.userid?e.session.userid:"",r.fulladdress=r.address+" "+r.city+", "+r.state,r.fulladdress=r.fulladdress?r.fulladdress:"",r.googlekey=exporter.googlekey,r.mapurl="https://maps.googleapis.com/maps/api/js?key="+exporter.googlekey+"&callback=initMap",s.render(__dirname+"/../views/pages/applicant-job",r)}else obj.userid="",obj.fulladdress="",s.render(__dirname+"/../views/pages/applicant-job",{err:"something went wrong. contact the admin if it happens again."})}),app.get("/map-data",function(e,s){exporter.buildGoogleMap(e.query.address,function(e){s.status(200).send(e)})}),app.get("/**",function(e,s,r){const t=mongoClient.db(dbName);var n=e.app.locals.specialContext?e.app.locals.specialContext:exporter.empty(exporter.data);if(e.app.locals.specialContext=null,e.session.userid||"/"!=e.url||(n.password=password,s.render(__dirname+"/../views/pages/login",n)),e.session&&e.session.userid){if("/applicant"==e.url){if(n.firstName)s.render(__dirname+"/../views/pages/applicant-form",n);else{var i,o={user:e.session.userid};db_queries.findOne(t,o,"applicants","userid",function(e,r){i=e?Object.assign(exporter.data,e):n,s.render(__dirname+"/../views/pages/applicant-form",i)})}return}"/"==e.url&&(n.hidden="invisible",s.render(__dirname+"/../views/pages/login",n))}return e.session&&"admin"===e.session.role&&("/admin-search"==e.url&&s.render(__dirname+"/../views/pages/admin-search",n),"/admin-jobform"==e.url&&s.render(__dirname+"/../views/pages/admin-jobform",n),"/admin-home"==e.url&&(n.msg="Admin Panel",s.render(__dirname+"/../views/pages/admin-home",n))),r()}),app.post("/submit-applicant",function(e,s,r){const t=mongoClient.db(dbName);e.body.userid=e.session.userid;var n=exporter.trimObjStrings(e.body);db_queries.saveUserForm(t,n,function(e,r){r?s.status(500).send("Something went wrong, "+r):s.status(200).send("You're information has been submitted, "+e.ops[0].$set.firstName+'. <br />To unsubscribe from Nimble Tec\'s list, text "unsubscribe" to 1(908) 356-5955')})}),app.post("/admin-search-results",function(e,s,r){if("admin"===e.session.role){const r=mongoClient.db(dbName),n=9;var t=e.body.page||1;db_queries.search(r,e.body.primary,t,n,function(e,r,i){e?s.send({results:e,count:r,pages:Math.ceil(r/n),currentPage:t}):(i&&s.status(500).send("something went wrong"),s.status(200).send("no results found"))})}else s.redirect("/")}),app.post("/submit-auth",function(e,s,r){const t=mongoClient.db(dbName);if(e.body.new)createUser(e,s,t);else{var n={user:e.body.username};db_queries.findOne(t,n,"auth","username",function(r,n){r?bcrypt.compare(e.body.password,r.password,function(n,i){if(i){if(e.session.userid=r._id.toString(),e.session.role=r.role||"","admin"===e.session.role&&e.session.userid)e.app.locals.specialContext=Object.assign(exporter.data,{msg:"Admin Console"}),s.redirect("/admin-home");else if(e.session.userid){var o={user:e.session.userid};db_queries.findOne(t,o,"applicants","userid",function(r,t){e.app.locals.specialContext=Object.assign(exporter.data,r),s.redirect("/applicant")})}}else n?(e.app.locals.specialContext=Object.assign(exporter.data,{err:"something went wrong "+n}),s.status(500).redirect(e.get("referer"))):(e.app.locals.specialContext=Object.assign(exporter.data,{err:"wrong password or username"}),s.status(500).redirect(e.get("referer")))}):n?(e.app.locals.specialContext=Object.assign(exporter.data,{err:"something blew up "+n}),s.status(500).redirect(e.get("referer"))):(e.app.locals.specialContext=Object.assign(exporter.data,{err:"wrong password or username"}),s.status(200).redirect(e.get("referer")))})}}),app.post("/submit-jobform",function(e,s,r){if("object"!=typeof exporter.base64.encode(e.body)){let r="https://nimble-tec.herokuapp.com/thejob?"+exporter.base64.encode(e.body);e.app.locals.specialContext=Object.assign(exporter.data,{url:r}),s.redirect(e.get("referer"))}else exporter.base64.encode(e.body).error?(e.app.locals.specialContext=Object.assign(exporter.data,{msg:"something went wrong "+exporter.base64.encode(e.body).error}),s.redirect(e.get("referer"))):(e.app.locals.specialContext=Object.assign(exporter.data,{msg:"something went wrong"}),s.redirect(e.get("referer")))}),app.post("/submit-sms",function(e,s){var r=e.body.textmessage,t=e.body.sms;t.forEach(function(e){client.messages.create({body:"Nimble Tec: "+r,from:"+19083565955",to:"+1"+e.tel}).then(e=>{var r=t.length>1?"Your message has been sent to "+t.length+" people":"Your message has been sent to "+t.length+" person";s.status(200).send(r),e.sid})})}),http.createServer(app).listen(port,()=>{console.log("Express server listening on port "+port)});