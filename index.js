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
  // console.log(user);
  done(null, user);
});
passport.deserializeUser((rows, done) => {
  // console.log(`deserialized user ${rows.user}`);
  done(null, rows);
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
app.get('/account/order', db.getUserOrders);
app.post('/account/order/', db.createNewOrder);
app.get('/account/order/:orderId', db.getOrder);
app.delete('/account/order/:orderId', db.deleteOrder);
app.put('/account/order/add/:orderId', db.addOrderProduct);
app.put('/account/order/edit/:orderId', db.editOrderQty);
app.put('/account/order/checkout/:orderId', db.checkoutOrder);


app.listen(port, () => {
    console.log(`E-Commerce app listening on port ${port}`)
});