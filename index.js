const express = require("express")
const bodyParser = require("body-parser")
const https = require("https")
const Customer = require("./models/Customer");
const mongoose = require("mongoose")
const validator = require("validator")
const bcrypt = require('bcrypt');
const passport = require('passport')
const passportlocalmongoose = require('passport-local-mongoose')
const session = require('express-session')
var hashPassword;

const LocalStrategy = require('passport-local').Strategy;
var GitHubStrategy = require('passport-github').Strategy;
var GoogleStrategy = require('passport-google-oauth2').Strategy;
paypal = require('paypal-rest-sdk');

paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': CLIENT_ID,
    'client_secret': CLIENT_SECRET
});


const app = express()
var urlencodedParser = bodyParser.urlencoded({ extended: false })
app.use(express.static("public"))

app.use(session({
    cookie: { maxAge: 120000 },
    resave: false,
    saveUninitialized: false,
    secret: 'iServiceSECRET'
}))
app.use(passport.initialize())
app.use(passport.session());
//app.use(passport.authenticate('remember-me'));


mongoose.set('useCreateIndex', true)
mongoose.connect("mongodb://localhost:27017/iServerDB", { useNewUrlParser: true, useUnifiedTopology: true })
passport.use('local', Customer.createStrategy());


passport.use('google', new GoogleStrategy({
    clientID: CLIENT_ID,
    clientSecret: CLIENT_S,
    //callbackURL: "http://localhost:8080/payment",
    callbackURL: "https://salty-plateau-53914.herokuapp.com/payment",
    passReqToCallback: true
},
    function (request, accessToken, refreshToken, profile, done) {
        return done(null, profile);
    }));

passport.use('github', new GitHubStrategy({
    clientID: C_ID,
    clientSecret: C_S,
    //callbackURL: ' http://localhost:8080/payment'
    callbackURL: "https://salty-plateau-53914.herokuapp.com/payment"
},
    function (accessToken, refreshToken, profile, cb) {
        Customer.findOrCreate({ githubId: profile.id },
            function (err, customer) {
                return cb(err, user);
            });
    }
));

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/public/HTML/index.html")
})
app.get('/login', (req, res) => {
    res.sendFile(__dirname + "/public/HTML/login.html")
})
app.get('/forgot', (req, res) => {
    res.sendFile(__dirname + "/public/HTML/reset.html")
})
app.get('/payment', (req, res) => {
    res.sendFile(__dirname + "/public/HTML/payment.html")
})
app.get('/reset', (req, res) => {
    res.sendFile(__dirname + "/public/HTML/changepass.html")
})
app.get('/sucess', (req, res) => {
    res.sendFile(__dirname + "/public/HTML/success.html")
})
app.get('/github',
    passport.authenticate('github'));

app.get('/github/callback',
    passport.authenticate('github', {
        failureRedirect: '/'
    }),
    function (req, res) {
        res.redirect('/payment');
    });
app.get('/google',
    passport.authenticate('google', {
        scope:
            ['email', 'profile']
    }
    ));
app.get('/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/',
    }),
    function (req, res) {
        res.redirect('/payment')
    });
app.get('/payment/paypal',
    passport.authenticate('paypal'));
