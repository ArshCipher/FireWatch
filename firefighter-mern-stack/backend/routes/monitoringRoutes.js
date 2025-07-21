/**
 * 🔥 Monitoring Routes
 * 
 * Advanced monitoring features and evidence-based analytics
 */

import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { Firefighter } from '../models/Firefighter.js';
import { SensorData } from '../models/SensorData.js';
import { Alert } from '../models/Alert.js';
import { logDatabaseOperation, logSystemEvent, logger } from '../middleware/logger.js';

const router = express.Router();

/**
 * GET /api/monitoring/health-assessment/:id
 * Comprehensive health assessment for a firefighter
 */
router.get('/health-assessment/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { timeframe = '24h' } = req.query;
    
    // Calculate time range
    const now = new Date();
    let startTime;
    
    switch (timeframe) {
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
    
    // Get firefighter info
    const firefighter = await Firefighter.findById(id);
    if (!firefighter) {
      return res.status(404).json({
        success: false,
        message: 'Firefighter not found'
      });
    }
    
    // Get sensor data in timeframe
    const sensorData = await SensorData.find({
      firefighterId: id,
      timestamp: { $gte: startTime }
    }).sort({ timestamp: 1 });
    
    if (sensorData.length === 0) {
      return res.json({
        success: true,
        data: {
          firefighter,
          assessment: 'NO_DATA',
          message: 'No sensor data available for the specified timeframe'
        }
      });
    }
    
    // Calculate health metrics
    const healthMetrics = calculateHealthMetrics(sensorData);
    
    // Risk assessment based on evidence-based thresholds
    const riskAssessment = performRiskAssessment(healthMetrics, firefighter);
    
    // Get related alerts
    const alerts = await Alert.find({
      firefighterId: id,
      createdAt: { $gte: startTime }
    }).sort({ createdAt: -1 });
    
    // Generate recommendations
    const recommendations = generateHealthRecommendations(healthMetrics, riskAssessment, alerts);
    
    res.json({
      success: true,
      data: {
        firefighter,
        timeframe,
        dataPoints: sensorData.length,
        healthMetrics,
        riskAssessment,
        recommendations,
        alerts: alerts.slice(0, 5), // Latest 5 alerts
        lastUpdated: now
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/monitoring/fatigue-analysis/:id
 * Fatigue and stress analysis
 */
router.get('/fatigue-analysis/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { hours = 8 } = req.query;
    
    const startTime = new Date(Date.now() - parseInt(hours) * 60 * 60 * 1000);
    
    const sensorData = await SensorData.find({
      firefighterId: id,
      timestamp: { $gte: startTime }
    }).sort({ timestamp: 1 });
    
    if (sensorData.length < 10) {
      return res.json({
        success: true,
        data: {
          analysis: 'INSUFFICIENT_DATA',
          message: 'Need at least 10 data points for fatigue analysis'
        }
      });
    }
    
    const fatigueAnalysis = calculateFatigueIndicators(sensorData);
    const stressAnalysis = calculateStressIndicators(sensorData);
    
    res.json({
      success: true,
      data: {
        firefighterId: id,
        timeframe: `${hours}h`,
        fatigueAnalysis,
        stressAnalysis,
        overallAssessment: combineFatigueStressAssessment(fatigueAnalysis, stressAnalysis),
        recommendations: generateFatigueRecommendations(fatigueAnalysis, stressAnalysis)
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/monitoring/environmental-exposure/:id
 * Environmental exposure analysis
 */
router.get('/environmental-exposure/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { timeframe = '24h' } = req.query;
    
    const now = new Date();
    let startTime;
    
    switch (timeframe) {
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
    
    const sensorData = await SensorData.find({
      firefighterId: id,
      timestamp: { $gte: startTime }
    }).sort({ timestamp: 1 });
    
    const exposureAnalysis = calculateEnvironmentalExposure(sensorData);
    const riskLevels = assessExposureRisks(exposureAnalysis);
    
    res.json({
      success: true,
      data: {
        firefighterId: id,
        timeframe,
        exposureAnalysis,
        riskLevels,
        recommendations: generateExposureRecommendations(exposureAnalysis, riskLevels)
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/monitoring/team-health
 * Team-wide health monitoring
 */
router.get('/team-health', authenticate, authorize(['admin', 'commander']), async (req, res, next) => {
  try {
    const { department } = req.query;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    // Get active firefighters
    let query = { status: 'active', isOnDuty: true };
    if (department) query.department = department;
    
    const activeFirefighters = await Firefighter.find(query);
    
    const teamHealth = await Promise.all(
      activeFirefighters.map(async (firefighter) => {
        const latestSensor = await SensorData.findOne({
          firefighterId: firefighter._id
        }).sort({ timestamp: -1 });
        
        const recentData = await SensorData.find({
          firefighterId: firefighter._id,
          timestamp: { $gte: oneHourAgo }
        });
        
        const activeAlerts = await Alert.find({
          firefighterId: firefighter._id,
          status: 'active'
        });
        
        const healthStatus = assessIndividualHealth(latestSensor, recentData, activeAlerts);
        
        return {
          firefighter: {
            id: firefighter._id,
            name: firefighter.name,
            position: firefighter.position,
            department: firefighter.department
          },
          healthStatus,
          lastUpdate: latestSensor?.timestamp || null,
          alertCount: activeAlerts.length,
          criticalAlerts: activeAlerts.filter(a => a.severity === 'CRITICAL').length
        };
      })
    );
    
    // Calculate team statistics
    const teamStats = calculateTeamStatistics(teamHealth);
    
    res.json({
      success: true,
      data: {
        teamHealth,
        teamStats,
        department: department || 'All Departments',
        lastUpdated: new Date()
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/monitoring/manual-assessment
 * Submit manual health assessment
 */
router.post('/manual-assessment', authenticate, async (req, res, next) => {
  try {
    const {
      firefighterId,
      assessmentType,
      findings,
      recommendations,
      urgencyLevel
    } = req.body;
    
    // Verify firefighter exists
    const firefighter = await Firefighter.findById(firefighterId);
    if (!firefighter) {
      return res.status(404).json({
        success: false,
        message: 'Firefighter not found'
      });
    }
    
    // Create manual assessment alert
    const alert = new Alert({
      firefighterId,
      type: 'MANUAL_ASSESSMENT',
      severity: urgencyLevel,
      message: `Manual ${assessmentType} assessment: ${findings}`,
      metadata: {
        assessmentType,
        findings,
        recommendations,
        assessedBy: req.user.id
      },
      createdBy: req.user.id
    });
    
    await alert.save();
    
    logSystemEvent('MANUAL_ASSESSMENT_CREATED', {
      firefighterId,
      assessmentType,
      urgencyLevel,
      assessedBy: req.user.id
    });
    
    res.status(201).json({
      success: true,
      data: alert,
      message: 'Manual assessment recorded successfully'
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * Helper Functions
 */

function calculateHealthMetrics(sensorData) {
  if (sensorData.length === 0) return null;
  
  const heartRates = sensorData.map(d => d.heartRate).filter(hr => hr);
  const temperatures = sensorData.map(d => d.temperature).filter(t => t);
  const airQualities = sensorData.map(d => d.airQuality).filter(aq => aq);
  
  return {
    heartRate: {
      avg: heartRates.length ? heartRates.reduce((a, b) => a + b, 0) / heartRates.length : 0,
      min: heartRates.length ? Math.min(...heartRates) : 0,
      max: heartRates.length ? Math.max(...heartRates) : 0,
      trend: calculateTrend(heartRates)
    },
    temperature: {
      avg: temperatures.length ? temperatures.reduce((a, b) => a + b, 0) / temperatures.length : 0,
      min: temperatures.length ? Math.min(...temperatures) : 0,
      max: temperatures.length ? Math.max(...temperatures) : 0,
      timeAboveThreshold: calculateTimeAboveThreshold(sensorData, 'temperature', 50)
    },
    airQuality: {
      avg: airQualities.length ? airQualities.reduce((a, b) => a + b, 0) / airQualities.length : 0,
      min: airQualities.length ? Math.min(...airQualities) : 0,
      timeBelowThreshold: calculateTimeBelowThreshold(sensorData, 'airQuality', 30)
    }
  };
}

function performRiskAssessment(metrics, firefighter) {
  if (!metrics) return { overall: 'UNKNOWN', factors: [] };
  
  const riskFactors = [];
  let riskScore = 0;
  
  // Heart rate risks
  if (metrics.heartRate.max > 200) {
    riskFactors.push('EXTREME_HEART_RATE');
    riskScore += 3;
  } else if (metrics.heartRate.max > 180) {
    riskFactors.push('HIGH_HEART_RATE');
    riskScore += 2;
  }
  
  if (metrics.heartRate.avg > 150) {
    riskFactors.push('SUSTAINED_HIGH_HR');
    riskScore += 2;
  }
  
  // Temperature exposure risks
  if (metrics.temperature.timeAboveThreshold > 30) { // 30 minutes above 50°C
    riskFactors.push('PROLONGED_HEAT_EXPOSURE');
    riskScore += 2;
  }
  
  // Air quality risks
  if (metrics.airQuality.timeBelowThreshold > 15) { // 15 minutes below 30%
    riskFactors.push('POOR_AIR_EXPOSURE');
    riskScore += 2;
  }
  
  // Age factor (if available)
  const age = firefighter.age;
  if (age && age > 45) {
    riskScore += 1;
  }
  
  let overall;
  if (riskScore >= 5) overall = 'HIGH';
  else if (riskScore >= 3) overall = 'MEDIUM';
  else if (riskScore >= 1) overall = 'LOW';
  else overall = 'MINIMAL';
  
  return { overall, riskScore, factors: riskFactors };
}

function generateHealthRecommendations(metrics, riskAssessment, alerts) {
  const recommendations = [];
  
  if (riskAssessment.overall === 'HIGH') {
    recommendations.push({
      priority: 'URGENT',
      action: 'IMMEDIATE_REST',
      description: 'Firefighter requires immediate rest and medical evaluation'
    });
  }
  
  if (riskAssessment.factors.includes('EXTREME_HEART_RATE')) {
    recommendations.push({
      priority: 'HIGH',
      action: 'CARDIAC_MONITORING',
      description: 'Monitor heart rate closely and consider ECG evaluation'
    });
  }
  
  if (riskAssessment.factors.includes('PROLONGED_HEAT_EXPOSURE')) {
    recommendations.push({
      priority: 'HIGH',
      action: 'COOLING_PROTOCOL',
      description: 'Implement cooling measures and hydration protocol'
    });
  }
  
  if (riskAssessment.factors.includes('POOR_AIR_EXPOSURE')) {
    recommendations.push({
      priority: 'HIGH',
      action: 'RESPIRATORY_CHECK',
      description: 'Check respiratory equipment and consider oxygen therapy'
    });
  }
  
  return recommendations;
}

function calculateFatigueIndicators(sensorData) {
  // Heart rate variability decline indicates fatigue
  const hrVariability = calculateHRVariability(sensorData);
  const baselineHR = sensorData.slice(0, 10).reduce((sum, d) => sum + d.heartRate, 0) / 10;
  const recentHR = sensorData.slice(-10).reduce((sum, d) => sum + d.heartRate, 0) / 10;
  
  return {
    hrVariabilityTrend: hrVariability.trend,
    hrElevation: recentHR - baselineHR,
    fatigueScore: calculateFatigueScore(hrVariability, recentHR - baselineHR),
    recommendation: recentHR - baselineHR > 20 ? 'REST_RECOMMENDED' : 'CONTINUE_MONITORING'
  };
}

function calculateStressIndicators(sensorData) {
  // Stress indicators based on heart rate patterns
  const rapidHRChanges = countRapidHeartRateChanges(sensorData);
  const sustainedElevation = calculateSustainedElevation(sensorData);
  
  return {
    rapidChanges: rapidHRChanges,
    sustainedElevation,
    stressLevel: rapidHRChanges > 5 || sustainedElevation > 30 ? 'HIGH' : 'NORMAL'
  };
}

// Additional helper functions for calculations...
function calculateTrend(values) {
  if (values.length < 2) return 'STABLE';
  const first = values.slice(0, Math.floor(values.length / 3)).reduce((a, b) => a + b, 0) / Math.floor(values.length / 3);
  const last = values.slice(-Math.floor(values.length / 3)).reduce((a, b) => a + b, 0) / Math.floor(values.length / 3);
  
  if (last > first * 1.1) return 'INCREASING';
  if (last < first * 0.9) return 'DECREASING';
  return 'STABLE';
}

function calculateTimeAboveThreshold(data, field, threshold) {
  let timeAbove = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i][field] > threshold) {
      const timeDiff = (data[i].timestamp - data[i-1].timestamp) / (1000 * 60); // minutes
      timeAbove += timeDiff;
    }
  }
  return timeAbove;
}

function calculateTimeBelowThreshold(data, field, threshold) {
  let timeBelow = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i][field] < threshold) {
      const timeDiff = (data[i].timestamp - data[i-1].timestamp) / (1000 * 60); // minutes
      timeBelow += timeDiff;
    }
  }
  return timeBelow;
}

function calculateEnvironmentalExposure(sensorData) {
  return {
    heatExposure: calculateTimeAboveThreshold(sensorData, 'temperature', 50),
    extremeHeatExposure: calculateTimeAboveThreshold(sensorData, 'temperature', 60),
    poorAirExposure: calculateTimeBelowThreshold(sensorData, 'airQuality', 30),
    criticalAirExposure: calculateTimeBelowThreshold(sensorData, 'airQuality', 15)
  };
}

function assessExposureRisks(exposure) {
  const risks = [];
  
  if (exposure.extremeHeatExposure > 10) risks.push('CRITICAL_HEAT');
  else if (exposure.heatExposure > 30) risks.push('HIGH_HEAT');
  
  if (exposure.criticalAirExposure > 5) risks.push('CRITICAL_AIR');
  else if (exposure.poorAirExposure > 15) risks.push('HIGH_AIR');
  
  return risks;
}

function generateExposureRecommendations(exposure, risks) {
  const recommendations = [];
  
  if (risks.includes('CRITICAL_HEAT')) {
    recommendations.push('IMMEDIATE_COOLING_REQUIRED');
  }
  if (risks.includes('CRITICAL_AIR')) {
    recommendations.push('RESPIRATORY_SUPPORT_NEEDED');
  }
  
  return recommendations;
}

function assessIndividualHealth(latestSensor, recentData, alerts) {
  if (!latestSensor) return 'NO_DATA';
  
  const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL').length;
  if (criticalAlerts > 0) return 'CRITICAL';
  
  const highAlerts = alerts.filter(a => a.severity === 'HIGH').length;
  if (highAlerts > 0) return 'WARNING';
  
  if (recentData.length === 0) return 'STALE_DATA';
  
  return 'NORMAL';
}

function calculateTeamStatistics(teamHealth) {
  const total = teamHealth.length;
  const statusCounts = teamHealth.reduce((acc, member) => {
    acc[member.healthStatus] = (acc[member.healthStatus] || 0) + 1;
    return acc;
  }, {});
  
  return {
    total,
    statusBreakdown: statusCounts,
    criticalCount: statusCounts.CRITICAL || 0,
    warningCount: statusCounts.WARNING || 0,
    normalCount: statusCounts.NORMAL || 0
  };
}

function calculateHRVariability(sensorData) {
  // Simplified HRV calculation
  const heartRates = sensorData.map(d => d.heartRate);
  const differences = [];
  
  for (let i = 1; i < heartRates.length; i++) {
    differences.push(Math.abs(heartRates[i] - heartRates[i-1]));
  }
  
  const avgDiff = differences.reduce((a, b) => a + b, 0) / differences.length;
  return {
    variability: avgDiff,
    trend: avgDiff > 10 ? 'HIGH' : avgDiff > 5 ? 'NORMAL' : 'LOW'
  };
}

function calculateFatigueScore(hrVariability, hrElevation) {
  let score = 0;
  
  if (hrVariability.trend === 'LOW') score += 2;
  if (hrElevation > 20) score += 2;
  if (hrElevation > 30) score += 1;
  
  return score;
}

function countRapidHeartRateChanges(sensorData) {
  let rapidChanges = 0;
  for (let i = 1; i < sensorData.length; i++) {
    const change = Math.abs(sensorData[i].heartRate - sensorData[i-1].heartRate);
    if (change > 15) rapidChanges++;
  }
  return rapidChanges;
}

function calculateSustainedElevation(sensorData) {
  let sustainedMinutes = 0;
  const baseline = sensorData.slice(0, 5).reduce((sum, d) => sum + d.heartRate, 0) / 5;
  
  for (let i = 5; i < sensorData.length; i++) {
    if (sensorData[i].heartRate > baseline + 30) {
      sustainedMinutes += 1; // Assuming 1-minute intervals
    }
  }
  
  return sustainedMinutes;
}

function combineFatigueStressAssessment(fatigueAnalysis, stressAnalysis) {
  if (fatigueAnalysis.fatigueScore >= 4 || stressAnalysis.stressLevel === 'HIGH') {
    return 'HIGH_RISK';
  } else if (fatigueAnalysis.fatigueScore >= 2) {
    return 'MODERATE_RISK';
  }
  return 'LOW_RISK';
}

function generateFatigueRecommendations(fatigueAnalysis, stressAnalysis) {
  const recommendations = [];
  
  if (fatigueAnalysis.fatigueScore >= 4) {
    recommendations.push('MANDATORY_REST_PERIOD');
  } else if (fatigueAnalysis.fatigueScore >= 2) {
    recommendations.push('CONSIDER_ROTATION');
  }
  
  if (stressAnalysis.stressLevel === 'HIGH') {
    recommendations.push('STRESS_MANAGEMENT_INTERVENTION');
  }
  
  return recommendations;
}

export default router;
