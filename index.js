/**
 * User-related API endpoints for the myFlix app.
 * 
 * This file defines the routes that handle user operations.
 * Each route interacts with the database after JWT authentication.
 * 
 * @module routes/users
 */

const { resolveSoa } = require('dns');
const express = require('express'),
    morgan = require('morgan'),
    fs = require('fs'),
    path = require('path'),
    uuid = require('uuid'),
    mongoose = require('mongoose'),
    Models = require('./models.js');

const Movies = Models.Movie;
const Users = Models.User;
const app = express();

const cors = require('cors');
app.use(cors());

const { check, validationResult } = require('express-validator');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let auth = require('./auth')(app);

const passport = require('passport');
require('./passport');

// LOCAL
// mongoose.connect('mongodb://localhost:27017/test', { useNewUrlParser: true, useUnifiedTopology: true });

// ONLINE
mongoose.connect( process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {flags: 'a'});

app.use(morgan('combined', {stream: accessLogStream}));

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.send('Welcome to MyFlix!');

});

/**
 * Returns a list of all movies to user.
 * Uses the GET method.
 * 
 * @route GET /movies
 */
app.get('/movies', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Movies.find()
        .then((movies) => {
            res.status(200).json(movies);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

/**
 * Returns data about a single movie by title to the user.
 * Uses the GET method.
 * 
 * @route GET /movies/:Title
 * @param {string} Title
 * @returns {json} - information about the requested movie
 */
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

/**
 * Returns data about a genre by name/title.
 * Uses the GET method.
 * 
 * @route GET /movies/genre/:genreName
 * @param {string} genreName
 * @returns {json} - information about the genre
 */
app.get('/movies/genre/:genreName', passport.authenticate('jwt', { session: false }), async (req, res) => {
    Movies.findOne({ 'Genre.Name': req.params.genreName })
        .then((genre) => {
            res.json(genre);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

/**
 * Returns data about a director by name.
 * Uses the GET method.
 * 
 * @route GET /movies/director/:directorName
 * @param {string} directorName
 * @returns {json} - information about the director
 */
app.get('/movies/director/:directorName', passport.authenticate('jwt', { session: false }), async (req, res) => {
    Movies.findOne({ 'Director.Name': req.params.directorName })
        .then((director) => {
            res.json(director);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

/**
 * Allows new users to register.
 * Uses the POST method.
 * 
 * @route POST /users
 * @param {string} Username
 * @param {string} Password
 * @param {string} Email
 * @param {Date} Birthday
 * @returns {string} - message with success or error
 */
app.post('/users', async (req, res) => {

    [
        check('Username', 'Username is required').isLength({ min: 5 }),
        check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
        check('Password', 'Password is required').not().isEmpty(),
        check('Email', 'Email does not appear to be valid.').isEmail()
    ], async (req, res) => {

        let errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }
    }
    
    let hashedPassword = Users.hashPassword(req.body.Password);
    await Users.findOne({ Username: req.body.Username })
    .then((user) => {
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
                .then((user) => {res.status(201).json(user) })
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

/**
 * Returns a list of all users.
 * Uses the GET method.
 * 
 * @route GET /users
 * @returns {array} - list of all users
 */
app.get('/users', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Users.find()
        .then((users) => {
            res.status(200).json(users);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

/**
 * Gets a user by username.
 * Uses the GET method.
 * 
 * @route GET /users/:Username
 * @param {string} Username
 * @returns {json} - information about the user
 */
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

/**
 * Allows authenticated users to update their profile details.
 * Uses the PUT method.
 * 
 * @route PUT /users/:Username
 * @param {string} Username
 * @returns {json} - saves updated user information
 */
app.put('/users/:Username', passport.authenticate('jwt', { session: false }), async (req, res) => {
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
    { new: true })
    .then((updatedUser) => {
        res.json(updatedUser);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

/**
 * Allows users to add a movie to their list of favorites.
 * Uses the POST method.
 * 
 * @route POST /users/:Username/favorites/:MovieID
 * @param {string} Username
 * @param {string} MovieID
 * @returns {json} - new list of favorite movies
 */
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

/**
 * Allows users to remove a movie from their list of favorites.
 * Uses the DELETE method.
 * 
 * @route DELETE /users/:Username/favorites/:MovieID
 * @param {string} Username
 * @param {string} MovieID
 * @returns {json} - updated list of favorite movies
 */
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

/**
 * Allows existing users to deregister.
 * Uses the DELETE method.
 * 
 * @route DELETE /users/:Username
 * @param {string} Username
 * @returns {string} - message with success or error
 */
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

/**
 * Error handling
 */
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

/**
 * Port handling / lists Port in console
 */
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
    console.log('Listening on Port ' + port);
});