/**
 * 🔥 Authentication Routes
 * 
 * Handles user authentication, registration, and session management
 */

import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticate } from '../middleware/auth.js';
import { validateRegistration, validateLogin } from '../middleware/validation.js';
import { User } from '../models/User.js';
import { logSecurityEvent, logSystemEvent, logger } from '../middleware/logger.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', validateRegistration, async (req, res, next) => {
  try {
    const { name, email, password, role = 'firefighter', department } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logSecurityEvent('REGISTRATION_ATTEMPT_DUPLICATE_EMAIL', { email }, req);
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      department,
      isActive: true,
      createdAt: new Date()
    });
    
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    logSystemEvent('USER_REGISTERED', {
      userId: user._id,
      email: user.email,
      role: user.role,
      department
    });
    
    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userResponse,
        token
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 * User login
 */
router.post('/login', validateLogin, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      logSecurityEvent('LOGIN_ATTEMPT_INVALID_EMAIL', { email }, req);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Check if user is active
    if (!user.isActive) {
      logSecurityEvent('LOGIN_ATTEMPT_INACTIVE_USER', { 
        userId: user._id, 
        email 
      }, req);
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact administrator.'
      });
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      logSecurityEvent('LOGIN_ATTEMPT_INVALID_PASSWORD', { 
        userId: user._id, 
        email 
      }, req);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    logSystemEvent('USER_LOGIN_SUCCESS', {
      userId: user._id,
      email: user.email,
      role: user.role,
      ip: req.ip
    });
    
    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/logout
 * User logout (mainly for logging purposes)
 */
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    logSystemEvent('USER_LOGOUT', {
      userId: req.user.id,
      email: req.user.email
    });
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/auth/me
 * Update current user profile
 */
router.put('/me', authenticate, async (req, res, next) => {
  try {
    const { name, department, preferences } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update allowed fields
    if (name) user.name = name;
    if (department) user.department = department;
    if (preferences) user.preferences = { ...user.preferences, ...preferences };
    
    user.updatedAt = new Date();
    await user.save();
    
    logSystemEvent('USER_PROFILE_UPDATED', {
      userId: user._id,
      updatedFields: Object.keys(req.body)
    });
    
    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: userResponse
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/auth/change-password
 * Change user password
 */
router.put('/change-password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long'
      });
    }
    
    const user = await User.findById(req.user.id).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    
    if (!isValidPassword) {
      logSecurityEvent('PASSWORD_CHANGE_INVALID_CURRENT', { 
        userId: user._id 
      }, req);
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    user.password = hashedPassword;
    user.updatedAt = new Date();
    await user.save();
    
    logSecurityEvent('PASSWORD_CHANGED_SUCCESS', { 
      userId: user._id 
    }, req);
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/refresh
 * Refresh JWT token
 */
router.post('/refresh', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }
    
    // Generate new JWT token
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    res.json({
      success: true,
      data: { token }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/forgot-password
 * Request password reset (placeholder for future implementation)
 */
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    // For now, just log the request
    logSecurityEvent('PASSWORD_RESET_REQUESTED', { email }, req);
    
    // Always return success to prevent email enumeration
    res.json({
      success: true,
      message: 'If the email exists, a password reset link has been sent'
    });
    
  } catch (error) {
    next(error);
  }
});

export default router;
