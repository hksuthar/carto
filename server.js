var express = require('express');
var app=express();
var csvjson = require('csvjson');
var parse = require('csv-parse');
var mongojs=require('mongojs');

var mongoose = require('mongoose');
var csv = require('fast-csv');
var path = require('path');

var MongoClient = require('mongodb').MongoClient;
var db = null;
var dbName='carttronics'
var dbName_user = 'user'
var url = 'mongodb://localhost:27017/' + dbName_user
var url_carttronics = 'mongodb://localhost:27017/'+dbName

var fs = require('fs');
var bodyParser = require('body-parser');
var multer = require('multer');
var moment = require('moment'); 
var collection;
var str = "";
var aData = null;
var Document = null;

/******************************** For File uploaded Start ************************************/

app.use(express.static('../Carttronics_Graph/Client/', { index: 'login.html' }));

app.use(bodyParser.json());

app.get('/', function (req, res) {
    res.status(200).sendFile('index.html', { root: path.join(__dirname, '../Carttronics_Graph/Client/') });
});

app.get('/carttronicslogin',function(req, res){
    console.log("I see a get request")
});

app.get('/Chart_1', function (req, res) {
    console.log("I see a get request from Chart_1")
    MongoClient.connect(url_carttronics, function (err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
        } else {
            console.log('Connection Done ', url_carttronics);
            db.listCollections().toArray(function(err, collInfos) {
                // collInfos is an array of collection info objects that look like:
                // { name: 'test', options: {} }
                console.log(collInfos);
                //res.send(collInfos);
            });
            
            var collection = db.collection('carttronics');
            var adata = []

            collection.find({}).toArray( function (err, docs) { // Should succeed
                if (err)
                    throw err;
                else {
                    res.send(docs);
                }
            });
        }     
    });
});

app.post('/carttronicslogin', function(req,res){
    
    console.log("i am Harsh Patel");

    console.log(req.body.email);

    //Main Data insert
    MongoClient.connect(url, function (err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
        } else {
            console.log('Connection Done ', url);
            //console.log(db);
            var collection = db.collection('user');
            //console.log(collection.find );
            var data = collection.find({ 'email': req.body.email, "password": req.body.pass });
            
            collection.find({ 'email': req.body.email, "password": req.body.pass }, function (errr, docs) { // Should succeed
                if (errr)
                    console.log("Please enter valid email and password");
                   //res.send("not");
                else {                
                    docs.each(function (err, doc) {
                        if (doc) {
                            console.log(doc.username);
                            res.send("index.html");
                        }    
                    });
                }
            });
        }
    });
});

