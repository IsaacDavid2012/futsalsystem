const winston = require('winston');
const path = require('path');

const isDev = process.env.NODE_ENV !== 'production';

const logger = winston.createLogger({
  level: isDev ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          let msg = `${timestamp} [${level}]: ${message}`;
          if (Object.keys(meta).length > 0) {
            msg += ' ' + JSON.stringify(meta);
          }
          return msg;
        })
      ),
    }),
    // Log errors to file in production
    ...(process.env.NODE_ENV === 'production'
      ? [
        new winston.transports.File({
          filename: path.join(__dirname, '../../logs/error.log'),
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
        new winston.transports.File({
          filename: path.join(__dirname, '../../logs/combined.log'),
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
      ]
      : []),
  ],
});

module.exports = logger;
