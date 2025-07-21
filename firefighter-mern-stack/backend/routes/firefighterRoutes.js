/**
 * 🔥 Firefighter Routes - RESTful API Endpoints
 * 
 * Defines all HTTP routes for firefighter operations
 * Implements proper REST conventions with validation middleware
 */

import express from 'express';
import { body, param, query } from 'express-validator';
import {
  getAllFirefighters,
  getFirefighterById,
  createFirefighter,
  updateFirefighter,
  activateFirefighter,
  deactivateFirefighter,
  updateBaselines,
  getActiveFirefighters,
  getFirefightersByDepartment,
  deleteFirefighter,
  getFirefighterStats
} from '../controllers/firefighterController.js';

const router = express.Router();

// Validation middleware
const firefighterValidation = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('phone')
    .matches(/^\+?[\d\s\-\(\)]{10,15}$/)
    .withMessage('Please provide a valid phone number'),
  body('dateOfBirth')
    .isISO8601()
    .toDate()
    .withMessage('Please provide a valid date of birth'),
  body('gender')
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
  body('height')
    .isFloat({ min: 150, max: 220 })
    .withMessage('Height must be between 150 and 220 cm'),
  body('weight')
    .isFloat({ min: 40, max: 200 })
    .withMessage('Weight must be between 40 and 200 kg'),
  body('department')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Department is required'),
  body('station')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Station is required'),
  body('rank')
    .optional()
    .isIn(['Probationary', 'Firefighter', 'Driver/Operator', 'Lieutenant', 'Captain', 'Battalion Chief', 'Deputy Chief', 'Fire Chief'])
    .withMessage('Invalid rank'),
  body('shift')
    .isIn(['A', 'B', 'C', 'D', 'Day', 'Night'])
    .withMessage('Invalid shift'),
  body('fitnessLevel')
    .optional()
    .isIn(['poor', 'fair', 'good', 'excellent', 'elite'])
    .withMessage('Invalid fitness level')
];

const baselineValidation = [
  body('restingHeartRate')
    .isFloat({ min: 40, max: 100 })
    .withMessage('Resting heart rate must be between 40 and 100 BPM'),
  body('restingTemperature')
    .optional()
    .isFloat({ min: 96.0, max: 99.5 })
    .withMessage('Resting temperature must be between 96.0 and 99.5°F'),
  body('baselineHRV')
    .optional()
    .isFloat({ min: 10, max: 200 })
    .withMessage('Baseline HRV must be between 10 and 200 ms'),
  body('vo2Max')
    .optional()
    .isFloat({ min: 20, max: 80 })
    .withMessage('VO2 Max must be between 20 and 80 ml/kg/min')
];

const paramValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid firefighter ID')
];

// Routes

/**
 * @route   GET /api/firefighters
 * @desc    Get all firefighters with filtering and pagination
 * @access  Public (should be protected in production)
 */
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  query('onDuty').optional().isBoolean().withMessage('onDuty must be a boolean')
], getAllFirefighters);

/**
 * @route   GET /api/firefighters/active
 * @desc    Get only active firefighters currently on duty
 * @access  Public
 */
router.get('/active', getActiveFirefighters);

/**
 * @route   GET /api/firefighters/stats
 * @desc    Get firefighter statistics and analytics
 * @access  Public
 */
router.get('/stats', getFirefighterStats);

/**
 * @route   GET /api/firefighters/department/:department
 * @desc    Get firefighters by department
 * @access  Public
 */
router.get('/department/:department', [
  param('department').trim().isLength({ min: 2 }).withMessage('Department name is required')
], getFirefightersByDepartment);

/**
 * @route   GET /api/firefighters/:id
 * @desc    Get firefighter by ID with detailed information
 * @access  Public
 */
router.get('/:id', [
  ...paramValidation,
  query('includeHistory').optional().isBoolean().withMessage('includeHistory must be a boolean')
], getFirefighterById);

/**
 * @route   POST /api/firefighters
 * @desc    Create new firefighter profile
 * @access  Protected (should require admin role)
 */
router.post('/', firefighterValidation, createFirefighter);

/**
 * @route   PUT /api/firefighters/:id
 * @desc    Update firefighter profile
 * @access  Protected
 */
router.put('/:id', [
  ...paramValidation,
  // Make most fields optional for updates
  body('firstName').optional().trim().isLength({ min: 2, max: 50 }),
  body('lastName').optional().trim().isLength({ min: 2, max: 50 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().matches(/^\+?[\d\s\-\(\)]{10,15}$/),
  body('height').optional().isFloat({ min: 150, max: 220 }),
  body('weight').optional().isFloat({ min: 40, max: 200 }),
  body('rank').optional().isIn(['Probationary', 'Firefighter', 'Driver/Operator', 'Lieutenant', 'Captain', 'Battalion Chief', 'Deputy Chief', 'Fire Chief']),
  body('fitnessLevel').optional().isIn(['poor', 'fair', 'good', 'excellent', 'elite'])
], updateFirefighter);

/**
 * @route   POST /api/firefighters/:id/activate
 * @desc    Activate firefighter for duty
 * @access  Protected
 */
router.post('/:id/activate', [
  ...paramValidation,
  body('incidentId').optional().isMongoId().withMessage('Invalid incident ID')
], activateFirefighter);

/**
 * @route   POST /api/firefighters/:id/deactivate
 * @desc    Deactivate firefighter from duty
 * @access  Protected
 */
router.post('/:id/deactivate', paramValidation, deactivateFirefighter);

/**
 * @route   PUT /api/firefighters/:id/baselines
 * @desc    Update firefighter baseline measurements
 * @access  Protected
 */
router.put('/:id/baselines', [
  ...paramValidation,
  ...baselineValidation
], updateBaselines);

/**
 * @route   DELETE /api/firefighters/:id
 * @desc    Delete (deactivate) firefighter
 * @access  Protected (should require admin role)
 */
router.delete('/:id', paramValidation, deleteFirefighter);

export default router;
