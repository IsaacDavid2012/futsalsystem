/**
 * Main application server
 * Production-ready Futsal Management System
 */

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const cors = require('cors');

// Import configuration and middleware
const config = require('./src/utils/config');
const logger = require('./src/utils/logger');
const { errorHandler } = require('./src/middleware/errorHandler');
const jwt = require('jsonwebtoken');

// Import routes
const authRoutes = require('./src/routes/auth');
const bookingsRoutes = require('./src/routes/bookings');
const adminRoutes = require('./src/routes/admin');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ['\'self\''],
      scriptSrc: ['\'self\''],
      styleSrc: ['\'self\'', '\'unsafe-inline\'', 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com'],
      fontSrc: ['\'self\'', 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com', 'data:'],
    },
  },
}));

// Trust proxy for production
if (config.isProduction) {
  app.set('trust proxy', 1);
}

// Hide X-Powered-By header
app.disable('x-powered-by');

// Core middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// CORS middleware (for future API clients)
app.use(cors({
  origin: (origin, callback) => {
    if (config.cors.isOriginAllowed(origin)) {
      return callback(null, true);
    }

    logger.warn('Blocked by CORS policy', {
      origin,
    });
    return callback(null, false);
  },
  credentials: config.cors.credentials,
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Request logging middleware
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
  });
  next();
});

/**
 * Health check endpoint
 */
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Root route - always show the main site entry page
 */
app.get('/', (_req, res) => {
  res.redirect('/login.html');
});

/**
 * Home route - requires authentication
 */
app.get('/home', (req, res) => {
  const token = req.cookies.auth;

  if (!token) {
    return res.redirect('/login.html');
  }

  try {
    jwt.verify(token, config.jwt.secret || 'dev_secret_change_me');
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } catch {
    logger.warn('Home access denied - invalid token');
    res.clearCookie('auth', { path: '/' });
    return res.redirect('/login.html');
  }
});

/**
 * Legacy dashboard route - redirect to home
 */
app.get('/dashboard', (_req, res) => {
  res.redirect('/home');
});

/**
 * Dedicated admin portal route
 */
app.get('/admin', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-portal.html'));
});

/**
 * API Routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/admin', adminRoutes);

/**
 * 404 handler for API routes
 */
app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'API route not found.' });
});

/**
 * Global error handler - must be last middleware
 */
app.use(errorHandler);

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`);
  logger.debug(`Environment: ${config.env}`);
});