app.get('/payment/paypal/callback',
    passport.authenticate('paypal', {
        failureRedirect: '/payment'
    }),
    function (req, res) {
        res.redirect('/success');
    }
);
app.post('/', urlencodedParser, function (req, res) {
    country = req.body.country,
        firstname = req.body.first_name,
        lastname = req.body.last_name,
        email = req.body.email,
        password = req.body.password,
        confirm_password = req.body.confirm_password,
        mobile_number = req.body.mobile_phone_number

    const data = {
        members: [{
            email_address: email,
            status: "subscribed",
            merge_fields: {
                FNAME: firstname,
                LNAME: lastname
            }
        }]

    }
    jsonData = JSON.stringify(data)
    const url = "https://us5.api.mailchimp.com/3.0/lists/f2f7f73ff7";

    const options = {
        method: "POST",
        auth: "email:2c657ef5ec13e4988cb1571de77e4780-us5"
    }

    const request = https.request(url, options, (response) => {
        response.on("data", (data) => {
            console.log(JSON.parse(data))
        })
    })
    request.write(jsonData)
    request.end()
    console.log(firstname, lastname, email);

    if (password == confirm_password) {
        if (password.length >= 8) {
            hashPassword = hashpass(req.body.password);
            const customer = new Customer({
                country: country,
                fname: firstname,
                lname: lastname,
                email: email,
                password: hashPassword,
                confirmpass: hashPassword,
                mobile_number: mobile_number
            })
            customer.save((err) => {
                if (err) {
                    console.log(err);
                }
                else {
                    if (res.statusCode === 200) {
                        //res.sendFile(__dirname + "/login.html")
                        res.redirect('/login');
                    }
                    else {
                        res.sendFile(__dirname + "/404.html")
                    }

                }
            });
        } else {
            res.sendFile(__dirname + "/error1.html")
        }
    } else {
        res.sendFile(__dirname + "/error2.html")
    }
})


/*app.post('/login',
    passport.authenticate('local', {
        failureRedirect: './public/HTML/error2'
    }),
    function (req, res) {
        if (typeof req.body.rememberMe !== 'undefined') { // save credentials
            let date = new Date();
            date.setDate(date.getDate() + 7); // add a week, ie save credentials for a week
            req.session.cookie.maxAge = date; // set new expiry
        }
        res.redirect('/payment');
    });*/
app.post('/login', urlencodedParser, function (req, res) {

    var db = mongoose.createConnection('mongodb://localhost:27017/iServerDB', { useNewUrlParser: true, useUnifiedTopology: true });
    get_email = req.body.email;
    get_password = req.body.password;

    Customer.findOne({ "email": get_email }, (err, user) => {
        if (user == null) {
            res.send('Incorrect Email or Password!')
        }
        else {
            bcrypt.compare(get_password, user.password, function (err, result) {

                if (result == true) {
                    res.redirect('/payment');
                }
                else {
                    res.send('Incorrect Email or Password!')
                }
            })
        }
    })

    //mongoose.connection.close();
})
/*app.post('/login',
    passport.authenticate('local', { failureRedirect: '/login' }),
    function (req, res) {
        if (typeof req.body.rememberme != 'undefined') {
            req.session.cookie.maxAge = 120000;
        }
        res.redirect('/payment');    
    }
);*/
app.post('/paypal', (req, res) => {
    const create_payment_json = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            //"return_url": "http://localhost:8080/sucess",
            //"cancel_url": "http://localhost:8080/payment"
            "return_url": "https://salty-plateau-53914.herokuapp.com/sucess",
            "cancel_url": "https://salty-plateau-53914.herokuapp.com/payment"
        },
        "transactions": [{
            "item_list": {
                "items": [{
                    "name": "Red Sox Hat",
                    "sku": "001",
                    "price": "25.00",
                    "currency": "AUD",
                    "quantity": 1
                }]
            },
            "amount": {
                "currency": "AUD",
                "total": "25.00"
            },
            "description": "Hat for the best team ever"
        }]
    };
    paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
            throw error;
        } else {
            for (let i = 0; i < payment.links.length; i++) {
                if (payment.links[i].rel === 'approval_url') {
                    res.redirect(payment.links[i].href);
                }
            }
        }
    });

});
app.get('/success', (req, res) => {
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;

    const execute_payment_json = {
        "payer_id": payerId,
        "transactions": [{
            "amount": {
                "currency": "AUD",
                "total": "25.00"
            }
        }]
    };

    paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
        if (error) {
            console.log(error.response);
            throw error;
        } else {
            console.log(JSON.stringify(payment));
            res.send('Success');
        }
    });
});
app.get('/cancel', (req, res) => res.send('Cancelled'));

function hashpass(password) {

    const saltRounds = 10;
    // Random salt/
    const salt = bcrypt.genSaltSync(saltRounds);

    //Get hash value
    var hash = bcrypt.hashSync(password, salt);

    return hash;
}

let port = process.env.PORT;
if (port == null || port == "") {
    port = 8080;
}
app.listen(port, (req, res) => {
    console.log("Server is running successfullly!")
})
