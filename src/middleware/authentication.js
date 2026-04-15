const jwt = require('jsonwebtoken');
const config = require('../utils/config');
const logger = require('../utils/logger');

/**
 * Authentication middleware - verifies JWT token from cookies
 */
const requireAuth = (req, res, next) => {
  const token = req.cookies.auth;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret || 'dev_secret_change_me');
    req.user = decoded;
    next();
  } catch (err) {
    logger.warn('Authentication failed', {
      reason: err.message,
      ip: req.ip,
    });
    return res.status(401).json({ message: 'Invalid or expired session.' });
  }
};

/**
 * CORS origin enforcement middleware
 */
const enforceOrigin = (req, res, next) => {
  const origin = req.get('origin');
  if (!config.cors.isOriginAllowed(origin)) {
    logger.warn('CORS violation', {
      origin,
      ip: req.ip,
    });
    return res.status(403).json({ message: 'Forbidden origin.' });
  }

  next();
};

module.exports = { requireAuth, enforceOrigin };
