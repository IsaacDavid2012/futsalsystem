require('dotenv').config();

/**
 * Application configuration
 */

const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  isProduction: process.env.NODE_ENV === 'production',

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '7d',
  },

  // Cookie Configuration
  cookie: {
    secure: process.env.COOKIE_SECURE
      ? process.env.COOKIE_SECURE === 'true'
      : process.env.NODE_ENV === 'production',
    sameSite: process.env.COOKIE_SAME_SITE || (process.env.NODE_ENV === 'production' ? 'strict' : 'lax'),
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  },

  // CORS Configuration
  cors: {
    allowedOrigin: process.env.ALLOWED_ORIGIN || '',
    credentials: true,
  },

  // Rate Limiting
  rateLimit: {
    auth: {
      maxRequests: 15,
      windowMs: 15 * 60 * 1000, // 15 minutes
    },
    general: {
      maxRequests: 100,
      windowMs: 15 * 60 * 1000,
    },
  },
};

// Validate required environment variables in production
if (config.isProduction) {
  if (!config.jwt.secret) {
    throw new Error('JWT_SECRET is required in production');
  }
}

// Warn about development defaults
if (!config.isProduction && !config.jwt.secret) {
  console.warn('⚠️  JWT_SECRET not set. Using insecure development fallback.');
}

module.exports = config;
