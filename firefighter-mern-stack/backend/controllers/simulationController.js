/**
 * 📊 Simulation Controller
 * 
 * Handles data simulation scenarios for testing and training
 */

import Firefighter from '../models/Firefighter.js';
import SensorData from '../models/SensorData.js';
import Alert from '../models/Alert.js';
import AlertController from './alertController.js';

class SimulationController {
  constructor() {
    this.activeSimulations = new Map();
    this.simulationIntervals = new Map();
    
    // Initialize scenarios
    this.scenarios = {
      'routine_training': {
        id: 'routine_training',
        name: '🔥 Routine Training Exercise',
        description: 'TRAINING ONLY: TEMPERATURE_HIGH (38.5-38.9°C) + HEART_RATE_MODERATE (150-184 bpm) - Capped at HIGH severity',
        duration: 45,
        alertTargets: ['HEART_RATE_MODERATE', 'TEMPERATURE_HIGH'], // Only training-level alerts
        maxSeverity: 'high', // Cap at HIGH severity for training
        heartRateProfile: {
          baseline: 70,
          peak: 170, // TARGET: 150-184 bpm for MODERATE alerts
          variability: 10, // Reduced for precision
          spikeProbability: 0.02,
          sustainedElevation: 0.1
        },
        temperatureProfile: {
          baseline: 37.0,
          peak: 38.7, // TARGET: 38.5-38.9°C for HIGH alerts
          riseRate: 0.15, // Gradual rise to HIGH range
          deltaThreshold: 1.1
        },
        movementProfile: {
          activityLevel: 'MODERATE',
          fallRisk: 0.0, // NO fall risk during controlled training
          inactivityPeriods: false,
          baseAcceleration: { x: 2.0, y: 1.8, z: 2.2 } // Normal activity, avoid fall thresholds
        },
        environmentalFactors: {
          ambientTemp: 22, // 22°C controlled environment
          humidity: 45,
          airQuality: 95 // EXCELLENT air quality - no environmental alerts
        }
      },
      'structure_fire': {
        id: 'structure_fire',
        name: '🏠 Structure Fire Response',
        description: 'STRUCTURE FIRE: TEMPERATURE_HIGH (38.5-38.9°C) + ENVIRONMENTAL_HAZARD HIGH (≤50% air quality)',
        duration: 60,
        alertTargets: ['TEMPERATURE_HIGH', 'ENVIRONMENTAL_HAZARD'], // Structure fire specific alerts
        heartRateProfile: {
          baseline: 85,
          peak: 140, // Keep well below 150 bpm threshold - NO heart rate alerts
          variability: 15,
          spikeProbability: 0.10,
          sustainedElevation: 0.4
        },
        temperatureProfile: {
          baseline: 37.0, 
          peak: 37.8, // Very conservative peak to account for environmental effects (37.8 + 0.9 env = 38.7°C target)
          riseRate: 0.06, // Slow rise rate
          deltaThreshold: 0.8
        },
        movementProfile: {
          activityLevel: 'HIGH',
          fallRisk: 0.0, // NO fall risk for structure fire
          inactivityPeriods: false,
          baseAcceleration: { x: 4.5, y: 3.8, z: 4.2 } // High activity but avoid >20g fall threshold
        },
        environmentalFactors: {
          ambientTemp: 25, // Reduced further to prevent temperature overload
          humidity: 55, // Reduced humidity  
          airQuality: 45 // TARGET: ≤50% for HIGH environmental hazard alerts
        }
      },
      'heat_exhaustion': {
        id: 'heat_exhaustion',
        name: '🌡️ Heat Exhaustion Emergency',
        description: 'HEAT EXHAUSTION ONLY: Generates temperature CRITICAL (≥39.0°C) + heart rate HIGH (185-199 bpm)',
        duration: 30,
        alertTargets: ['TEMPERATURE_CRITICAL', 'HEART_RATE_HIGH'], // Only these alert types
        heartRateProfile: {
          baseline: 95,
          peak: 195, // TARGET: 185-199 bpm for HIGH alerts
          variability: 10, // Reduced variability for precision
          spikeProbability: 0.18,
          sustainedElevation: 0.8
        },
        temperatureProfile: {
          baseline: 38.0, // Start at moderate threshold
          peak: 39.2, // TARGET: ≥39.0°C for CRITICAL alerts
          riseRate: 0.50, // Aggressive rise to hit critical threshold quickly
          deltaThreshold: 1.2
        },
        movementProfile: {
          activityLevel: 'MODERATE',
          fallRisk: 0.0, // NO fall risk for heat exhaustion
          inactivityPeriods: false,
          baseAcceleration: { x: 2.5, y: 2.0, z: 2.8 } // Moderate activity during heat stress
        },
        environmentalFactors: {
          ambientTemp: 45, // 45°C extreme heat
          humidity: 90, // High humidity increases heat stress
          airQuality: 95 // GOOD air quality - no air quality alerts
        }
      },
      'fall_incident': {
        id: 'fall_incident',
        name: '⚠️ Fall Incident Response',
        description: 'FALL INCIDENT ONLY: Generates FALL_DETECTED (>20g) + INACTIVITY_DETECTED (<0.8g) - Movement monitoring only',
        duration: 30,
        alertTargets: ['FALL_DETECTED', 'INACTIVITY_DETECTED'], // Only fall and movement-related alerts
        heartRateProfile: {
          baseline: 85,
          peak: 140, // Keep well below 150 bpm threshold - NO heart rate alerts (injury stress is not the focus)
          variability: 15,
          spikeProbability: 0.08, // Reduced spike probability
          sustainedElevation: 0.3 // Reduced sustained elevation
        },
        temperatureProfile: {
          baseline: 37.1,
          peak: 37.4, // Keep well below 37.5°C threshold - NO temperature alerts
          riseRate: 0.05, // Minimal temperature rise
          deltaThreshold: 0.3
        },
        movementProfile: {
          activityLevel: 'HIGH',
          fallRisk: 0.35, // HIGH fall risk for >20g acceleration spikes
          inactivityPeriods: true, // Enable <0.8g inactivity detection post-fall
          baseAcceleration: { x: 25.0, y: 20.0, z: 22.0 } // TARGET: >20g total for fall detection
        },
        environmentalFactors: {
          ambientTemp: 22, // Normal temperature
          humidity: 60,
          airQuality: 95 // GOOD air quality - no environmental alerts
        }
      },
      'inactivity_scenario': {
        id: 'inactivity_scenario',
        name: '😴 Firefighter Incapacitation Scenario',
        description: 'INACTIVITY ONLY: INACTIVITY_DETECTED (<0.8g movement) - Movement detection only',
        duration: 15,
        alertTargets: ['INACTIVITY_DETECTED'], // Only inactivity alerts
        heartRateProfile: {
          baseline: 85,
          peak: 120, // Keep well below 130 bpm threshold - NO heart rate alerts
          variability: 10,
          spikeProbability: 0.01,
          sustainedElevation: 0.05
        },
        temperatureProfile: {
          baseline: 37.0,
          peak: 37.2, // Lower peak to account for environmental effects
          riseRate: 0.02, // Very minimal temperature rise
          deltaThreshold: 0.2
        },
        movementProfile: {
          activityLevel: 'LOW',
          fallRisk: 0.02,
          inactivityPeriods: true, // PRIMARY FOCUS - detect <0.8g inactivity
          baseAcceleration: { x: 0.3, y: 0.2, z: 0.2 } // TARGET: <0.8g total for inactivity detection
        },
        environmentalFactors: {
          ambientTemp: 20, // Lower ambient temperature
          humidity: 50, // Standard humidity
          airQuality: 95 // GOOD air quality - no environmental alerts
        }
      },
      'wildfire_suppression': {
        id: 'wildfire_suppression',
        name: '🔥 Wildfire Suppression',
        description: 'TEMPERATURE FOCUS: TEMPERATURE_CRITICAL (≥39.0°C) - Heat stress only',
        duration: 120,
        alertTargets: ['TEMPERATURE_CRITICAL'], // Only critical temperature alerts
        heartRateProfile: {
          baseline: 85,
          peak: 125, // Keep well below 130 bpm threshold - NO heart rate alerts
          variability: 15,
          spikeProbability: 0.05,
          sustainedElevation: 0.2
        },
        temperatureProfile: {
          baseline: 37.8,
          peak: 39.5, // TARGET: ≥39.0°C for CRITICAL temperature alerts
          riseRate: 0.40, // Aggressive rise to critical threshold
          deltaThreshold: 1.7
        },
        movementProfile: {
          activityLevel: 'MODERATE', // Reduced activity - focus on heat not exertion
          fallRisk: 0.0, // NO fall risk for temperature focus
          inactivityPeriods: false,
          baseAcceleration: { x: 3.0, y: 2.5, z: 3.2 } // Avoid fall thresholds
        },
        environmentalFactors: {
          ambientTemp: 42, // 42°C extreme heat
          humidity: 20, // Low humidity typical of wildfire
          airQuality: 90 // GOOD air quality - no environmental alerts
        }
      },
      'search_rescue': {
        id: 'search_rescue',
        name: '🔍 Search & Rescue Operations',
        description: 'SEARCH & RESCUE: TEMPERATURE_MODERATE (38.0-38.4°C) + HEART_RATE_MODERATE (150-184 bpm)',
        duration: 75,
        alertTargets: ['TEMPERATURE_MODERATE', 'HEART_RATE_MODERATE'], // Only moderate alerts
        heartRateProfile: {
          baseline: 80,
          peak: 165, // TARGET: 150-184 bpm for MODERATE alerts
          variability: 15, // Reduced for precision
          spikeProbability: 0.08,
          sustainedElevation: 0.5
        },
        temperatureProfile: {
          baseline: 37.2,
          peak: 38.3, // TARGET: 38.0-38.4°C for MODERATE temperature alerts
          riseRate: 0.15, // Gentle rise to stay in moderate range
          deltaThreshold: 1.1
        },
        movementProfile: {
          activityLevel: 'MODERATE',
          fallRisk: 0.0, // NO fall risk for search rescue
          inactivityPeriods: false,
          baseAcceleration: { x: 3.0, y: 2.5, z: 3.2 }
        },
        environmentalFactors: {
          ambientTemp: 26, // 26°C normal ambient
          humidity: 55,
          airQuality: 95 // EXCELLENT air quality - no environmental alerts
        }
      },
      'hazmat_response': {
        id: 'hazmat_response',
        name: '☢️ HAZMAT Response',
        description: 'HAZMAT ONLY: Generates ENVIRONMENTAL_HAZARD CRITICAL (≤25% air quality) + SCBA malfunctions',
        duration: 45,
        alertTargets: ['ENVIRONMENTAL_HAZARD', 'SCBA_MALFUNCTION'], // Only hazmat alerts
        heartRateProfile: {
          baseline: 85,
          peak: 125, // Keep well below 130 bpm threshold - NO heart rate alerts
          variability: 15,
          spikeProbability: 0.05,
          sustainedElevation: 0.2
        },
        temperatureProfile: {
          baseline: 37.1,
          peak: 37.4, // Keep well below 37.5°C threshold - NO temperature alerts
          riseRate: 0.05, // Minimal temperature rise
          deltaThreshold: 0.3
        },
        movementProfile: {
          activityLevel: 'MODERATE',
          fallRisk: 0.0, // NO fall risk for hazmat
          inactivityPeriods: false,
          baseAcceleration: { x: 2.8, y: 2.2, z: 3.0 }
        },
        environmentalFactors: {
          ambientTemp: 22, // Normal ambient temperature
          humidity: 60,
          airQuality: 20 // TARGET: ≤25% for CRITICAL environmental hazard alerts
        }
      },
      'equipment_failure_scenario': {
        id: 'equipment_failure_scenario',
        name: '🛡️ Equipment Failure Emergency',
        description: 'EQUIPMENT ONLY: Manages SCBA and equipment failures',
        duration: 25,
        alertTargets: ['SCBA_MALFUNCTION', 'EQUIPMENT_MALFUNCTION', 'HELMET_REMOVAL'], // Only equipment alerts
        heartRateProfile: {
          baseline: 85,
          peak: 140, // Keep below HIGH threshold - focus on equipment
          variability: 20,
          spikeProbability: 0.10,
          sustainedElevation: 0.4
        },
        temperatureProfile: {
          baseline: 37.0, // Lower baseline
          peak: 37.2, // Much lower peak to account for environmental effects (37.2 + 1.0 env = 38.2, still below 38.5)
          riseRate: 0.05, // Minimal rate to keep temperature stable
          deltaThreshold: 0.2 // Smaller delta
        },
        movementProfile: {
          activityLevel: 'MODERATE', // Normal movement - focus on equipment
          fallRisk: 0.0, // NO fall risk for equipment scenario
          inactivityPeriods: false,
          baseAcceleration: { x: 3.0, y: 2.5, z: 3.2 }
        },
        environmentalFactors: {
          ambientTemp: 20, // Lower ambient temperature (reduces ambientEffect to 0°C)
          humidity: 50, // Standard humidity (reduces humidityEffect to 0°C)
          airQuality: 95 // Excellent air quality - focus on equipment not environment
        }
      },
      'medical_emergency_scenario': {
        id: 'medical_emergency_scenario',
        name: '🚑 Medical Emergency Simulation',
        description: 'HEART_RATE FOCUS: HEART_RATE_CRITICAL (≥200 bpm) - Cardiac monitoring only',
        duration: 20,
        alertTargets: ['HEART_RATE_CRITICAL'], // Only critical heart rate alerts
        heartRateProfile: {
          baseline: 170, // Start higher for immediate escalation
          peak: 220, // Higher peak to ensure ≥200 bpm
          variability: 15, // Reduced for precision targeting
          spikeProbability: 0.40, // Higher spike probability
          sustainedElevation: 0.9 // Very sustained elevation
        },
        temperatureProfile: {
          baseline: 37.0,
          peak: 37.2, // Lower peak to account for environmental effects
          riseRate: 0.02, // Minimal temperature rise
          deltaThreshold: 0.2
        },
        movementProfile: {
          activityLevel: 'LOW',
          fallRisk: 0.0, // NO fall risk for cardiac focus
          inactivityPeriods: false,
          baseAcceleration: { x: 1.0, y: 0.8, z: 1.2 } // Low movement, avoid thresholds
        },
        environmentalFactors: {
          ambientTemp: 20, // Lower ambient temperature
          humidity: 50, // Standard humidity
          airQuality: 95 // GOOD air quality - no environmental alerts
        }
      },
      'immobility_scenario': {
        id: 'immobility_scenario',
        name: '🚫 Extended Immobility Crisis',
        description: 'IMMOBILITY ONLY: INACTIVITY_DETECTED (<0.8g movement) + potential HEART_RATE_LOW (130-149 bpm)',
        duration: 10,
        alertTargets: ['INACTIVITY_DETECTED', 'HEART_RATE_LOW'], // Inactivity + minimal heart rate alerts
        heartRateProfile: {
          baseline: 85,
          peak: 135, // TARGET: 130-149 bpm for LOW heart rate alerts (minimal stress)
          variability: 10,
          spikeProbability: 0.01,
          sustainedElevation: 0.1
        },
        temperatureProfile: {
          baseline: 36.9,
          peak: 37.4, // Keep well below 37.5°C threshold - NO temperature alerts
          riseRate: 0.05,
          deltaThreshold: 0.5
        },
        movementProfile: {
          activityLevel: 'LOW',
          fallRisk: 0.05,
          inactivityPeriods: true, // PRIMARY FOCUS - detect <0.8g inactivity
          baseAcceleration: { x: 0.2, y: 0.1, z: 0.3 } // TARGET: <0.8g total for inactivity detection
        },
        environmentalFactors: {
          ambientTemp: 22, // Lower ambient temp for immobility
          humidity: 65,
          airQuality: 95 // EXCELLENT air quality - no environmental alerts
        }
      },
      'communication_lost_scenario': {
        id: 'communication_lost_scenario',
        name: '📡 Communication Breakdown',
        description: 'COMMUNICATION ONLY: Handles radio failure scenarios - NO sensor data transmitted',
        duration: 35,
        alertTargets: ['COMMUNICATION_LOST', 'RADIO_FAILURE'], // Only communication alerts
        communicationFailure: true, // Special flag for communication scenarios
        heartRateProfile: {
          baseline: 85, // These won't be transmitted due to communication failure
          peak: 120,
          variability: 15,
          spikeProbability: 0.05,
          sustainedElevation: 0.2
        },
        temperatureProfile: {
          baseline: 37.0,
          peak: 37.5,
          riseRate: 0.10,
          deltaThreshold: 0.5
        },
        movementProfile: {
          activityLevel: 'MODERATE',
          fallRisk: 0.0, // NO fall risk - communication focus
          inactivityPeriods: false,
          baseAcceleration: { x: 2.5, y: 2.0, z: 2.8 }
        },
        environmentalFactors: {
          ambientTemp: 25, // Normal environment
          humidity: 60,
          airQuality: 95 // GOOD air quality
        }
      },
      'multi_hazard_extreme': {
        id: 'multi_hazard_extreme',
        name: '⚡ Multi-Hazard Extreme Emergency',
        description: 'MULTI-HAZARD: ALL CRITICAL alerts - TEMPERATURE_CRITICAL + HEART_RATE_CRITICAL + ENVIRONMENTAL_HAZARD + FALL_DETECTED',
        duration: 60,
        alertTargets: ['TEMPERATURE_CRITICAL', 'HEART_RATE_CRITICAL', 'ENVIRONMENTAL_HAZARD', 'FALL_DETECTED', 'EQUIPMENT_MALFUNCTION'], // All critical alerts
        heartRateProfile: {
          baseline: 100,
          peak: 220, // TARGET: ≥200 bpm for CRITICAL alerts
          variability: 25, // Reduced for precision
          spikeProbability: 0.30,
          sustainedElevation: 0.9
        },
        temperatureProfile: {
          baseline: 37.7,
          peak: 40.3, // TARGET: ≥39.0°C for CRITICAL temperature alerts
          riseRate: 0.44,
          deltaThreshold: 2.6
        },
        movementProfile: {
          activityLevel: 'EXTREME',
          fallRisk: 0.12,
          inactivityPeriods: false,
          baseAcceleration: { x: 30.0, y: 25.0, z: 28.0 } // TARGET: >20g total for fall detection
        },
        environmentalFactors: {
          ambientTemp: 40,
          humidity: 90,
          airQuality: 15 // TARGET: ≤25% for CRITICAL environmental hazard alerts
        }
      }
    };
  }

