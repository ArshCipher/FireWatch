/**
 * 🔥 Data Processing Service
 * 
 * Processes incoming sensor data and applies scientific algorithms
 */

import { EventEmitter } from 'events';
import { SensorData } from '../models/SensorData.js';
import { Alert } from '../models/Alert.js';
import { logSystemEvent, logger } from '../middleware/logger.js';

class DataProcessingService extends EventEmitter {
  constructor() {
    super();
    this.processingQueue = [];
    this.isProcessing = false;
    this.stats = {
      processed: 0,
      errors: 0,
      avgProcessingTime: 0
    };
  }

  /**
   * Start the data processing service
   */
  start() {
    logSystemEvent('DATA_PROCESSING_SERVICE_STARTED', {});
    
    // Process queue every 100ms
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 100);
    
    logger.info('Data Processing Service started');
  }

  /**
   * Stop the data processing service
   */
  stop() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    
    logSystemEvent('DATA_PROCESSING_SERVICE_STOPPED', {});
    logger.info('Data Processing Service stopped');
  }

  /**
   * Add sensor data to processing queue
   */
  addToQueue(sensorData) {
    this.processingQueue.push({
      data: sensorData,
      timestamp: new Date()
    });
  }

  /**
   * Process the queue
   */
  async processQueue() {
    if (this.isProcessing || this.processingQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const startTime = Date.now();

    try {
      const item = this.processingQueue.shift();
      await this.processSensorData(item.data);
      
      this.stats.processed++;
      this.updateAvgProcessingTime(Date.now() - startTime);
      
    } catch (error) {
      this.stats.errors++;
      logger.error('Error processing sensor data', { error: error.message });
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process individual sensor data
   */
  async processSensorData(sensorData) {
    // Apply evidence-based algorithms
    const analysis = this.analyzeVitalSigns(sensorData);
    
    // Check for alerts
    const alerts = await this.checkForAlerts(sensorData, analysis);
    
    // Emit processed data event
    this.emit('dataProcessed', {
      sensorData,
      analysis,
      alerts
    });

    return { analysis, alerts };
  }

  /**
   * Analyze vital signs using evidence-based algorithms
   */
  analyzeVitalSigns(sensorData) {
    const { heartRate, temperature, airQuality } = sensorData;
    
    const analysis = {
      heartRate: this.analyzeHeartRate(heartRate),
      temperature: this.analyzeTemperature(temperature),
      airQuality: this.analyzeAirQuality(airQuality),
      overall: 'NORMAL'
    };

    // Determine overall status
    const riskLevels = [
      analysis.heartRate.riskLevel,
      analysis.temperature.riskLevel,
      analysis.airQuality.riskLevel
    ];

    if (riskLevels.includes('CRITICAL')) {
      analysis.overall = 'CRITICAL';
    } else if (riskLevels.includes('HIGH')) {
      analysis.overall = 'HIGH_RISK';
    } else if (riskLevels.includes('MEDIUM')) {
      analysis.overall = 'MODERATE_RISK';
    }

    return analysis;
  }

  /**
   * Analyze heart rate based on evidence-based thresholds
   */
  analyzeHeartRate(heartRate) {
    let riskLevel = 'NORMAL';
    let recommendation = '';
    const zones = this.getHeartRateZones();

    if (heartRate > 200) {
      riskLevel = 'CRITICAL';
      recommendation = 'IMMEDIATE_MEDICAL_ATTENTION';
    } else if (heartRate > 180) {
      riskLevel = 'HIGH';
      recommendation = 'REDUCE_ACTIVITY_IMMEDIATELY';
    } else if (heartRate > 160) {
      riskLevel = 'MEDIUM';
      recommendation = 'MONITOR_CLOSELY';
    } else if (heartRate < 50) {
      riskLevel = 'HIGH';
      recommendation = 'CHECK_CONSCIOUSNESS_LEVEL';
    }

    return {
      value: heartRate,
      riskLevel,
      recommendation,
      zone: this.getHeartRateZone(heartRate, zones),
      percentageOfMax: Math.round((heartRate / 220) * 100) // Simplified max HR calculation
    };
  }

  /**
   * Analyze environmental temperature
   */
  analyzeTemperature(temperature) {
    let riskLevel = 'NORMAL';
    let recommendation = '';

    if (temperature > 60) {
      riskLevel = 'CRITICAL';
      recommendation = 'EVACUATE_IMMEDIATELY';
    } else if (temperature > 50) {
      riskLevel = 'HIGH';
      recommendation = 'LIMIT_EXPOSURE_TIME';
    } else if (temperature > 40) {
      riskLevel = 'MEDIUM';
      recommendation = 'INCREASE_HYDRATION';
    }

    return {
      value: temperature,
      riskLevel,
      recommendation,
      heatStressIndex: this.calculateHeatStressIndex(temperature)
    };
  }

  /**
   * Analyze air quality
   */
  analyzeAirQuality(airQuality) {
    let riskLevel = 'NORMAL';
    let recommendation = '';

    if (airQuality < 15) {
      riskLevel = 'CRITICAL';
      recommendation = 'CHECK_SCBA_IMMEDIATELY';
    } else if (airQuality < 30) {
      riskLevel = 'HIGH';
      recommendation = 'ENSURE_PROPER_VENTILATION';
    } else if (airQuality < 50) {
      riskLevel = 'MEDIUM';
      recommendation = 'MONITOR_RESPIRATORY_STATUS';
    }

    return {
      value: airQuality,
      riskLevel,
      recommendation,
      classification: this.getAirQualityClassification(airQuality)
    };
  }

  /**
   * Check for alert conditions
   */
  async checkForAlerts(sensorData, analysis) {
    const alerts = [];

    // Critical heart rate alert
    if (analysis.heartRate.riskLevel === 'CRITICAL') {
      alerts.push({
        type: 'CRITICAL_HEART_RATE',
        severity: 'CRITICAL',
        message: `Critical heart rate detected: ${sensorData.heartRate} BPM`,
        recommendation: analysis.heartRate.recommendation
      });
    }

    // High temperature alert
    if (analysis.temperature.riskLevel === 'CRITICAL') {
      alerts.push({
        type: 'EXTREME_TEMPERATURE',
        severity: 'CRITICAL',
        message: `Extreme temperature exposure: ${sensorData.temperature}°C`,
        recommendation: analysis.temperature.recommendation
      });
    }

    // Poor air quality alert
    if (analysis.airQuality.riskLevel === 'CRITICAL') {
      alerts.push({
        type: 'CRITICAL_AIR_QUALITY',
        severity: 'CRITICAL',
        message: `Critical air quality detected: ${sensorData.airQuality}%`,
        recommendation: analysis.airQuality.recommendation
      });
    }

    return alerts;
  }

  /**
   * Get heart rate zones based on scientific evidence
   */
  getHeartRateZones() {
    return {
      resting: { min: 60, max: 100 },
      light: { min: 101, max: 140 },
      moderate: { min: 141, max: 160 },
      vigorous: { min: 161, max: 180 },
      maximum: { min: 181, max: 220 }
    };
  }

  /**
   * Determine heart rate zone
   */
  getHeartRateZone(heartRate, zones) {
    if (heartRate <= zones.resting.max) return 'resting';
    if (heartRate <= zones.light.max) return 'light';
    if (heartRate <= zones.moderate.max) return 'moderate';
    if (heartRate <= zones.vigorous.max) return 'vigorous';
    return 'maximum';
  }

  /**
   * Calculate heat stress index
   */
  calculateHeatStressIndex(temperature) {
    // Simplified heat stress calculation
    if (temperature < 25) return 'LOW';
    if (temperature < 35) return 'MODERATE';
    if (temperature < 45) return 'HIGH';
    if (temperature < 55) return 'VERY_HIGH';
    return 'EXTREME';
  }

  /**
   * Get air quality classification
   */
  getAirQualityClassification(airQuality) {
    if (airQuality >= 80) return 'EXCELLENT';
    if (airQuality >= 60) return 'GOOD';
    if (airQuality >= 40) return 'MODERATE';
    if (airQuality >= 20) return 'POOR';
    return 'HAZARDOUS';
  }

  /**
   * Update average processing time
   */
  updateAvgProcessingTime(processingTime) {
    const weight = 0.1; // Exponential moving average weight
    this.stats.avgProcessingTime = 
      (this.stats.avgProcessingTime * (1 - weight)) + (processingTime * weight);
  }

  /**
   * Get processing statistics
   */
  getStats() {
    return {
      ...this.stats,
      queueLength: this.processingQueue.length,
      isProcessing: this.isProcessing
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      processed: 0,
      errors: 0,
      avgProcessingTime: 0
    };
  }
}

// Create singleton instance
const dataProcessingService = new DataProcessingService();

// Export start function as expected by server.js
export const startDataProcessingService = (io) => {
  dataProcessingService.io = io; // Store io reference for real-time updates
  dataProcessingService.start();
  return dataProcessingService;
};

export default dataProcessingService;
