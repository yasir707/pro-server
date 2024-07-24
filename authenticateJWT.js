const jwt = require('jsonwebtoken');
const JWT_SECRET = 'gsh83gfd*32#f8sfg@^28hsa0g4&^7s2';


const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        console.error('No authorization header'); 
        return res.sendStatus(401); 
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        console.error('Malformed authorization header'); 
        return res.sendStatus(401); 
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error(token ,'Invalid token');
            return res.sendStatus(403); 
        }
        console.log(token)
        console.log('Decoded token:', user);
        req.user = user;
        next();
    });
};

module.exports = authenticateJWT;