  // Start continuous simulation for a firefighter
  startSimulation = async (req, res) => {
    try {
      const { firefighterId, firefighterIds, scenarioId } = req.body;
      
      if (!scenarioId) {
        return res.status(400).json({
          success: false,
          message: 'scenarioId is required'
        });
      }

      // Handle both single firefighter and multiple firefighters
      let fighterIds = [];
      if (firefighterIds && Array.isArray(firefighterIds)) {
        fighterIds = firefighterIds;
      } else if (firefighterId) {
        fighterIds = [firefighterId];
      } else {
        return res.status(400).json({
          success: false,
          message: 'firefighterId or firefighterIds are required'
        });
      }

      if (fighterIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one firefighter ID is required'
        });
      }

      const scenario = await this.getScenarioById(scenarioId);
      if (!scenario) {
        return res.status(404).json({
          success: false,
          message: 'Scenario not found'
        });
      }

      const results = [];
      const errors = [];

      for (const fighterId of fighterIds) {
        try {
          // Check if simulation is already running
          if (this.activeSimulations.has(fighterId)) {
            errors.push({
              firefighterId: fighterId,
              error: 'Simulation already running for this firefighter'
            });
            continue;
          }

          const firefighter = await Firefighter.findById(fighterId);
          if (!firefighter) {
            errors.push({
              firefighterId: fighterId,
              error: 'Firefighter not found'
            });
            continue;
          }

          // Initialize simulation
          this.activeSimulations.set(fighterId, {
            firefighter,
            scenario,
            startTime: new Date(),
            dataPoints: 0
          });

          this.startDataGeneration(fighterId, req);

          results.push({
            firefighterId: fighterId,
            firefighterName: `${firefighter.firstName} ${firefighter.lastName}`,
            scenario: scenario.name,
            duration: scenario.duration,
            status: 'started'
          });

        } catch (error) {
          console.error(`❌ Error starting simulation for firefighter ${fighterId}:`, error);
          errors.push({
            firefighterId: fighterId,
            error: error.message
          });
        }
      }

