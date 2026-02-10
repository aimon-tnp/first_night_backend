const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'asdfghjkl;;lkjhgfdsa';

function authenticate(req, res, next) {
    let token = req.headers['x-access-token'] || req.headers['authorization'];

    if (!token) {
        return res.status(401).json({ error: 'missing token' });
    }

    if (token.startsWith('Bearer ')) {
        // Remove Bearer from string
        token = token.slice(7, token.length);
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'invalid token' });
        }
        req.user = {
            id: decoded.sub,
            role: decoded.role,
            username: decoded.username
        };
        next();
    });
}

function requireRole(role) {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ error: 'not authenticated' });
        if (req.user.role !== role) return res.status(403).json({ error: 'forbidden' });
        next();
    };
}

module.exports = { authenticate, requireRole };
