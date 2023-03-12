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
      // Session times out after one day
      maxAge: 24 * 60 * 60 * 1000 
    }
  })
);
app.use(passport.initialize());
app.use(passport.session()); // Allows persistent logins

// Local Strategy
passport.use(new LocalStrategy(
  function verify(username, password, cb) {
    db.getUsernamePassword(username, password, cb)}
));

// Store encrypted username and id
passport.serializeUser((user, done) => {
  done(null, user);
});
// Retreive encryped username and id
passport.deserializeUser((rows, done) => {
  done(null, rows);
});


// ROUTES
// ACCOUNT ROUTE
app.post('/account/register', db.createUser);

// login using Local Strategy
app.post('/account/login', 
  passport.authenticate(
    'local', 
    {failureMessage: true}),
    (req, res) => {
      res.redirect('/account');
    }
);

app.post('/account/logout', (req, res, next) => {
    req.logout((err) => {
      if(err) {return next(err)}
      res.redirect('/account');
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
app.get('/account/order/:orderId', db.getOrder);

// basket routes
app.get('/account/basket', db.getUserBaskets);
app.post('/account/basket', db.createNewBasket);
app.get('/account/basket/:basketId', db.getBasket);
app.delete('/account/basket/:basketId', db.deleteBasket);
app.put('/account/basket/add/:basketId', db.addProductToBasket);
app.put('/account/basket/edit/:basketId', db.editProductQty);
app.delete('/account/basket/delete/:basketId', db.deleteProductFromBasket);

app.put('/account/basket/checkout/:basketId', db.checkout);


app.listen(port, () => {
    console.log(`E-Commerce app listening on port ${port}`)
});
