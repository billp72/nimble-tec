require("dotenv").config();const accountSid=process.env.ACCOUNTSIDLOCALTWILIO||process.env.ACCOUNTSIDTWILIO,authToken=process.env.AUTHTOKENLOCALTWILIO||process.env.AUTHTOKENTWILIO,port=process.env.PORT||process.env.PORTLOCAL,http=require("http"),express=require("express"),session=require("express-session"),cors=require("cors"),MongoClient=require("mongodb").MongoClient,client=require("twilio")(accountSid,authToken),bcrypt=require("bcrypt"),generator=require("generate-password"),exporter=require("./vars"),app=express();app.use("/",express.static(__dirname+"/../public")),app.use(express.urlencoded({extended:!0})),app.use(express.json()),app.set("view engine","ejs"),app.use(session({secret:process.env.SESSIONSECRETELOCAL||process.env.SESSIONSECRETE,resave:!0,saveUninitialized:!0})),app.use(cors());var base64={encode:function(e){try{return{en:encodeURIComponent(JSON.stringify(e))}}catch(e){return{er:e}}},decode:function(e){try{return{en:decodeURIComponent(e)}}catch(e){return{er:e}}}};const url=process.env.DEV_MONGODB||process.env.LOCALMONGODB,dbName="applicants_db",mongoClient=new MongoClient(url,{useUnifiedTopology:!0,useNewUrlParser:!0});mongoClient.connect(e=>{createValidated(mongoClient.db(dbName),function(){mongoClient.close()})});var db_queries={search:function(e,s,r){e.collection("applicants").find({primary:s}).toArray(function(e,s){r(s,e)})},createUser:function(e,s,r){e.collection("auth").insertOne(s,function(e,s){r(s.ops[0],e)})},saveUserForm:function(e,s,r,n){},findOne:function(e,s,r){e.collection("auth").findOne({username:s.username},function(e,s){r(s,e)})}};function helpers(e,s,r){bcrypt.genSalt(10).then(s=>bcrypt.hash(e.body.password,s)).then(n=>{var t={password:n,username:e.body.username};db_queries.findOne(r,t,function(n,a){n?(e.app.locals.specialContext=Object.assign(exporter.data,{err:"that username is already taken"}),s.redirect(e.get("referer"))):db_queries.createUser(r,t,function(r,n){n||(r?(e.session.userid=r._id,e.session.role=r.role||"",e.session.role?(e.app.locals.specialContext=Object.assign(exporter.data,e.body),s.redirect("/admin-home")):(e.app.locals.specialContext=Object.assign(exporter.data,e.body),s.redirect("/applicant"))):s.status(500).end("Whoops. The account was not created "+n))})})})}function createValidated(e,s){e.createCollection("applicants",{validator:{$jsonSchema:{bsonType:"object",required:["phone","firstname","skill1","subscribed"],properties:{phone:{bsonType:"string",description:"must be a string and is required"},email:{bsonType:"string",pattern:"@mongodb.com$",description:"must be a string and match the regular expression pattern"},firstname:{bsonType:"string",description:"must be a string and is required"},lastname:{bsonType:"string",description:"must be a string"},$or:[{skill1:{bsonType:"string",description:"must be a string and is required"}},{skill2:{bsonType:"string",description:"must be a string"}},{skill3:{bsonType:"string",description:"must be a string"}}],subscribed:{bsonType:"bool",description:"when this is true a user is subscribed"},status:{enum:["Unknown","Incomplete"],description:"can only be one of the enum values"}}}},validationAction:"warn"},function(e,r){console.log("Collection created."),s()})}var password=generator.generate({length:10,numbers:!0});app.get("/thejob",function(e,s,r){if("object"==typeof JSON.parse(Object.keys(e.query)[0])){let r=JSON.parse(Object.keys(e.query)[0]);r.err="",s.render(__dirname+"/../views/pages/applicant-job",r)}else s.render(__dirname+"/../views/pages/applicant-job",Object.assign(exporter.data,{err:"something went wrong. contact the admin if it happens again."}));return exporter.empty(exporter.data),r()}),app.get("/**",function(e,s,r){var n=e.app.locals.specialContext&&"object"==typeof e.app.locals.specialContext?e.app.locals.specialContext:exporter.empty(exporter.data);return e.app.locals.specialContext=null,e.session.userid||(n.password=password,s.render(__dirname+"/../views/pages/login",n)),e.session&&e.session.userid&&("/applicant"==e.url&&s.render(__dirname+"/../views/pages/applicant-form",n),"/applicant-complete"==e.url&&(n.formCompleted?s.render(__dirname+"/../views/pages/applicant-complete",n):s.redirect("/applicant")),"/"==e.url&&(n.hidden="invisible",s.render(__dirname+"/../views/pages/login",n))),e.session&&"admin"===e.session.role&&("/admin-search"==e.url&&s.render(__dirname+"/../views/pages/admin-search",n),"/admin-jobform"==e.url&&s.render(__dirname+"/../views/pages/admin-jobform",n),"/admin-home"==e.url&&(n.msg="Admin Panel",s.render(__dirname+"/../views/pages/admin-home",n))),r()}),app.post("/submit-applicant",function(e,s,r){var n=Object.assign(exporter.data,{msg:"You're all set, "+e.body.firstName});e.app.locals.specialContext=n,s.redirect("/applicant-complete")}),app.post("/admin-search-results",function(e,s,r){if("admin"===e.session.role){let e=[{name:"bill",age:37,phone:"908-531-5329",primary:"java"},{name:"joe",age:44,phone:"908-531-5320",primary:"java"}];s.json(e)}else s.redirect("/")}),app.post("/submit-auth",function(e,s,r){const n=mongoClient.db(dbName);e.body.new?helpers(e,s,n):db_queries.findOne(n,{username:e.body.username},function(r,n){r?bcrypt.compare(e.body.password,r.password,function(n,t){t?(e.session.userid=r._id,e.session.role=r.role||"","admin"===e.session.role&&e.session.userid?(e.app.locals.specialContext=Object.assign(exporter.data,{msg:"Admin Console"}),s.redirect("/admin-home")):e.session.userid&&(e.app.locals.specialContext=Object.assign(exporter.data,e.body),s.redirect("/applicant"))):n?(e.app.locals.specialContext=Object.assign(exporter.data,{err:"something went wrong "+n}),s.status(500).redirect(e.get("referer"))):(e.app.locals.specialContext=Object.assign(exporter.data,{err:"wrong password or username"}),s.status(500).redirect(e.get("referer")))}):n?(e.app.locals.specialContext=Object.assign(exporter.data,{err:"something blew up "+n}),s.status(500).redirect(e.get("referer"))):(e.app.locals.specialContext=Object.assign(exporter.data,{err:"wrong password or username"}),s.status(200).redirect(e.get("referer")))})}),app.post("/submit-jobform",function(e,s,r){if(base64.decode(e.body).en)if(base64.decode(e.body).er)e.app.locals.specialContext=Object.assign(exporter.data,{msg:"something went wrong"}),s.redirect(e.get("referer"));else{let r="https://nimble-tec.herokuapp.com/thejob?"+base64.encode(e.body).en;e.app.locals.specialContext=Object.assign(exporter.data,{url:r}),s.redirect(e.get("referer"))}else e.app.locals.specialContext=Object.assign(exporter.data,{msg:"something went wrong"}),s.redirect(e.get("referer"))}),app.post("/submit-sms",(e,s)=>{var r=e.body.message,n=e.body.sms;n.forEach(function(e){client.messages.create({body:"Nimble Tec: "+e.firstname+", "+r,from:"+19083565955",to:"+1"+e.tel}).then(e=>e.sid)}),s.end(n.length+" messages sent")}),http.createServer(app).listen(port,()=>{console.log("Express server listening on port "+port)});