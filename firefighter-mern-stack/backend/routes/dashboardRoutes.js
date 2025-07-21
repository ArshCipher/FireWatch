/**
 * 🔥 Dashboard Routes
 * 
 * Provides aggregated data and analytics for dashboard views
 */

import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { Firefighter } from '../models/Firefighter.js';
import { SensorData } from '../models/SensorData.js';
import { Alert } from '../models/Alert.js';
import { logDatabaseOperation, logger } from '../middleware/logger.js';

const router = express.Router();

/**
 * GET /api/dashboard/overview
 * Get dashboard overview data
 */
router.get('/overview', authenticate, async (req, res, next) => {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Get basic counts
    const [
      totalFirefighters,
      activeFirefighters,
      onDutyFirefighters,
      activeAlerts,
      criticalAlerts,
      recentSensorData
    ] = await Promise.all([
      Firefighter.countDocuments(),
      Firefighter.countDocuments({ status: 'active' }),
      Firefighter.countDocuments({ status: 'active', isOnDuty: true }),
      Alert.countDocuments({ status: 'active' }),
      Alert.countDocuments({ status: 'active', severity: 'CRITICAL' }),
      SensorData.countDocuments({ timestamp: { $gte: oneDayAgo } })
    ]);
    
    // Get alert breakdown
    const alertBreakdown = await Alert.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const alertCounts = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0
    };
    
    alertBreakdown.forEach(item => {
      alertCounts[item._id] = item.count;
    });
    
    // Get department breakdown
    const departmentBreakdown = await Firefighter.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: '$department',
          total: { $sum: 1 },
          onDuty: {
            $sum: { $cond: [{ $eq: ['$isOnDuty', true] }, 1, 0] }
          }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        summary: {
          totalFirefighters,
          activeFirefighters,
          onDutyFirefighters,
          activeAlerts,
          criticalAlerts,
          recentSensorData
        },
        alerts: {
          total: activeAlerts,
          breakdown: alertCounts
        },
        departments: departmentBreakdown,
        lastUpdated: now
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/dashboard/realtime
 * Get real-time dashboard data
 */
router.get('/realtime', authenticate, async (req, res, next) => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    // Get active firefighters with latest sensor data
    const activeFirefighters = await Firefighter.find({ 
      status: 'active', 
      isOnDuty: true 
    }).select('_id name position department location');
    
    const realtimeData = await Promise.all(
      activeFirefighters.map(async (firefighter) => {
        const latestSensor = await SensorData.findOne({
          firefighterId: firefighter._id
        }).sort({ timestamp: -1 });
        
        const recentAlerts = await Alert.find({
          firefighterId: firefighter._id,
          status: 'active'
        }).sort({ createdAt: -1 }).limit(3);
        
        return {
          firefighter,
          sensorData: latestSensor,
          alerts: recentAlerts,
          isOnline: latestSensor && latestSensor.timestamp > fiveMinutesAgo,
          lastSeen: latestSensor?.timestamp || null
        };
      })
    );
    
    // Get system health metrics
    const systemHealth = {
      activeSensors: realtimeData.filter(f => f.isOnline).length,
      totalSensors: realtimeData.length,
      alertsLastHour: await Alert.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
      }),
      dataPointsLastHour: await SensorData.countDocuments({
        timestamp: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
      })
    };
    
    res.json({
      success: true,
      data: {
        firefighters: realtimeData,
        systemHealth,
        timestamp: new Date()
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/dashboard/analytics
 * Get analytics data for dashboard
 */
router.get('/analytics', authenticate, async (req, res, next) => {
  try {
    const { period = '24h' } = req.query;
    
    // Calculate time range
    const now = new Date();
    let startTime;
    let groupBy;
    
    switch (period) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        groupBy = {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' },
          hour: { $hour: '$timestamp' },
          minute: { $subtract: [{ $minute: '$timestamp' }, { $mod: [{ $minute: '$timestamp' }, 5] }] }
        };
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        groupBy = {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' },
          hour: { $hour: '$timestamp' }
        };
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        groupBy = {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' }
        };
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        groupBy = {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' },
          hour: { $hour: '$timestamp' }
        };
    }
    
    // Sensor data analytics
    const sensorAnalytics = await SensorData.aggregate([
      {
        $match: {
          timestamp: { $gte: startTime }
        }
      },
      {
        $group: {
          _id: groupBy,
          avgHeartRate: { $avg: '$heartRate' },
          maxHeartRate: { $max: '$heartRate' },
          avgTemperature: { $avg: '$temperature' },
          maxTemperature: { $max: '$temperature' },
          avgAirQuality: { $avg: '$airQuality' },
          minAirQuality: { $min: '$airQuality' },
          dataPoints: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1, '_id.minute': 1 }
      }
    ]);
    
    // Alert analytics
    const alertAnalytics = await Alert.aggregate([
      {
        $match: {
          createdAt: { $gte: startTime }
        }
      },
      {
        $group: {
          _id: {
            severity: '$severity',
            type: '$type',
            time: groupBy
          },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Critical events timeline
    const criticalEvents = await Alert.find({
      severity: 'CRITICAL',
      createdAt: { $gte: startTime }
    })
      .populate('firefighterId', 'name position')
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.json({
      success: true,
      data: {
        period,
        timeRange: {
          start: startTime,
          end: now
        },
        sensorAnalytics,
        alertAnalytics,
        criticalEvents
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/dashboard/map-data
 * Get firefighter location data for map display
 */
router.get('/map-data', authenticate, async (req, res, next) => {
  try {
    // Get active firefighters with their latest sensor data
    const firefighters = await Firefighter.find({ 
      status: 'active', 
      isOnDuty: true 
    }).select('_id name position department');
    
    const mapData = await Promise.all(
      firefighters.map(async (firefighter) => {
        const latestSensor = await SensorData.findOne({
          firefighterId: firefighter._id
        })
          .sort({ timestamp: -1 })
          .select('location heartRate temperature airQuality timestamp');
        
        const activeAlerts = await Alert.find({
          firefighterId: firefighter._id,
          status: 'active'
        }).select('severity type');
        
        return {
          id: firefighter._id,
          name: firefighter.name,
          position: firefighter.position,
          department: firefighter.department,
          location: latestSensor?.location || null,
          vitals: latestSensor ? {
            heartRate: latestSensor.heartRate,
            temperature: latestSensor.temperature,
            airQuality: latestSensor.airQuality
          } : null,
          alerts: activeAlerts,
          lastUpdate: latestSensor?.timestamp || null,
          status: getFirefighterStatus(latestSensor, activeAlerts)
        };
      })
    );
    
    // Filter out firefighters without location data
    const firefightersWithLocation = mapData.filter(f => f.location);
    
    res.json({
      success: true,
      data: {
        firefighters: firefightersWithLocation,
        total: firefighters.length,
        withLocation: firefightersWithLocation.length,
        lastUpdated: new Date()
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/dashboard/alerts-summary
 * Get detailed alerts summary for dashboard
 */
router.get('/alerts-summary', authenticate, async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    
    // Get recent active alerts
    const recentAlerts = await Alert.find({ status: 'active' })
      .populate('firefighterId', 'name position department')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    // Get alert trends (last 24 hours by hour)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const alertTrends = await Alert.aggregate([
      {
        $match: {
          createdAt: { $gte: oneDayAgo }
        }
      },
      {
        $group: {
          _id: {
            hour: { $hour: '$createdAt' },
            severity: '$severity'
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.hour': 1 }
      }
    ]);
    
    // Get top alert types
    const topAlertTypes = await Alert.aggregate([
      {
        $match: {
          createdAt: { $gte: oneDayAgo }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          critical: {
            $sum: { $cond: [{ $eq: ['$severity', 'CRITICAL'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      }
    ]);
    
    res.json({
      success: true,
      data: {
        recentAlerts,
        alertTrends,
        topAlertTypes
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * Helper function to determine firefighter status
 */
function getFirefighterStatus(sensorData, alerts) {
  if (!sensorData) {
    return 'OFFLINE';
  }
  
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  if (sensorData.timestamp < fiveMinutesAgo) {
    return 'DISCONNECTED';
  }
  
  const criticalAlerts = alerts.filter(alert => alert.severity === 'CRITICAL');
  if (criticalAlerts.length > 0) {
    return 'CRITICAL';
  }
  
  const highAlerts = alerts.filter(alert => alert.severity === 'HIGH');
  if (highAlerts.length > 0) {
    return 'WARNING';
  }
  
  return 'NORMAL';
}

export default router;
