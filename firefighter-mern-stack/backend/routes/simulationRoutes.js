/**
 * 📊 Simulation Routes
 * 
 * API routes for data simulation and testing scenarios
 */

import express from 'express';
import simulationController from '../controllers/simulationController.js';

const router = express.Router();

// Start simulation for multiple firefighters
router.post('/start', simulationController.startSimulation);

// Start all simulations for active firefighters
router.post('/start-all', simulationController.startAllSimulations);

// Stop simulation for a specific firefighter  
router.delete('/stop/:firefighterId', simulationController.stopSimulation);

// Stop all active simulations
router.post('/stop-all', simulationController.stopAllSimulations);

// Create custom scenario
router.post('/custom-scenario', simulationController.customScenario);

// Get all active simulations
router.get('/active', simulationController.getActiveSimulations);

// Get simulation status for a specific firefighter
router.get('/status/:firefighterId', simulationController.getSimulationStatus);

// Get available scenarios
router.get('/scenarios', simulationController.getAvailableScenarios);

// Generate realistic sensor data
router.post('/generate-data', simulationController.generateSensorData);

export default router;
