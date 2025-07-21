/**
 * 🔥 Sensor Data Model - Real-time Physiological Monitoring
 * 
 * Handles real-time sensor data collection and storage
 * Implements evidence-based monitoring with quality assessment
 * 
 * Scientific Standards:
 * - NFPA 1582: Physiological monitoring standards
 * - Zhang et al. (2021): Firefighter monitoring research
 * - ACSM Guidelines: Exercise physiology standards
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;

// Environmental Data Schema
const EnvironmentalDataSchema = new Schema({
  ambientTemperature: {
    type: Number,
    min: -40,
    max: 60, // Celsius
    required: true
  },
  humidity: {
    type: Number,
    min: 0,
    max: 100, // Percentage
    required: true
  },
  heatIndex: {
    type: Number,
    min: -40,
    max: 80 // Calculated heat index
  },
  airQuality: {
    type: String,
    enum: ['good', 'moderate', 'poor', 'hazardous'],
    default: 'good'
  },
  smokeLevel: {
    type: Number,
    min: 0,
    max: 100, // Percentage
    default: 0
  }
}, { _id: false });

// Equipment Status Schema
const EquipmentStatusSchema = new Schema({
  helmet: {
    status: {
      type: String,
      enum: ['on', 'off', 'unknown'],
      default: 'unknown'
    },
    batteryLevel: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  scba: {
    pressure: {
      type: Number,
      min: 0,
      max: 5000, // PSI
      required: true
    },
    flowRate: {
      type: Number,
      min: 0,
      max: 100 // Liters per minute
    },
    status: {
      type: String,
      enum: ['normal', 'low', 'critical', 'malfunction'],
      default: 'normal'
    }
  },
  communication: {
    status: {
      type: String,
      enum: ['connected', 'disconnected', 'weak'],
      default: 'connected'
    },
    batteryLevel: {
      type: Number,
      min: 0,
      max: 100
    },
    signalStrength: {
      type: Number,
      min: 0,
      max: 100
    }
  }
}, { _id: false });

// Location Data Schema
const LocationDataSchema = new Schema({
  coordinates: {
    latitude: {
      type: Number,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180
    }
  },
  altitude: Number,
  accuracy: Number, // GPS accuracy in meters
  floor: String, // Building floor/level
  zone: String, // Fire zone or area designation
  lastLocationUpdate: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// Data Quality Assessment Schema
const DataQualitySchema = new Schema({
  overallScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  sensorConnectivity: {
    type: Number,
    min: 0,
    max: 100
  },
  signalStrength: {
    type: Number,
    min: 0,
    max: 100
  },
  dataCompleteness: {
    type: Number,
    min: 0,
    max: 100
  },
  anomalyFlags: [String], // Array of detected anomalies
  calibrationStatus: {
    type: String,
    enum: ['calibrated', 'needs_calibration', 'unknown'],
    default: 'unknown'
  }
}, { _id: false });

// Main Sensor Data Schema
const SensorDataSchema = new Schema({
  // Reference to firefighter
  firefighterId: {
    type: Schema.Types.ObjectId,
    ref: 'Firefighter',
    required: true,
    index: true
  },
  
  // Timestamp
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  
  // Core Physiological Data
  heartRate: {
    type: Number,
    min: 30,
    max: 250,
    required: true
  },
  heartRateVariability: {
    type: Number,
    min: 0,
    max: 200 // RMSSD in milliseconds
  },
  bodyTemperature: {
    type: Number,
    min: 35.0,
    max: 45.0, // Celsius - Increased to allow extreme emergency scenarios
    required: true
  },
  respirationRate: {
    type: Number,
    min: 8,
    max: 60 // Breaths per minute
  },
  bloodOxygen: {
    type: Number,
    min: 70,
    max: 100 // SpO2 percentage
  },
  
  // Direct Air Quality (for simple simulation data)
  airQuality: {
    type: String,
    enum: ['good', 'moderate', 'poor', 'hazardous'],
    default: 'good'
  },
  
  // Movement and Position Data
  movement: {
    accelerometer: {
      x: { type: Number, min: -50, max: 50 },
      y: { type: Number, min: -50, max: 50 },
      z: { type: Number, min: -50, max: 50 }
    },
    gyroscope: {
      x: { type: Number, min: -2000, max: 2000 },
      y: { type: Number, min: -2000, max: 2000 },
      z: { type: Number, min: -2000, max: 2000 }
    },
    stepCount: {
      type: Number,
      min: 0,
      default: 0
    },
    posture: {
      type: String,
      enum: ['standing', 'walking', 'running', 'lying', 'fallen', 'unknown'],
      default: 'unknown'
    },
    activityLevel: {
      type: String,
      enum: ['resting', 'light', 'moderate', 'vigorous', 'extreme'],
      default: 'moderate'
    }
  },
  
  // Environmental and Equipment Data
  environmental: EnvironmentalDataSchema,
  equipment: EquipmentStatusSchema,
  location: LocationDataSchema,
  
  // Data Quality Assessment
  dataQuality: DataQualitySchema,
  
  // Risk Assessment (calculated)
  riskLevel: {
    type: String,
    enum: ['normal', 'caution', 'warning', 'critical', 'emergency'],
    default: 'normal',
    index: true
  },
  riskScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  // Alert Flags
  alertFlags: [{
    type: {
      type: String,
      enum: [
        'HEART_RATE_HIGH',
        'HEART_RATE_CRITICAL',
        'TEMPERATURE_HIGH',
        'TEMPERATURE_CRITICAL',
        'FALL_DETECTED',
        'IMMOBILITY_DETECTED',
        'HRV_STRESS',
        'DEHYDRATION',
        'HELMET_OFF',
        'SCBA_MALFUNCTION',
        'COMMUNICATION_LOST',
        'EVACUATION_NEEDED'
      ]
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Processing Metadata
  processedAt: {
    type: Date,
    default: Date.now
  },
  processingVersion: {
    type: String,
    default: '2.0.0'
  },
  rawDataId: String, // Reference to raw sensor data if stored separately
  
  // Incident Context
  incidentId: {
    type: Schema.Types.ObjectId,
    ref: 'Incident'
  },
  incidentPhase: {
    type: String,
    enum: ['response', 'arrival', 'attack', 'ventilation', 'overhaul', 'recovery'],
    default: 'response'
  }
}, {
  timestamps: true,
  // TTL index for automatic cleanup of old data (90 days)
  expires: '90d'
});

// Indexes for performance and queries
SensorDataSchema.index({ firefighterId: 1, timestamp: -1 });
SensorDataSchema.index({ timestamp: -1 });
SensorDataSchema.index({ riskLevel: 1, timestamp: -1 });
SensorDataSchema.index({ 'alertFlags.type': 1 });
SensorDataSchema.index({ incidentId: 1, timestamp: -1 });
SensorDataSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

// Virtual fields
SensorDataSchema.virtual('age', {
  ref: 'Firefighter',
  localField: 'firefighterId',
  foreignField: '_id',
  justOne: true
});

// Instance methods
SensorDataSchema.methods.calculateRiskScore = function() {
  // Evidence-based risk calculation
  let score = 0;
  
  // Heart rate risk (25% weight)
  if (this.heartRate > 180) score += 25;
  else if (this.heartRate > 160) score += 15;
  else if (this.heartRate > 140) score += 8;
  
  // Temperature risk (30% weight) - Now using direct Celsius values
  if (this.bodyTemperature >= 40.0) score += 30;      // Critical: ≥40.0°C
  else if (this.bodyTemperature >= 38.9) score += 20; // High: ≥38.9°C
  else if (this.bodyTemperature >= 38.0) score += 10; // Moderate: ≥38.0°C
  
  // Equipment risk (15% weight)
  if (this.equipment?.scba?.pressure < 500) score += 15;
  else if (this.equipment?.scba?.pressure < 1000) score += 8;
  
  // Environmental risk (15% weight)
  if (this.environmental?.ambientTemperature > 40) score += 15;
  else if (this.environmental?.ambientTemperature > 35) score += 8;
  
  // Data quality impact (15% weight reduction)
  const qualityMultiplier = (this.dataQuality?.overallScore || 100) / 100;
  score *= qualityMultiplier;
  
  this.riskScore = Math.min(100, Math.round(score));
  
  // Update risk level based on score
  if (score >= 80) this.riskLevel = 'emergency';
  else if (score >= 60) this.riskLevel = 'critical';
  else if (score >= 40) this.riskLevel = 'warning';
  else if (score >= 20) this.riskLevel = 'caution';
  else this.riskLevel = 'normal';
  
  return this.riskScore;
};

SensorDataSchema.methods.detectAnomalies = function(previousReading) {
  const anomalies = [];
  
  if (previousReading) {
    // Heart rate spike detection (>30 BPM increase in <2 minutes)
    const timeDiff = (this.timestamp - previousReading.timestamp) / 1000 / 60; // minutes
    const hrDiff = this.heartRate - previousReading.heartRate;
    
    if (timeDiff < 2 && hrDiff > 30) {
      anomalies.push('HEART_RATE_SPIKE');
    }
    
    // Temperature spike detection - Now using direct Celsius values
    const tempCelsiusDiff = this.bodyTemperature - previousReading.bodyTemperature;
    if (timeDiff < 5 && tempCelsiusDiff > 1.1) { // 1.1°C spike threshold
      anomalies.push('TEMPERATURE_SPIKE');
    }
    
    // Fall detection (significant acceleration change)
    if (this.movement?.accelerometer && previousReading.movement?.accelerometer) {
      const accelChange = Math.sqrt(
        Math.pow(this.movement.accelerometer.x - previousReading.movement.accelerometer.x, 2) +
        Math.pow(this.movement.accelerometer.y - previousReading.movement.accelerometer.y, 2) +
        Math.pow(this.movement.accelerometer.z - previousReading.movement.accelerometer.z, 2)
      );
      
      if (accelChange > 20) {
        anomalies.push('POSSIBLE_FALL');
      }
    }
  }
  
  return anomalies;
};

// Static methods
SensorDataSchema.statics.getLatestForFirefighter = function(firefighterId) {
  return this.findOne({ firefighterId }).sort({ timestamp: -1 });
};

SensorDataSchema.statics.getTimeSeriesData = function(firefighterId, startTime, endTime) {
  return this.find({
    firefighterId,
    timestamp: { $gte: startTime, $lte: endTime }
  }).sort({ timestamp: 1 });
};

SensorDataSchema.statics.getAggregatedData = function(firefighterId, timeWindow = '1h') {
  const groupBy = timeWindow === '1h' ? {
    year: { $year: '$timestamp' },
    month: { $month: '$timestamp' },
    day: { $dayOfMonth: '$timestamp' },
    hour: { $hour: '$timestamp' }
  } : {
    year: { $year: '$timestamp' },
    month: { $month: '$timestamp' },
    day: { $dayOfMonth: '$timestamp' }
  };
  
  return this.aggregate([
    { $match: { firefighterId: mongoose.Types.ObjectId(firefighterId) } },
    {
      $group: {
        _id: groupBy,
        avgHeartRate: { $avg: '$heartRate' },
        maxHeartRate: { $max: '$heartRate' },
        avgTemperature: { $avg: '$bodyTemperature' },
        maxTemperature: { $max: '$bodyTemperature' },
        avgRiskScore: { $avg: '$riskScore' },
        maxRiskScore: { $max: '$riskScore' },
        alertCount: { $sum: { $size: '$alertFlags' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } }
  ]);
};

// Pre-save middleware
SensorDataSchema.pre('save', function(next) {
  // Calculate risk score before saving
  this.calculateRiskScore();
  
  // Set processing timestamp
  this.processedAt = new Date();
  
  next();
});

const SensorData = mongoose.model('SensorData', SensorDataSchema);

export { SensorData };
export default SensorData;
