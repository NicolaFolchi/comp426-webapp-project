let fs = require("fs");
let binData = fs.readFileSync("data.json");
let db = JSON.parse(binData);

let express = require("express");
// used to parse the request body
let bodyParser = require("body-parser");
// used for the creation of unique id's for tuiter posts
const shortid = require('shortid');
const bcrypt = require('bcryptjs');
// used for the management of user sessions throughout the app
const session = require('express-session');
// importing the user schema for mongoDB
const User = require('./models/user').User;
const router_app = require('./routes_app');
const session_middleware = require('./middlewares/session');


let app = express();

// this allows me to have express look into a folder 'public' and retrieve static files (html, imgs)
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.use(session({
    // need to generate a new secret for each session -- PENDING
    secret: 'swofhigryaefqwn',
    resave: false,
    saveUninitialized: false
}));

// sending all of our posts data
app.get('/tuits', function (request, response) {
    console.log(request.session.user_id);
    response.send(db);
});
// sending all data from a specific post
app.get('/tuits/:tuit', function (request, response) {
    let tuitID = request.params.tuit;
    for (let i = 0; i < db.length; i++) {
        if (db[i]['id'] == tuitID) {
            response.send(db[i]);
            break;
        }
    }
})
// making a post to the feed
app.post('/tuits', function (request, response) {
    let reply = {
        status: 'success',
        tuitData: request.body
    };

    // adding needed properties to my tuits
    request.body['id'] = shortid.generate();
    request.body['authorUsername'] = request.session.user_username;
    request.body['authorFirstName'] = request.session.user_firstName;
    request.body['authorLastName'] = request.session.user_lastName;
    request.body['createdAt'] = (new Date());

    // adding as first element to json file
    db.unshift(request.body);
    let data = JSON.stringify(db, null, 2);
    fs.writeFile("data.json", data, function (err, result) {
        if (err) console.log('error', err);
    });

    response.send(reply);
});
// signing up process
app.post("/users", async function (request, response) {
    // finding if username or email already exist on user database
    User.find({ $or: [{ username: request.body.username }, { emailAddress: request.body.email }] }, async function (err, userd) {
        if (!userd.length) {
            try {
                let username = request.body.username;
                let password = await bcrypt.hash(request.body.password, 10);
                let fName = request.body.fName;
                let lName = request.body.lName;
                let email = request.body.email;
                let userData = {
                    username: username,
                    password: password,
                    firstName: fName,
                    lastName: lName,
                    emailAddress: email
                };

                // creating user on mongodb
                let user = new User(userData);
                user.save(function (err, user, ) {
                    if (err) {
                        console.log(String(err));
                        response.status(400).send(String(err));
                    } else {
                        console.log('todo bien');
                        // created
                        response.status(201).send();
                    }
                })
            } catch {
                // server issue :/
                response.status(500).send();
            }
        } else {
            console.log(userd);
            response.status(400).send("Username/Email are being used  :/");
        }
    })
});

// login process and user authorization
app.post('/login', function (request, response) {
    // searching for a user on our db that matches the input
    User.find({ username: request.body.username }, async function (err, userd) {
        if (!userd.length) {
            return response.status(404).send('User not found');
        }
        try {
            if (await bcrypt.compare(request.body.password, userd[0].password)) {
                request.session.user_id = userd[0]._id;
                request.session.user_username = userd[0].username;
                request.session.user_firstName = userd[0].firstName;
                request.session.user_lastName = userd[0].lastName;
                request.session.user_password = userd[0].password;
                request.session.user_obj = userd[0];
                console.log('session key: ' + request.session.user_id);
                return response.redirect('/')
            } else {
                response.status(400).send('Failed to log in, password incorrect');
            }
        } catch {
            response.status(500).send("something weird happened  :s");
        }
    })
});

// updating post user information of a specific post
app.put('/tuits/:postid', function (request, response) {
    let tuitID = request.params.postid;
    for (let i = 0; i < db.length; i++) {
        if (db[i]['id'] == tuitID) {
            let previousEntry = db[i];
            previousEntry['review'] = request.body['review'];
            previousEntry['rating'] = request.body['rating'];

            let data = JSON.stringify(db, null, 2);
            fs.writeFile("data.json", data, function (err, result) {
                if (err) console.log('error', err);
            });
            response.status(200).send();
            break;
        }
    }
});

//updating user passord data on DB
app.post('/changePassword', async function (request, response) {
    try {
        let newEncryptedPassword = await bcrypt.hash(request.body.newPassword, 10);
        User.find({ username: request.body.username }, async function (err, userd) {

            if (await bcrypt.compare(request.body.previousPassword, userd[0].password)) {

                User.findOneAndUpdate({ username: request.body.username }, { $set: { password: newEncryptedPassword } }, { useFindAndModify: false }, function (err, doc) {
                    if (err) return res.send(500, { error: err });
                    return response.send('Succesfully saved.');
                });
            } else {
                return response.status(400).send('Previous password is incorrect')
            }
        });
    } catch (e) {
        console.log(String(e));
    }

})
// sending logged in user info to front-end
app.get('/getLoggedInUser', function (request, response) {
    response.send(request.session.user_obj);
});
// deleting a user from our app
app.delete('/users', function (request, response) {
    // redirecting to home
    response.sendFile(__dirname + '/public/index.html'); // not working on app
    // deleting the user on the db
    User.findByIdAndRemove({ _id: request.session.user_id }, function (err) {
        if (err) {
            console.log(err);
            return response.status(500).send();
        }
        return response.status(200).send()
    });
    // killing the cookie session
    request.session.destroy(function (err) {
        if (err) {
            console.log(err);
            return response.status(500).send()
        }
        return response.status(200).send();
    });
});

// delete a post
app.delete('/tuits/:postid', function (request, response) {
    let tuitID = request.params.postid;
    for (let i = 0; i < db.length; i++) {
        if (db[i]['id'] == tuitID) {
            db.splice(0, 1);
            let data = JSON.stringify(db, null, 2);
            fs.writeFile("data.json", data, function (err, result) {
                if (err) console.log('error', err);
            });
            response.status(200).send();
            break;
        }
    }
});

app.post('/logout', function (request, response) {
    response.sendFile(__dirname + '/public/index.html'); // not working on app
    // killing the cookie session
    request.session.destroy(function (err) {
        if (err) {
            console.log(err);
            return response.status(500).send()
        }
        return response.status(200).send();
    });
})
// ------------------ SPOTIFY API INTEGRATION ---------------------------

const request = require('request');
const client_id = 'af2ce6ca8d05496ebde76dff70598354';
const client_secret = 'f0e685f8afc441d6954d0321d73698e3';

// your application requests authorization
let authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
    },
    form: {
        grant_type: 'client_credentials'
    },
    json: true
};

app.get('/getToken', function (req, res) {
    request.post(authOptions, function (error, response, body) {
        if (!error && response.statusCode === 200) {

            // use the access token to access the Spotify Web API
            let token = body.access_token;
            res.send(token);
        }
    });
});

app.use('/app', session_middleware);
app.use('/app', router_app);

let server = app.listen(3000, () => {
    console.log('we out heree');
});