// Quick test to see if alerts are being generated
const fetch = require('node-fetch');

async function testAlerts() {
  try {
    console.log('🔍 Testing alert API...');
    
    // Test if server is running
    const response = await fetch('http://localhost:3004/api/alerts/active');
    
    if (!response.ok) {
      console.log('❌ Server not running or alerts endpoint not available');
      console.log('Status:', response.status);
      return;
    }
    
    const result = await response.json();
    console.log('✅ Alert API Response:', JSON.stringify(result, null, 2));
    
    if (result.data && result.data.length > 0) {
      console.log(`📊 Found ${result.data.length} active alerts`);
      result.data.forEach((alert, index) => {
        console.log(`  Alert ${index + 1}: ${alert.type} - ${alert.severity} - ${alert.title}`);
      });
    } else {
      console.log('📭 No active alerts found');
    }
    
  } catch (error) {
    console.error('❌ Error testing alerts:', error.message);
  }
}

testAlerts();
