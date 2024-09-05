// models/book.js

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    userid : String,
    username : String,
    password : String,
    published_date : { type : Date, default : Date.now }
});

module.exports = mongoose.model('user', userSchema);