app.post('/Chart_1', function (req, res) {
    
    console.log("i see post request from Chart_1")
    
    //Main Data insert
    MongoClient.connect(url_carttronics, function (err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
        } else {
            console.log('Connection Done ', url_carttronics);
            //console.log(db);
            var collection = db.collection('user');
            collection.find({ 'email': req.body.email, "password": req.body.pass }, function (err, docs) { // Should succeed
                if (err)
                    res.send("not Ok");
                else {
                    docs.each(function (err, doc) {
                        if (doc) {
                            console.log(doc.email)
                            res.send("index.html");
                            //res.status(200).sendFile('Chart.html', { root: path.join(__dirname, '../carttronics/client/') });//res.sendFile(__dirname + '/Client/index.html');
                                                        
                        }
                    });
                }
            });   
        }
        //var db = 'CartData';
    });
});

    /************* Added by Hemesh from Krutika Ends **********************/

    app.use(function(req, res, next) { //allow cross origin requests
        res.setHeader("Access-Control-Allow-Methods", "POST, PUT, OPTIONS, DELETE, GET");
        res.header("Access-Control-Allow-Origin", "http://localhost");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });

    var storage = multer.diskStorage({ //multers disk storage settings
        destination: function (req, file, cb) {
            cb(null, './uploads/');
        },
        filename: function (req, file, cb) {
            var datetimestamp = Date.now();
            cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length -1]);
        }
    });

    var upload = multer({ //multer settings
        storage: storage
   }).single('file');

    app.post('/upload', function (req, res) {

        upload(req, res, function (err) {
            if(err){
                 res.json({error_code:1,err_desc:err});
                 return;
            }

            
            /***************************** Main Data Base all the data store in carttronics collection (Start)  **********************************/

            console.log("It is done");
            res.json({ error_code: 0, err_desc: null });
            var filename = '/' + req.file.path;
            console.log(filename.length);
            console.log(filename);
           
            var Converter = require("csvtojson").Converter;

            var updatefilename = "./Updatecsvfile.csv";
            console.log(updatefilename.length);
                 
            fs.readFileSync(__dirname+filename).toString().split(' ').forEach(function (line) {
                fs.appendFileSync(updatefilename, line.toString());
            });
                var Converter = require("csvtojson").Converter;
                console.log(updatefilename);
                var fileStream = fs.createReadStream(__dirname+updatefilename.substring(1,19));
                var converter = new Converter({ constructResult: true });
                
                converter.on("end_parsed", function (jsonObj) {
                    console.log(jsonObj);
                    var jsonfile = require('jsonfile');
                    var file_json =__dirname+ "/uploads/"+updatefilename.substring(1,16 )+'json';
                    jsonfile.writeFile(file_json, jsonObj, function (err) { console.error(err); });
                });
                fileStream.pipe(converter);
            
            //Logic implimentation for the separate files starts
            var filename = "/uploads/Updatecsvfile.json" 
            var people = [], casters = {}, dts = [], dts1 = [];
            var fileContents = fs.readFileSync(__dirname + filename);
            var ss = fileContents.toString().split('\n');
            //console.log(ss);
            for (var i = 1; i < ss.length-1; i++) {
                var s = ss[i].toString().split(',');
                var dt = '', t = '', sn = '', m = '';
                if (s[2] != undefined)
                    dt = s[2].replace("\"", "");

                if (dts.indexOf(dt) < 0) {
                    dts.push(dt);
                }

                if (s[0] != undefined)
                    t = s[0].replace("\"", "").replace("PT", "");
                var d = moment(t).format("YYYY-MM-DD hh:mm");
                
                var temp = d + 621355968000000000;
                if (dts1.indexOf(d) < 0) {
                    dts1.push(d);
                }
                
                if (s[1] != undefined)
                    sn = s[1].replace("\"", "");

                if (!casters.hasOwnProperty(sn)) {
                    var c = {
                        locs: [],
                        type: "NA",
                    }
                    // var obj = {};
                    casters[sn] = c;
                    //casters.push(obj);
                }
                var l = {};

                if (s[3] != undefined)
                    m = s[3].replace("\"", "");

                if (m.match(/Enter Store/gi)) { l["location"] = "S"; }
                else if (m.match(/Must Check/gi)) { l["location"] = "S"; }
                else if (m.match(/Check/gi)) { l["location"] = "C"; }
                else if (m.match(/Leave Store/gi)) { l["location"] = "P"; }
                else if (m.match(/Trolley Bay Outside/gi)) { l["location"] = "T"; }
                else if (m.match(/Trolley Bay Outside/gi)) { l["location"] = "T"; }
                else if (m.match(/Perimeter Lock/gi)) {
                    l["location"] = "L";
                    if (casters[sn].locs.length != 0)
                        if (casters[sn].locs[casters[sn].locs.length - 1].location == "L")
                            l["location"] = "P";
                }
                else if (m.match(/Unlock/gi)) { l["location"] = "P"; }
                if (l["location"] != "M" && sn != undefined) {
                    l["when"] = moment(t);
                    //l["when"] = d;
                    if (casters[sn] != undefined && casters[sn].locs.length == 0) { casters[sn].locs.push(l); }
                    else if (casters[sn] != undefined) {
                        // console.log(casters[sn]);
                        var last = casters[sn].locs[casters[sn].locs.length - 1];
                        if (last["when"] == d)
                            casters[sn].locs[casters[sn].locs.length - 1] = l;
                        else
                            casters[sn].locs.push(l);
                    }
                }
            }
            var dd = dts1.sort();
            var start = moment(dd[0]);
            var end = moment(dd[dd.length - 1]);

            for (var k in casters) {
                var s = casters[k];
                var ct = start;
                var tlocs = [];
                var thisLoc = {};
                thisLoc["location"] = "M";
                thisLoc["when"] = start;
                for (var li = 0; li < s.locs.length; li++) {
                    var breaker = 0;
                    while (ct._i < s.locs[li].when._i) {
                        breaker++;
                        tlocs.push(thisLoc);
                        ct = moment("" + moment(ct.toDate().getTime() + 60*1000).format("YYYY-MM-DD hh:mm:ss.SSSS"));//moment(ct).add(1, 'm');// check conversion
                    }
                }
                var breaker = 0;
                while (ct._i < end._i) {
                    breaker++;
                    tlocs.push(thisLoc);
                    ct = moment("" + moment(ct.toDate().getTime() + 60*1000).format("YYYY-MM-DD hh:mm:ss.SSSS"));// check conversion YYYY-MM-DD hh:mm:ss.SSSS
                }

                s['slocs'] = tlocs;
                s['locs'] = null;
                casters[k] = s;
            }
            var output = [];
            var output2 = [];
            output.push("Date,Missing,Parking Lot,Trolley Bay,Shopping,Checked Out");
            output2.push("Date,Stops");

            var outputMy = "";
            var output2My = "";
            outputMy = "Date,Missing,Parking Lot,Trolley Bay,Shopping,Checked Out";
            output2My = "Date,Stops";

            var lck = 0;
            var ct = start;
            
            var aa = moment(ct).add(10, 'm')
            var breaker = 0;

            for (var ct = start ; ct._i < end._i; ct = moment("" + moment(ct.toDate().getTime() + 60 * 1000).format("YYYY-MM-DD hh:mm:ss.SSSS"))) {
                breaker++;
                var m = 0; var s = 0; var c = 0; var p = 0; var t = 0;
                var xi;

                for (var sss in casters) {
                    try {
                            if (casters[sss].slocs[xi] == "S") s += 1;
                            if (casters[sss].slocs[xi] == "M") m += 1;
                            if (casters[sss].slocs[xi] == "C") c += 1;
                            if (casters[sss].slocs[xi] == "P") p += 1;
                            if (casters[sss].slocs[xi] == "T") t += 1;
                            if (casters[sss].slocs[xi] == "L")
                            if (xi == 0) lck += 1;
                                else if (casters[sss].slocs[xi - 1] != "L")
                                    lck += 1;
                        }
                        catch (ex) {
                            console.log("Error is coming in printing");
                        }
                }
                var ts = ct - new Date(1970, 1, 1);
                var xss = "" + ts + "," + m + "," + p + "," + t + "," + s + "," + c;
                outputMy = outputMy + "\n" + xss;
                output.push(xss);
                
                var xss1 = "" + ts + "," + lck;
                output2My = output2My + "\n" + xss1;
                output2.push(xss1);
                xi += 1;
            }
            console.log(output);
            var xfilename = __dirname + filename.substring(0, 27)+'_x'+'.csv';
            var stopfilename = __dirname + filename.substring(0, 27) + '_stops' + '.csv';
            fs.writeFile(xfilename, outputMy);
            fs.writeFile(stopfilename, output2My);

            //Logic implimentation for the separate files Ends

            var fileStream = new fs.createReadStream(__dirname + filename);
            console.log(fileStream);
            console.log("It is done 2");
            var csvconverter = new Converter({ constructResult: true });
            console.log("It is done 3");
            
            //converts the file in to jason

            //end_parsed or record_parsed
            csvconverter.on("end_parsed", function (jsonObj) {
                console.log(jsonObj);
                console.log("in json funtion");
                var jsonfile = require('jsonfile');

                var file_json = __dirname + filename.substring(0, 28) + 'json';
                console.log('Harsh File');
                console.log(file_json);
                jsonfile.writeFile(file_json, jsonObj, function (err) { console.error(err); });
                
                MongoClient.connect(url_carttronics, function (err, db) {
                    if (err) {
                        console.log('Unable to connect to the mongoDB server. Error:', err);
                    } else {
                        console.log('Connection Done ', url_carttronics);
                        var mydocuments = fs.readFile(file_json, 'utf8', function (err, data) {
                            var collection = db.collection('carttronics');
                            console.log(collection);
                            collection.insert(JSON.parse(data), function (err, docs) { // Should succeed
                                collection.count(function (err, count) {
                                    console.log("done");
                                    db.close();
                                });
                            });
                        });
                    }
                });
            });
            fileStream.pipe(csvconverter);

            /***************************** Main Data Base all the data store in carttronics collection (End)  **********************************/
            


            /***************************** Graph ploat database in particular store wise (Start)  **********************************/

            var filename = '/' + req.file.path;
            var updatefilename = "./Updatecsvfile.csv";
            console.log(updatefilename.length);
                 
            fs.readFileSync(__dirname+filename).toString().split(' ').forEach(function (line) {
                fs.appendFileSync(updatefilename, line.toString());
            });
                var Converter = require("csvtojson").Converter;
                var fileStream = fs.createReadStream(__dirname+updatefilename.substring(1,19));
                var converter = new Converter({ constructResult: true });
                
                converter.on("end_parsed", function (jsonObj) {
                    
                    var jsonfile = require('jsonfile');
                    var file_json =__dirname+ "/uploads/"+updatefilename.substring(1,16 )+'json';
                    jsonfile.writeFile(file_json, jsonObj, function (err) { console.error(err); });
                    fs.unlink(__dirname+filename, function (err) {
                        if (err) {
                            return console.error(err);
                        }
                    console.log("File deleted successfully!");
                    });
                    fs.unlink(__dirname + updatefilename.substring(1,19), function (err) {
                       if (err) {
                           return console.error(err);
                       }
                    console.log("File deleted successfully updatecsv!");
                    });
                    
                    mongoose.connect('mongodb://localhost/carttronics');
                    var db = mongoose.connection;
                
                    db.on('error', console.error.bind(console, 'Connection error:'));

                    db.once('open', function (callback) {
                        console.log('Insert Data');
                        var gaussSchema = mongoose.Schema({
                           Date: Date,
                           Missing: String,
                           Shoppnig: String,
                           CheckedOut: String,
                           ParkingLot: String,
                           TrolleyBay: String
                        }); 
                       // Associate the schema with the Document model
                       Document = mongoose.model('document', gaussSchema);
                       //Had to do something similar, hope this helps.

                       // Get the data from test_data.json
                       var aDocs = JSON.parse(fs.readFileSync('uploads/Updatecsvfile_x.json'));

                       // Loop through and add the sample dataset to the database
                       for (var n = 0; n < aDocs.length; n++) {
                            var docToAdd = new Document(aDocs[n]);
                            docToAdd.save(function (err, docToAdd) {
                                if (err) return console.error(err);
                            });
                        }
                    });
                      
                });
                fileStream.pipe(converter);

                /***************************** Graph ploat database in particular store wise (End)  **********************************/ 


        });

    });
    
