require('dotenv').config();

/**
 * Application configuration
 */

const parseCsv = (value) => String(value || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const defaultAllowedOrigins = [
  'https://futsal.creativeclicks.tech',
  'http://localhost:3010',
  'http://127.0.0.1:3010',
  'http://192.168.0.3:3010',
];

const configuredAllowedOrigins = parseCsv(process.env.ALLOWED_ORIGINS);
const singleAllowedOrigin = String(process.env.ALLOWED_ORIGIN || '').trim();
const allowedOrigins = configuredAllowedOrigins.length > 0
  ? configuredAllowedOrigins
  : singleAllowedOrigin
    ? [singleAllowedOrigin]
    : defaultAllowedOrigins;

const allowLocalhostOrigin = process.env.ALLOW_LOCALHOST_ORIGIN
  ? process.env.ALLOW_LOCALHOST_ORIGIN === 'true'
  : true;
const allowIpOrigin = process.env.ALLOW_IP_ORIGIN
  ? process.env.ALLOW_IP_ORIGIN === 'true'
  : true;

const localhostOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;
const ipv4OriginPattern = /^https?:\/\/((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})(:\d+)?$/i;
const ipv6OriginPattern = /^https?:\/\/\[[0-9a-f:]+\](:\d+)?$/i;

const isOriginAllowed = (origin) => {
  // Requests without an Origin header are typically same-host server calls.
  if (!origin) {
    return true;
  }

  if (allowedOrigins.includes(origin)) {
    return true;
  }

  if (allowLocalhostOrigin && localhostOriginPattern.test(origin)) {
    return true;
  }

  if (allowIpOrigin && (ipv4OriginPattern.test(origin) || ipv6OriginPattern.test(origin))) {
    return true;
  }

  return false;
};

const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3010,
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
    allowedOrigins,
    allowLocalhost: allowLocalhostOrigin,
    allowIpAddress: allowIpOrigin,
    isOriginAllowed,
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
