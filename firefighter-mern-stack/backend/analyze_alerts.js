const mongoose = require('mongoose');
const Alert = require('./models/Alert');
const SensorData = require('./models/SensorData');

mongoose.connect('mongodb://127.0.0.1:27017/firefighter_system').then(async () => {
  console.log('📊 RECENT ALERT ANALYSIS (Last 5 minutes)');
  
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  
  const recentAlerts = await Alert.find({
    createdAt: { $gte: fiveMinutesAgo }
  }).sort({ createdAt: -1 }).limit(30);
  
  console.log(`\n🚨 Found ${recentAlerts.length} alerts in last 5 minutes:`);
  
  recentAlerts.forEach(alert => {
    console.log(`  - ${alert.type} (${alert.severity}) at ${alert.createdAt.toLocaleTimeString()}`);
    if (alert.metadata?.scenario) {
      console.log(`    Scenario: ${alert.metadata.scenario}`);
    }
  });
  
  const alertsByType = {};
  const alertsByScenario = {};
  
  recentAlerts.forEach(alert => {
    alertsByType[alert.type] = (alertsByType[alert.type] || 0) + 1;
    if (alert.metadata?.scenario) {
      alertsByScenario[alert.metadata.scenario] = (alertsByScenario[alert.metadata.scenario] || 0) + 1;
    }
  });
  
  console.log('\n📈 Alert Types Count:');
  Object.entries(alertsByType).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });
  
  console.log('\n🎬 Alerts by Scenario:');
  Object.entries(alertsByScenario).forEach(([scenario, count]) => {
    console.log(`  ${scenario}: ${count}`);
  });
  
  // Check if any alerts exist at all
  const totalAlerts = await Alert.countDocuments();
  console.log(`\n📊 Total alerts in database: ${totalAlerts}`);
  
  // Check recent sensor data
  const recentSensorData = await SensorData.find({
    timestamp: { $gte: fiveMinutesAgo }
  }).limit(10).sort({ timestamp: -1 });
  
  console.log(`\n📡 Recent sensor data entries: ${recentSensorData.length}`);
  recentSensorData.forEach(data => {
    console.log(`  - FF: ${data.firefighterId}, HR: ${data.heartRate}, Temp: ${data.bodyTemperature}°C, Time: ${data.timestamp.toLocaleTimeString()}`);
    if (data.metadata?.scenario) {
      console.log(`    Scenario: ${data.metadata.scenario}`);
    }
  });
  
  process.exit(0);
}).catch(err => {
  console.error('Database error:', err);
  process.exit(1);
});
