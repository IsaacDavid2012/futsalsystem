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

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ['\'self\''],
      scriptSrc: ['\'self\''],
      styleSrc: ['\'self\'', '\'unsafe-inline\''],
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
app.use(cors(config.isProduction ? {
  origin: config.cors.allowedOrigin || false,
  credentials: true,
} : {
  credentials: true,
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
 * Root redirect - go to dashboard if authenticated, otherwise to login
 */
app.get('/', (req, res) => {
  const hasAuthCookie = Boolean(req.cookies.auth);
  res.redirect(hasAuthCookie ? '/dashboard' : '/login.html');
});

/**
 * Dashboard route - requires authentication
 */
app.get('/dashboard', (req, res) => {
  const token = req.cookies.auth;

  if (!token) {
    return res.redirect('/login.html');
  }

  try {
    jwt.verify(token, config.jwt.secret || 'dev_secret_change_me');
    return res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
  } catch {
    logger.warn('Dashboard access denied - invalid token');
    res.clearCookie('auth', { path: '/' });
    return res.redirect('/login.html');
  }
});

/**
 * API Routes
 */
app.use('/api/auth', authRoutes);

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
