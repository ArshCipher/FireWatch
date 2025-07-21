/**
 * 🔥 Validation Middleware
 * 
 * Input validation for API endpoints
 */

import Joi from 'joi';
import { logger } from './logger.js';

/**
 * Generic validation middleware
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property]);
    
    if (error) {
      logger.warn('Validation Error', {
        endpoint: req.originalUrl,
        method: req.method,
        property,
        error: error.details[0].message,
        userId: req.user?.id || 'anonymous'
      });
      
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }
    
    next();
  };
};

/**
 * User Registration Validation
 */
const registrationSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])')).required()
    .messages({
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
    }),
  role: Joi.string().valid('admin', 'commander', 'firefighter', 'medic').default('firefighter'),
  department: Joi.string().max(100).required()
});

export const validateRegistration = validate(registrationSchema);

/**
 * User Login Validation
 */
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const validateLogin = validate(loginSchema);

/**
 * Firefighter Registration Validation
 */
const firefighterSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  badgeNumber: Joi.string().min(1).max(20).required(),
  position: Joi.string().valid('Firefighter', 'Lieutenant', 'Captain', 'Chief', 'Paramedic').required(),
  department: Joi.string().max(100).required(),
  email: Joi.string().email(),
  phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/),
  emergencyContact: Joi.object({
    name: Joi.string().max(100).required(),
    phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).required(),
    relationship: Joi.string().max(50).required()
  }).required(),
  medicalInfo: Joi.object({
    bloodType: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
    allergies: Joi.array().items(Joi.string().max(100)),
    medications: Joi.array().items(Joi.string().max(100)),
    conditions: Joi.array().items(Joi.string().max(100))
  }),
  age: Joi.number().integer().min(18).max(70),
  height: Joi.number().positive(),
  weight: Joi.number().positive()
});

export const validateFirefighter = validate(firefighterSchema);

/**
 * Sensor Data Validation
 */
const sensorDataSchema = Joi.object({
  firefighterId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
    .messages({
      'string.pattern.base': 'Invalid firefighter ID format'
    }),
  heartRate: Joi.number().integer().min(30).max(250).required(),
  temperature: Joi.number().min(-20).max(100).required(),
  airQuality: Joi.number().min(0).max(100).required(),
  location: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    altitude: Joi.number(),
    accuracy: Joi.number().positive()
  }).required(),
  batteryLevel: Joi.number().min(0).max(100),
  deviceId: Joi.string().max(50)
});

export const validateSensorData = validate(sensorDataSchema);

/**
 * Alert Creation Validation
 */
const alertSchema = Joi.object({
  firefighterId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
  type: Joi.string().valid(
    'CRITICAL_HEART_RATE',
    'HIGH_TEMPERATURE',
    'POOR_AIR_QUALITY',
    'LOCATION_HAZARD',
    'EQUIPMENT_MALFUNCTION',
    'MANUAL_DISTRESS',
    'COMMUNICATION_LOST',
    'MANUAL_ASSESSMENT'
  ).required(),
  severity: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL').required(),
  message: Joi.string().min(10).max(500).required(),
  metadata: Joi.object()
});

export const validateAlert = validate(alertSchema);

/**
 * Query Parameter Validation
 */
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().max(50),
  order: Joi.string().valid('asc', 'desc').default('desc')
});

export const validatePagination = validate(paginationSchema, 'query');

/**
 * Date Range Validation
 */
const dateRangeSchema = Joi.object({
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().min(Joi.ref('startDate'))
});

export const validateDateRange = validate(dateRangeSchema, 'query');

/**
 * Firefighter Update Validation
 */
const firefighterUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  position: Joi.string().valid('Firefighter', 'Lieutenant', 'Captain', 'Chief', 'Paramedic'),
  department: Joi.string().max(100),
  email: Joi.string().email(),
  phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/),
  emergencyContact: Joi.object({
    name: Joi.string().max(100).required(),
    phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).required(),
    relationship: Joi.string().max(50).required()
  }),
  medicalInfo: Joi.object({
    bloodType: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
    allergies: Joi.array().items(Joi.string().max(100)),
    medications: Joi.array().items(Joi.string().max(100)),
    conditions: Joi.array().items(Joi.string().max(100))
  }),
  isOnDuty: Joi.boolean(),
  status: Joi.string().valid('active', 'inactive', 'medical_leave', 'suspended'),
  age: Joi.number().integer().min(18).max(70),
  height: Joi.number().positive(),
  weight: Joi.number().positive()
});

export const validateFirefighterUpdate = validate(firefighterUpdateSchema);

/**
 * Manual Assessment Validation
 */
const manualAssessmentSchema = Joi.object({
  firefighterId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
  assessmentType: Joi.string().valid('medical', 'fitness', 'psychological', 'equipment').required(),
  findings: Joi.string().min(10).max(1000).required(),
  recommendations: Joi.string().max(1000),
  urgencyLevel: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL').required()
});

export const validateManualAssessment = validate(manualAssessmentSchema);

/**
 * Location Update Validation
 */
const locationSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  altitude: Joi.number(),
  accuracy: Joi.number().positive(),
  timestamp: Joi.date().iso()
});

export const validateLocation = validate(locationSchema);

/**
 * Custom validation for MongoDB ObjectId
 */
export const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  
  if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }
  
  next();
};

/**
 * Validate that required environment variables are set
 */
export const validateEnvironment = () => {
  const required = [
    'MONGODB_URI',
    'JWT_SECRET',
    'NODE_ENV'
  ];
  
  const missing = required.filter(env => !process.env[env]);
  
  if (missing.length > 0) {
    logger.error('Missing required environment variables', { missing });
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

/**
 * Rate limiting validation
 */
export const validateRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    if (requests.has(key)) {
      const userRequests = requests.get(key).filter(time => time > windowStart);
      requests.set(key, userRequests);
    }
    
    // Check current requests
    const currentRequests = requests.get(key) || [];
    
    if (currentRequests.length >= maxRequests) {
      logger.warn('Rate limit exceeded', {
        ip: key,
        requests: currentRequests.length,
        limit: maxRequests,
        window: windowMs
      });
      
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    // Add current request
    currentRequests.push(now);
    requests.set(key, currentRequests);
    
    next();
  };
};

/**
 * File upload validation
 */
export const validateFileUpload = (allowedTypes = [], maxSize = 5 * 1024 * 1024) => {
  return (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    // Check file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
      });
    }
    
    // Check file size
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum size: ${maxSize / (1024 * 1024)}MB`
      });
    }
    
    next();
  };
};

export default {
  validate,
  validateRegistration,
  validateLogin,
  validateFirefighter,
  validateFirefighterUpdate,
  validateSensorData,
  validateAlert,
  validateManualAssessment,
  validatePagination,
  validateDateRange,
  validateLocation,
  validateObjectId,
  validateEnvironment,
  validateRateLimit,
  validateFileUpload
};
