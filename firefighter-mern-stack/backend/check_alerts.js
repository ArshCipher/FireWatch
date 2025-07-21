/**
 * Simple script to check alerts in the database
 */
import mongoose from 'mongoose';
import Alert from './models/Alert.js';

async function checkAlerts() {
  try {
    await mongoose.connect('mongodb://localhost:27017/firefighter_monitoring');
    console.log('✅ Connected to MongoDB');
    
    const activeAlerts = await Alert.find({ status: 'active' }).limit(10);
    console.log('🚨 Active alerts found:', activeAlerts.length);
    
    activeAlerts.forEach(alert => {
      console.log(`- ${alert.type}: ${alert.title} (${alert.severity}) - ${alert.triggeredAt}`);
    });
    
    const allAlerts = await Alert.find({}).limit(20);
    console.log('📊 Total alerts in DB:', allAlerts.length);
    
    if (allAlerts.length > 0) {
      console.log('Recent alerts:');
      allAlerts.slice(0, 5).forEach(alert => {
        console.log(`  - ${alert.type} (${alert.status}) - ${alert.triggeredAt}`);
      });
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkAlerts();
