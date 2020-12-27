require('dotenv').config({ path: './sendgrid.env' });
const express = require("express");
const bcrypt = require ("bcrypt") ;
const router = express.Router();
const jwt = require('jsonwebtoken');
const keys = require('../../config/keys');
const passport = require ('passport');
const async = require('async');
const otpGenerator = require('otp-generator');
const sgMail = require('@sendgrid/mail');


//Load input validation
const validateRegisterInput = require ('../../validation/register');
const validateLoginInput = require ('../../validation/login');

// Load user model
const User = require("../../models/User");

// @router GET request to api/users/test
// @discription  Tests users route
// @access to this route is Public
router.get('/test', (req, res) => res.json({msg: `User Works`}));

// @router POST request to api/users/register
// @discription  Registers a user
// @access to this route is Public
router.post('/register', (req, res) => {
    const { errors, isValid } = validateRegisterInput(req.body);

    // Check Validation
    if (!isValid){
        return res.status(400).json(errors);
    }

    User.findOne({ email: req.body.email}).then(user => {
            if (user) {
                errors.email = 'Email already exists';
                return res.status(400).json(errors);
            } else {
                const newUser = new User({
                    fullname: req.body.fullname,
                    username: req.body.username.toLowerCase(),
                    email: req.body.email.toLowerCase(),
                    phoneNumber: req.body.phoneNumber,
                    country: req.body.country,
                    state: req.body.state,
                    password: req.body.password
                });
                // bcrypt to encrypt the password
                bcrypt.genSalt(10, (err, salt) => {
                    // next line gets the password text from the newUser above and encrypts  it
                    bcrypt.hash(newUser.password, salt, (err, hash) => {
                        // the hash will be stored in the  database
                        if(err) throw err;
                        newUser.password = hash;
                        newUser.save()
                        .then(user => res.json(user))
                        .catch(err => console.log(err));
                    });
                });
            }
        });
});

// @router POST request to api/users/login
// @discription  Login user / Returning JWT Token
// @access to this route is Public
router.post('/login',(req, res) => {

    const {errors, isValid} = validateLoginInput(req.body);

    //Check Validation
    if (!isValid) {
        return res.status(400).json(errors);
    }

    const email = req.body.email.toLowerCase();
    const password = req.body.password;

    // Find user by email
    User.findOne({email}).then(user => {
        // Check for user
        if(!user){
            errors.email = "User not found";
            return res.status(404).json(errors);
        }

        // Check Password
        bcrypt.compare(password, user.password).then(isMatch => {
            if(isMatch) {
                // User Matched
                const payload = { id: user.id, name: user.fullname }; // create jwt payload

                //Sign Token
                jwt.sign(payload, keys.secretOrKey, {expiresIn: 3600 }, (err, token) => {
                    res.json({
                        success: true,
                        token: 'Bearer '+ token
                    });
                });
            } else {
                errors.password = 'Password incorrect';
                return res.status(400).json(errors);
            }
        });
    });
});


// @router POST request to api/users/forgot
// @discription Post tries to help user change thier password from an email link
// @access to this route is PUBLIC
router.post('/forgot', (req, res)=>{
    var error = "";
    async.waterfall(
      [
        function(done) {
          token = otpGenerator.generate(6, { upperCase: false, specialChars: false });
          // done(token);
          User.findOne({ email: req.body.email.toLowerCase() }, function(err, user) {
            if (!user) {
              error = "Email not found";
              return res.status(404).json(error);
            }

            user.resetPasswordToken = token;
            user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    
            user.save(function(err) {
              done(err, token, user);
            });
          });
        },

        function(token, done){
          console.log(done)
          sgMail.setApiKey(process.env.SENDGRID_API_KEY);
          const msg = {
          to: `${req.body.email}`,
          from: 'Email Title <YOUR EMAIL>', // Use your sendgrid verified sender email address or domain
          subject: 'Password reset',
          html: `<strong>your otp is ${token} </strong>`,
          };
          sgMail
          .send(msg)
          .then((response) => {
            res.json(res.statusCode)
          }, error => {
              console.error(error);

              if (error.response) {
              console.error(error.response.body)
              }
              });
        }
        
      ], function(err) {
        if (err) return  res.json(err);
       
      });
})


// @router POST request to api/users/forgot
// @discription Post tries to help user change thier password from an email link
// @access to this route is PUBLIC
router.post('/reset', function(req, res) {
    async.waterfall([
      function(done) {
        User.findOne({ resetPasswordToken: req.body.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
          if (!user) {
            return res.status(404).json('Password reset token is invalid or has expired.');
          }

          user.password = req.body.password;
          user.resetPasswordToken = undefined;
          user.resetPasswordExpires = undefined;

          // bcrypt to encrypt the password
          bcrypt.genSalt(10, (err, salt) => {
            // next line get the new password text from the user and encrypts  it
            bcrypt.hash(user.password, salt, (err, hash) => {
                // the hash will be stored in the  database
                if(err) throw err;
                user.password = hash;
                user.save(function(err) {
                  done(err, user);
                })
            });
        });
      });
    },
      
    function(user){
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      const msg = {
      to: `${user.email}`,
      from: 'Email Title <YOUR EMAIL>', // Use your sendgrid verified sender email address or domain
      subject: 'Password change',
      html: `<strong> Hi, Your password have been changed successfully </strong>`,
      };
      sgMail
      .send(msg)
      .then((response) => {
        res.json(res.statusCode)
      }, error => {
          console.error(error);

          if (error.response) {
          console.error(error.response.body)
          }
          });

    }
    ], function(err) {
      console.log(err)
    });
  });




// @router GET request to api/users/current
// @discription  Return current user
// @access to this route is PRIVATE
router.get('/current', passport.authenticate('jwt', {session: false}), (req, res) => {
    res.json({
        id:req.user.id,
        email: req.user.email,
        name: req.user.fullname,
    });
});

module.exports = router;