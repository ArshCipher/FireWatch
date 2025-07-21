/**
 * 🚨 Alert Controller  
 * 
 * Manages alert creation, tracking, and acknowledgment
 * Implements scientific thresholds and evidence-based monitoring
 */

import Alert from '../models/Alert.js';
import Firefighter from '../models/Firefighter.js';
import SensorData from '../models/SensorData.js';

class AlertController {

  // Get all alerts (active, acknowledged, resolved, etc.)
  getAllAlerts = async (req, res) => {
    try {
      console.log('🔍 getAllAlerts called - fetching all alerts from database');
      const { limit = 100, status } = req.query;
      
      const query = {};
      if (status) {
        query.status = status;
      }

      const alerts = await Alert.find(query)
        .populate('firefighterId', 'firstName lastName badgeNumber')
        .sort({ triggeredAt: -1 })
        .limit(parseInt(limit));

      console.log(`📊 Found ${alerts.length} alerts in database`);
      
      res.json({
        success: true,
        data: alerts
      });
    } catch (error) {
      console.error('❌ Error in getAllAlerts:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

  // Get all active alerts
  getActiveAlerts = async (req, res) => {
    try {
      console.log('🔍 getActiveAlerts called - fetching alerts from database');
      const alerts = await Alert.find({ 
        status: 'active' 
      })
      .populate('firefighterId', 'firstName lastName badgeNumber')
      .sort({ triggeredAt: -1 })
      .limit(100);

      console.log(`📊 Found ${alerts.length} active alerts in database`);
      
      res.json({
        success: true,
        data: alerts
      });
    } catch (error) {
      console.error('❌ Error in getActiveAlerts:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

  // Get alerts for a specific firefighter
  getFirefighterAlerts = async (req, res) => {
    try {
      const { firefighterId } = req.params;
      const { status, limit = 50 } = req.query;

      const query = { firefighterId };
      if (status !== undefined) {
        query.status = status; // Use 'active', 'acknowledged', etc.
      }

      const alerts = await Alert.find(query)
        .sort({ triggeredAt: -1 })
        .limit(parseInt(limit));

      res.json({
        success: true,
        data: alerts
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

  // Acknowledge an alert
  acknowledgeAlert = async (req, res) => {
    try {
      const { alertId } = req.params;
      const { acknowledgedBy, notes } = req.body;

      const alert = await Alert.findById(alertId);
      if (!alert) {
        return res.status(404).json({
          success: false,
          message: 'Alert not found'
        });
      }

      alert.status = 'acknowledged';
      alert.acknowledgedAt = new Date();
      alert.acknowledgedBy = acknowledgedBy;
      if (notes) {
        alert.notes = notes;
      }

      await alert.save();

      // Emit real-time update
      if (req.app.get('socketio')) {
        req.app.get('socketio').emit('alertAcknowledged', {
          alertId: alert._id,
          firefighterId: alert.firefighterId,
          acknowledgedBy,
          acknowledgedAt: alert.acknowledgedAt
        });
      }

      res.json({
        success: true,
        message: 'Alert acknowledged successfully',
        data: alert
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

  // Create a new alert (manual or system-generated)
  createAlert = async (req, res) => {
    try {
      const { 
        firefighterId, 
        type, 
        severity, 
        message, 
        metadata = {},
        isManual = false 
      } = req.body;

      // Verify firefighter exists
      const firefighter = await Firefighter.findById(firefighterId);
      if (!firefighter) {
        return res.status(404).json({
          success: false,
          message: 'Firefighter not found'
        });
      }

      const alert = new Alert({
        firefighterId,
        type,
        severity,
        message,
        status: 'active', // Use status field consistently
        triggeredAt: new Date(),
        metadata: {
          ...metadata,
          isManual
        }
      });

      await alert.save();

      // Populate firefighter info for real-time emission
      await alert.populate('firefighterId', 'firstName lastName badgeNumber');

      // Emit real-time alert
      if (req.app.get('socketio')) {
        req.app.get('socketio').emit('newAlert', alert);
      }

      res.status(201).json({
        success: true,
        message: 'Alert created successfully',
        data: alert
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

  // Get alert statistics
  getAlertStatistics = async (req, res) => {
    try {
      const { timeframe = '24h' } = req.query;
      
      let startTime;
      switch (timeframe) {
        case '1h':
          startTime = new Date(Date.now() - 60 * 60 * 1000);
          break;
        case '24h':
          startTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        default:
          startTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
      }

      const [totalAlerts, activeAlerts, severityStats, typeStats] = await Promise.all([
        Alert.countDocuments({ triggeredAt: { $gte: startTime } }),
        Alert.countDocuments({ status: 'active' }),
        Alert.aggregate([
          { $match: { triggeredAt: { $gte: startTime } } },
          { $group: { _id: '$severity', count: { $sum: 1 } } }
        ]),
        Alert.aggregate([
          { $match: { triggeredAt: { $gte: startTime } } },
          { $group: { _id: '$type', count: { $sum: 1 } } }
        ])
      ]);

      const stats = {
        totalAlerts,
        activeAlerts,
        timeframe,
        bySeverity: severityStats.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byType: typeStats.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

  // Bulk acknowledge alerts
  bulkAcknowledgeAlerts = async (req, res) => {
    try {
      const { alertIds, acknowledgedBy, notes } = req.body;

      if (!alertIds || !Array.isArray(alertIds) || alertIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'alertIds array is required'
        });
      }

      const updateData = {
        status: 'acknowledged',
        acknowledgedAt: new Date(),
        acknowledgedBy
      };

      if (notes) {
        updateData.notes = notes;
      }

      const result = await Alert.updateMany(
        { _id: { $in: alertIds }, status: 'active' },
        updateData
      );

      // Emit real-time update for bulk acknowledgment
      if (req.app.get('socketio')) {
        req.app.get('socketio').emit('bulkAlertsAcknowledged', {
          alertIds,
          acknowledgedBy,
          acknowledgedAt: updateData.acknowledgedAt,
          count: result.modifiedCount
        });
      }

      res.json({
        success: true,
        message: `Successfully acknowledged ${result.modifiedCount} alert(s)`,
        data: {
          acknowledged: result.modifiedCount,
          requested: alertIds.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

  // Check sensor data and generate alerts
  checkAndCreateAlerts = async (sensorData, firefighter) => {
    try {
      console.log(`🔍 DEBUG: AlertController.checkAndCreateAlerts called for ${firefighter.firstName || firefighter.name}`);
      console.log(`📊 DEBUG: Input sensor data:`, {
        heartRate: sensorData.heartRate,
        bodyTemperature: sensorData.bodyTemperature,
        airQuality: sensorData.airQuality,
        movement: sensorData.movement
      });
      
      const alerts = [];
      
      // Get scenario information and check allowed alert types
      const currentScenario = sensorData.metadata?.scenario;
      const allowedAlertTypes = sensorData.metadata?.alertTargets || null;
      
      console.log(`🎯 DEBUG: Scenario filtering - scenario: ${currentScenario}, allowedAlertTypes:`, allowedAlertTypes);
      
      // Helper function to check if alert type is allowed for current scenario
      const isAlertTypeAllowed = (alertType) => {
        if (!currentScenario || !allowedAlertTypes) {
          console.log(`✅ DEBUG: Alert type ${alertType} allowed - no scenario restrictions`);
          return true; // Allow all alerts if no scenario specified
        }
        const allowed = allowedAlertTypes.includes(alertType);
        console.log(`${allowed ? '✅' : '❌'} DEBUG: Alert type ${alertType} ${allowed ? 'allowed' : 'blocked'} for scenario ${currentScenario}`);
        return allowed;
      };
      
      // Add debug logging for critical scenarios
      if (['immobility_scenario', 'heat_exhaustion', 'structure_fire'].includes(sensorData.scenario)) {
        console.log(`🔍 ALERT CONTROLLER DEBUG: ${sensorData.scenario} - Temp: ${sensorData.bodyTemperature}°C, HR: ${sensorData.heartRate}, AQ: ${sensorData.airQuality}`);
      }
      
      const age = new Date().getFullYear() - new Date(firefighter.dateOfBirth || '1990-01-01').getFullYear();
      const maxHR = 208 - 0.7 * age;
      const hrPercent = (sensorData.heartRate / maxHR) * 100;

      // Heart Rate Alert Logic (Evidence-based thresholds from field studies)
      if (sensorData.heartRate >= 200 || hrPercent >= 95) {
        // Critical Alert: ≥200 bpm or >95% age-predicted max for >1 min
        if (isAlertTypeAllowed('HEART_RATE_CRITICAL')) {
          const alert = new Alert({
            firefighterId: firefighter._id,
            type: 'HEART_RATE_CRITICAL',
            severity: 'critical',
            title: 'Critical Heart Rate Alert - Immediate Action Required',
            priority: 10,
            message: `CRITICAL: Heart rate ${sensorData.heartRate} bpm (${hrPercent.toFixed(0)}% of age-predicted max) - Cardiac event risk`,
            status: 'active',
            triggeredAt: new Date(),
            metadata: {
              sensorDataId: sensorData._id,
              thresholdType: 'heartRate',
              value: sensorData.heartRate,
              maxValue: Math.round(maxHR),
              percentage: hrPercent,
              recommendedAction: 'IMMEDIATE MEDICAL ATTENTION - CEASE ALL ACTIVITY - Check for cardiac symptoms',
              emergencyResponse: true,
              escalationRequired: true,
              medicalEvacuation: true
            }
          });
          await alert.save();
          alerts.push(alert);
        }

      } else if (sensorData.heartRate >= 185 || hrPercent >= 90) {
        // High Alert: 185–199 bpm or >90% age-predicted max for >5 min
        const alert = new Alert({
          firefighterId: firefighter._id,
          type: 'HEART_RATE_HIGH',
          severity: 'high',
          title: 'High Heart Rate Alert - Monitor Closely',
          priority: 8,
          message: `HIGH: Heart rate ${sensorData.heartRate} bpm (${hrPercent.toFixed(0)}% of max) - Approaching critical threshold`,
          status: 'active',
          triggeredAt: new Date(),
          metadata: {
            sensorDataId: sensorData._id,
            thresholdType: 'heartRate',
            value: sensorData.heartRate,
            maxValue: Math.round(maxHR),
            percentage: hrPercent,
            recommendedAction: 'Immediate rest and cooling - Consider rotation if sustained >5 min - Monitor for cardiac symptoms',
            medicalEvaluation: true,
            coolingRequired: true
          }
        });
        await alert.save();
        alerts.push(alert);

      } else if (sensorData.heartRate >= 150 || hrPercent >= 80) {
        // Moderate Alert: 150–184 bpm sustained >10 min
        // Check if alert type is allowed for current scenario
        if (isAlertTypeAllowed('HEART_RATE_MODERATE')) {
          const alert = new Alert({
            firefighterId: firefighter._id,
            type: 'HEART_RATE_MODERATE',
            severity: 'moderate',
            title: 'Moderate Heart Rate Alert - Sustained Elevation',
            priority: 6,
            message: `MODERATE: Heart rate ${sensorData.heartRate} bpm (${hrPercent.toFixed(0)}% of max) - Monitor if sustained >10 min`,
            status: 'active',
            triggeredAt: new Date(),
            metadata: {
              sensorDataId: sensorData._id,
              thresholdType: 'heartRate',
              value: sensorData.heartRate,
              maxValue: Math.round(maxHR),
              percentage: hrPercent,
              recommendedAction: 'Monitor closely - Ensure adequate hydration - Consider work/rest cycles',
              hydrationReminder: true,
              workRestCycle: true
            }
          });
          await alert.save();
          alerts.push(alert);
        }
      }

      // Core Temperature Alert Logic (NFPA 1582/NIOSH Evidence-Based Thresholds)
      // Use bodyTemperature from the sensor data
      const tempCelsius = sensorData.bodyTemperature;
      
      console.log(`🌡️ DEBUG: Temperature detection - bodyTemperature: ${sensorData.bodyTemperature}°C`);
      console.log(`🌡️ DEBUG: Temperature threshold check - tempCelsius (${tempCelsius}) >= 39.0? ${tempCelsius >= 39.0}`);
      
      if (tempCelsius >= 39.0) {
        console.log(`🚨 DEBUG: TEMPERATURE CRITICAL ALERT TRIGGERED! Creating alert for ${tempCelsius.toFixed(1)}°C`);
        // Critical Alert: ≥39.0°C - NIOSH/NFPA recommend withdrawal
        const alert = new Alert({
          firefighterId: firefighter._id,
          type: 'TEMPERATURE_CRITICAL',
          severity: 'critical',
          title: 'Critical Core Temperature - Immediate Withdrawal Required',
          priority: 10,
          message: `CRITICAL: Core temperature ${tempCelsius.toFixed(1)}°C - Heat exhaustion/stroke risk`,
          status: 'active',
          triggeredAt: new Date(),
          metadata: {
            sensorDataId: sensorData._id,
            thresholdType: 'coreTemperature',
            value: tempCelsius,
            threshold: 39.0,
            recommendedAction: 'IMMEDIATE WITHDRAWAL - Aggressive cooling protocol - Ice packs to neck/wrists - Medical evaluation required',
            emergencyResponse: true,
            coolingRequired: true,
            medicalEvacuation: true
          }
        });
        await alert.save();
        alerts.push(alert);

      } else if (tempCelsius >= 38.5) {
        // High Alert: 38.5–38.9°C - Field studies show peaks at 38.4–39.6°C
        const alert = new Alert({
          firefighterId: firefighter._id,
          type: 'TEMPERATURE_HIGH',
          severity: 'high',
          title: 'High Core Temperature - Cooling Break Required',
          priority: 8,
          message: `HIGH: Core temperature ${tempCelsius.toFixed(1)}°C - Elevated heat stress`,
          status: 'active',
          triggeredAt: new Date(),
          metadata: {
            sensorDataId: sensorData._id,
            thresholdType: 'coreTemperature',
            value: tempCelsius,
            threshold: 38.5,
            recommendedAction: 'Immediate cooling break - Remove to shade - Cold fluids - Monitor closely for progression',
            coolingBreakRequired: true,
            hydrationRequired: true
          }
        });
        await alert.save();
        alerts.push(alert);

      } else if (tempCelsius >= 38.0) {
        // Moderate Alert: 38.0–38.4°C
        // Only generate for scenarios that should have temperature alerts
        const scenario = sensorData.metadata?.scenario;
        const shouldGenerateTemperatureAlert = !scenario || // Allow if no scenario specified
          scenario === 'structure_fire' ||
          scenario === 'wildfire_suppression' ||
          scenario === 'heat_exhaustion' ||
          scenario === 'hazmat_response' ||
          scenario === 'search_rescue';
          
        if (shouldGenerateTemperatureAlert) {
          const alert = new Alert({
            firefighterId: firefighter._id,
            type: 'TEMPERATURE_MODERATE',
            severity: 'moderate',
            title: 'Moderate Core Temperature - Monitor Heat Stress',
            priority: 6,
            message: `MODERATE: Core temperature ${tempCelsius.toFixed(1)}°C - Heat stress developing`,
            status: 'active',
            triggeredAt: new Date(),
            metadata: {
              sensorDataId: sensorData._id,
              thresholdType: 'coreTemperature',
              value: tempCelsius,
              threshold: 38.0,
              recommendedAction: 'Monitor temperature trend - Ensure adequate hydration - Consider work/rest cycles',
              hydrationCheck: true,
              temperatureMonitoring: true
            }
          });
          await alert.save();
          alerts.push(alert);
        }
      }
      // Note: 37.5-37.9°C is normal firefighter body temperature during fire operations - no alert needed

      // Air Quality Alert Logic (Environmental hazard thresholds)
      // Convert enum to numeric value for threshold comparison
      let airQualityValue = 100; // Default good air quality
      if (sensorData.airQuality === 'hazardous') {
        airQualityValue = 20;
      } else if (sensorData.airQuality === 'poor') {
        airQualityValue = 40;
      } else if (sensorData.airQuality === 'moderate') {
        airQualityValue = 65;
      }
      
      // Use numeric value from metadata if available (from simulation)
      if (sensorData.metadata && sensorData.metadata.numericAirQuality) {
        airQualityValue = sensorData.metadata.numericAirQuality;
      }

      if (airQualityValue <= 25) {
        const alert = new Alert({
          firefighterId: firefighter._id,
          type: 'ENVIRONMENTAL_HAZARD',
          severity: 'critical',
          title: 'Critical Air Quality - Immediate Evacuation Required',
          priority: 10,
          message: `CRITICAL: Air quality ${airQualityValue}% (${sensorData.airQuality}) - Dangerous exposure to toxins`,
          status: 'active',
          triggeredAt: new Date(),
          metadata: {
            sensorDataId: sensorData._id,
            thresholdType: 'airQuality',
            value: airQualityValue,
            threshold: 25,
            recommendedAction: 'IMMEDIATE EVACUATION - Check SCBA function - Switch to backup air supply - Medical evaluation post-exposure',
            evacuationRequired: true,
            scbaCheck: true,
            medicalEvaluation: true
          }
        });
        await alert.save();
        alerts.push(alert);

      } else if (airQualityValue <= 50) {
        const alert = new Alert({
          firefighterId: firefighter._id,
          type: 'ENVIRONMENTAL_HAZARD',
          severity: 'high',
          title: 'Poor Air Quality - Verify Equipment Function',
          priority: 7,
          message: `HIGH: Air quality ${airQualityValue}% (${sensorData.airQuality}) - Poor environmental conditions`,
          status: 'active',
          triggeredAt: new Date(),
          metadata: {
            sensorDataId: sensorData._id,
            thresholdType: 'airQuality',
            value: airQualityValue,
            threshold: 50,
            recommendedAction: 'Verify SCBA function immediately - Limit exposure time - Monitor for respiratory symptoms',
            scbaVerification: true,
            exposureLimiting: true,
            respiratoryMonitoring: true
          }
        });
        await alert.save();
        alerts.push(alert);
      }

      // Movement/Fall Detection Logic (Smart helmet and wearable studies)
      // Calculate total acceleration magnitude from x, y, z components
      let totalAcceleration = 0;
      
      console.log(`🔍 DEBUG: Movement detection - checking acceleration...`);
      console.log(`📊 DEBUG: sensorData.movement:`, sensorData.movement);
      
      if (sensorData.movement && sensorData.movement.accelerometer) {
        const acc = sensorData.movement.accelerometer;
        if (acc.x !== undefined || acc.y !== undefined || acc.z !== undefined) {
          totalAcceleration = Math.sqrt(
            Math.pow(acc.x || 0, 2) + 
            Math.pow(acc.y || 0, 2) + 
            Math.pow(acc.z || 0, 2)
          );
          console.log(`📊 DEBUG: Calculated totalAcceleration from accelerometer: ${totalAcceleration}g`);
        }
      } else if (sensorData.acceleration !== undefined) {
        // Fallback to direct acceleration value
        totalAcceleration = sensorData.acceleration;
        console.log(`📊 DEBUG: Using direct acceleration value: ${totalAcceleration}g`);
      }
      
      console.log(`🎯 DEBUG: Final totalAcceleration: ${totalAcceleration}g`);
      
      if (totalAcceleration > 20) {
        // Fall Detection: Acc >20g (fall event from evidence)
        const alert = new Alert({
          firefighterId: firefighter._id,
          type: 'FALL_DETECTED',
          severity: 'critical',
          title: 'Fall Detected - Firefighter Down',
          priority: 10,
          message: `FALL DETECTED: ${totalAcceleration.toFixed(1)}g acceleration - Firefighter potentially down`,
          status: 'active',
          triggeredAt: new Date(),
          metadata: {
            sensorDataId: sensorData._id,
            thresholdType: 'fallDetection',
            value: totalAcceleration,
            threshold: 20,
            recommendedAction: 'IMMEDIATE RESPONSE - Check firefighter status - Deploy RIT team if no response - Medical evaluation required',
            escalationRequired: true,
            emergencyResponse: true,
            ritDeployment: true
          }
        });
        await alert.save();
        alerts.push(alert);
      }

      // Inactivity Detection (possible collapse)
      console.log(`🔍 DEBUG: Checking inactivity - totalAcceleration: ${totalAcceleration}g, threshold: <0.8g`);
      if (totalAcceleration < 0.8 && totalAcceleration > 0) {
        console.log(`🚨 DEBUG: INACTIVITY DETECTED! Creating alert for ${firefighter.firstName || firefighter.name}`);
        // Inactivity: No significant movement >60s (possible collapse)
        const alert = new Alert({
          firefighterId: firefighter._id,
          type: 'INACTIVITY_DETECTED',
          severity: 'high',
          title: 'Inactivity Alert - Possible Incapacitation',
          priority: 9,
          message: `INACTIVITY DETECTED: ${totalAcceleration.toFixed(1)}g movement - No significant activity >60s`,
          status: 'active',
          triggeredAt: new Date(),
          metadata: {
            sensorDataId: sensorData._id,
            thresholdType: 'inactivity',
            value: totalAcceleration,
            threshold: 0.8,
            recommendedAction: 'IMMEDIATE WELFARE CHECK - Radio contact attempt - Visual confirmation required - Prepare RIT if no response',
            welfareCheck: true,
            emergencyResponse: true,
            radioContact: true
          }
        });
        console.log(`💾 DEBUG: Saving inactivity alert to database...`);
        await alert.save();
        console.log(`✅ DEBUG: Inactivity alert saved successfully with ID: ${alert._id}`);
        alerts.push(alert);
      } else {
        console.log(`✅ DEBUG: No inactivity detected - acceleration ${totalAcceleration}g is above 0.8g threshold`);
      }

      // Additional Health and Safety Checks
      
      // Temperature Delta Detection (Helmet Off/Severe Heat)
      const baselineTemp = 37.0; // Normal core temperature in Celsius
      const tempDelta = tempCelsius - baselineTemp;
      
      // Helmet Off Detection: Temperature delta <–8.3°C for 10s
      if (tempDelta <= -8.3) {
        const alert = new Alert({
          firefighterId: firefighter._id,
          type: 'HELMET_OFF',
          severity: 'high',
          title: 'Helmet Removed - Safety Protocol Violation',
          priority: 8,
          message: `HELMET OFF: Temperature delta ${tempDelta.toFixed(1)}°C indicates helmet removal`,
          status: 'active',
          triggeredAt: new Date(),
          metadata: {
            sensorDataId: sensorData._id,
            thresholdType: 'helmetOff',
            tempDelta: tempDelta,
            baseline: baselineTemp,
            current: tempCelsius,
            recommendedAction: 'Immediate radio contact - Verify firefighter status - Ensure helmet replacement - Safety protocol reminder',
            radioContact: true,
            safetyProtocol: true
          }
        });
        await alert.save();
        alerts.push(alert);
      }
      
      // Severe Heat Exposure: Delta >3.9°C over 1 min
      if (tempDelta >= 3.9) {
        const alert = new Alert({
          firefighterId: firefighter._id,
          type: 'SEVERE_HEAT',
          severity: 'critical',
          title: 'Severe Heat Exposure - Risk of Heat Stroke',
          priority: 9,
          message: `SEVERE HEAT: +${tempDelta.toFixed(1)}°C above baseline - Heat stroke risk imminent`,
          status: 'active',
          triggeredAt: new Date(),
          metadata: {
            sensorDataId: sensorData._id,
            thresholdType: 'severeHeat',
            tempDelta: tempDelta,
            baseline: baselineTemp,
            current: tempCelsius,
            recommendedAction: 'IMMEDIATE AGGRESSIVE COOLING - Ice packs to neck/groin/wrists - Remove gear - Shade/AC - Medical standby',
            emergencyResponse: true,
            aggressiveCooling: true,
            medicalStandby: true
          }
        });
        await alert.save();
        alerts.push(alert);
      }
      
      // Hydration reminder (every 15 minutes in high-stress scenarios)
      // Only generate for scenarios that involve physical exertion and heat exposure
      const scenario = sensorData.metadata?.scenario;
      const shouldGenerateHydrationAlert = !scenario || // Allow if no scenario specified
        scenario === 'structure_fire' ||
        scenario === 'wildfire_suppression' ||
        scenario === 'heat_exhaustion' ||
        scenario === 'hazmat_response';
      
      if (shouldGenerateHydrationAlert) {
        const lastHydration = sensorData.metadata?.lastHydrationReminder || 0;
        const timeSinceHydration = Date.now() - lastHydration;
        const fifteenMinutes = 15 * 60 * 1000;
        
        // Hydration Reminder: Every 15 min if no other alert is triggered
        if (timeSinceHydration > fifteenMinutes && (tempCelsius >= 38.0 || sensorData.heartRate >= 150)) {
          const alert = new Alert({
            firefighterId: firefighter._id,
            type: 'HYDRATION_REMINDER',
            severity: 'moderate',
            title: 'Hydration Reminder - Maintain Fluid Balance',
            priority: 4,
            message: `HYDRATION: High stress conditions (HR: ${sensorData.heartRate}, Temp: ${tempCelsius.toFixed(1)}°C) - Maintain fluid intake`,
            status: 'active',
            triggeredAt: new Date(),
            metadata: {
              sensorDataId: sensorData._id,
              thresholdType: 'hydrationReminder',
              timeSinceLastReminder: timeSinceHydration,
              currentTemp: tempCelsius,
              currentHR: sensorData.heartRate,
              recommendedAction: 'Consume 200-300ml fluids immediately - Monitor urine color - Electrolyte replacement if sweating heavily',
              fluidIntake: true,
              electrolyteReplacement: true
            }
          });
          await alert.save();
          alerts.push(alert);
        }
      }

      // Equipment failure simulation (enhanced logic based on environmental conditions)
      const equipmentFailureChance = this.calculateEquipmentFailureRisk(sensorData, tempCelsius);
      if (Math.random() < equipmentFailureChance) {
        const alert = new Alert({
          firefighterId: firefighter._id,
          type: 'SCBA_MALFUNCTION',
          severity: 'critical',
          title: 'SCBA Malfunction - Equipment Failure',
          priority: 10,
          message: `SCBA MALFUNCTION: Equipment failure detected in hazardous environment (Air: ${airQualityValue}% (${sensorData.airQuality}), Temp: ${tempCelsius.toFixed(1)}°C)`,
          status: 'active',
          triggeredAt: new Date(),
          metadata: {
            sensorDataId: sensorData._id,
            thresholdType: 'equipmentFailure',
            airQuality: airQualityValue,
            temperature: tempCelsius,
            heartRate: sensorData.heartRate,
            recommendedAction: 'IMMEDIATE EVACUATION - Switch to backup air supply - Emergency egress - Equipment inspection required',
            evacuationRequired: true,
            emergencyResponse: true,
            backupAirSupply: true,
            equipmentInspection: true
          }
        });
        await alert.save();
        alerts.push(alert);
      }

      // HRV (Heart Rate Variability) Alerts (if available)
      if (sensorData.hrv && sensorData.hrv.rmssd && sensorData.hrv.lfhf) {
        const rmssd = sensorData.hrv.rmssd;
        const lfhf = sensorData.hrv.lfhf;
        
        if (rmssd < 10 || lfhf > 8.0) {
          // Critical Alert: RMSSD <10 ms, LF/HF >8.0
          const alert = new Alert({
            firefighterId: firefighter._id,
            type: 'HRV_STRESS',
            severity: 'critical',
            title: 'Critical Physiological Stress - HRV Analysis',
            priority: 9,
            message: `CRITICAL HRV: RMSSD ${rmssd}ms, LF/HF ${lfhf.toFixed(1)} - Severe autonomic stress`,
            status: 'active',
            triggeredAt: new Date(),
            metadata: {
              sensorDataId: sensorData._id,
              thresholdType: 'hrvCritical',
              rmssd: rmssd,
              lfhf: lfhf,
              recommendedAction: 'IMMEDIATE REST - Severe autonomic stress detected - Medical evaluation - Consider rotation',
              autonomicStress: true,
              medicalEvaluation: true,
              immediateRest: true
            }
          });
          await alert.save();
          alerts.push(alert);
          
        } else if (rmssd < 15 || lfhf > 6.0) {
          // High Alert: RMSSD <15 ms, LF/HF >6.0
          const alert = new Alert({
            firefighterId: firefighter._id,
            type: 'HRV_STRESS',
            severity: 'high',
            title: 'High Physiological Stress - HRV Monitoring',
            priority: 7,
            message: `HIGH HRV: RMSSD ${rmssd}ms, LF/HF ${lfhf.toFixed(1)} - Elevated autonomic stress`,
            status: 'active',
            triggeredAt: new Date(),
            metadata: {
              sensorDataId: sensorData._id,
              thresholdType: 'hrvHigh',
              rmssd: rmssd,
              lfhf: lfhf,
              recommendedAction: 'Monitor closely - Consider rest period - Stress management techniques - Breathing exercises',
              stressManagement: true,
              restPeriod: true,
              breathingExercises: true
            }
          });
          await alert.save();
          alerts.push(alert);
          
        } else if (rmssd < 20 || lfhf > 4.0) {
          // Moderate Alert: RMSSD <20 ms, LF/HF >4.0
          const alert = new Alert({
            firefighterId: firefighter._id,
            type: 'HRV_STRESS',
            severity: 'moderate',
            title: 'Moderate Physiological Stress - HRV Alert',
            priority: 5,
            message: `MODERATE HRV: RMSSD ${rmssd}ms, LF/HF ${lfhf.toFixed(1)} - Autonomic stress developing`,
            status: 'active',
            triggeredAt: new Date(),
            metadata: {
              sensorDataId: sensorData._id,
              thresholdType: 'hrvModerate',
              rmssd: rmssd,
              lfhf: lfhf,
              recommendedAction: 'Monitor stress levels - Maintain steady work pace - Adequate hydration - Deep breathing',
              stressMonitoring: true,
              paceControl: true,
              deepBreathing: true
            }
          });
          await alert.save();
          alerts.push(alert);
        }
      }

      console.log(`📊 DEBUG: checkAndCreateAlerts completed for ${firefighter.firstName || firefighter.name}`);
      console.log(`📋 DEBUG: Generated ${alerts.length} alerts:`, alerts.map(a => ({ type: a.type, severity: a.severity, message: a.message })));
      return alerts;

    } catch (error) {
      console.error('❌ ERROR in checkAndCreateAlerts:', error);
      console.error('Stack trace:', error.stack);
      return [];
    }
  };

  // Calculate equipment failure risk based on environmental conditions
  calculateEquipmentFailureRisk(sensorData, tempCelsius) {
    let baseRisk = 0.01; // 1% base risk

    // Convert enum air quality to numeric for calculations
    let airQualityValue = 100; // Default good air quality
    if (sensorData.airQuality === 'hazardous') {
      airQualityValue = 20;
    } else if (sensorData.airQuality === 'poor') {
      airQualityValue = 40;
    } else if (sensorData.airQuality === 'moderate') {
      airQualityValue = 65;
    }
    
    // Use numeric value from metadata if available (from simulation)
    if (sensorData.metadata && sensorData.metadata.numericAirQuality) {
      airQualityValue = sensorData.metadata.numericAirQuality;
    }

    // Increase risk based on critical temperature (wildfire scenarios)
    if (tempCelsius >= 39.0) {
      baseRisk += 0.06; // +6% for critical temperature
    } else if (tempCelsius >= 38.5) {
      baseRisk += 0.03; // +3% for high temperature
    }

    // Increase risk based on poor air quality (HAZMAT scenarios)
    if (airQualityValue <= 20) {
      baseRisk += 0.08; // +8% for critical air quality
    } else if (airQualityValue <= 30) {
      baseRisk += 0.04; // +4% for poor air quality
    }

    // Increase risk based on extreme heart rate (stress on equipment)
    if (sensorData.heartRate >= 200) {
      baseRisk += 0.02; // +2% for extreme exertion
    }

    // Cap maximum risk at 15%
    return Math.min(baseRisk, 0.15);
  };

  // Auto-expire old alerts (utility function)
  expireOldAlerts = async () => {
    try {
      const expirationTime = new Date(Date.now() - 6 * 60 * 60 * 1000); // 6 hours
      
      const result = await Alert.updateMany(
        { 
          status: 'active',
          triggeredAt: { $lt: expirationTime }, 
          severity: { $in: ['moderate', 'low'] },
          createdAt: { $lt: expirationTime }
        },
        { 
          status: 'resolved', 
          notes: 'Auto-expired after 6 hours' 
        }
      );

      return result.modifiedCount;
    } catch (error) {
      console.error('Error in expireOldAlerts:', error);
      return 0;
    }
  };

  // Resolve an alert
  resolveAlert = async (req, res) => {
    try {
      const { alertId } = req.params;
      const { resolvedBy, resolution } = req.body;

      const alert = await Alert.findByIdAndUpdate(
        alertId,
        { 
          status: 'resolved',
          resolvedAt: new Date(),
          resolvedBy: resolvedBy || 'System',
          resolution: resolution || 'Alert resolved'
        },
        { new: true }
      ).populate('firefighterId', 'firstName lastName badgeNumber');

      if (!alert) {
        return res.status(404).json({
          success: false,
          message: 'Alert not found'
        });
      }

      console.log(`✅ Alert ${alertId} resolved by ${resolvedBy || 'System'}`);
      
      res.json({
        success: true,
        message: 'Alert resolved successfully',
        data: alert
      });
    } catch (error) {
      console.error('Error resolving alert:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to resolve alert',
        error: error.message
      });
    }
  };

  // Dismiss an alert
  dismissAlert = async (req, res) => {
    try {
      const { alertId } = req.params;
      const { dismissedBy, reason } = req.body;

      const alert = await Alert.findByIdAndUpdate(
        alertId,
        { 
          status: 'dismissed',
          dismissedAt: new Date(),
          dismissedBy: dismissedBy || 'System',
          dismissalReason: reason || 'Alert dismissed'
        },
        { new: true }
      ).populate('firefighterId', 'firstName lastName badgeNumber');

      if (!alert) {
        return res.status(404).json({
          success: false,
          message: 'Alert not found'
        });
      }

      console.log(`❌ Alert ${alertId} dismissed by ${dismissedBy || 'System'}`);
      
      res.json({
        success: true,
        message: 'Alert dismissed successfully',
        data: alert
      });
    } catch (error) {
      console.error('Error dismissing alert:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to dismiss alert',
        error: error.message
      });
    }
  };

  // Escalate an alert
  escalateAlert = async (req, res) => {
    try {
      const { alertId } = req.params;
      const { escalatedBy, escalationLevel, notes } = req.body;

      const alert = await Alert.findByIdAndUpdate(
        alertId,
        { 
          status: 'escalated',
          escalatedAt: new Date(),
          escalatedBy: escalatedBy || 'System',
          escalationLevel: escalationLevel || 'HIGH',
          escalationNotes: notes || 'Alert escalated for urgent attention',
          priority: Math.min((alert?.priority || 5) + 2, 10) // Increase priority
        },
        { new: true }
      ).populate('firefighterId', 'firstName lastName badgeNumber');

      if (!alert) {
        return res.status(404).json({
          success: false,
          message: 'Alert not found'
        });
      }

      console.log(`🚨 Alert ${alertId} escalated by ${escalatedBy || 'System'} to level ${escalationLevel || 'HIGH'}`);
      
      res.json({
        success: true,
        message: 'Alert escalated successfully',
        data: alert
      });
    } catch (error) {
      console.error('Error escalating alert:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to escalate alert',
        error: error.message
      });
    }
  };

  // Clean up old and invalid alerts
  cleanupOldAlerts = async (req, res) => {
    try {
      const { force } = req.query; // Allow force cleanup via query parameter

      let deletedCount = 0;
      
      if (force === 'true') {
        // Force cleanup: Remove ALL alerts
        const result = await Alert.deleteMany({});
        deletedCount = result.deletedCount;
        console.log(`🗑️ FORCE CLEANUP: Removed ALL ${deletedCount} alerts`);
      } else {
        // Normal cleanup: Remove old alerts (>24 hours)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const result = await Alert.deleteMany({
          $or: [
            { createdAt: { $lt: oneDayAgo } },
            { status: 'resolved', resolvedAt: { $lt: oneDayAgo } }
          ]
        });
        deletedCount = result.deletedCount;
        console.log(`🧹 NORMAL CLEANUP: Removed ${deletedCount} old alerts`);
      }

      res.json({
        success: true,
        message: `Cleanup completed - removed ${deletedCount} alerts`,
        deletedCount
      });
    } catch (error) {
      console.error('Error during alert cleanup:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cleanup alerts',
        error: error.message
      });
    }
  };
}

export default new AlertController();
