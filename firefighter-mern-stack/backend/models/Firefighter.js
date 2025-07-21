/**
 * 🔥 Firefighter Model - Core Domain Entity
 * 
 * Comprehensive firefighter profile with evidence-based monitoring parameters
 * Includes baseline measurements, medical history, and department information
 * 
 * Scientific Standards:
 * - NFPA 1582: Medical standards for firefighters
 * - ACSM Guidelines: Exercise testing and prescription
 * - Tanaka Formula: Age-predicted maximum heart rate
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;

// Baseline Measurements Schema
const BaselineMeasurementsSchema = new Schema({
  restingHeartRate: {
    type: Number,
    min: 40,
    max: 100,
    required: true
  },
  maxHeartRate: {
    type: Number,
    min: 150,
    max: 220
  },
  restingTemperature: {
    type: Number,
    min: 35.5,
    max: 37.5, // Celsius
    default: 37.0
  },
  baselineHRV: {
    type: Number,
    min: 10,
    max: 200,
    default: 50
  },
  vo2Max: {
    type: Number,
    min: 20,
    max: 80
  },
  bloodPressure: {
    systolic: {
      type: Number,
      min: 90,
      max: 180
    },
    diastolic: {
      type: Number,
      min: 60,
      max: 120
    }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// Medical History Schema
const MedicalHistorySchema = new Schema({
  conditions: [{
    type: String,
    enum: [
      'hypertension',
      'diabetes',
      'asthma',
      'heart_disease',
      'back_injury',
      'knee_injury',
      'allergies',
      'none'
    ]
  }],
  medications: [String],
  allergies: [String],
  lastPhysicalExam: Date,
  medicalClearance: {
    status: {
      type: String,
      enum: ['cleared', 'restricted', 'pending', 'expired'],
      default: 'pending'
    },
    expirationDate: Date,
    restrictions: [String]
  }
}, { _id: false });

// Equipment Preferences Schema
const EquipmentPreferencesSchema = new Schema({
  scbaModel: String,
  helmetType: String,
  sensorLocation: {
    type: String,
    enum: ['wrist', 'chest', 'helmet'],
    default: 'wrist'
  },
  alertPreferences: {
    visualAlerts: { type: Boolean, default: true },
    audioAlerts: { type: Boolean, default: true },
    vibrationAlerts: { type: Boolean, default: true }
  }
}, { _id: false });

// Main Firefighter Schema
const FirefighterSchema = new Schema({
  // Unique Identifier
  firefighterId: {
    type: String,
    required: true,
    unique: true,
    match: /^FF\d{4}$/
  },
  
  // Personal Information
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxLength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxLength: 50
  },
  dateOfBirth: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        return value < new Date();
      },
      message: 'Date of birth must be in the past'
    }
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  
  // Physical Characteristics
  height: {
    type: Number, // in centimeters
    required: true,
    min: 150,
    max: 220
  },
  weight: {
    type: Number, // in kilograms
    required: true,
    min: 40,
    max: 200
  },
  
  // Contact Information
  email: {
    type: String,
    required: true,
    unique: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  phone: {
    type: String,
    required: true,
    match: /^\+?[\d\s\-\(\)]{10,15}$/
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'USA' }
  },
  
  // Health and Fitness
  fitnessLevel: {
    type: String,
    enum: ['poor', 'fair', 'good', 'excellent', 'elite'],
    default: 'good'
  },
  baselineMeasurements: BaselineMeasurementsSchema,
  medicalHistory: MedicalHistorySchema,
  
  // Department Information
  department: {
    type: String,
    required: true
  },
  station: {
    type: String,
    required: true
  },
  rank: {
    type: String,
    enum: [
      'Probationary',
      'Firefighter',
      'Driver/Operator',
      'Lieutenant',
      'Captain',
      'Battalion Chief',
      'Deputy Chief',
      'Fire Chief'
    ],
    default: 'Firefighter'
  },
  yearsOfService: {
    type: Number,
    min: 0,
    max: 50,
    default: 0
  },
  shift: {
    type: String,
    enum: ['A', 'B', 'C', 'D', 'Day', 'Night'],
    required: true
  },
  
  // Status and Monitoring
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  onDuty: {
    type: Boolean,
    default: false,
    index: true
  },
  currentIncident: {
    type: Schema.Types.ObjectId,
    ref: 'Incident',
    default: null
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  
  // Equipment and Preferences
  equipmentPreferences: EquipmentPreferencesSchema,
  
  // Emergency Contacts
  emergencyContacts: [{
    name: {
      type: String,
      required: true
    },
    relationship: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true,
      match: /^\+?[\d\s\-\(\)]{10,15}$/
    },
    email: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  
  // System Metadata
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastUpdatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  tags: [String], // For categorization and searching
  notes: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
FirefighterSchema.index({ department: 1, station: 1 });
FirefighterSchema.index({ isActive: 1, onDuty: 1 });
FirefighterSchema.index({ createdAt: -1 });
FirefighterSchema.index({ 'baselineMeasurements.restingHeartRate': 1 });
FirefighterSchema.index({ email: 1 }, { unique: true });
FirefighterSchema.index({ firefighterId: 1 }, { unique: true });

// Virtual fields
FirefighterSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

FirefighterSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

FirefighterSchema.virtual('bmi').get(function() {
  if (!this.height || !this.weight) return null;
  const heightInMeters = this.height / 100;
  return (this.weight / (heightInMeters * heightInMeters)).toFixed(1);
});

FirefighterSchema.virtual('predictedMaxHeartRate').get(function() {
  if (!this.age) return null;
  // Tanaka formula: 208 - (0.7 × age)
  return Math.round(208 - (0.7 * this.age));
});

// Instance methods
FirefighterSchema.methods.activateForDuty = function(incidentId = null) {
  this.onDuty = true;
  this.currentIncident = incidentId;
  this.lastSeen = new Date();
  return this.save();
};

FirefighterSchema.methods.deactivateFromDuty = function() {
  this.onDuty = false;
  this.currentIncident = null;
  return this.save();
};

FirefighterSchema.methods.calculateHeartRateZones = function() {
  const maxHR = this.baselineMeasurements?.maxHeartRate || this.predictedMaxHeartRate;
  const restingHR = this.baselineMeasurements?.restingHeartRate || 60;
  
  if (!maxHR) return null;
  
  return {
    resting: restingHR,
    zone1: Math.round(restingHR + (maxHR - restingHR) * 0.5), // Recovery
    zone2: Math.round(restingHR + (maxHR - restingHR) * 0.6), // Aerobic base
    zone3: Math.round(restingHR + (maxHR - restingHR) * 0.7), // Aerobic
    zone4: Math.round(restingHR + (maxHR - restingHR) * 0.8), // Threshold
    zone5: Math.round(restingHR + (maxHR - restingHR) * 0.9), // VO2 Max
    maximum: maxHR
  };
};

FirefighterSchema.methods.updateBaselines = function(measurements) {
  this.baselineMeasurements = { ...this.baselineMeasurements, ...measurements };
  this.baselineMeasurements.lastUpdated = new Date();
  return this.save();
};

// Static methods
FirefighterSchema.statics.findActiveFirefighters = function() {
  return this.find({ isActive: true, onDuty: true });
};

FirefighterSchema.statics.findByDepartment = function(department) {
  return this.find({ department, isActive: true });
};

FirefighterSchema.statics.generateFirefighterId = async function() {
  const count = await this.countDocuments();
  return `FF${String(count + 1).padStart(4, '0')}`;
};

// Pre-save middleware
FirefighterSchema.pre('save', function(next) {
  // Calculate max heart rate if not provided
  if (!this.baselineMeasurements?.maxHeartRate && this.age) {
    if (!this.baselineMeasurements) {
      this.baselineMeasurements = {};
    }
    this.baselineMeasurements.maxHeartRate = Math.round(208 - (0.7 * this.age));
  }
  
  // Ensure only one primary emergency contact
  if (this.emergencyContacts?.length > 0) {
    let primaryCount = 0;
    this.emergencyContacts.forEach(contact => {
      if (contact.isPrimary) primaryCount++;
    });
    
    if (primaryCount === 0) {
      this.emergencyContacts[0].isPrimary = true;
    } else if (primaryCount > 1) {
      let foundPrimary = false;
      this.emergencyContacts.forEach(contact => {
        if (contact.isPrimary && foundPrimary) {
          contact.isPrimary = false;
        } else if (contact.isPrimary) {
          foundPrimary = true;
        }
      });
    }
  }
  
  next();
});

// Pre-remove middleware to clean up related data
FirefighterSchema.pre('remove', async function(next) {
  await mongoose.model('SensorData').deleteMany({ firefighterId: this._id });
  await mongoose.model('Alert').deleteMany({ firefighterId: this._id });
  next();
});

const Firefighter = mongoose.model('Firefighter', FirefighterSchema);

export { Firefighter };
export default Firefighter;
