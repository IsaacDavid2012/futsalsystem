const logger = require('../utils/logger');

const rateLimitState = new Map();

/**
 * Create a rate limiting middleware
 * @param {object} options - { maxRequests, windowMs }
 * @returns {function} - Express middleware
 */
const createRateLimiter = ({ maxRequests, windowMs }) => {
  return (req, res, next) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const record = rateLimitState.get(key);

    // Clear old records periodically (every 100 requests)
    if (rateLimitState.size > 10000) {
      for (const [k, v] of rateLimitState.entries()) {
        if (now - v.start > windowMs) {
          rateLimitState.delete(k);
        }
      }
    }

    if (!record || now - record.start > windowMs) {
      rateLimitState.set(key, { count: 1, start: now });
      return next();
    }

    if (record.count >= maxRequests) {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        attempts: record.count,
      });
      return res.status(429).json({
        message: 'Too many requests. Please try again later.',
      });
    }

    record.count += 1;
    next();
  };
};

module.exports = { createRateLimiter };
