/**
 * 🔥 Logging Middleware
 * 
 * Comprehensive logging system for the firefighter monitoring application
 * Tracks requests, errors, and system events for debugging and monitoring
 */

import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');

// Winston logger configuration
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'firefighter-monitoring' },
  transports: [
    // Write all logs to console in development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
        })
      )
    })
  ]
});

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );
  
  logger.add(
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );
}

// Request logging middleware
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  logger.info('Incoming Request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id || 'anonymous',
    requestId: req.id || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  });
  
  // Capture response
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    
    logger.info('Request Completed', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length') || 0,
      userId: req.user?.id || 'anonymous'
    });
    
    return originalSend.call(this, data);
  };
  
  next();
};

// Error logging middleware
export const errorLogger = (err, req, res, next) => {
  logger.error('Request Error', {
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id || 'anonymous'
    },
    timestamp: new Date().toISOString()
  });
  
  next(err);
};

// Security event logger
export const logSecurityEvent = (event, details, req = null) => {
  logger.warn('Security Event', {
    event,
    details,
    request: req ? {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id || 'anonymous'
    } : null,
    timestamp: new Date().toISOString()
  });
};

// System event logger
export const logSystemEvent = (event, details) => {
  logger.info('System Event', {
    event,
    details,
    timestamp: new Date().toISOString()
  });
};

// Database operation logger
export const logDatabaseOperation = (operation, collection, details) => {
  logger.debug('Database Operation', {
    operation,
    collection,
    details,
    timestamp: new Date().toISOString()
  });
};

// Alert event logger
export const logAlertEvent = (firefighterId, alertType, severity, details) => {
  logger.warn('Alert Generated', {
    firefighterId,
    alertType,
    severity,
    details,
    timestamp: new Date().toISOString()
  });
};

// Performance logger
export const logPerformance = (operation, duration, details = {}) => {
  const level = duration > 1000 ? 'warn' : 'info';
  
  logger[level]('Performance Metric', {
    operation,
    duration: `${duration}ms`,
    details,
    timestamp: new Date().toISOString()
  });
};

// API rate limit logger
export const logRateLimit = (req) => {
  logger.warn('Rate Limit Exceeded', {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    url: req.originalUrl,
    userId: req.user?.id || 'anonymous',
    timestamp: new Date().toISOString()
  });
};

// Health check logger
export const logHealthCheck = (component, status, details = {}) => {
  const level = status === 'healthy' ? 'info' : 'error';
  
  logger[level]('Health Check', {
    component,
    status,
    details,
    timestamp: new Date().toISOString()
  });
};

// Export logger instance for direct use
export { logger };

export default {
  requestLogger,
  errorLogger,
  logSecurityEvent,
  logSystemEvent,
  logDatabaseOperation,
  logAlertEvent,
  logPerformance,
  logRateLimit,
  logHealthCheck,
  logger
};
