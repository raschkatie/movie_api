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

// create in-memory array
let topMovies = [
    {
    title: 'Lord of the Rings: Fellowship of the Ring',
    director: 'Peter Jackson',
    genre: 'Fantasy'
    },
    {
    title: 'It Follows',
    director: 'David Robert Mitchell',
    genre: 'Horror'
    },
    {
    title: 'Harry Potter and the Chamber of Secrets',
    director: 'Chris Columbus',
    genre: 'Fantasy'
    },
    {
    title: 'The Lighthouse',
    director: 'Robert Eggers',
    genre: 'Horror'
    },
    {
    title: '1408',
    director: 'Mikael Håfström',
    genre: 'Horror'
    },
    {
    title: 'Howl\'s Moving Castle',
    director: 'Hayao Miyazaki',
    genre: 'Adventure'
    },
    {
    title: 'The Shining',
    director: 'Stanley Kubrick',
    genre: 'Horror'
    },
    {
    title: 'Interstellar',
    director: 'Christopher Nolan',
    genre: 'Sci-Fi'
    },
    {
    title: 'How to Train Your Dragon',
    director: 'Dean DeBlois',
    genre: 'Adventure'
    },
    {
    title: 'The Conjuring',
    director: 'James Wan',
    genre: 'Horror'
    }
]

let users = [
    {
        id: 40,
        name: 'John Doe',
        email: 'john@gmail.com',
        favorites: [{
            title: 'Lord of the Rings: Fellowship of the Ring',
            director: 'Peter Jackson',
            genre: 'Fantasy'
            },
            {
            title: 'It Follows',
            director: 'David Robert Mitchell',
            genre: 'Horror'
            }]
    },
    {
        id: 41,
        name: 'Jane Doe',
        email: 'jane@hotmail.com'
    }
]

// invoke middleware function
app.use(morgan('combined', {stream: accessLogStream}));

// Use express.static to serve your “documentation.html” file from the public folder
app.use(express.static('public'));

// create an Express GET route located at the endpoint “/movies”
app.get('/movies', (req, res) => {
    // returns a JSON object containing data about your top 10 movies
    res.json(topMovies);

});

// Create another GET route located at the endpoint “/”
app.get('/', (req, res) => {
    // returns a default textual response of your choosing
    res.send('Welcome to MyFlix!');

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