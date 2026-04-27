const jwt = require('jsonwebtoken');
const config = require('../utils/config');
const db = require('../../db');
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
    const decoded = jwt.verify(token, config.jwt.secret);
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
 * Admin authorization middleware - ensures the authenticated user has admin access
 */
const requireAdmin = (req, res, next) => {
  if (req.user.role === 'admin') {
    return next();
  }

  db.get('SELECT role FROM users WHERE id = ?', [req.user.id], (err, row) => {
    if (err) {
      return res.status(500).json({ message: 'Server error.' });
    }

    if (!row) {
      return res.status(401).json({ message: 'Unauthorized.' });
    }

    if (row.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }

    req.user.role = 'admin';
    return next();
  });
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

module.exports = { requireAuth, requireAdmin, enforceOrigin };
