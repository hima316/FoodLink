import winston from 'winston';
import { config } from './env';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: config.isDev }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return stack
      ? `[${timestamp}] ${level}: ${message}\n${stack}`
      : `[${timestamp}] ${level}: ${message}`;
  })
);

// Create Winston logger instance
const logger = winston.createLogger({
  level: config.isDev ? 'debug' : 'info',
  format: logFormat,
  transports: [
    // Console transport for all environments
    new winston.transports.Console(),
    // File transport for production errors
    ...(config.isProd
      ? [
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
          new winston.transports.File({
            filename: 'logs/combined.log',
            maxsize: 5242880,
            maxFiles: 5,
          }),
        ]
      : []),
  ],
  exceptionHandlers: config.isProd
    ? [new winston.transports.File({ filename: 'logs/exceptions.log' })]
    : [],
});

export default logger;