/* File uploaded end*/

/* For Dashbord start*/
//var dbName_contact='contactlist'
//var url_contactlist= 'mongodb://localhost:27017/'+dbName_contact

var mongojs = require('mongojs');
var db_c = mongojs('user', ['user']);

MongoClient.connect(url, function (err, db) {
    if (err) {
        console.log('Unable to connect to the mongoDB server. Error:', err);
    } 
    else 
    {
        console.log('Connection Done ', url);

        app.get('/user', function (req, res) {
            console.log("I received a get request");

            db_c.user.find(function (err, docs) {
                console.log(docs);
                res.json(docs);
            });
            
        });

        app.post('/user', function (req, res) {
            console.log(req.body);
            db_c.user.insert(req.body, function(err, doc) {
                res.json(doc);
            });
            
        });

        app.delete('/user/:id', function(req, res) {
            var id = req.params.id;
            console.log(id);
            db_c.user.remove({_id: mongojs.ObjectId(id)}, function(err, doc) {
                res.json(doc);
            })
        });

        app.get('/user/:id', function(req, res) {
            var id = req.params.id;
            console.log(id);
            db_c.user.findOne({_id: mongojs.ObjectId(id)}, function(err, doc) {
                res.json(doc);
            })
        });

        app.put('/user/:id', function(req, res) {
            var id = req.params.id;
            console.log(req.body.username);
            db_c.user.findAndModify({query: {_id: mongojs.ObjectId(id)}, 
                update: {$set: {username: req.body.username, email: req.body.email, password: req.body.password, desc: req.body.desc, roles: req.body.roles, f_name: req.body.f_name, l_name: req.body.l_name, m_name: req.body.m_name, address: req.body.address, phone: req.body.phone, s_address: req.body.s_address, city: req.body.city, s_o_pro: req.body.s_o_pro, zipcode: req.body.zipcode, country: req.body.country, b_phone: req.body.b_phone, b_f_phone: req.body.b_f_phone, fax: req.body.fax}},
                new: true}, function (err, doc) {
                    res.json(doc);
                });
        });
    }
});

/*Dashboard end*/


app.listen(3000);
console.log("server running on port 3000");