      const successCount = results.length;
      const errorCount = errors.length;

      if (successCount === 0) {
        return res.status(400).json({
          success: false,
          message: 'Failed to start any simulations',
          errors
        });
      }

      res.json({
        success: true,
        message: `Started simulations for ${successCount} firefighter(s)${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
        data: {
          started: results,
          errors: errors.length > 0 ? errors : undefined,
          summary: {
            total: fighterIds.length,
            started: successCount,
            failed: errorCount
          }
        }
      });

    } catch (error) {
      console.error('❌ Error starting simulation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start simulation',
        error: error.message
      });
    }
  };

  // Stop simulation
  stopSimulation = async (req, res) => {
    try {
      const { firefighterId } = req.params;
      
      if (!this.activeSimulations.has(firefighterId)) {
        return res.status(404).json({
          success: false,
          message: 'No active simulation found for this firefighter'
        });
      }

      // Clear interval and remove from active simulations
      const interval = this.simulationIntervals.get(firefighterId);
      if (interval) {
        clearInterval(interval);
        this.simulationIntervals.delete(firefighterId);
      }
      
      const simulation = this.activeSimulations.get(firefighterId);
      this.activeSimulations.delete(firefighterId);

      res.json({
        success: true,
        message: 'Simulation stopped successfully',
        data: {
          firefighterId,
          dataPointsGenerated: simulation.dataPoints,
          duration: Math.round((new Date() - simulation.startTime) / 1000)
        }
      });

    } catch (error) {
      console.error('❌ Error stopping simulation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to stop simulation',
        error: error.message
      });
    }
  };

  // Start data generation for a firefighter
  startDataGeneration(firefighterId, req = null) {
    const simulation = this.activeSimulations.get(firefighterId);
    if (!simulation) return;

    const { firefighter, scenario } = simulation;
    let dataPointCount = 0;

    const interval = setInterval(async () => {
      try {
        const elapsedMinutes = (new Date() - simulation.startTime) / (1000 * 60);
        
        console.log(`🎬 DEBUG: Generating data for scenario "${scenario.id}" (${scenario.name}) - elapsed: ${elapsedMinutes.toFixed(1)}min`);
        
        // Stop simulation if duration exceeded
        if (elapsedMinutes >= scenario.duration) {
          clearInterval(interval);
          this.simulationIntervals.delete(firefighterId);
          this.activeSimulations.delete(firefighterId);
          console.log(`✅ Simulation completed for ${firefighter.firstName} after ${scenario.duration} minutes`);
          return;
        }

        // Handle communication failure scenarios differently
        if (scenario.communicationFailure) {
          console.log(`📡 DEBUG: Communication failure scenario - generating COMMUNICATION_LOST alert only`);
          
          // Generate only communication failure alert
          const communicationAlert = new Alert({
            firefighterId: firefighter._id,
            type: 'COMMUNICATION_LOST',
            severity: 'critical',
            title: 'Communication System Failure',
            priority: 9,
            message: `CRITICAL: Communication lost with ${firefighter.firstName} ${firefighter.lastName} - Last known location required for immediate response`,
            status: 'active',
            triggeredAt: new Date(),
            metadata: {
              scenario: scenario.id,
              elapsedMinutes: elapsedMinutes.toFixed(1),
              dataPointNumber: ++dataPointCount,
              communicationFailure: true,
              lastKnownStatus: 'Active duty - Communication system malfunction',
              recommendedAction: 'IMMEDIATE: Establish visual contact - Deploy backup communication - Initiate emergency protocols',
              evacuationRequired: true,
              emergencyResponse: true
            }
          });

          await communicationAlert.save();
          console.log(`📡 Generated COMMUNICATION_LOST alert for ${firefighter.firstName}`);
          
          // Emit communication failure alert
          if (req && req.app && req.app.get('socketio')) {
            req.app.get('socketio').emit('communicationFailure', {
              firefighterId,
              alert: communicationAlert,
              status: 'communication_lost'
            });
            console.log(`📡 Emitted communication failure alert via Socket.IO for firefighter ${firefighterId}`);
          }
          
          return; // Don't generate sensor data for communication failures
        }

        // Generate realistic vitals
        const vitals = this.calculateRealisticVitals(scenario, elapsedMinutes, firefighter);
        
        // Debug logging for critical scenarios
        if (['immobility_scenario', 'inactivity_scenario', 'heat_exhaustion', 'structure_fire'].includes(scenario.id)) {
          console.log(`🔍 DEBUG: ${scenario.id} vitals - HR: ${vitals.heartRate}, Temp: ${vitals.temperature}°C, AQ: ${vitals.airQuality}, Acceleration: ${vitals.acceleration.toFixed(2)}g`);
          
          // Special debug for inactivity scenarios
          if (['immobility_scenario', 'inactivity_scenario'].includes(scenario.id)) {
            console.log(`🚫 DEBUG: INACTIVITY SCENARIO - Acceleration: ${vitals.acceleration.toFixed(2)}g (target: <0.8g for INACTIVITY_DETECTED)`);
          }
        }
        
        // Create sensor data entry
        // Convert numeric air quality to enum value with debug logging
        let airQualityEnum = 'good';
        if (vitals.airQuality <= 25) {
          airQualityEnum = 'hazardous';
        } else if (vitals.airQuality <= 50) {
          airQualityEnum = 'poor';
        } else if (vitals.airQuality <= 75) {
          airQualityEnum = 'moderate';
        }
        
        console.log(`💨 DEBUG: Air quality conversion - numeric: ${vitals.airQuality}% → enum: ${airQualityEnum}`);

        // Map scenario activity level to SensorData enum
        const activityLevelMap = {
          'LOW': 'light',
          'MODERATE': 'moderate', 
          'HIGH': 'vigorous',
          'EXTREME': 'extreme'
        };
        const activityLevel = activityLevelMap[scenario.movementProfile.activityLevel] || 'moderate';

        const sensorData = new SensorData({
          firefighterId: firefighter._id,
          heartRate: vitals.heartRate,
          bodyTemperature: vitals.temperature,
          airQuality: airQualityEnum,
          movement: {
            accelerometer: {
              x: vitals.acceleration * 0.6, // Distribute acceleration across axes
              y: vitals.acceleration * 0.8,
              z: vitals.acceleration * 0.7
            },
            activityLevel: activityLevel
          },
          timestamp: new Date(),
          isSimulated: true,
          metadata: {
            scenario: scenario.id,
            elapsedMinutes: elapsedMinutes.toFixed(1),
            dataPointNumber: ++dataPointCount,
            totalAcceleration: vitals.acceleration, // Store for reference
            numericAirQuality: vitals.airQuality, // Store numeric version for reference
            accelerationComponents: { // Add detailed acceleration breakdown for debugging
              x: vitals.acceleration * 0.6,
              y: vitals.acceleration * 0.8, 
              z: vitals.acceleration * 0.7,
              total: vitals.acceleration
            }
          }
        });

        const savedData = await sensorData.save();
        simulation.dataPoints++;

        // Use centralized AlertController for ALL alert generation
        const alerts = await AlertController.checkAndCreateAlerts(savedData, firefighter);
        
        // Enhanced alert filtering with proper mapping to AlertController types
        let filteredAlerts = alerts;
        if (scenario.alertTargets && alerts && alerts.length > 0) {
          // Create comprehensive mapping of scenario targets to actual alert types
          const alertTypeMapping = {
            // Heart Rate Alerts
            'HEART_RATE_CRITICAL': ['HEART_RATE_CRITICAL'],
            'HEART_RATE_HIGH': ['HEART_RATE_HIGH'],
            'HEART_RATE_MODERATE': ['HEART_RATE_MODERATE'],
            'HEART_RATE_LOW': ['HEART_RATE_LOW'],
            
            // Temperature Alerts
            'TEMPERATURE_CRITICAL': ['TEMPERATURE_CRITICAL'],
            'TEMPERATURE_HIGH': ['TEMPERATURE_HIGH'],
            'TEMPERATURE_MODERATE': ['TEMPERATURE_MODERATE'],
            'TEMPERATURE_LOW': ['TEMPERATURE_LOW'],
            
            // Environmental Alerts
            'ENVIRONMENTAL_HAZARD': ['ENVIRONMENTAL_HAZARD'],
            'AIR_QUALITY_CRITICAL': ['ENVIRONMENTAL_HAZARD'],
            
            // Movement Alerts
            'FALL_DETECTED': ['FALL_DETECTED'],
            'INACTIVITY_DETECTED': ['INACTIVITY_DETECTED'],
            
            // Equipment Alerts
            'SCBA_MALFUNCTION': ['SCBA_MALFUNCTION'],
            'EQUIPMENT_MALFUNCTION': ['EQUIPMENT_FAILURE'], // Use valid enum value
            'HELMET_REMOVAL': ['HELMET_OFF'], // Use valid enum value (HELMET_OFF not HELMET_REMOVAL)
            
            // Communication Alerts
            'COMMUNICATION_LOST': ['COMMUNICATION_LOST'],
            'RADIO_FAILURE': ['COMMUNICATION_LOST']
          };
          
          // Get all allowed alert types for this scenario
          const allowedAlertTypes = [];
          scenario.alertTargets.forEach(target => {
            if (alertTypeMapping[target]) {
              allowedAlertTypes.push(...alertTypeMapping[target]);
            }
          });
          
          console.log(`🎯 SCENARIO MAPPING: ${scenario.id} targets [${scenario.alertTargets.join(', ')}] → allowed types [${allowedAlertTypes.join(', ')}]`);
          
          filteredAlerts = alerts.filter(alert => {
            const isAllowed = allowedAlertTypes.includes(alert.type);
            if (!isAllowed) {
              console.log(`🚫 FILTERED OUT: ${alert.type}(${alert.severity}) - not in allowed types for ${scenario.id}`);
            }
            return isAllowed;
          });
          
          if (filteredAlerts.length < alerts.length) {
            console.log(`🎯 SCENARIO FILTER: ${scenario.id} - Filtered ${alerts.length} alerts down to ${filteredAlerts.length} scenario-specific alerts`);
            console.log(`🎯 Generated: ${alerts.map(a => a.type).join(', ')}`);
            console.log(`🎯 Kept: ${filteredAlerts.map(a => a.type).join(', ')}`);
          }
        }

        // Apply severity cap for training scenarios
        if (scenario.maxSeverity && filteredAlerts && filteredAlerts.length > 0) {
          const severityLevels = { low: 1, moderate: 2, high: 3, critical: 4 };
          const maxLevel = severityLevels[scenario.maxSeverity] || 4;
          
          filteredAlerts = filteredAlerts.filter(alert => {
            const alertLevel = severityLevels[alert.severity] || 1;
            return alertLevel <= maxLevel;
          });
          
          console.log(`🎓 TRAINING CAP: ${scenario.id} - Capped alerts at ${scenario.maxSeverity} severity`);
        }
        
        if (filteredAlerts && filteredAlerts.length > 0) {
          console.log(`🚨 Generated ${filteredAlerts.length} scenario-specific alerts for ${firefighter.firstName}:`, 
            filteredAlerts.map(a => `${a.type}(${a.severity})`));
        }

        // Emit real-time updates via Socket.IO if available
        if (req && req.app && req.app.get('socketio')) {
          req.app.get('socketio').emit('sensorDataUpdate', {
            firefighterId,
            data: savedData,
            alerts: filteredAlerts || [] // Use filtered alerts
          });
          console.log(`📡 Emitted real-time update via Socket.IO for firefighter ${firefighterId}`);
        } else {
          console.log(`❌ Socket.IO not available for real-time updates - req.app:`, !!req?.app, 'socketio:', !!req?.app?.get('socketio'));
        }

        // Enhanced Equipment Failure Logic for Specific Scenarios - only for equipment-focused scenarios
        if (scenario.alertTargets && scenario.alertTargets.some(target => target.includes('EQUIPMENT') || target.includes('SCBA'))) {
          const shouldTriggerEquipmentFailure = this.checkEquipmentFailure(scenario, vitals, elapsedMinutes);
          if (shouldTriggerEquipmentFailure) {
            const equipmentAlert = await this.generateEquipmentFailureAlert(firefighter, savedData, scenario);
            if (equipmentAlert) {
              console.log(`⚠️ Equipment failure alert generated for ${firefighter.firstName}:`, equipmentAlert.type);
            }
          }
        }

      } catch (error) {
        console.error(`❌ Error generating simulation data for ${firefighterId}:`, error.message);
        console.error(`Stack trace:`, error.stack);
        // Don't stop the interval, just log the error
      }
    }, 10000); // Generate data every 10 seconds (reduced frequency to prevent alert spam)

    this.simulationIntervals.set(firefighterId, interval);
  }

  // Get scenario by ID
  async getScenarioById(scenarioId) {
    console.log(`🔍 Looking for scenario: ${scenarioId}`);
    console.log(`📋 Available scenarios: ${Object.keys(this.scenarios).join(', ')}`);
    
    const scenario = this.scenarios[scenarioId];
    if (scenario) {
      console.log(`✅ Found scenario: ${scenario.name}`);
      return scenario;
    } else {
      console.log(`❌ Scenario ${scenarioId} not found`);
      return null;
    }
  }

  // Calculate realistic vitals for simulation scenarios
  calculateRealisticVitals(scenario, elapsedMinutes, firefighter) {
    const progress = Math.min(elapsedMinutes / scenario.duration, 1);

    console.log(`🔬 DEBUG: calculateRealisticVitals for scenario ${scenario.id}, elapsed: ${elapsedMinutes.toFixed(1)}min, progress: ${(progress * 100).toFixed(1)}%`);

    // HEART RATE CALCULATION - Use scenario-defined peaks (AlertController handles age-based thresholds)
    const baseHR = scenario.heartRateProfile.baseline;
    const peakHR = scenario.heartRateProfile.peak; // Use scenario peak directly - AlertController will determine if it's dangerous
    
    const hrVariability = scenario.heartRateProfile.variability;
    
    // More aggressive progression to reach target values faster
    let progressionExponent = 0.2; // Default aggressive progression
    
    // ULTRA-AGGRESSIVE progression for critical heart rate scenarios
    if (['medical_emergency_scenario', 'multi_hazard_extreme'].includes(scenario.id)) {
      progressionExponent = 0.1; // Even more aggressive - reaches peak faster
      console.log(`🚨 DEBUG: Using ULTRA-AGGRESSIVE progression (${progressionExponent}) for critical scenario ${scenario.id}`);
    }
    
    let progressiveHR = baseHR + (peakHR - baseHR) * Math.pow(progress, progressionExponent);
    
    // Add scenario-specific surge for critical scenarios
    if (['heat_exhaustion', 'wildfire_suppression', 'hazmat_response'].includes(scenario.id)) {
      if (progress > 0.1) progressiveHR += 20; // Earlier and stronger boost
      if (progress > 0.4) progressiveHR += 10; // Additional boost later
    }
    
    // Special handling for structure fire to reach HIGH range
    if (scenario.id === 'structure_fire' && progress > 0.2) {
      progressiveHR += 15; // Boost to reach 175 peak
    }
    
    // CRITICAL HEART RATE SCENARIOS - Aggressive progression to reach ≥200 bpm
    if (['medical_emergency_scenario', 'multi_hazard_extreme'].includes(scenario.id)) {
      if (progress > 0.05) progressiveHR += 30; // Very early boost to reach critical levels
      if (progress > 0.2) progressiveHR += 25; // Additional boost to ensure ≥200 bpm
      if (progress > 0.4) progressiveHR += 15; // Sustained critical levels
      console.log(`🚨 DEBUG: CRITICAL HR SCENARIO - ${scenario.id} - boosted HR to ${progressiveHR.toFixed(1)} bpm`);
    }
    
    // Natural variability and fatigue
    const variabilityNoise = (Math.random() - 0.5) * hrVariability;
    const fatigueEffect = progress * 8; // Reduced fatigue effect
    
    let heartRate = Math.round(progressiveHR + variabilityNoise + fatigueEffect);
    heartRate = Math.max(60, Math.min(250, heartRate));
    
    console.log(`💓 DEBUG: HR calculation - base: ${baseHR}, peak: ${peakHR}, progressive: ${progressiveHR.toFixed(1)}, final: ${heartRate}`);

    // TEMPERATURE CALCULATION - More aggressive progression
    const baseTemp = scenario.temperatureProfile.baseline;
    const peakTemp = scenario.temperatureProfile.peak;
    const riseRate = scenario.temperatureProfile.riseRate;
    
    // More aggressive temperature rise to reach critical values
    let tempIncrease = riseRate * elapsedMinutes * 2.0; // Increased multiplier from 1.5 to 2.0
    if (tempIncrease > (peakTemp - baseTemp)) {
      tempIncrease = peakTemp - baseTemp; // Cap at peak
    }
    
    const ambientEffect = (scenario.environmentalFactors.ambientTemp - 20) * 0.15; // Increased from 0.12
    const humidityEffect = (scenario.environmentalFactors.humidity - 50) * 0.025; // Increased from 0.02
    
    let temperature = baseTemp + tempIncrease + ambientEffect + humidityEffect;
    
    // Add scenario-specific heat surge for critical scenarios (REMOVED structure_fire)
    if (['heat_exhaustion', 'wildfire_suppression', 'hazmat_response'].includes(scenario.id)) {
      if (progress > 0.2) temperature += 0.4; // Earlier and stronger boost
      if (progress > 0.5) temperature += 0.3; // Additional boost
    }
    
    // Removed structure fire heat boost to keep it in HIGH range, not critical
    
    // Special handling for immobility scenario - KEEP TEMPERATURE LOW
    if (scenario.id === 'immobility_scenario') {
      // Cap temperature for immobility to stay well below alert thresholds
      temperature = Math.min(temperature, 37.5); // Never exceed 37.5°C for immobility
      console.log(`🚫 DEBUG: Immobility scenario - capping temperature at ${temperature.toFixed(1)}°C`);
    }
    
    temperature += (Math.random() - 0.5) * 0.15; // Reduced random variation
    temperature = Math.max(35, Math.min(42, temperature));
    
    console.log(`🌡️ DEBUG: Temp calculation - base: ${baseTemp}, peak: ${peakTemp}, increase: ${tempIncrease.toFixed(2)}, final: ${temperature.toFixed(1)}°C`);

    // MOVEMENT/ACCELERATION CALCULATION
    const activityMultipliers = {
      'LOW': 1.8,
      'MODERATE': 3.5,
      'HIGH': 6.0,
      'EXTREME': 8.5
    };
    
    let acceleration;
    
    // Use baseAcceleration if defined for specific scenarios (like inactivity)
    if (scenario.movementProfile.baseAcceleration) {
      const base = scenario.movementProfile.baseAcceleration;
      
      // Special handling for fall incident - high acceleration initially, then low after fall
      if (scenario.id === 'fall_incident') {
        if (progress < 0.2) {
          // Initial 20% - high acceleration for fall detection
          const totalBase = Math.sqrt(base.x * base.x + base.y * base.y + base.z * base.z);
          acceleration = totalBase + (Math.random() - 0.5) * 5.0; // More variation for fall
          console.log(`🆘 DEBUG: Fall scenario - FALL PHASE - target: ${totalBase.toFixed(1)}g, final: ${acceleration.toFixed(2)}g`);
        } else {
          // After fall - very low acceleration for inactivity detection
          acceleration = 0.3 + (Math.random() - 0.5) * 0.4; // 0.1-0.5g range
          acceleration = Math.max(0.1, Math.min(0.7, acceleration)); // Keep below 0.8g threshold
          console.log(`🚫 DEBUG: Fall scenario - INACTIVITY PHASE - final: ${acceleration.toFixed(2)}g (post-fall immobility)`);
        }
      } else {
        // Standard baseAcceleration handling for other scenarios
        const totalBase = Math.sqrt(base.x * base.x + base.y * base.y + base.z * base.z);
        acceleration = totalBase + (Math.random() - 0.5) * 0.2; // ±0.1g variation
        acceleration = Math.max(0.1, Math.min(50, acceleration));
        console.log(`📐 DEBUG: Using baseAcceleration - x: ${base.x}, y: ${base.y}, z: ${base.z}, total: ${totalBase.toFixed(2)}g, final: ${acceleration.toFixed(2)}g`);
      }
    } else {
      // Use activity multipliers for scenarios without specific baseAcceleration
      acceleration = 1.0 + Math.random() * activityMultipliers[scenario.movementProfile.activityLevel];
      acceleration = Math.max(0.1, Math.min(50, acceleration));
      
      console.log(`🏃 DEBUG: Using activity multiplier - level: ${scenario.movementProfile.activityLevel}, final: ${acceleration.toFixed(2)}g`);
    }

    // AIR QUALITY - Fix the undefined issue
    const envFactors = scenario.environmentalFactors;
    let airQuality = envFactors.airQuality + (Math.random() - 0.5) * 8; // Reduced variation
    airQuality = Math.max(0, Math.min(100, Math.round(airQuality)));
    
    console.log(`💨 DEBUG: Air quality - base: ${envFactors.airQuality}, final: ${airQuality}%`);

    const vitals = {
      heartRate,
      temperature: Math.round(temperature * 10) / 10,
      acceleration: Math.round(acceleration * 10) / 10,
      airQuality,
      tempDelta: temperature - baseTemp
    };

    console.log(`📊 DEBUG: Final vitals:`, vitals);
    return vitals;
  }

  // Check if equipment failure should be triggered based on scenario and conditions
  checkEquipmentFailure(scenario, vitals, elapsedMinutes) {
    const scenarioFailureRates = {
      'wildfire_suppression': 0.12, // 12% chance ONLY when temperature ≥39.0°C
      'hazmat_response': 0.08, // 8% chance when air quality ≤25% OR temp ≥39.0°C
      'equipment_failure_scenario': 0.35, // 35% chance - designed for equipment failures (increased for testing)
      'multi_hazard_extreme': 0.15 // 15% chance in extreme conditions
    };

    const baseFailureRate = scenarioFailureRates[scenario.id] || 0.0; // No failures for other scenarios
    
    console.log(`🔧 DEBUG: Equipment failure check for ${scenario.id} - elapsed: ${elapsedMinutes.toFixed(1)}min, rate: ${baseFailureRate}`);

    // Wildfire: SCBA malfunction ONLY when critical temperature reached
    if (scenario.id === 'wildfire_suppression' && vitals.temperature >= 39.0) {
      console.log(`🔥 DEBUG: Wildfire SCBA failure check - temp: ${vitals.temperature}°C >= 39.0°C, chance: ${baseFailureRate}`);
      return Math.random() < baseFailureRate;
    }

    // HAZMAT: Equipment failure when poor air quality OR critical temperature
    if (scenario.id === 'hazmat_response' && (vitals.airQuality <= 25 || vitals.temperature >= 39.0)) {
      console.log(`☢️ DEBUG: HAZMAT equipment failure check - air: ${vitals.airQuality}%, temp: ${vitals.temperature}°C, chance: ${baseFailureRate}`);
      return Math.random() < baseFailureRate;
    }

    // Equipment Failure Scenario: Time-based failures
    if (scenario.id === 'equipment_failure_scenario' && elapsedMinutes >= 1) { // Start equipment failures after 1 minute
      console.log(`🛡️ DEBUG: Equipment failure scenario - elapsed: ${elapsedMinutes.toFixed(1)}min >= 1min, chance: ${baseFailureRate}`);
      return Math.random() < baseFailureRate;
    }

    // Multi-hazard: Multiple stress factors
    if (scenario.id === 'multi_hazard_extreme') {
      const stressFactors = 
        (vitals.temperature >= 39.0 ? 1 : 0) +
        (vitals.heartRate >= 190 ? 1 : 0) +
        (vitals.airQuality <= 25 ? 1 : 0);
      
      if (stressFactors >= 2) {
        console.log(`⚡ DEBUG: Multi-hazard extreme - ${stressFactors} stress factors, chance: ${baseFailureRate}`);
        return Math.random() < baseFailureRate;
      }
    }

    console.log(`✅ DEBUG: No equipment failure triggered for ${scenario.id} - conditions not met`);
    return false; // No equipment failures for structure_fire, heat_exhaustion, search_rescue
  }

  // Generate equipment failure alerts
  async generateEquipmentFailureAlert(firefighter, sensorData, scenario) {
    try {
      const equipmentTypes = {
        'wildfire_suppression': 'SCBA_MALFUNCTION',
        'hazmat_response': 'SCBA_MALFUNCTION', 
        'structure_fire': 'EQUIPMENT_FAILURE',  // Changed from invalid THERMAL_PROTECTION_FAILURE
        'equipment_failure_scenario': 'EQUIPMENT_FAILURE', // Changed from invalid MULTIPLE_EQUIPMENT_FAILURE
        'multi_hazard_extreme': 'EQUIPMENT_FAILURE' // Changed from invalid CRITICAL_EQUIPMENT_FAILURE
      };

      const alertType = equipmentTypes[scenario.id] || 'EQUIPMENT_FAILURE';

      const alert = new Alert({
        firefighterId: firefighter._id,
        type: alertType,
        severity: 'critical',
        title: 'Equipment Failure - Immediate Action Required',
        priority: 10,
        message: `${alertType.replace(/_/g, ' ')}: Equipment malfunction detected during ${scenario.name}`,
        status: 'active',
        triggeredAt: new Date(),
        metadata: {
          sensorDataId: sensorData._id,
          thresholdType: 'equipmentFailure',
          scenario: scenario.id,
          temperature: sensorData.temperature,
          airQuality: sensorData.airQuality,
          heartRate: sensorData.heartRate,
          recommendedAction: 'IMMEDIATE EVACUATION - Switch to backup equipment - Emergency egress - Equipment inspection required',
          evacuationRequired: true,
          emergencyResponse: true,
          equipmentInspection: true
        }
      });

      await alert.save();
      return alert;
    } catch (error) {
      console.error('❌ Error generating equipment failure alert:', error);
      return null;
    }
  }

  // Generate sensor data for testing
  generateSensorData = async (req, res) => {
    try {
      console.log('📊 Generating sensor data...');
      
      const { firefighterId, count = 10, scenario = 'normal' } = req.body;
      
      if (!firefighterId) {
        return res.status(400).json({
          success: false,
          message: 'firefighterId is required'
        });
      }

      // Verify firefighter exists
      const firefighter = await Firefighter.findById(firefighterId);
      if (!firefighter) {
        return res.status(404).json({
          success: false,
          message: 'Firefighter not found'
        });
      }

      const sensorDataPoints = [];
      const now = new Date();

      for (let i = 0; i < count; i++) {
        const timestamp = new Date(now.getTime() - (i * 10000)); // 10 second intervals
        
        // Generate realistic data based on scenario
        let heartRate, temperature, acceleration;
        
        switch (scenario) {
          case 'emergency':
            heartRate = Math.floor(Math.random() * 40) + 180; // 180-220
            temperature = Math.random() * 2 + 39; // 39-41°C
            acceleration = Math.random() * 15 + 5; // 5-20g
            break;
          case 'moderate':
            heartRate = Math.floor(Math.random() * 30) + 160; // 160-190
            temperature = Math.random() * 1 + 38.5; // 38.5-39.5°C
            acceleration = Math.random() * 10 + 2; // 2-12g
            break;
          default: // normal
            heartRate = Math.floor(Math.random() * 40) + 80; // 80-120
            temperature = Math.random() * 0.5 + 37.5; // 37.5-38°C
            acceleration = Math.random() * 3 + 0.5; // 0.5-3.5g
        }

        const sensorData = new SensorData({
          firefighterId,
          heartRate: Math.round(heartRate),
          bodyTemperature: Math.round(temperature * 10) / 10, // Use bodyTemperature field
          movement: {
            accelerometer: {
              x: acceleration * 0.6, // Distribute acceleration across axes
              y: acceleration * 0.8,
              z: acceleration * 0.7
            },
            activityLevel: 'moderate' // Use valid enum value
          },
          airQuality: 'good', // Default to good for simple simulation
          timestamp,
          isSimulated: true
        });

        await sensorData.save();
        sensorDataPoints.push(sensorData);
      }

      res.status(200).json({
        success: true,
        message: `Generated ${count} sensor data points`,
        data: sensorDataPoints,
        scenario
      });

    } catch (error) {
      console.error('❌ Error generating sensor data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate sensor data',
        error: error.message
      });
    }
  };

  // Get available scenarios
  getAvailableScenarios = async (req, res) => {
    try {
      console.log('📋 GET /scenarios - Returning available scenarios');
      
      // Return the scenario objects with their IDs and metadata
      const scenarioList = Object.keys(this.scenarios).map(id => ({
        id,
        name: this.scenarios[id].name,
        description: this.scenarios[id].description,
        duration: this.scenarios[id].duration
      }));
      
      console.log(`✅ Returning ${scenarioList.length} scenarios:`, scenarioList.map(s => s.name));
      
      res.json({
        success: true,
        data: scenarioList,
        count: scenarioList.length
      });
    } catch (error) {
      console.error('❌ Error getting scenarios:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get scenarios',
        error: error.message
      });
    }
  };

  // Start all simulations for active firefighters
  startAllSimulations = async (req, res) => {
    try {
      console.log('🚀 Starting simulations for all active firefighters...');
      
      const { scenarioId = 'routine_training' } = req.body;
      
      const activeFirefighters = await Firefighter.find({ 
        isActive: true, 
        onDuty: true 
      });

      if (activeFirefighters.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No active firefighters found'
        });
      }

      const results = [];
      for (const firefighter of activeFirefighters) {
        if (!this.activeSimulations.has(firefighter._id.toString())) {
          const scenario = await this.getScenarioById(scenarioId);
          if (scenario) {
            this.activeSimulations.set(firefighter._id.toString(), {
              firefighter,
              scenario,
              startTime: new Date(),
              dataPoints: 0
            });
            this.startDataGeneration(firefighter._id.toString(), req);
            results.push({
              firefighterId: firefighter._id,
              name: `${firefighter.firstName} ${firefighter.lastName}`,
              status: 'started'
            });
          }
        }
      }

      res.json({
        success: true,
        message: `Started simulations for ${results.length} firefighters`,
        data: results
      });

    } catch (error) {
      console.error('❌ Error starting all simulations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start all simulations',
        error: error.message
      });
    }
  };

  // Stop all active simulations
  stopAllSimulations = async (req, res) => {
    try {
      console.log('🛑 Stopping all active simulations...');
      
      const activeCount = this.activeSimulations.size;
      
      // Clear all intervals
      for (const [firefighterId, interval] of this.simulationIntervals) {
        clearInterval(interval);
      }
      
      // Clear all active simulations
      this.activeSimulations.clear();
      this.simulationIntervals.clear();

      res.json({
        success: true,
        message: `Stopped ${activeCount} active simulations`,
        data: { stoppedCount: activeCount }
      });

    } catch (error) {
      console.error('❌ Error stopping all simulations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to stop all simulations',
        error: error.message
      });
    }
  };

  // Get all active simulations
  getActiveSimulations = async (req, res) => {
    try {
      const activeSimulations = Array.from(this.activeSimulations.entries()).map(([firefighterId, simulation]) => {
        const elapsedSeconds = Math.round((new Date() - simulation.startTime) / 1000);
        const elapsedMinutes = Math.round(elapsedSeconds / 60);
        const totalDurationMinutes = simulation.scenario.duration || 0;
        const progressPercent = totalDurationMinutes > 0 ? Math.round((elapsedMinutes / totalDurationMinutes) * 100) : 0;
        
        return {
          firefighterId,
          firefighterName: `${simulation.firefighter.firstName} ${simulation.firefighter.lastName}`,
          scenarioName: simulation.scenario.name,
          scenarioId: simulation.scenario.id,
          scenarioDescription: simulation.scenario.description,
          totalDuration: totalDurationMinutes,
          elapsedTime: elapsedSeconds,
          elapsedMinutes: elapsedMinutes,
          progressPercent: Math.min(progressPercent, 100),
          startTime: simulation.startTime,
          dataPoints: simulation.dataPoints,
          status: progressPercent >= 100 ? 'completed' : 'running',
          alertTargets: simulation.scenario.alertTargets || []
        };
      });

      res.json({
        success: true,
        data: activeSimulations,
        count: activeSimulations.length
      });

    } catch (error) {
      console.error('❌ Error getting active simulations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get active simulations',
        error: error.message
      });
    }
  };

  // Get simulation status for a specific firefighter
  getSimulationStatus = async (req, res) => {
    try {
      const { firefighterId } = req.params;
      
      const simulation = this.activeSimulations.get(firefighterId);
      
      if (!simulation) {
        return res.status(404).json({
          success: false,
          message: 'No active simulation found for this firefighter'
        });
      }

      const elapsedSeconds = Math.round((new Date() - simulation.startTime) / 1000);
      const elapsedMinutes = Math.round(elapsedSeconds / 60);
      const totalDurationMinutes = simulation.scenario.duration || 0;
      const progressPercent = totalDurationMinutes > 0 ? Math.round((elapsedMinutes / totalDurationMinutes) * 100) : 0;

      res.json({
        success: true,
        data: {
          firefighterId,
          firefighterName: `${simulation.firefighter.firstName} ${simulation.firefighter.lastName}`,
          scenarioName: simulation.scenario.name,
          scenarioId: simulation.scenario.id,
          scenarioDescription: simulation.scenario.description,
          totalDuration: totalDurationMinutes,
          elapsedTime: elapsedSeconds,
          elapsedMinutes: elapsedMinutes,
          progressPercent: Math.min(progressPercent, 100),
          startTime: simulation.startTime,
          dataPoints: simulation.dataPoints,
          status: progressPercent >= 100 ? 'completed' : 'running',
          alertTargets: simulation.scenario.alertTargets || [],
          isActive: true
        }
      });

    } catch (error) {
      console.error('❌ Error getting simulation status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get simulation status',
        error: error.message
      });
    }
  };

  // Create custom scenario (placeholder for future implementation)
  customScenario = async (req, res) => {
    try {
      res.status(501).json({
        success: false,
        message: 'Custom scenario creation not yet implemented',
        data: null
      });

    } catch (error) {
      console.error('❌ Error creating custom scenario:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create custom scenario',
        error: error.message
      });
    }
  };
}

export default new SimulationController();
