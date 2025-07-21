#!/usr/bin/env node

/**
 * 🧪 Alert Testing Script
 * 
 * Tests all alert scenarios and verifies proper alert     {
      name: 'Poor Air Quality',
      data: {
        firefighterId: firefighter._id,
        heartRate: 160,
        bodyTemperature: 100.4, // Changed from temperature to bodyTemperature
        movement: {
          accelerometer: {
            x: 1.7,
            y: 2.5,
            z: 2.0 // Total = sqrt(1.7² + 2.5² + 2.0²) = 3.5g (Normal activity)
          }
        },
        airQuality: 20, // Below 25%
        timestamp: new Date()
      }
    },
 */

import mongoose from 'mongoose';
import AlertController from './controllers/alertController.js';
import Alert from './models/Alert.js';
import Firefighter from './models/Firefighter.js';
import SensorData from './models/SensorData.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/firefighter_monitoring';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB for testing');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function createTestFirefighter() {
  // Create a valid ObjectId for createdBy
  const mongoose = await import('mongoose');
  const validObjectId = new mongoose.default.Types.ObjectId();
  
  // Generate unique ID
  const timestamp = Date.now().toString().slice(-4);
  const firefighterId = `FF${timestamp}`;
  
  const testFirefighter = new Firefighter({
    firefighterId: firefighterId, // Unique ID with timestamp
    firstName: 'Test',
    lastName: 'Firefighter',
    badgeNumber: `TEST${timestamp}`,
    email: `test${timestamp}@fire.dept`,
    phone: '+1-555-0123',
    position: 'Firefighter',
    department: 'Test Department',
    station: 'Station 1',
    shift: 'A',
    dateOfBirth: new Date('1990-01-01'),
    gender: 'male', // Must be lowercase
    height: 180,
    weight: 80,
    status: 'active',
    createdBy: validObjectId // Must be valid ObjectId
  });
  
  await testFirefighter.save();
  return testFirefighter;
}

async function testAlertScenarios(firefighter) {
  console.log('\n🔥 Testing Alert Scenarios...\n');
  
  const scenarios = [
    {
      name: 'Fall Detection',
      data: {
        firefighterId: firefighter._id,
        heartRate: 120,
        bodyTemperature: 98.6, // Changed from temperature to bodyTemperature
        movement: {
          accelerometer: {
            x: 15.2,
            y: 12.8,
            z: 16.1 // Total = sqrt(15.2² + 12.8² + 16.1²) = 25.5g (Above 20g threshold)
          }
        },
        airQuality: 80,
        timestamp: new Date()
      }
    },
    {
      name: 'Critical Heart Rate',
      data: {
        firefighterId: firefighter._id,
        heartRate: 205, // Above 200 bpm
        bodyTemperature: 100.4, // Changed from temperature to bodyTemperature
        movement: {
          accelerometer: {
            x: 1.8,
            y: 2.1,
            z: 1.5 // Total = sqrt(1.8² + 2.1² + 1.5²) = 3.2g (Normal activity)
          }
        },
        airQuality: 75,
        timestamp: new Date()
      }
    },
    {
      name: 'Critical Temperature',
      data: {
        firefighterId: firefighter._id,
        heartRate: 180,
        bodyTemperature: 104.4, // Above 39°C (changed from temperature to bodyTemperature)
        movement: {
          accelerometer: {
            x: 2.2,
            y: 1.9,
            z: 2.8 // Total = sqrt(2.2² + 1.9² + 2.8²) = 4.1g (Normal activity)
          }
        },
        airQuality: 70,
        timestamp: new Date()
      }
    },
    {
      name: 'Poor Air Quality',
      data: {
        firefighterId: firefighter._id,
        heartRate: 160,
        bodyTemperature: 100.4, // Changed from temperature to bodyTemperature
        movement: {
          accelerometer: {
            x: 1.7,
            y: 2.5,
            z: 2.0 // Total = sqrt(1.7² + 2.5² + 2.0²) = 3.5g (Normal activity)
          }
        },
        airQuality: 20, // Below 25%
        timestamp: new Date()
      }
    },
    {
      name: 'Inactivity Detection',
      data: {
        firefighterId: firefighter._id,
        heartRate: 140,
        bodyTemperature: 100.0, // Changed from temperature to bodyTemperature
        movement: {
          accelerometer: {
            x: 0.2,
            y: 0.3,
            z: 0.2 // Total = sqrt(0.2² + 0.3² + 0.2²) = 0.4g (Below 0.8g threshold)
          }
        },
        airQuality: 85,
        timestamp: new Date()
      }
    },
    {
      name: 'Severe Heat Exposure',
      data: {
        firefighterId: firefighter._id,
        heartRate: 175,
        bodyTemperature: 105.8, // +4°C above baseline (changed from temperature to bodyTemperature)
        movement: {
          accelerometer: {
            x: 1.4,
            y: 1.8,
            z: 1.6 // Total = sqrt(1.4² + 1.8² + 1.6²) = 2.8g (Normal activity)
          }
        },
        airQuality: 65,
        timestamp: new Date()
      }
    }
  ];

  for (const scenario of scenarios) {
    console.log(`\n📊 Testing: ${scenario.name}`);
    
    // Create sensor data
    const sensorData = new SensorData(scenario.data);
    await sensorData.save();
    
    // Test alert generation
    const alertsBefore = await Alert.countDocuments({ firefighterId: firefighter._id });
    
    const generatedAlerts = await AlertController.checkAndCreateAlerts(sensorData, firefighter);
    
    const alertsAfter = await Alert.countDocuments({ firefighterId: firefighter._id });
    const newAlerts = alertsAfter - alertsBefore;
    
    console.log(`   Generated ${newAlerts} alert(s)`);
    
    if (generatedAlerts.length > 0) {
      generatedAlerts.forEach(alert => {
        console.log(`   ✅ ${alert.type}: ${alert.severity} - ${alert.message}`);
        if (alert.metadata && alert.metadata.recommendedAction) {
          console.log(`   📋 Action: ${alert.metadata.recommendedAction}`);
        }
        if (alert.title) {
          console.log(`   🏷️  Title: ${alert.title}`);
        }
        if (alert.priority) {
          console.log(`   🔢 Priority: ${alert.priority}`);
        }
      });
    } else {
      console.log(`   ⚠️  No alerts generated for ${scenario.name}`);
    }
  }
}

async function cleanup(firefighter) {
  // Clean up test data
  await Alert.deleteMany({ firefighterId: firefighter._id });
  await SensorData.deleteMany({ firefighterId: firefighter._id });
  await Firefighter.findByIdAndDelete(firefighter._id);
  console.log('\n🧹 Cleaned up test data');
}

async function main() {
  try {
    await connectDB();
    
    console.log('🚨 Alert System Testing Started');
    
    const testFirefighter = await createTestFirefighter();
    console.log(`✅ Created test firefighter: ${testFirefighter.firstName} ${testFirefighter.lastName}`);
    
    await testAlertScenarios(testFirefighter);
    
    // Show final alert summary
    const totalAlerts = await Alert.countDocuments({ firefighterId: testFirefighter._id });
    const alertsByType = await Alert.aggregate([
      { $match: { firefighterId: testFirefighter._id } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    
    console.log(`\n📈 Final Summary:`);
    console.log(`   Total Alerts Generated: ${totalAlerts}`);
    alertsByType.forEach(group => {
      console.log(`   ${group._id}: ${group.count}`);
    });
    
    await cleanup(testFirefighter);
    
    console.log('\n✅ Alert testing completed successfully!');
    
  } catch (error) {
    console.error('❌ Testing failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
main().catch(console.error);
