const { verifyToken } = require('../utils/jwt');
const redisClient = require('../config/redis');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    // Check if token is blacklisted
    try {
      const isBlacklisted = await redisClient.get(`blacklist:${token}`);

      if (isBlacklisted) {
        return res.status(401).json({ success: false, message: 'Token has been revoked' });
      }
    } catch (redisErr) {
      console.error('Redis error:', redisErr); // don't throw
    }

    req.user = { id: decoded.id, username: decoded.username, role: decoded.role };
    req.token = token;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

/**
 * Restrict access to ADMIN role only. Must be used after `protect`.
 */
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Forbidden: admins only' });
  }
  next();
};

module.exports = { protect, adminOnly };
