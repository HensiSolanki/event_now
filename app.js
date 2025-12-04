const mongoose = require('mongoose');
mongoose.set('strictQuery', false);
const dotenv = require('dotenv');
dotenv.config({ path: "./config.env" });
var app = require('express')();
var express = require('express');
var path = require('path');
var http = require('http').Server(app);
// import Router file
var pageRouter = require('./routes/routes');
var user = require("./models/UserModel");
var session = require('express-session');
var bodyParser = require('body-parser');
var flash = require('connect-flash');
var urlencodeParser = bodyParser.urlencoded({ extended: true });
app.use(urlencodeParser);
app.use(session({ resave: false, saveUninitialized: true, secret: 'nodedemo' }));
app.use(flash());
/* ---------for database connection---------- */
const DB = process.env.DATABASE_URL;
mongoose.connect(DB, {
    useNewUrlParser: true
}).then((con) => console.log("DB connection successfully..!"));

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

app.use('/public', express.static('public'));
app.set('layout', 'layout/layout');
var expressLayouts = require('express-ejs-layouts');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
// Define All Route 
pageRouter(app);

app.all('*', function (req, res) {
    res.locals = { title: '404 Page Not Found' };
    res.render('auth/error-404', { layout: "layout/layout-without-nav" });
});

http.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));