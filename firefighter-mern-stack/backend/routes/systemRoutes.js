/**
 * 🧪 System Testing Routes
 * 
 * Routes for comprehensive system testing and health monitoring
 */

import express from 'express';
import systemController from '../controllers/systemController.js';

const router = express.Router();

// System health check
router.get('/health', systemController.getHealth);

// Get system statistics
router.get('/stats', systemController.getStats);

// Test database operations
router.get('/test/database', systemController.testDatabase);

// Test Socket.IO functionality
router.get('/test/socketio', systemController.testSocketIO);

// Generate test data
router.post('/test/generate-data', systemController.generateTestData);

// Clean test data
router.delete('/test/clean-data', systemController.cleanTestData);

export default router;
