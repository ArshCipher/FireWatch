/**
 * 🌡️ Temperature Migration Script
 * 
 * Converts existing bodyTemperature data from Fahrenheit to Celsius
 * Run this once after updating the system to use Celsius consistently
 */

import mongoose from 'mongoose';
import SensorData from './models/SensorData.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/firefighter_monitoring';

async function migrateTemperatureData() {
  try {
    console.log('🌡️ Starting temperature data migration...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find all sensor data with Fahrenheit temperatures (95-110°F range)
    const fahrenheitData = await SensorData.find({
      bodyTemperature: { $gte: 95, $lte: 110 }
    });
    
    console.log(`📊 Found ${fahrenheitData.length} records with Fahrenheit temperatures`);
    
    if (fahrenheitData.length === 0) {
      console.log('✅ No Fahrenheit data found. Migration complete!');
      return;
    }
    
    let converted = 0;
    let errors = 0;
    
    // Convert each record
    for (const record of fahrenheitData) {
      try {
        const fahrenheitTemp = record.bodyTemperature;
        const celsiusTemp = (fahrenheitTemp - 32) * 5/9;
        
        // Validate the conversion makes sense
        if (celsiusTemp < 35 || celsiusTemp > 42) {
          console.log(`⚠️ Skipping suspicious temperature: ${fahrenheitTemp}°F → ${celsiusTemp.toFixed(1)}°C (ID: ${record._id})`);
          continue;
        }
        
        // Update the record
        await SensorData.findByIdAndUpdate(record._id, {
          bodyTemperature: parseFloat(celsiusTemp.toFixed(2))
        });
        
        converted++;
        
        if (converted % 100 === 0) {
          console.log(`📈 Converted ${converted}/${fahrenheitData.length} records...`);
        }
        
      } catch (error) {
        console.error(`❌ Error converting record ${record._id}:`, error.message);
        errors++;
      }
    }
    
    console.log('🎯 Migration Results:');
    console.log(`✅ Successfully converted: ${converted} records`);
    console.log(`❌ Errors: ${errors} records`);
    console.log(`📊 Total processed: ${fahrenheitData.length} records`);
    
    // Verify the migration
    const remainingFahrenheit = await SensorData.countDocuments({
      bodyTemperature: { $gte: 95, $lte: 110 }
    });
    
    const celsiusData = await SensorData.countDocuments({
      bodyTemperature: { $gte: 35, $lte: 42 }
    });
    
    console.log('🔍 Post-migration validation:');
    console.log(`📉 Remaining Fahrenheit records: ${remainingFahrenheit}`);
    console.log(`📈 Celsius records: ${celsiusData}`);
    
    if (remainingFahrenheit === 0 && celsiusData > 0) {
      console.log('✅ Migration completed successfully!');
    } else {
      console.log('⚠️ Migration may need manual review');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the migration
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateTemperatureData();
}

export default migrateTemperatureData;
