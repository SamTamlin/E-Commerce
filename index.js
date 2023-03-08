const express = require('express');
const app = express();
const db = require('./db/index.js');
require('dotenv').config();
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

const port = process.env.PORT

// Initialize Packages
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: false,
      maxAge: 24 * 60 * 60 * 1000
    }
  })
);
app.use(passport.initialize());
app.use(passport.session()); // Allows persistent logins

// Passport local strategy
passport.use(new LocalStrategy(
  function verify(username, password, cb) {
    db.getUsernamePassword(username, password, cb)}
));

// Stores username
passport.serializeUser((user, done) => {
  // console.log(`serailized user ${user.rows[0].username}`);
  done(null, user.rows[0].username);
});
passport.deserializeUser((username, done) => {
  // console.log(`deserialized user ${username}`);
  done(null, username);
});


// ROUTES
// user routes
app.post('/account/register', db.createUser);

app.post(
  '/account/login', 
  passport.authenticate('local', {
    successRedirect: '/account/',
    failureRedirect: '/account/login'
  })
);

app.post('/account/logout', (req, res, next) => {
    req.logout((err) => {
      if(err) {return next(err)}
      res.redirect('/account/login');
    });
    
  }
);

app.get('/account', db.getUser);
app.put('/account', db.updateUser);
app.delete('/account', db.deleteUser);

// product routes
app.get('/product', db.getProducts);
app.post('/product', db.createProduct);
app.get('/product/:id', db.getProduct);
app.put('/product/:id', db.updateProduct);
app.delete('/product/:id', db.deleteProduct);

// order routes
app.get('/account/order/:username');
app.post('/account/order/:username');
app.get('/account/order/:username/:orderId');
app.put('/account/order/:username/:orderId');
app.delete('/account/order/:username/:orderId');



app.listen(port, () => {
    console.log(`E-Commerce app listening on port ${port}`)
});