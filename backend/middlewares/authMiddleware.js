const jwt = require('jsonwebtoken');
const { isBlacklisted } = require('../utils/blackTokenList');

exports.authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ error: 'Access token required' });
    }

    let tokenBlacklisted = false;
    try {
        tokenBlacklisted = await isBlacklisted(token);
    } catch (error) {
        console.error('CRITICAL: Failed to check token blacklist due to Redis error');
        tokenBlacklisted = false;
    }

    if (tokenBlacklisted) {
        return res.status(401).json({ message: 'Authentication required. Token has been invalidated.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.error('JWT verification error:', err.message);
            return res.status(403).json({ error: 'Invalid or expired token' });
        }

        req.user = user;
        req.token = token; // for blacklist token on logout
        next();
    });
};