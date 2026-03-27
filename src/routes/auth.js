const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../db');
const { validateRequest } = require('../middleware/validation');
const { requireAuth, enforceOrigin } = require('../middleware/authentication');
const { asyncHandler } = require('../middleware/errorHandler');
const { createRateLimiter } = require('../middleware/rateLimiter');
const { signupSchema, loginSchema } = require('../utils/validators');
const config = require('../utils/config');
const logger = require('../utils/logger');

const router = express.Router();

// Rate limiters
const authRateLimiter = createRateLimiter(config.rateLimit.auth);

/**
 * Issue JWT authentication cookie
 */
const issueAuthCookie = (res, payload) => {
  const token = jwt.sign(payload, config.jwt.secret || 'dev_secret_change_me', {
    expiresIn: config.jwt.expiresIn,
  });
  res.cookie('auth', token, config.cookie);
};

/**
 * POST /api/auth/signup
 * Create a new user account
 */
router.post(
  '/signup',
  enforceOrigin,
  authRateLimiter,
  validateRequest(signupSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    logger.info('Signup attempt', { email: email.substring(0, 3) + '***' });

    try {
      const passwordHash = await bcrypt.hash(password, 12);
      const createdAt = new Date().toISOString();

      db.run(
        'INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)',
        [email, passwordHash, createdAt],
        function (err) {
          if (err) {
            if (err.message.includes('UNIQUE')) {
              logger.warn('Signup failed: email already registered', { email: email.substring(0, 3) + '***' });
              return res.status(409).json({ message: 'Email already registered.' });
            }
            logger.error('Database error during signup', { error: err.message });
            return res.status(500).json({ message: 'Server error.' });
          }

          issueAuthCookie(res, { id: this.lastID, email });
          logger.info('User signed up', { userId: this.lastID });

          return res.status(201).json({ message: 'Signup successful.' });
        }
      );
    } catch (error) {
      logger.error('Error in signup route', { error: error.message });
      res.status(500).json({ message: 'Server error.' });
    }
  })
);

/**
 * POST /api/auth/login
 * Authenticate an existing user
 */
router.post(
  '/login',
  enforceOrigin,
  authRateLimiter,
  validateRequest(loginSchema),
  (req, res) => {
    const { email, password } = req.body;

    logger.info('Login attempt', { email: email.substring(0, 3) + '***' });

    db.get(
      'SELECT id, email, password_hash FROM users WHERE email = ?',
      [email],
      asyncHandler(async (err, row) => {
        if (err) {
          logger.error('Database error during login', { error: err.message });
          return res.status(500).json({ message: 'Server error.' });
        }

        if (!row) {
          logger.warn('Login failed: user not found', { email: email.substring(0, 3) + '***' });
          return res.status(401).json({ message: 'Invalid credentials.' });
        }

        try {
          const isMatch = await bcrypt.compare(password, row.password_hash);

          if (!isMatch) {
            logger.warn('Login failed: invalid password', { email: email.substring(0, 3) + '***' });
            return res.status(401).json({ message: 'Invalid credentials.' });
          }

          issueAuthCookie(res, { id: row.id, email: row.email });
          logger.info('User logged in', { userId: row.id });

          return res.json({ message: 'Login successful.' });
        } catch (error) {
          logger.error('Error in login route', { error: error.message });
          return res.status(500).json({ message: 'Server error.' });
        }
      })
    );
  }
);

/**
 * GET /api/auth/me
 * Get current authenticated user info
 */
router.get('/me', requireAuth, (req, res) => {
  return res.json({ user: { id: req.user.id, email: req.user.email } });
});

/**
 * POST /api/auth/logout
 * Clear authentication cookie
 */
router.post('/logout', enforceOrigin, (req, res) => {
  res.clearCookie('auth', {
    path: config.cookie.path,
    httpOnly: config.cookie.httpOnly,
    sameSite: config.cookie.sameSite,
    secure: config.cookie.secure,
  });
  logger.info('User logged out');
  return res.json({ message: 'Logged out.' });
});

module.exports = router;
