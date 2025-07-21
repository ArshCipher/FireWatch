/**
 * 🔥 Sensor Data Routes
 * 
 * Handles all sensor data related endpoints for the firefighter monitoring system
 */

import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateSensorData } from '../middleware/validation.js';
import { SensorData } from '../models/SensorData.js';
import { Firefighter } from '../models/Firefighter.js';
import { Alert } from '../models/Alert.js';
import { logDatabaseOperation, logAlertEvent, logger } from '../middleware/logger.js';

const router = express.Router();

/**
 * POST /api/sensor-data
 * Submit new sensor data reading
 */
router.post('/', authenticate, validateSensorData, async (req, res, next) => {
  try {
    const { firefighterId, heartRate, temperature, airQuality, location } = req.body;
    
    // Verify firefighter exists
    const firefighter = await Firefighter.findById(firefighterId);
    if (!firefighter) {
      return res.status(404).json({
        success: false,
        message: 'Firefighter not found'
      });
    }
    
    // Create sensor data record
    const sensorData = new SensorData({
      firefighterId,
      heartRate,
      temperature,
      airQuality,
      location,
      timestamp: new Date()
    });
    
    await sensorData.save();
    
    logDatabaseOperation('CREATE', 'SensorData', { firefighterId, dataId: sensorData._id });
    
    // Check for critical alerts
    const alerts = await checkForAlerts(sensorData);
    
    // Emit real-time update via Socket.IO
    req.app.get('io').emit('sensorDataUpdate', {
      firefighterId,
      data: sensorData,
      alerts
    });
    
    res.status(201).json({
      success: true,
      data: sensorData,
      alerts
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sensor-data/firefighter/:id
 * Get sensor data for a specific firefighter
 */
router.get('/firefighter/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      limit = 100, 
      offset = 0, 
      startDate, 
      endDate,
      dataType 
    } = req.query;
    
    // Build query
    let query = { firefighterId: id };
    
    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Get sensor data
    const sensorData = await SensorData.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .lean();
    
    // Get total count for pagination
    const total = await SensorData.countDocuments(query);
    
    logDatabaseOperation('READ', 'SensorData', { 
      firefighterId: id, 
      count: sensorData.length 
    });
    
    res.json({
      success: true,
      data: sensorData,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: total > (parseInt(offset) + parseInt(limit))
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sensor-data/latest/:id
 * Get latest sensor reading for a firefighter
 */
router.get('/latest/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const latestData = await SensorData.findOne({ firefighterId: id })
      .sort({ timestamp: -1 })
      .lean();
    
    if (!latestData) {
      return res.status(404).json({
        success: false,
        message: 'No sensor data found for firefighter'
      });
    }
    
    res.json({
      success: true,
      data: latestData
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sensor-data/analytics/:id
 * Get analytics for firefighter sensor data
 */
router.get('/analytics/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { period = '24h' } = req.query;
    
    // Calculate time range
    const now = new Date();
    let startTime;
    
    switch (period) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '8h':
        startTime = new Date(now.getTime() - 8 * 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
    
    // Aggregate analytics
    const analytics = await SensorData.aggregate([
      {
        $match: {
          firefighterId: id,
          timestamp: { $gte: startTime }
        }
      },
      {
        $group: {
          _id: null,
          avgHeartRate: { $avg: '$heartRate' },
          maxHeartRate: { $max: '$heartRate' },
          minHeartRate: { $min: '$heartRate' },
          avgTemperature: { $avg: '$temperature' },
          maxTemperature: { $max: '$temperature' },
          minTemperature: { $min: '$temperature' },
          avgAirQuality: { $avg: '$airQuality' },
          minAirQuality: { $min: '$airQuality' },
          totalReadings: { $sum: 1 }
        }
      }
    ]);
    
    // Get recent alerts
    const recentAlerts = await Alert.find({
      firefighterId: id,
      createdAt: { $gte: startTime }
    }).sort({ createdAt: -1 }).limit(10);
    
    res.json({
      success: true,
      data: {
        period,
        analytics: analytics[0] || {},
        recentAlerts,
        timeRange: {
          start: startTime,
          end: now
        }
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sensor-data/realtime/all
 * Get real-time data for all active firefighters
 */
router.get('/realtime/all', authenticate, authorize(['admin', 'commander']), async (req, res, next) => {
  try {
    // Get all active firefighters
    const activeFirefighters = await Firefighter.find({ 
      status: 'active',
      isOnDuty: true 
    }).select('_id name position');
    
    // Get latest sensor data for each
    const realtimeData = await Promise.all(
      activeFirefighters.map(async (firefighter) => {
        const latestData = await SensorData.findOne({ 
          firefighterId: firefighter._id 
        }).sort({ timestamp: -1 });
        
        return {
          firefighter,
          sensorData: latestData,
          lastUpdate: latestData?.timestamp || null
        };
      })
    );
    
    res.json({
      success: true,
      data: realtimeData
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/sensor-data/:id
 * Delete sensor data record (admin only)
 */
router.delete('/:id', authenticate, authorize(['admin']), async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const deletedData = await SensorData.findByIdAndDelete(id);
    
    if (!deletedData) {
      return res.status(404).json({
        success: false,
        message: 'Sensor data not found'
      });
    }
    
    logDatabaseOperation('DELETE', 'SensorData', { dataId: id });
    
    res.json({
      success: true,
      message: 'Sensor data deleted successfully'
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sensor-data/live
 * Get live sensor data for all firefighters (for dashboard)
 */
router.get('/live', async (req, res, next) => {
  try {
    // Get all active firefighters
    const activeFirefighters = await Firefighter.find({ 
      isActive: true 
    }).select('_id firstName lastName badgeNumber dateOfBirth');
    
    // Get latest sensor data for each
    const liveData = await Promise.all(
      activeFirefighters.map(async (firefighter) => {
        const latestData = await SensorData.findOne({ 
          firefighterId: firefighter._id 
        }).sort({ timestamp: -1 });
        
        return {
          firefighter,
          sensorData: latestData,
          lastUpdate: latestData?.timestamp || null
        };
      })
    );
    
    res.json({
      success: true,
      data: liveData
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * Helper function to check for critical alerts
 */
async function checkForAlerts(sensorData) {
  const alerts = [];
  const { firefighterId, heartRate, temperature, airQuality } = sensorData;
  
  // Critical heart rate alert
  if (heartRate > 180 || heartRate < 50) {
    const alert = new Alert({
      firefighterId,
      type: 'CRITICAL_HEART_RATE',
      severity: heartRate > 200 || heartRate < 40 ? 'CRITICAL' : 'HIGH',
      message: `Heart rate ${heartRate > 180 ? 'too high' : 'too low'}: ${heartRate} BPM`,
      sensorData: sensorData._id,
      metadata: { heartRate, threshold: heartRate > 180 ? 180 : 50 }
    });
    
    await alert.save();
    alerts.push(alert);
    
    logAlertEvent(firefighterId, 'CRITICAL_HEART_RATE', alert.severity, { heartRate });
  }
  
  // High temperature alert
  if (temperature > 50) {
    const alert = new Alert({
      firefighterId,
      type: 'HIGH_TEMPERATURE',
      severity: temperature > 60 ? 'CRITICAL' : 'HIGH',
      message: `High environmental temperature: ${temperature}°C`,
      sensorData: sensorData._id,
      metadata: { temperature, threshold: 50 }
    });
    
    await alert.save();
    alerts.push(alert);
    
    logAlertEvent(firefighterId, 'HIGH_TEMPERATURE', alert.severity, { temperature });
  }
  
  // Poor air quality alert
  if (airQuality < 30) {
    const alert = new Alert({
      firefighterId,
      type: 'POOR_AIR_QUALITY',
      severity: airQuality < 15 ? 'CRITICAL' : 'HIGH',
      message: `Poor air quality detected: ${airQuality}% clean air`,
      sensorData: sensorData._id,
      metadata: { airQuality, threshold: 30 }
    });
    
    await alert.save();
    alerts.push(alert);
    
    logAlertEvent(firefighterId, 'POOR_AIR_QUALITY', alert.severity, { airQuality });
  }
  
  return alerts;
}

export default router;
