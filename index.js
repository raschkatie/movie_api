// requiring all modules
const { resolveSoa } = require('dns');
const express = require('express'),
    morgan = require('morgan'),
    fs = require('fs'),
    path = require('path'),
    uuid = require('uuid'),
    mongoose = require('mongoose'),
    Models = require('./models.js');

// import models from models.js file
const Movies = Models.Movie;
const Users = Models.User;
const Genres = Models.Genre;
const Directors = Models.Director;
const app = express();

const cors = require('cors');
app.use(cors());

const { check, validationResult } = require('express-validator');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// import authentication js file (AFTER app.use for Express (& inherent bodyParser))
let auth = require('./auth')(app);

const passport = require('passport');
require('./passport');

// connect Mongoose with db to perform CRUD operations

// LOCAL
// mongoose.connect('mongodb://localhost:27017/test', { useNewUrlParser: true, useUnifiedTopology: true });

// ONLINE
mongoose.connect( process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// create write stream, then append to log.txt
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {flags: 'a'});

// invoke middleware function
app.use(morgan('combined', {stream: accessLogStream}));

// Use express.static to serve your “documentation.html” file from the public folder
app.use(express.static('public'));

// Create another GET route located at the endpoint “/”
app.get('/', (req, res) => {
    res.send('Welcome to MyFlix!');

});

// Return a list of ALL movies to the user
app.get('/movies', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Movies.find()
        .then((movies) => {
            res.status(201).json(movies);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

// Return data about a single movie by title to the user
app.get('/movies/:Title', passport.authenticate('jwt', { session: false }), async (req, res) => {
    Movies.findOne({ Title: req.params.Title })
        .then((movie) => {
            res.json(movie);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

// Return data about a genre by name/title
app.get('/movies/genre/:Name', passport.authenticate('jwt', { session: false }), async (req, res) => {
    Genres.findOne({ Name: req.params.Name })
        .then((genre) => {
            res.json(genre);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

// Return data about a director by name
app.get('/movies/director/:Name', passport.authenticate('jwt', { session: false }), async (req, res) => {
    Directors.findOne({ Name: req.params.Name })
        .then((director) => {
            res.json(director);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

// Allow new users to register
app.post('/users', async (req, res) => {
    
    // validate new user information for security
    [
        check('Username', 'Username is required').isLength({ min: 5 }),
        check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
        check('Password', 'Password is required').not().isEmpty(),
        check('Email', 'Email does not appear to be valid.').isEmail()
    ], async (req, res) => {

        // checking validation object for errors
        let errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }
    }
    
    let hashedPassword = Users.hashPassword(req.body.Password);
    await Users.findOne({ Username: req.body.Username })  // Mongoose command - seeing if username already exists
    .then((user) => {  // promise
        if (user) {
            return res.status(400).send(req.body.Username + ' already exists');
        } else {
            Users
                .create({
                    Username: req.body.Username,
                    Password: hashedPassword,
                    Email: req.body.Email,
                    Birthday: req.body.Birthday
                })
                .then((user) => {res.status(201).json(user) })  // callback funtion w/in promise
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error: ' + err);
            });
        }
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// GET all users
app.get('/users', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Users.find()
        .then((users) => {
            res.status(201).json(users);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

// GET a user by username
app.get('/users/:Username', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Users.findOne({ Username: req.params.Username })
        .then((user) => {
            res.json(user);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

// Allow users to update their user info
app.put('/users/:Username', passport.authenticate('jwt', { session: false }), async (req, res) => {
    // makes sure username matches the one in the request parameter
    if(req.user.Username !== req.params.Username){
        return res.status(400).send('Permission denied');
    }
    
    let hashedPassword = Users.hashPassword(req.body.Password);
    await Users.findOneAndUpdate({ Username: req.params.Username }, { $set:
        {
            Username: req.body.Username,
            Password: hashedPassword,
            Email: req.body.Email,
            Birthday: req.body.Birthday
        }
    },
    { new: true })  // ensures doc is returned
    .then((updatedUser) => {
        res.json(updatedUser);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// Allow users to add a movie to their list of favorites
app.post('/users/:Username/favorites/:MovieID', passport.authenticate('jwt', { session: false }), async (req, res) => {
    if(req.user.Username !== req.params.Username){
        return res.status(400).send('Permission denied');
    }
    
    await Users.findOneAndUpdate({ Username: req.params.Username }, {
        $push: { FavoriteMovies: req.params.MovieID }
    },
    { new: true })
    .then((updatedUser) => {
        res.json(updatedUser);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// Allow users to remove a movie from their list of favorites
app.delete('/users/:Username/favorites/:MovieID', passport.authenticate('jwt', { session: false }), async (req, res) => {
    if(req.user.Username !== req.params.Username){
        return res.status(400).send('Permission denied');
    }
    
    await Users.findOneAndUpdate({ Username: req.params.Username }, {
        $pull: { FavoriteMovies: req.params.MovieID }
    },
    { new: true })
    .then((updatedUser) => {
        res.json(updatedUser);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// Allow existing users to deregister
app.delete('/users/:Username', passport.authenticate('jwt', { session: false }), async (req, res) => {
    if(req.user.Username !== req.params.Username){
        return res.status(400).send('Permission denied');
    }

    await Users.findOneAndDelete({ Username: req.params.Username })
        .then((user) => {
            if (!user) {
                res.status(400).send(req.params.Username + ' was not found');
            } else {
                res.status(200).send(req.params.Username + ' was deleted.');
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

// Create an error-handling middleware function that will log all application-level errors to the terminal
// should always be defined last in middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// listens for a response on user's port or port 8080
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
    console.log('Listening on Port ' + port);
});