// require express in your “index.js” file
const express = require('express'),
    morgan = require('morgan'),
    fs = require('fs'),
    path = require('path'),
    bodyParser = require('body-parser'),
    uuid = require('uuid');

const app = express();

app.use(bodyParser.json());

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
app.get('/movies', (req, res) => {
    res.status(200).json(topMovies);

});

// Return data about a single movie by title to the user
app.get('/movies/:title', (req, res) => {
    res.json(topMovies.find((movie) => {
        return movie.title === req.params.title
    }));

});

// Return data about a genre by name/title
app.get('/movies/genre/:genre', (req, res) => {
    res.send('Successful GET request returning data of genre');
});

// Return data about a director by name
app.get('/movies/director/:director', (req, res) => {
    res.send('Successful GET request returning data of director');
});

// Allow new users to register
app.post('/account', (req, res) => {
    let newUser = req.body;

    if (!newUser.name) {
        res.status(400).send('Missing name. Please provide name in request body.');
    } else {
        newUser.id = uuid.v4();
        users.push(newUser);
        res.status(201).send(newUser);
    }
});

// Allow users to update their user info
app.put('/account/:id', (req, res) => {
    res.send('Successful attempt to update user info');
});

// Allow users to add a movie to their list of favorites
app.post('/account/:id/favorites', (req, res) => {
    res.send('Movie added to user Favorites');
});

// Allow users to remove a movie from their list of favorites
app.delete('/account/:id/favorites/:title', (req, res) => {
    res.send('Movie successfully deleted from Favorites');
});

// Allow existing users to deregister
app.delete('/account/:id', (req, res) => {
    res.send('User info successfully removed. You are deregistered');
});

// Create an error-handling middleware function that will log all application-level errors to the terminal
// should always be defined last in middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// listens for a response on port 8080
app.listen(8080, () => {
    console.log('Listening and running on port 8080');
});