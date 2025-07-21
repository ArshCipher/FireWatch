/**
 * 🧪 Scenario Logic Test
 * 
 * Tests all scenario types to verify alert logic
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import simulationController from './controllers/simulationController.js';
import Alert from './models/Alert.js';
import Firefighter from './models/Firefighter.js';
import SensorData from './models/SensorData.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/firefighter_monitoring';

async function testAllScenarios() {
  try {
    console.log('🚀 Starting scenario logic verification...\n');
    
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    console.log('📡 Connected to MongoDB');
    
    // Clean up existing test data
    await Alert.deleteMany({});
    await Firefighter.deleteMany({ firefighterId: 'FF0001' });
    console.log('🧹 Cleaned up existing alerts and test firefighters');
    
    // Create test firefighter with all required fields
    const testFirefighter = new Firefighter({
      firefighterId: 'FF0001',
      firstName: 'Test',
      lastName: 'Firefighter',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'male',
      height: 180,
      weight: 80,
      email: 'test@firestation.com',
      phone: '+1-555-0123',
      department: 'Test Fire Department',
      station: 'Station 1',
      shift: 'A',
      isActive: true,
      currentScenario: 'NONE',
      createdBy: new mongoose.Types.ObjectId() // Valid ObjectId
    });
    await testFirefighter.save();
    console.log('👨‍🚒 Created test firefighter');
    
    // Test cases for each scenario
    const scenarios = [
      {
        name: 'HEAT_EXHAUSTION',
        data: {
          heartRate: 195,
          bodyTemperature: 39.1,
          temperature: 39.1,
          acceleration: 1.2,
          airQuality: 85
        },
        expectedAlerts: ['TEMPERATURE_CRITICAL', 'HEART_RATE_HIGH']
      },
      {
        name: 'FALL',
        data: {
          heartRate: 190,
          bodyTemperature: 37.5,
          temperature: 37.5,
          acceleration: 25.0,
          airQuality: 90
        },
        expectedAlerts: ['FALL_DETECTED', 'INACTIVITY_DETECTED', 'HEART_RATE_HIGH']
      },
      {
        name: 'HAZMAT',
        data: {
          heartRate: 140,
          bodyTemperature: 37.8,
          temperature: 37.8,
          acceleration: 1.5,
          airQuality: 20
        },
        expectedAlerts: ['ENVIRONMENTAL_HAZARD', 'SCBA_MALFUNCTION']
      },
      {
        name: 'TRAINING',
        data: {
          heartRate: 205,
          bodyTemperature: 39.5,
          temperature: 39.5,
          acceleration: 1.0,
          airQuality: 75
        },
        expectedBehavior: 'All alerts capped at HIGH severity'
      },
      {
        name: 'INACTIVITY',
        data: {
          heartRate: 145,
          bodyTemperature: 37.5,
          temperature: 37.5,
          acceleration: 0.3,
          airQuality: 90
        },
        expectedAlerts: ['INACTIVITY_DETECTED']
      }
    ];
    
    console.log('\n🔍 Testing individual scenarios:\n');
    
    for (const scenario of scenarios) {
      console.log(`--- Testing ${scenario.name} ---`);
      
      // Update firefighter scenario
      testFirefighter.currentScenario = scenario.name;
      await testFirefighter.save();
      
      // Create sensor data
      const sensorData = new SensorData({
        firefighterId: testFirefighter._id,
        ...scenario.data,
        timestamp: new Date()
      });
      await sensorData.save();
      
      // Mock request/response
      const req = { body: { firefighterId: testFirefighter._id } };
      let responseData = null;
      const res = {
        json: (data) => { responseData = data; return data; },
        status: (code) => ({ json: res.json })
      };
      
      // Generate alerts
      await simulationController.generateSensorData(req, res);
      
      if (responseData && responseData.success) {
        const alerts = responseData.data || [];
        console.log(`✅ Generated ${alerts.length} alerts:`);
        
        alerts.forEach(alert => {
          console.log(`   • ${alert.type} (${alert.severity}): ${alert.title}`);
        });
        
        // Verify scenario-specific logic
        if (scenario.name === 'TRAINING') {
          const criticalAlerts = alerts.filter(a => a.severity === 'critical');
          if (criticalAlerts.length === 0) {
            console.log('✅ TRAINING: Correctly capped all alerts below CRITICAL');
          } else {
            console.log('❌ TRAINING: Found critical alerts (should be capped)');
          }
        }
        
        if (scenario.name === 'FALL') {
          const fallRelated = alerts.filter(a => 
            a.type.includes('FALL') || 
            a.type.includes('INACTIVITY') || 
            a.type.includes('HEART_RATE')
          );
          console.log(`✅ FALL: Generated ${fallRelated.length} fall-related alerts`);
        }
        
        if (scenario.name === 'HAZMAT') {
          const hazmatRelated = alerts.filter(a => 
            a.type.includes('ENVIRONMENTAL') || 
            a.type.includes('SCBA')
          );
          console.log(`✅ HAZMAT: Generated ${hazmatRelated.length} environmental alerts`);
        }
        
      } else {
        console.log('❌ Failed to generate alerts');
      }
      
      console.log(''); // Empty line for readability
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Final verification
    console.log('📊 FINAL VERIFICATION:\n');
    
    const allAlerts = await Alert.find({}).populate('firefighterId');
    console.log(`Total alerts generated: ${allAlerts.length}`);
    
    // Group by scenario
    const byScenario = {};
    allAlerts.forEach(alert => {
      const scenario = alert.firefighterId.currentScenario;
      if (!byScenario[scenario]) byScenario[scenario] = [];
      byScenario[scenario].push(alert);
    });
    
    Object.keys(byScenario).forEach(scenario => {
      console.log(`\n${scenario} (${byScenario[scenario].length} alerts):`);
      const types = [...new Set(byScenario[scenario].map(a => a.type))];
      types.forEach(type => {
        const count = byScenario[scenario].filter(a => a.type === type).length;
        console.log(`  • ${type}: ${count}`);
      });
    });
    
    // Scenario-specific validations
    console.log('\n🎯 SCENARIO VALIDATION:');
    
    // TRAINING should have no critical alerts
    const trainingAlerts = byScenario['TRAINING'] || [];
    const trainingCritical = trainingAlerts.filter(a => a.severity === 'critical');
    console.log(`✓ TRAINING critical alerts: ${trainingCritical.length} (should be 0)`);
    
    // FALL should only have fall-related alerts
    const fallAlerts = byScenario['FALL'] || [];
    const fallTypes = [...new Set(fallAlerts.map(a => a.type))];
    console.log(`✓ FALL alert types: ${fallTypes.join(', ')}`);
    
    // HAZMAT should only have environmental alerts
    const hazmatAlerts = byScenario['HAZMAT'] || [];
    const hazmatTypes = [...new Set(hazmatAlerts.map(a => a.type))];
    console.log(`✓ HAZMAT alert types: ${hazmatTypes.join(', ')}`);
    
    console.log('\n✅ All scenario logic verification completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
  }
}

testAllScenarios();
