const mongoose = require('mongoose')
    bcrypt = require('bcrypt');

let movieSchema = mongoose.Schema({
    Title: { type: String, required: true },
    Description: { type: String, required: true },
    Genre: { type: mongoose.Schema.Types.ObjectId, ref: 'Genre' },
    Director: { type: mongoose.Schema.Types.ObjectId, ref: 'Director' },
    Actors: [String],
    ImagePath: String,
    Featured: Boolean
});

let userSchema = mongoose.Schema({
    Username: { type: String, required: true },
    Password: { type: String, required: true },
    Email: { type: String, required: true },
    Birthday: Date,
    FavoriteMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }]
});

// hashing password
userSchema.statics.hashPassword = (password) => {
    return bcrypt.hashSync(password, 10);
};

// no arrow functions when defining instance methods
userSchema.methods.validatePassword = function(password) {
    return bcrypt.compareSync(password, this.Password);
};

let directorSchema = mongoose.Schema({
    Name: { type: String, required: true },
    Bio: { type: String, required: true },
    Birth: { type: String },
    Death: { type: String }
});

let genreSchema = mongoose.Schema({
    Name: { type: String, required: true },
    Description: { type: String, required: true }
});

let Movie = mongoose.model('Movie', movieSchema);
let User = mongoose.model('User', userSchema);
let Director = mongoose.model('Director', directorSchema);
let Genre = mongoose.model('Genre', genreSchema);
module.exports.Movie = Movie;
module.exports.User = User;
module.exports.Director = Director;
module.exports.Genre = Genre;