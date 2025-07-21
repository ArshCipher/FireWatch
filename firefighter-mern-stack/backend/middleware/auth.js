/**
 * 🔥 Authentication Middleware
 * 
 * Handles JWT authentication and authorization for the firefighter monitoring system
 * Provides role-based access control and session management
 */

import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from './errorHandler.js';
import { cache } from '../config/redis.js';

// Mock user data for development (replace with actual user service)
const mockUsers = {
  'admin': {
    id: 'admin-001',
    username: 'admin',
    role: 'admin',
    permissions: ['read', 'write', 'delete', 'manage_users']
  },
  'commander': {
    id: 'commander-001',
    username: 'commander',
    role: 'incident_commander',
    permissions: ['read', 'write', 'acknowledge_alerts']
  },
  'medic': {
    id: 'medic-001',
    username: 'medic',
    role: 'medic',
    permissions: ['read', 'medical_response']
  }
};

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'firefighter-monitoring-secret-key';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

// Generate JWT token
export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      permissions: user.permissions
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRE,
      issuer: 'firefighter-monitoring-system',
      audience: 'firefighter-monitoring-users'
    }
  );
};

// Verify JWT token
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new UnauthorizedError('Invalid token');
    } else {
      throw new UnauthorizedError('Token verification failed');
    }
  }
};

// Authentication middleware
export const authMiddleware = async (req, res, next) => {
  try {
    let token;
    
    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies (if using cookie authentication)
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    
    if (!token) {
      throw new UnauthorizedError('Access token is required');
    }
    
    // Verify token
    const decoded = verifyToken(token);
    
    // Check if token is blacklisted (logout functionality)
    const isBlacklisted = await cache.exists(`blacklist:${token}`);
    if (isBlacklisted) {
      throw new UnauthorizedError('Token has been revoked');
    }
    
    // Get user data (in production, fetch from database)
    const user = mockUsers[decoded.username];
    if (!user) {
      throw new UnauthorizedError('User not found');
    }
    
    // Attach user to request object
    req.user = {
      ...user,
      token,
      tokenExpiry: new Date(decoded.exp * 1000)
    };
    
    next();
  } catch (error) {
    next(error);
  }
};

// Optional authentication (allows both authenticated and non-authenticated access)
export const optionalAuth = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    
    if (token) {
      try {
        const decoded = verifyToken(token);
        const user = mockUsers[decoded.username];
        if (user) {
          req.user = { ...user, token };
        }
      } catch (error) {
        // Ignore token errors for optional auth
        console.log('Optional auth token error:', error.message);
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

// Role-based authorization middleware
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    
    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(`Access denied. Required roles: ${roles.join(', ')}`);
    }
    
    next();
  };
};

// Permission-based authorization middleware
export const requirePermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    
    const hasPermission = permissions.some(permission => 
      req.user.permissions.includes(permission)
    );
    
    if (!hasPermission) {
      throw new ForbiddenError(`Access denied. Required permissions: ${permissions.join(', ')}`);
    }
    
    next();
  };
};

// Login function (for development)
export const login = async (username, password) => {
  // In production, verify password against database
  const user = mockUsers[username];
  
  if (!user || password !== 'password123') { // Simple password for development
    throw new UnauthorizedError('Invalid credentials');
  }
  
  const token = generateToken(user);
  
  // Store token info in cache for session management
  await cache.set(`session:${user.id}`, {
    token,
    user: user,
    loginTime: new Date().toISOString(),
    lastActivity: new Date().toISOString()
  }, 7 * 24 * 60 * 60); // 7 days
  
  return {
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      permissions: user.permissions
    },
    token,
    expiresIn: JWT_EXPIRE
  };
};

// Logout function
export const logout = async (req) => {
  if (req.user && req.user.token) {
    // Add token to blacklist
    const decoded = jwt.decode(req.user.token);
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
    
    if (expiresIn > 0) {
      await cache.set(`blacklist:${req.user.token}`, true, expiresIn);
    }
    
    // Remove session
    await cache.del(`session:${req.user.id}`);
  }
};

// Update last activity
export const updateActivity = async (req, res, next) => {
  if (req.user) {
    try {
      const sessionKey = `session:${req.user.id}`;
      const session = await cache.get(sessionKey);
      
      if (session) {
        session.lastActivity = new Date().toISOString();
        await cache.set(sessionKey, session, 7 * 24 * 60 * 60);
      }
    } catch (error) {
      console.error('Error updating activity:', error);
      // Don't throw error - this is not critical
    }
  }
  
  next();
};

// Development middleware that allows bypassing authentication
export const devBypassAuth = (req, res, next) => {
  if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
    req.user = mockUsers.admin; // Use admin user for development
  }
  next();
};

// Export aliases for common usage patterns
export const authenticate = authMiddleware;
export const authorize = requireRole;

export default {
  authMiddleware,
  optionalAuth,
  requireRole,
  requirePermission,
  generateToken,
  verifyToken,
  login,
  logout,
  updateActivity,
  devBypassAuth,
  authenticate,
  authorize
};
