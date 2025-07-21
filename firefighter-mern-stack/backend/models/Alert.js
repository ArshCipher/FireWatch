/**
 * 🔥 Alert Model - Evidence-Based Alert Management
 * 
 * Comprehensive alert system for firefighter safety monitoring
 * Implements evidence-based thresholds and escalation protocols
 * 
 * Scientific Standards:
 * - NFPA 1582: Emergency response protocols
 * - NIOSH: Occupational safety guidelines
 * - Emergency Medicine Standards: Triage and response
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;

// Alert Actions Schema
const AlertActionSchema = new Schema({
  type: {
    type: String,
    enum: [
      'acknowledged',
      'escalated',
      'resolved',
      'dismissed',
      'medical_response',
      'evacuation_ordered',
      'incident_commander_notified'
    ],
    required: true
  },
  performedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  notes: String,
  location: {
    latitude: Number,
    longitude: Number
  }
}, { _id: false });

// Recommendation Schema
const RecommendationSchema = new Schema({
  type: {
    type: String,
    enum: [
      'rest',
      'hydration',
      'cooling',
      'medical_evaluation',
      'equipment_check',
      'evacuation',
      'rotation_recommended',
      'immediate_medical_attention'
    ],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  description: String,
  estimatedTime: Number, // in minutes
  implemented: {
    type: Boolean,
    default: false
  },
  implementedAt: Date
}, { _id: false });

// Main Alert Schema
const AlertSchema = new Schema({
  // Core Alert Information
  alertId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return `ALERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
  },
  
  // References
  firefighterId: {
    type: Schema.Types.ObjectId,
    ref: 'Firefighter',
    required: true,
    index: true
  },
  sensorDataId: {
    type: Schema.Types.ObjectId,
    ref: 'SensorData'
  },
  incidentId: {
    type: Schema.Types.ObjectId,
    ref: 'Incident'
  },
  
  // Alert Classification
  type: {
    type: String,
    enum: [
      // Heart Rate Alerts (NFPA 1582 Evidence-Based)
      'HEART_RATE_LOW',         // 130-149 bpm normal exertion
      'HEART_RATE_MODERATE',    // 150-184 bpm >10min
      'HEART_RATE_HIGH',        // 185-199 bpm >5min
      'HEART_RATE_CRITICAL',    // ≥200 bpm >1min
      'HEART_RATE_SPIKE',
      'HEART_RATE_DROP',
      
      // Temperature Alerts (NFPA 1582 Evidence-Based)
      'TEMPERATURE_LOW',        // 37.5-37.9°C normal fire exposure
      'TEMPERATURE_MODERATE',   // 38.0-38.4°C
      'TEMPERATURE_HIGH',       // 38.5-38.9°C
      'TEMPERATURE_CRITICAL',   // ≥39.0°C
      'TEMPERATURE_SPIKE',
      'SEVERE_HEAT',           // >+3.9°C delta
      
      // Movement and Safety Alerts
      'FALL_DETECTED',         // >20g acceleration
      'INACTIVITY_DETECTED',   // >60s no movement
      'IMMOBILITY_DETECTED',
      
      // Equipment and Environmental
      'HELMET_OFF',            // <-8.3°C temperature delta
      'SCBA_MALFUNCTION',
      'SCBA_LOW_PRESSURE',
      'EQUIPMENT_FAILURE',
      'ENVIRONMENTAL_HAZARD',
      
      // Health and Wellness
      'HRV_STRESS',
      'DEHYDRATION',
      'HYDRATION_REMINDER',    // Every 15min reminder
      'MEDICAL_EMERGENCY',
      
      // Communication and Operations
      'COMMUNICATION_LOST',
      'EVACUATION_NEEDED',
      'CUSTOM_ALERT'
    ],
    required: true,
    index: true
  },
  
  // Severity and Priority
  severity: {
    type: String,
    enum: ['low', 'medium', 'moderate', 'high', 'critical', 'emergency'],
    required: true,
    index: true
  },
  priority: {
    type: Number,
    min: 1,
    max: 10,
    required: true
  },
  
  // Alert Status
  status: {
    type: String,
    enum: ['active', 'acknowledged', 'resolved', 'dismissed', 'escalated'],
    default: 'active',
    index: true
  },
  
  // Timing
  triggeredAt: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  acknowledgedAt: Date,
  resolvedAt: Date,
  escalatedAt: Date,
  
  // Alert Content
  title: {
    type: String,
    required: true,
    maxLength: 200
  },
  message: {
    type: String,
    required: true,
    maxLength: 1000
  },
  details: {
    triggerValue: Schema.Types.Mixed, // The value that triggered the alert
    thresholdValue: Schema.Types.Mixed, // The threshold that was exceeded
    baseline: Schema.Types.Mixed, // Individual baseline for comparison
    duration: Number, // How long the condition persisted (seconds)
    trend: {
      type: String,
      enum: ['increasing', 'decreasing', 'stable', 'unknown'],
      default: 'unknown'
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 95 // Confidence percentage in the alert
    }
  },
  
  // Response and Actions
  actions: [AlertActionSchema],
  recommendations: [RecommendationSchema],
  
  // Personnel Involved
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User' // Incident commander or medic assigned
  },
  notifiedPersonnel: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['incident_commander', 'safety_officer', 'medic', 'chief', 'dispatcher']
    },
    notifiedAt: {
      type: Date,
      default: Date.now
    },
    method: {
      type: String,
      enum: ['dashboard', 'email', 'sms', 'radio', 'app_notification'],
      default: 'dashboard'
    },
    acknowledged: {
      type: Boolean,
      default: false
    }
  }],
  
  // Location and Context
  location: {
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    floor: String,
    zone: String,
    description: String
  },
  
  // Environmental Context
  environmentalContext: {
    ambientTemperature: Number,
    humidity: Number,
    airQuality: String,
    smokeLevel: Number,
    visibility: String
  },
  
  // Alert Persistence and Escalation
  escalationLevel: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  autoEscalationEnabled: {
    type: Boolean,
    default: true
  },
  escalationInterval: {
    type: Number,
    default: 300000 // 5 minutes in milliseconds
  },
  nextEscalationAt: Date,
  
  // Related Alerts
  relatedAlerts: [{
    type: Schema.Types.ObjectId,
    ref: 'Alert'
  }],
  
  // Metadata
  source: {
    type: String,
    enum: ['sensor', 'manual', 'system', 'ai_detection'],
    default: 'sensor'
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100,
    default: 95
  },
  falsePositiveRisk: {
    type: String,
    enum: ['very_low', 'low', 'medium', 'high'],
    default: 'low'
  },
  
  // Resolution Information
  resolution: {
    outcome: {
      type: String,
      enum: [
        'resolved_normal',
        'resolved_medical_intervention',
        'resolved_equipment_fix',
        'resolved_environmental_change',
        'false_positive',
        'escalated_to_emergency',
        'firefighter_relieved'
      ]
    },
    description: String,
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    timeToResolution: Number, // in seconds
    followUpRequired: {
      type: Boolean,
      default: false
    },
    lessons: String // Lessons learned for future alerts
  },
  
  // Performance Metrics
  metrics: {
    responseTime: Number, // Time to acknowledgment (seconds)
    resolutionTime: Number, // Time to resolution (seconds)
    escalationCount: {
      type: Number,
      default: 0
    },
    notificationsSent: {
      type: Number,
      default: 0
    }
  },
  
  // System Fields
  version: {
    type: String,
    default: '2.0.0'
  },
  tags: [String] // For categorization and analysis
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
AlertSchema.index({ firefighterId: 1, triggeredAt: -1 });
AlertSchema.index({ status: 1, severity: -1 });
AlertSchema.index({ type: 1, triggeredAt: -1 });
AlertSchema.index({ incidentId: 1, triggeredAt: -1 });
AlertSchema.index({ triggeredAt: -1 });
AlertSchema.index({ priority: -1, status: 1 });
AlertSchema.index({ assignedTo: 1, status: 1 });

// TTL index for automatic cleanup of resolved alerts (1 year)
AlertSchema.index({ resolvedAt: 1 }, { 
  expireAfterSeconds: 31536000, // 1 year
  partialFilterExpression: { status: 'resolved' }
});

// Virtual fields
AlertSchema.virtual('firefighter', {
  ref: 'Firefighter',
  localField: 'firefighterId',
  foreignField: '_id',
  justOne: true
});

AlertSchema.virtual('age').get(function() {
  return Date.now() - this.triggeredAt.getTime();
});

AlertSchema.virtual('isOverdue').get(function() {
  if (this.status === 'resolved' || this.status === 'dismissed') return false;
  
  const overdueTime = {
    emergency: 60000, // 1 minute
    critical: 300000, // 5 minutes
    high: 900000, // 15 minutes
    medium: 1800000, // 30 minutes
    low: 3600000 // 1 hour
  };
  
  return this.age > (overdueTime[this.severity] || overdueTime.medium);
});

// Instance methods
AlertSchema.methods.acknowledge = function(userId, notes = '') {
  this.status = 'acknowledged';
  this.acknowledgedAt = new Date();
  
  this.actions.push({
    type: 'acknowledged',
    performedBy: userId,
    notes
  });
  
  // Update metrics
  this.metrics.responseTime = (this.acknowledgedAt - this.triggeredAt) / 1000;
  
  return this.save();
};

AlertSchema.methods.resolve = function(userId, outcome, description = '') {
  this.status = 'resolved';
  this.resolvedAt = new Date();
  
  this.resolution = {
    outcome,
    description,
    resolvedBy: userId,
    timeToResolution: (this.resolvedAt - this.triggeredAt) / 1000
  };
  
  this.actions.push({
    type: 'resolved',
    performedBy: userId,
    notes: description
  });
  
  // Update metrics
  this.metrics.resolutionTime = this.resolution.timeToResolution;
  
  return this.save();
};

AlertSchema.methods.escalate = function(userId, reason = '') {
  this.escalationLevel += 1;
  this.escalatedAt = new Date();
  
  if (this.escalationLevel >= 3) {
    this.severity = 'emergency';
    this.priority = Math.min(10, this.priority + 2);
  }
  
  this.actions.push({
    type: 'escalated',
    performedBy: userId,
    notes: reason
  });
  
  // Update metrics
  this.metrics.escalationCount += 1;
  
  // Set next escalation time
  if (this.autoEscalationEnabled) {
    this.nextEscalationAt = new Date(Date.now() + this.escalationInterval);
  }
  
  return this.save();
};

AlertSchema.methods.addRecommendation = function(type, description, priority = 'medium') {
  this.recommendations.push({
    type,
    description,
    priority
  });
  
  return this.save();
};

AlertSchema.methods.notifyPersonnel = function(personnel) {
  personnel.forEach(person => {
    this.notifiedPersonnel.push({
      userId: person.userId,
      role: person.role,
      method: person.method || 'dashboard'
    });
  });
  
  this.metrics.notificationsSent += personnel.length;
  
  return this.save();
};

// Static methods
AlertSchema.statics.getActiveAlerts = function() {
  return this.find({ 
    status: { $in: ['active', 'acknowledged', 'escalated'] } 
  }).sort({ priority: -1, triggeredAt: -1 });
};

AlertSchema.statics.getActiveAlertsForFirefighter = function(firefighterId) {
  return this.find({ 
    firefighterId,
    status: { $in: ['active', 'acknowledged', 'escalated'] } 
  }).sort({ triggeredAt: -1 });
};

AlertSchema.statics.getCriticalAlerts = function() {
  return this.find({
    severity: { $in: ['critical', 'emergency'] },
    status: { $in: ['active', 'acknowledged', 'escalated'] }
  }).sort({ priority: -1, triggeredAt: -1 });
};

AlertSchema.statics.getOverdueAlerts = function() {
  const now = new Date();
  
  return this.aggregate([
    {
      $match: {
        status: { $in: ['active', 'acknowledged'] }
      }
    },
    {
      $addFields: {
        age: { $subtract: [now, '$triggeredAt'] },
        overdueThreshold: {
          $switch: {
            branches: [
              { case: { $eq: ['$severity', 'emergency'] }, then: 60000 },
              { case: { $eq: ['$severity', 'critical'] }, then: 300000 },
              { case: { $eq: ['$severity', 'high'] }, then: 900000 },
              { case: { $eq: ['$severity', 'medium'] }, then: 1800000 }
            ],
            default: 3600000
          }
        }
      }
    },
    {
      $match: {
        $expr: { $gt: ['$age', '$overdueThreshold'] }
      }
    },
    {
      $sort: { priority: -1, triggeredAt: -1 }
    }
  ]);
};

AlertSchema.statics.generateAlertStats = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        triggeredAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          type: '$type',
          severity: '$severity'
        },
        count: { $sum: 1 },
        avgResponseTime: { $avg: '$metrics.responseTime' },
        avgResolutionTime: { $avg: '$metrics.resolutionTime' },
        escalationRate: { 
          $avg: { 
            $cond: [{ $gt: ['$escalationLevel', 0] }, 1, 0] 
          } 
        }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// Pre-save middleware
AlertSchema.pre('save', function(next) {
  // Set priority based on severity if not set
  if (!this.priority) {
    const severityPriority = {
      emergency: 10,
      critical: 8,
      high: 6,
      medium: 4,
      low: 2
    };
    this.priority = severityPriority[this.severity] || 4;
  }
  
  // Set next escalation time for new alerts
  if (this.isNew && this.autoEscalationEnabled && !this.nextEscalationAt) {
    this.nextEscalationAt = new Date(Date.now() + this.escalationInterval);
  }
  
  next();
});

const Alert = mongoose.model('Alert', AlertSchema);

export { Alert };
export default Alert;
