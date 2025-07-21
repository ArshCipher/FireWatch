/**
 * 🚨 Alert Routes
 * 
 * API routes for alert management and monitoring
 */

import express from 'express';
import alertController from '../controllers/alertController.js';

const router = express.Router();

// Get all alerts (including acknowledged, resolved, etc.)
router.get('/', alertController.getAllAlerts);

// Get all active alerts
router.get('/active', alertController.getActiveAlerts);

// Get alerts for a specific firefighter
router.get('/firefighter/:firefighterId', alertController.getFirefighterAlerts);

// Get alert statistics
router.get('/statistics', alertController.getAlertStatistics);

// Create a new alert
router.post('/', alertController.createAlert);

// Acknowledge a specific alert
router.patch('/:alertId/acknowledge', alertController.acknowledgeAlert);

// Resolve a specific alert
router.patch('/:alertId/resolve', alertController.resolveAlert);

// Dismiss a specific alert
router.patch('/:alertId/dismiss', alertController.dismissAlert);

// Escalate a specific alert
router.patch('/:alertId/escalate', alertController.escalateAlert);

// Bulk acknowledge multiple alerts
router.patch('/bulk-acknowledge', alertController.bulkAcknowledgeAlerts);

// Clean up old/invalid alerts
router.delete('/cleanup', alertController.cleanupOldAlerts);

export default router;
