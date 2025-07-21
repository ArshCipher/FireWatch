/**
 * 🔥 Monitoring Service
 * 
 * Advanced monitoring and health assessment service
 */

import { EventEmitter } from 'events';
import { SensorData } from '../models/SensorData.js';
import { Firefighter } from '../models/Firefighter.js';
import { Alert } from '../models/Alert.js';
import { logSystemEvent, logger } from '../middleware/logger.js';

class MonitoringService extends EventEmitter {
  constructor() {
    super();
    this.monitoringIntervals = new Map();
    this.healthProfiles = new Map();
    this.riskAssessments = new Map();
    this.stats = {
      activeMonitoring: 0,
      healthAssessments: 0,
      riskAlertsGenerated: 0
    };
  }

  /**
   * Start the monitoring service
   */
  start() {
    logSystemEvent('MONITORING_SERVICE_STARTED', {});
    
    // Check firefighter health every 30 seconds
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, 30000);
    
    // Update risk assessments every 2 minutes
    this.riskAssessmentInterval = setInterval(() => {
      this.updateRiskAssessments();
    }, 120000);
    
    // Cleanup stale data every 10 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupStaleData();
    }, 600000);
    
    logger.info('Monitoring Service started');
  }

  /**
   * Stop the monitoring service
   */
  stop() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    if (this.riskAssessmentInterval) {
      clearInterval(this.riskAssessmentInterval);
    }
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    // Clear individual monitoring intervals
    for (const [firefighterId, intervalId] of this.monitoringIntervals) {
      clearInterval(intervalId);
    }
    this.monitoringIntervals.clear();
    
    logSystemEvent('MONITORING_SERVICE_STOPPED', {});
    logger.info('Monitoring Service stopped');
  }

  /**
   * Start monitoring a specific firefighter
   */
  startFirefighterMonitoring(firefighterId, monitoringProfile = {}) {
    if (this.monitoringIntervals.has(firefighterId)) {
      logger.debug('Firefighter already being monitored', { firefighterId });
      return;
    }

    const profile = {
      firefighterId,
      startTime: new Date(),
      intervalMinutes: monitoringProfile.intervalMinutes || 1,
      alertThresholds: monitoringProfile.alertThresholds || this.getDefaultThresholds(),
      healthBaseline: null,
      lastAssessment: null,
      ...monitoringProfile
    };

    this.healthProfiles.set(firefighterId, profile);
    
    // Set up periodic monitoring
    const intervalId = setInterval(() => {
      this.monitorFirefighter(firefighterId);
    }, profile.intervalMinutes * 60 * 1000);
    
    this.monitoringIntervals.set(firefighterId, intervalId);
    this.stats.activeMonitoring++;
    
    logSystemEvent('FIREFIGHTER_MONITORING_STARTED', { 
      firefighterId,
      intervalMinutes: profile.intervalMinutes
    });
    
    logger.info('Started monitoring firefighter', { 
      firefighterId,
      intervalMinutes: profile.intervalMinutes
    });
  }

  /**
   * Stop monitoring a specific firefighter
   */
  stopFirefighterMonitoring(firefighterId) {
    const intervalId = this.monitoringIntervals.get(firefighterId);
    if (intervalId) {
      clearInterval(intervalId);
      this.monitoringIntervals.delete(firefighterId);
      this.stats.activeMonitoring--;
    }
    
    this.healthProfiles.delete(firefighterId);
    this.riskAssessments.delete(firefighterId);
    
    logSystemEvent('FIREFIGHTER_MONITORING_STOPPED', { firefighterId });
    logger.info('Stopped monitoring firefighter', { firefighterId });
  }

  /**
   * Monitor individual firefighter
   */
  async monitorFirefighter(firefighterId) {
    try {
      const profile = this.healthProfiles.get(firefighterId);
      if (!profile) return;

      // Get latest sensor data
      const latestData = await SensorData.findOne({ 
        firefighterId 
      }).sort({ timestamp: -1 });

      if (!latestData) {
        logger.debug('No sensor data available for firefighter', { firefighterId });
        return;
      }

      // Check if data is recent (within last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (latestData.timestamp < fiveMinutesAgo) {
        this.handleStaleData(firefighterId, latestData.timestamp);
        return;
      }

      // Perform health assessment
      const assessment = await this.performHealthAssessment(firefighterId, latestData);
      
      // Update profile
      profile.lastAssessment = assessment;
      profile.lastDataTimestamp = latestData.timestamp;
      
      // Check for alerts
      await this.checkMonitoringAlerts(firefighterId, assessment, latestData);
      
      // Emit monitoring update
      this.emit('monitoringUpdate', {
        firefighterId,
        assessment,
        sensorData: latestData,
        profile
      });

    } catch (error) {
      logger.error('Error monitoring firefighter', { 
        error: error.message, 
        firefighterId 
      });
    }
  }

  /**
   * Perform comprehensive health assessment
   */
  async performHealthAssessment(firefighterId, currentData) {
    try {
      // Get historical data (last 30 minutes)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      const historicalData = await SensorData.find({
        firefighterId,
        timestamp: { $gte: thirtyMinutesAgo }
      }).sort({ timestamp: 1 });

      if (historicalData.length === 0) {
        return this.getBasicAssessment(currentData);
      }

      // Calculate trends and patterns
      const trends = this.calculateTrends(historicalData);
      const patterns = this.analyzePatterns(historicalData);
      const riskFactors = this.identifyRiskFactors(currentData, trends, patterns);
      
      // Calculate overall health score
      const healthScore = this.calculateHealthScore(currentData, trends, riskFactors);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(riskFactors, trends);
      
      const assessment = {
        firefighterId,
        timestamp: new Date(),
        currentVitals: {
          heartRate: currentData.heartRate,
          temperature: currentData.temperature,
          airQuality: currentData.airQuality
        },
        trends,
        patterns,
        riskFactors,
        healthScore,
        recommendations,
        dataQuality: this.assessDataQuality(historicalData),
        alertLevel: this.determineAlertLevel(healthScore, riskFactors)
      };

      this.stats.healthAssessments++;
      return assessment;

    } catch (error) {
      logger.error('Error performing health assessment', { 
        error: error.message, 
        firefighterId 
      });
      return this.getBasicAssessment(currentData);
    }
  }

  /**
   * Calculate trends from historical data
   */
  calculateTrends(historicalData) {
    if (historicalData.length < 2) {
      return { heartRate: 'STABLE', temperature: 'STABLE', airQuality: 'STABLE' };
    }

    const calculateTrend = (values) => {
      const first = values.slice(0, Math.floor(values.length / 3));
      const last = values.slice(-Math.floor(values.length / 3));
      
      const firstAvg = first.reduce((sum, val) => sum + val, 0) / first.length;
      const lastAvg = last.reduce((sum, val) => sum + val, 0) / last.length;
      
      const changePercent = ((lastAvg - firstAvg) / firstAvg) * 100;
      
      if (changePercent > 10) return 'INCREASING';
      if (changePercent < -10) return 'DECREASING';
      return 'STABLE';
    };

    return {
      heartRate: calculateTrend(historicalData.map(d => d.heartRate)),
      temperature: calculateTrend(historicalData.map(d => d.temperature)),
      airQuality: calculateTrend(historicalData.map(d => d.airQuality)),
      dataPoints: historicalData.length
    };
  }

  /**
   * Analyze patterns in the data
   */
  analyzePatterns(historicalData) {
    const patterns = {
      heartRateVariability: this.calculateHeartRateVariability(historicalData),
      temperatureSpikes: this.detectTemperatureSpikes(historicalData),
      airQualityDrops: this.detectAirQualityDrops(historicalData),
      correlations: this.findCorrelations(historicalData)
    };

    return patterns;
  }

  /**
   * Identify risk factors
   */
  identifyRiskFactors(currentData, trends, patterns) {
    const riskFactors = [];
    
    // Heart rate risks
    if (currentData.heartRate > 180) {
      riskFactors.push({
        type: 'HIGH_HEART_RATE',
        severity: currentData.heartRate > 200 ? 'CRITICAL' : 'HIGH',
        value: currentData.heartRate,
        threshold: 180
      });
    }
    
    if (trends.heartRate === 'INCREASING') {
      riskFactors.push({
        type: 'INCREASING_HEART_RATE_TREND',
        severity: 'MEDIUM',
        description: 'Heart rate showing upward trend'
      });
    }

    // Temperature risks
    if (currentData.temperature > 50) {
      riskFactors.push({
        type: 'HIGH_TEMPERATURE_EXPOSURE',
        severity: currentData.temperature > 60 ? 'CRITICAL' : 'HIGH',
        value: currentData.temperature,
        threshold: 50
      });
    }

    // Air quality risks
    if (currentData.airQuality < 30) {
      riskFactors.push({
        type: 'POOR_AIR_QUALITY',
        severity: currentData.airQuality < 15 ? 'CRITICAL' : 'HIGH',
        value: currentData.airQuality,
        threshold: 30
      });
    }

    // Pattern-based risks
    if (patterns.heartRateVariability.level === 'LOW') {
      riskFactors.push({
        type: 'LOW_HEART_RATE_VARIABILITY',
        severity: 'MEDIUM',
        description: 'Possible fatigue or stress indicator'
      });
    }

    return riskFactors;
  }

  /**
   * Calculate overall health score (0-100)
   */
  calculateHealthScore(currentData, trends, riskFactors) {
    let score = 100;
    
    // Deduct points for current vital signs
    if (currentData.heartRate > 180) score -= 20;
    else if (currentData.heartRate > 160) score -= 10;
    
    if (currentData.temperature > 50) score -= 15;
    else if (currentData.temperature > 40) score -= 5;
    
    if (currentData.airQuality < 30) score -= 15;
    else if (currentData.airQuality < 50) score -= 5;
    
    // Deduct points for negative trends
    const negativelyTrends = ['INCREASING'].includes(trends.heartRate) ? 1 : 0;
    score -= negativelyTrends * 5;
    
    // Deduct points for risk factors
    const criticalRisks = riskFactors.filter(r => r.severity === 'CRITICAL').length;
    const highRisks = riskFactors.filter(r => r.severity === 'HIGH').length;
    const mediumRisks = riskFactors.filter(r => r.severity === 'MEDIUM').length;
    
    score -= criticalRisks * 25;
    score -= highRisks * 15;
    score -= mediumRisks * 5;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate personalized recommendations
   */
  generateRecommendations(riskFactors, trends) {
    const recommendations = [];
    
    // Critical recommendations
    const criticalRisks = riskFactors.filter(r => r.severity === 'CRITICAL');
    if (criticalRisks.length > 0) {
      recommendations.push({
        priority: 'IMMEDIATE',
        action: 'EMERGENCY_RESPONSE',
        description: 'Critical vital signs detected - immediate intervention required'
      });
    }
    
    // Heart rate recommendations
    const heartRateRisks = riskFactors.filter(r => r.type.includes('HEART_RATE'));
    if (heartRateRisks.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        action: 'REDUCE_PHYSICAL_ACTIVITY',
        description: 'Reduce physical exertion and monitor heart rate closely'
      });
    }
    
    // Temperature recommendations
    const tempRisks = riskFactors.filter(r => r.type.includes('TEMPERATURE'));
    if (tempRisks.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        action: 'COOLING_PROTOCOL',
        description: 'Implement cooling measures and increase hydration'
      });
    }
    
    // Air quality recommendations
    const airRisks = riskFactors.filter(r => r.type.includes('AIR_QUALITY'));
    if (airRisks.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        action: 'CHECK_BREATHING_APPARATUS',
        description: 'Verify SCBA functionality and consider area evacuation'
      });
    }
    
    // Trend-based recommendations
    if (trends.heartRate === 'INCREASING') {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'MONITOR_WORKLOAD',
        description: 'Monitor workload and consider rest periods'
      });
    }
    
    return recommendations;
  }

  /**
   * Perform health checks for all active firefighters
   */
  async performHealthChecks() {
    const activeFirefighters = await Firefighter.find({ 
      status: 'active',
      isOnDuty: true 
    }).select('_id');

    for (const firefighter of activeFirefighters) {
      if (!this.monitoringIntervals.has(firefighter._id.toString())) {
        // Start monitoring if not already active
        this.startFirefighterMonitoring(firefighter._id.toString());
      }
    }
  }

  /**
   * Update risk assessments
   */
  async updateRiskAssessments() {
    for (const [firefighterId, profile] of this.healthProfiles) {
      try {
        const riskAssessment = await this.calculateRiskAssessment(firefighterId);
        this.riskAssessments.set(firefighterId, riskAssessment);
        
        // Emit risk assessment update
        this.emit('riskAssessmentUpdate', {
          firefighterId,
          riskAssessment
        });
        
      } catch (error) {
        logger.error('Error updating risk assessment', { 
          error: error.message, 
          firefighterId 
        });
      }
    }
  }

  /**
   * Calculate comprehensive risk assessment
   */
  async calculateRiskAssessment(firefighterId) {
    const profile = this.healthProfiles.get(firefighterId);
    if (!profile || !profile.lastAssessment) {
      return { overall: 'UNKNOWN', factors: [], score: 0 };
    }

    const assessment = profile.lastAssessment;
    const riskScore = 100 - assessment.healthScore;
    
    let overall;
    if (riskScore >= 75) overall = 'CRITICAL';
    else if (riskScore >= 50) overall = 'HIGH';
    else if (riskScore >= 25) overall = 'MEDIUM';
    else overall = 'LOW';
    
    return {
      overall,
      score: riskScore,
      factors: assessment.riskFactors,
      recommendations: assessment.recommendations,
      lastUpdated: new Date(),
      healthScore: assessment.healthScore
    };
  }

  /**
   * Handle stale data detection
   */
  handleStaleData(firefighterId, lastDataTimestamp) {
    const profile = this.healthProfiles.get(firefighterId);
    if (!profile) return;

    const minutesSinceLastData = (Date.now() - lastDataTimestamp) / (1000 * 60);
    
    if (minutesSinceLastData > 10) {
      // Generate communication lost alert
      this.emit('communicationLost', {
        firefighterId,
        lastDataTimestamp,
        minutesSinceLastData
      });
    }
  }

  /**
   * Check for monitoring alerts
   */
  async checkMonitoringAlerts(firefighterId, assessment, sensorData) {
    const alertThresholds = this.healthProfiles.get(firefighterId)?.alertThresholds;
    if (!alertThresholds) return;

    // Check if health score dropped significantly
    if (assessment.healthScore < 50) {
      this.emit('healthScoreAlert', {
        firefighterId,
        healthScore: assessment.healthScore,
        riskFactors: assessment.riskFactors,
        sensorData
      });
      this.stats.riskAlertsGenerated++;
    }

    // Check for critical risk factors
    const criticalRisks = assessment.riskFactors.filter(r => r.severity === 'CRITICAL');
    if (criticalRisks.length > 0) {
      this.emit('criticalRiskAlert', {
        firefighterId,
        riskFactors: criticalRisks,
        sensorData
      });
      this.stats.riskAlertsGenerated++;
    }
  }

  /**
   * Clean up stale data and inactive monitoring
   */
  cleanupStaleData() {
    const now = new Date();
    const staleThreshold = 60 * 60 * 1000; // 1 hour
    
    for (const [firefighterId, profile] of this.healthProfiles) {
      if (profile.lastDataTimestamp && (now - profile.lastDataTimestamp) > staleThreshold) {
        logger.info('Cleaning up stale monitoring profile', { firefighterId });
        this.stopFirefighterMonitoring(firefighterId);
      }
    }
  }

  /**
   * Helper methods
   */
  getBasicAssessment(currentData) {
    return {
      timestamp: new Date(),
      currentVitals: {
        heartRate: currentData.heartRate,
        temperature: currentData.temperature,
        airQuality: currentData.airQuality
      },
      trends: { heartRate: 'UNKNOWN', temperature: 'UNKNOWN', airQuality: 'UNKNOWN' },
      patterns: {},
      riskFactors: [],
      healthScore: 75, // Default moderate score
      recommendations: [],
      dataQuality: 'INSUFFICIENT',
      alertLevel: 'NORMAL'
    };
  }

  getDefaultThresholds() {
    return {
      heartRate: { warning: 160, critical: 180 },
      temperature: { warning: 40, critical: 50 },
      airQuality: { warning: 50, critical: 30 }
    };
  }

  calculateHeartRateVariability(data) {
    const heartRates = data.map(d => d.heartRate);
    const differences = [];
    
    for (let i = 1; i < heartRates.length; i++) {
      differences.push(Math.abs(heartRates[i] - heartRates[i - 1]));
    }
    
    const avgDiff = differences.reduce((sum, diff) => sum + diff, 0) / differences.length;
    
    return {
      value: avgDiff,
      level: avgDiff > 10 ? 'HIGH' : avgDiff > 5 ? 'NORMAL' : 'LOW'
    };
  }

  detectTemperatureSpikes(data) {
    const temperatures = data.map(d => d.temperature);
    const spikes = [];
    
    for (let i = 1; i < temperatures.length - 1; i++) {
      const current = temperatures[i];
      const prev = temperatures[i - 1];
      const next = temperatures[i + 1];
      
      if (current > prev + 5 && current > next + 5) {
        spikes.push({ index: i, value: current, timestamp: data[i].timestamp });
      }
    }
    
    return spikes;
  }

  detectAirQualityDrops(data) {
    const airQualities = data.map(d => d.airQuality);
    const drops = [];
    
    for (let i = 1; i < airQualities.length; i++) {
      const current = airQualities[i];
      const prev = airQualities[i - 1];
      
      if (prev - current > 15) { // Significant drop
        drops.push({ index: i, drop: prev - current, timestamp: data[i].timestamp });
      }
    }
    
    return drops;
  }

  findCorrelations(data) {
    // Simplified correlation analysis
    return {
      heartRateTemperature: 'POSITIVE', // Placeholder
      heartRateAirQuality: 'NEGATIVE'   // Placeholder
    };
  }

  assessDataQuality(data) {
    if (data.length < 5) return 'INSUFFICIENT';
    if (data.length < 15) return 'LIMITED';
    return 'GOOD';
  }

  determineAlertLevel(healthScore, riskFactors) {
    const criticalRisks = riskFactors.filter(r => r.severity === 'CRITICAL').length;
    const highRisks = riskFactors.filter(r => r.severity === 'HIGH').length;
    
    if (criticalRisks > 0 || healthScore < 25) return 'CRITICAL';
    if (highRisks > 0 || healthScore < 50) return 'HIGH';
    if (healthScore < 75) return 'MEDIUM';
    return 'NORMAL';
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      ...this.stats,
      activeProfiles: this.healthProfiles.size,
      activeRiskAssessments: this.riskAssessments.size
    };
  }

  /**
   * Get monitoring status for a firefighter
   */
  getFirefighterStatus(firefighterId) {
    const profile = this.healthProfiles.get(firefighterId);
    const riskAssessment = this.riskAssessments.get(firefighterId);
    
    return {
      isMonitored: !!profile,
      profile,
      riskAssessment,
      lastUpdate: profile?.lastAssessment?.timestamp || null
    };
  }
}

// Create singleton instance
const monitoringService = new MonitoringService();

// Export start function as expected by server.js
export const startMonitoringService = (io) => {
  monitoringService.io = io; // Store io reference for real-time updates
  monitoringService.start();
  return monitoringService;
};

export default monitoringService;
