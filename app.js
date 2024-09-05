// app.js

// [LOAD PACKAGES]
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var session = require('express-session');
var fs = require('fs');
//var mongoose = require('mongoose');
//mongoose.Promise = global.Promise;
var crypto = require('crypto');
//var config = require('./myModules/config');

//var db = mongoose.connection;
//db.on('error', console.error);
//db.on('open', function() {
//    //console.log('Connected to mongod server');
//});
//mongoose.connect(config.dbUrl());

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

var allowCORS = function(req, res, next) {
  res.header('Acess-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  (req.method === 'OPTIONS') ?
    res.send(200) :
    next();
};
 
// 이 부분은 app.use(router) 전에 추가하도록 하자
app.use(allowCORS);
app.use(express.static('public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(session({
    secret : '@#@$MYSIGN#@$#$',
    resave:false,
    saveUninitialized:true
}));

// ------- Hash Key Generation for Password -------
var myHash = function myHash(key){
  var hash = crypto.createHash('sha1');
  hash.update(key);
  return hash.digest('hex');
;}

// ------- Create Session -------
var createSession = function createSession(){
  return function(req, res, next){
    if(!req.session.login){
      req.session.login = 'logout';
    }
    next();
  };
};

var port = process.env.PORT || 8080;

var router = require('./routes')(app, fs);

var server = app.listen(port, function() {
    console.log('express server running http://localhost:' + port);
});