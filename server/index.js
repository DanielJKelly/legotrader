const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const db = require('../database/index');
const app = express();

app.use(express.static(__dirname + '/../client/dist'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

passport.use(new FacebookStrategy(
  {
    clientID: '186862941903694',
    clientSecret: '55c5480cff3e9446d6240fb029445140',
    callbackURL: 'http://localhost:8080/auth/facebook/callback',
    profileFields: ['id', 'displayName', 'email', 'name']
  }, (accessToken, refreshToken, profile, done) => {
    console.log('accessToken: ', accessToken);
    console.log('refreshToken: ', refreshToken);
    console.log('profile: ', profile);
    console.log('done: ', done);

    db.User.findOneAndUpdate(
      { fbId: { $eq: done.id } },
      {
        userName: `${ profile.name.givenName } ${ profile.name.familyName }`,
        email: profile.emails[0].value,
        fbId: profile.id,
        fbAccessToken: accessToken
      },
      {
        upsert: true,
        new: true,
        runValidators: true
      }, (err, user) => {
        if (err) {
          throw err;
        } else {
          res.json(user);
        }
      });
  }));

app.get('/auth/facebook', passport.authenticate('facebook', {
  scope: ['email', 'public_profile']
}));

app.get('/auth/facebook/callback', passport.authenticate('facebook',
  {
    successRedirect: '/',
    failureRedirect: '/new-listing'
  }));

app.get('/listings', (req, res) => {

  let queryTerm = req.query;
  db.findQuery(queryTerm, function(err, data) {
    if (err) {
      res.sendStatus(500);
    } else {
      res.json(data);
    }
  });

});

app.post('/listing', (req, res) => {
  db.saveListing(req.body, function(err, data) {
    if (err) {
      res.sendStatus(500);
    } else {
      res.sendStatus(200);
    }
  });
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`App listening on port ${ port }`);
});
