const jwtSecret = 'your_jwt_secret';  // must be same key used in JWT Strategy in passport.js

const jwt = require('jsonwebtoken'),
    passport = require('passport');

require('./passport');  // requires local passport file

let generateJWTToken = (user) => {
    return jwt.sign(user, jwtSecret, {
        subject: user.Username,  // username you're encoding in JWT
        expiresIn: '7d',
        algorithm: 'HS256'  // algorithm used to 'sign'/encode values of JWT
    });
}

// POST login
module.exports = (router) => {
    router.post('/login', (req, res) => {
        passport.authenticate('local', { session: false }, (error, user, info) => {
            if (error || !user) {
                return res.status(400).json({
                    message: 'Something is not right',
                    user: User
                });
            }
            req.login(user, { session: false }, (error) => {
                if (error) {
                    res.send(error);
                }
                let token = generateJWTToken(user.toJSON());
                return res.json({ user, token });  // ES6 shorthand for user: user, token: token
            });
        })(req, res);
    });
}