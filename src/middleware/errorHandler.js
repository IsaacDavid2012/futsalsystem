const logger = require('../utils/logger');

/**
 * Global error handling middleware
 * Must be registered last in middleware chain
 */
const errorHandler = (err, req, res, _next) => {
  // Log the error
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  // Don't expose internal error details in production
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Unexpected server error.'
    : err.message || 'Unexpected server error.';

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV !== 'production' && { error: err.message }),
  });
};

/**
 * Async error wrapper - wraps async route handlers to catch errors
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { errorHandler, asyncHandler };
