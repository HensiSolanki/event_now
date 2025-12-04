const sequelize = require('./config/database');
const dotenv = require('dotenv');
dotenv.config({ path: "./config.env" });
var app = require('express')();
var express = require('express');
var path = require('path');
var http = require('http').Server(app);
// import Router file
var pageRouter = require('./routes/routes');
var apiAuthRouter = require('./routes/authRoutes');
var user = require("./models/UserModel");
var session = require('express-session');
var bodyParser = require('body-parser');
var flash = require('connect-flash');
var urlencodeParser = bodyParser.urlencoded({ extended: true });
app.use(urlencodeParser);
app.use(express.json()); // Add JSON parser for API routes
app.use(session({ resave: false, saveUninitialized: true, secret: 'nodedemo' }));
app.use(flash());

/* ---------for database connection---------- */
sequelize.authenticate()
    .then(() => {
        console.log("DB connection successfully..!");
        // Sync all models with database
        return sequelize.sync({ alter: false });
    })
    .then(() => {
        console.log("Database synced successfully!");
    })
    .catch((err) => {
        console.error("Unable to connect to the database:", err);
    });

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

app.use('/public', express.static('public'));
app.set('layout', 'layout/layout');
var expressLayouts = require('express-ejs-layouts');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);

// Define API Routes (before page routes)
app.use('/api/auth', apiAuthRouter);

// Define All Page Routes 
pageRouter(app);

app.all('*', function (req, res) {
    res.locals = { title: '404 Page Not Found' };
    res.render('auth/error-404', { layout: "layout/layout-without-nav" });
});

http.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
