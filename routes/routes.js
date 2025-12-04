const express = require('express');
const route = express.Router();
var bodyParser = require('body-parser');
var urlencodeParser = bodyParser.urlencoded({ extended: false });
// Contorller
const AuthController = require("../controllers/AuthController");

module.exports = function (route) {
    route.use((req, res, next) => {
        var uemail = req.session.useremail;
        const allowUrls = ["/login", "/auth-validate", "/register", "/signup", "/forgotpassword", "/sendforgotpasswordlink", "/resetpassword", "/error", "/changepassword"];
        if (allowUrls.indexOf(req.path) !== -1) {
            if (uemail != null && uemail != undefined) {
                return res.redirect('/');
            }

        } else if (!uemail) {
            return res.redirect('/login');
        }
        next();
    })


    route.get('/pages-400', (req, res, next) => {
        res.render('pages-400', { title: 'Error 400', layout: 'layout/layout-without-nav', dataCurrentPage:'pages-400' });
    })

    route.get('/pages-403', (req, res, next) => {
        res.render('pages-403', { title: 'Error 403', layout: 'layout/layout-without-nav', dataCurrentPage:'pages-403' });
    })
    route.get('/pages-404', (req, res, next) => {
        res.render('pages-404', { title: 'Error 404', layout: 'layout/layout-without-nav', dataCurrentPage:'pages-404' });
    })
    route.get('/pages-500', (req, res, next) => {
        res.render('pages-500', { title: 'Error 500', layout: 'layout/layout-without-nav', dataCurrentPage:'pages-500' });
    })
    route.get('/pages-503', (req, res, next) => {
        res.render('pages-503', { title: 'Error 503', layout: 'layout/layout-without-nav', dataCurrentPage:'pages-503' });
    })
    route.get('/pages-lock-screen', (req, res, next) => {
        res.render('pages-lock-screen', { title: 'Lock Screen', layout: 'layout/layout-without-nav', dataCurrentPage:'pages-lock-screen' });
    })
    route.get('/pages-login', (req, res, next) => {
        res.render('pages-login', { title: 'Login', layout: 'layout/layout-without-nav', dataCurrentPage:'pages-login' });
    })

    route.get('/pages-register', (req, res, next) => {
        res.render('pages-register', { title: 'Sign Up', layout: 'layout/layout-without-nav', dataCurrentPage:'pages-register'});
    })

    route.get('/pages-recoverpw', (req, res, next) => {
        res.render('pages-recoverpw', { title: 'Recover Password', layout: 'layout/layout-without-nav', dataCurrentPage:'pages-recoverpw' });
    })

    route.get('/', (req, res, next) => {
        res.render('index', { title: 'Dashboard', dataCurrentPage: 'index' });
    })
    route.get('/index', (req, res, next) => {
        res.render('index', { title: 'Dashboard', dataCurrentPage:'index' });
    })
    route.get('/apexcharts', (req, res, next) => {
        res.render('apexcharts', { title: 'Apex Charts', dataCurrentPage:'apexcharts' });
    })
    route.get('/echarts', (req, res, next) => {
        res.render('echarts', { title: 'E-Charts', dataCurrentPage:'echats' });
    })
    route.get('/form-elements', (req, res, next) => {
        res.render('form-elements', { title: 'Form Elements', dataCurrentPage:'form-elements' });
    })
    route.get('/form-mask', (req, res, next) => {
        res.render('form-mask', { title: 'Form Mask', dataCurrentPage:'form-mask' });
    })
    route.get('/form-xeditable', (req, res, next) => {
        res.render('form-xeditable', { title: 'Form Xeditable', dataCurrentPage:'form-xeditable' });
    })
    route.get('/icons-dripicons', (req, res, next) => {
        res.render('icons-dripicons', { title: 'Dripicons Icons', dataCurrentPage:'icons-dripicons' });
    })
    route.get('/icons-feather', (req, res, next) => {
        res.render('icons-feather', { title: 'Feather Icons', dataCurrentPage:'icons-feather' });
    })
    route.get('/icons-fontawesome', (req, res, next) => {
        res.render('icons-fontawesome', { title: 'Font Awesome Icons', dataCurrentPage:'icons-fontawesome' });
    })
    route.get('/icons-ion', (req, res, next) => {
        res.render('icons-ion', { title: 'Ion Icons', dataCurrentPage:'icons-ion' });
    })
    route.get('/icons-material', (req, res, next) => {
        res.render('icons-material', { title: 'Material Icons', dataCurrentPage:'icons-material' });
    })
    route.get('/icons-themify', (req, res, next) => {
        res.render('icons-themify', { title: 'Themify Icons', dataCurrentPage:'icons-themify' });
    })
    route.get('/icons-typicons', (req, res, next) => {
        res.render('icons-typicons', { title: 'Typicons Icons', dataCurrentPage:'icons-typicons' });
    })
    route.get('/layout-blank', (req, res, next) => {
        res.render('layout-blank', { title: 'Blank Page', dataCurrentPage:'layout-blank' });
    })
    route.get('/maps', (req, res, next) => {
        res.render('maps', { title: 'Map', dataCurrentPage:'maps' });
    })
    route.get('/tables-basic', (req, res, next) => {
        res.render('tables-basic', { title: 'Basic Tables', dataCurrentPage:'tables-basic' });
    })
    route.get('/tables-footable', (req, res, next) => {
        res.render('tables-footable', { title: 'Footable Tables', dataCurrentPage:'tables-footable' });
    })
    route.get('/tables-responsive', (req, res, next) => {
        res.render('tables-responsive', { title: 'Responsive Tables', dataCurrentPage:'tables-responsive' });
    })
    route.get('/ui-alerts', (req, res, next) => {
        res.render('ui-alerts', { title: 'Alerts', dataCurrentPage:'ui-alerts' });
    })
    route.get('/ui-buttons', (req, res, next) => {
        res.render('ui-buttons', { title: 'Buttons', dataCurrentPage:'ui-buttons' });
    })
    route.get('/ui-cards', (req, res, next) => {
        res.render('ui-cards', { title: 'Cards', dataCurrentPage:'ui-cards' });
    })
    route.get('/ui-grid', (req, res, next) => {
        res.render('ui-grid', { title: 'Grid', dataCurrentPage:'ui-grid' });
    })
    route.get('/ui-progressbars', (req, res, next) => {
        res.render('ui-progressbars', { title: 'Progressbars', dataCurrentPage:'ui-progressbars' });
    })
    route.get('/ui-tabs-accordions', (req, res, next) => {
        res.render('ui-tabs-accordions', { title: 'Tabs Accordions', dataCurrentPage:'ui-tabs' });
    })
    route.get('/ui-typography', (req, res, next) => {
        res.render('ui-typography', { title: 'Typography', dataCurrentPage:'ui-typography' });
    })

    // layouts Page
    route.get('/layout-fixed-sidebar-header', (req, res, next) => {
        res.render('layout-fixed-sidebar-header', { layout: 'layout/layout-fixed-sidebar-header', title: 'Fixed Sidebar Header', dataCurrentPage:'layout-fixed-sidebar-header'});
    })
    route.get('/layout-boxed', (req, res, next) => {
        res.render('layout-boxed', { layout: 'layout/layout-boxed', title: 'Boxed Layout', dataCurrentPage:'layout-boxed'});
    })
    route.get('/layout-collapsed-sidebar', (req, res, next) => {
        res.render('layout-collapsed-sidebar', { layout: 'layout/layout-collapsed-sidebar', title: 'Collapsed Sidebar', dataCurrentPage:'layout-collapsed-sidebar'});
    })
    route.get('/layout-fixed-header', (req, res, next) => {
        res.render('layout-fixed-header', { layout: 'layout/layout-fixed-header', title: 'Fixed Header', dataCurrentPage:'layout-fixed-header'});
    })
    route.get('/layout-fixed-sidebar', (req, res, next) => {
        res.render('layout-fixed-sidebar', { layout: 'layout/layout-fixed-sidebar', title: 'Fixed Sidebar', dataCurrentPage:'layout-fixed-sidebar'});
    })

    // Auth
    route.get('/login', (req, res, next) => {
        res.render('auth/login', { title: 'Login', layout: 'layout/layout-without-nav', 'message': req.flash('message'), error: req.flash('error') })
    })

    // validate login form
    route.post("/auth-validate", AuthController.validate)

    // logout
    route.get("/logout", AuthController.logout);

    route.get('/register', (req, res, next) => {
        res.render('auth/register', { title: 'Register', layout: 'layout/layout-without-nav', 'message': req.flash('message'), 'error': req.flash('error') })
    })

    // validate register form
    route.post("/signup", AuthController.signup)


    route.get('/forgotpassword', (req, res, next) => {
        res.render('auth/forgotpassword', { title: 'Forgot password', layout: 'layout/layout-without-nav', message: req.flash('message'), error: req.flash('error') })
    })

    // send forgot password link on user email
    route.post("/sendforgotpasswordlink", AuthController.forgotpassword)

    // reset password
    route.get("/resetpassword", AuthController.resetpswdview);
    // Change password
    route.post("/changepassword", AuthController.changepassword);

    //500
    route.get('/error', (req, res, next) => {
        res.render('auth/auth-500', { title: '500 Error', layout: 'layout/layout-without-nav' });
    })
}
