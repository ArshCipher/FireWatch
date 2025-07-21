/**
 * 🎯 Command Center Dashboard - CLEAN VERSION
 * 
 * Real-time monitoring of all firefighters with scientific thresholds
 * Evidence-based alerting system following NFPA 1582 standards
 * 
 * ⚠️ NO LOCAL ALERT GENERATION - ALL ALERTS COME FROM BACKEND API
 */

import React, { useState, useEffect } from 'react';

// Add pulse animation CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.1); opacity: 0.8; }
  }
`;
document.head.appendChild(style);

// Evidence-based physiological thresholds (NFPA 1582 compliant) - FOR DISPLAY ONLY
const THRESHOLDS = {
  HEART_RATE: {
    NORMAL: { min: 60, max: 149, color: 'green' },
    MODERATE: { min: 150, max: 184, color: 'yellow', duration: '10min' },
    HIGH: { min: 185, max: 199, color: 'orange', duration: '5min' },
    CRITICAL: { min: 200, max: 250, color: 'red', duration: '1min' }
  },
  TEMPERATURE: {
    NORMAL: { min: 37.5, max: 38.0, color: 'green' },
    MODERATE: { min: 38.0, max: 38.4, color: 'yellow' },
    HIGH: { min: 38.5, max: 38.9, color: 'orange' },
    CRITICAL: { min: 39.0, max: 45.0, color: 'red' }
  },
  MOVEMENT: {
    FALL_THRESHOLD: 20, // g-force
    INACTIVITY_THRESHOLD: 60, // seconds
    HELMET_TEMP_DROP: -8.3 // °C for helmet off detection
  }
};

interface FirefighterData {
  _id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  rank: string;
  status: 'active' | 'inactive' | 'emergency';
  isActive?: boolean;
  sensorData?: {
    heartRate: number;
    temperature: number;
    acceleration: number;
    timestamp: string;
  };
}

interface AlertData {
  _id: string;
  firefighterId: string;
  type: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  priority: number;
  title: string;
  message: string;
  status: 'active' | 'acknowledged' | 'resolved';
  timestamp: string;
  details?: {
    triggerValue?: number;
    thresholdBreached?: number;
    isSimulated?: boolean;
    recommendedAction?: string;
    maxHR?: number;
  };
}

const CommandCenterDashboard: React.FC = () => {
  const [firefighters, setFirefighters] = useState<FirefighterData[]>([]);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isRealTimeActive, setIsRealTimeActive] = useState(true);
  const [alertFilter, setAlertFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MODERATE' | 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED'>('ACTIVE');
  const [selectedFirefighter, setSelectedFirefighter] = useState<string | null>(null);

  // Fetch firefighter data from API
  const fetchFirefighters = async () => {
    try {
      const response = await fetch('http://localhost:3004/api/firefighters', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      if (!response.ok) {
        if (response.status === 429) {
          console.warn('⚠️ Rate limited - skipping firefighter fetch');
          return; // Skip this fetch cycle
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Handle different API response structures
      let data = [];
      if (result.success && result.data) {
        data = Array.isArray(result.data) ? result.data : result.data.firefighters || [];
      } else if (Array.isArray(result)) {
        data = result;
      }
      
      console.log(`👥 Fetched ${data.length} firefighters:`, data.map((f: any) => ({ id: f._id, name: f.firstName + ' ' + f.lastName || f.name })));
      
      setFirefighters(data);
      setLoading(false);
      
      // Clear any previous errors
      if (error) setError(null);
      
    } catch (err: any) {
      console.error('Error fetching firefighters:', err);
      
      if (err.name === 'AbortError') {
        setError('Request timeout - server may be slow');
      } else if (err.message.includes('CORS')) {
        setError('Backend server connection issue (CORS)');
      } else if (err.message.includes('429')) {
        setError('Too many requests - slowing down polling');
      } else {
        setError('Failed to load firefighter data - check backend server');
      }
      setLoading(false);
    }
  };

  // Fetch REAL alerts from backend API - NO LOCAL GENERATION
  const fetchAlerts = async () => {
    try {
      const response = await fetch('http://localhost:3004/api/alerts?limit=200', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout and retry logic
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      if (!response.ok) {
        if (response.status === 429) {
          console.warn('⚠️ Rate limited - reducing polling frequency');
          return; // Skip this fetch cycle
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      console.log('🔍 Raw API Response:', result);
      
      // Handle different API response structures
      let data = [];
      if (result.success && result.data) {
        data = Array.isArray(result.data) ? result.data : [];
      } else if (Array.isArray(result)) {
        data = result;
      }
      
      console.log(`📊 Processing ${data.length} raw alerts from API`);
      
      // Filter out invalid alerts and clean up
      const validAlerts = data.filter((alert: any) => {
        // Check for valid timestamp
        const timestamp = new Date(alert.timestamp || alert.triggeredAt || alert.createdAt);
        if (isNaN(timestamp.getTime())) {
          console.warn('⚠️ Removing alert with invalid timestamp:', alert);
          return false;
        }
        
        // Check for valid firefighter ID
        const firefighterId = alert.firefighterId?._id || alert.firefighterId;
        if (!firefighterId) {
          console.warn('⚠️ Removing alert with no firefighter ID:', alert);
          return false;
        }
        
        // Check if alert is too old (more than 24 hours for more reasonable cleanup)
        const hoursSinceAlert = (new Date().getTime() - timestamp.getTime()) / (1000 * 60 * 60);
        if (hoursSinceAlert > 24) {
          console.warn('⚠️ Removing old alert (>24h):', alert, `Hours old: ${hoursSinceAlert.toFixed(1)}`);
          return false;
        }
        
        return true;
      }).map((alert: any) => ({
        ...alert,
        // Normalize the firefighter ID (handle both populated and non-populated)
        firefighterId: alert.firefighterId?._id || alert.firefighterId,
        // Normalize timestamp field
        timestamp: alert.timestamp || alert.triggeredAt || alert.createdAt
      }));
      
      console.log(`✅ Processed ${validAlerts.length} valid alerts after cleanup`);
      console.log('🏷️ Alert firefighter IDs:', validAlerts.map((a: any) => a.firefighterId));
      
      setAlerts(validAlerts.slice(0, 100)); // Show up to 100 valid alerts
      setLastUpdate(new Date());
      
      // Clear any previous errors
      if (error) setError(null);
      
    } catch (err: any) {
      console.error('Error fetching alerts:', err);
      
      if (err.name === 'AbortError') {
        setError('Request timeout - server may be slow');
      } else if (err.message.includes('CORS')) {
        setError('Backend server connection issue (CORS)');
      } else if (err.message.includes('429')) {
        setError('Too many requests - slowing down polling');
      } else {
        setError('Failed to load alerts - check backend server');
      }
    }
  };

  // Start/Stop all simulations
  const toggleAllSimulations = async () => {
    try {
      const action = isRealTimeActive ? 'stop' : 'start';
      const response = await fetch(`http://localhost:3004/api/simulations/${action}-all`, {
        method: 'POST'
      });
      
      if (response.ok) {
        console.log(`${action} all simulations successful`);
        if (action === 'start') {
          fetchAlerts(); // Refresh alerts when starting
        }
      }
    } catch (error) {
      console.error(`Error ${isRealTimeActive ? 'stopping' : 'starting'} simulations:`, error);
    }
  };

  // Custom scenario creator
  const createCustomScenario = async () => {
    try {
      const response = await fetch('http://localhost:3004/api/simulations/custom-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Custom Emergency Scenario',
          duration: 300,
          firefighterCount: 4,
          conditions: {
            temperature: { min: 38.5, max: 42.0 },
            heartRate: { min: 160, max: 210 },
            acceleration: { min: 0.5, max: 25 }
          }
        })
      });
      
      if (response.ok) {
        console.log('Custom scenario created successfully');
        fetchAlerts(); // Refresh alerts
      }
    } catch (error) {
      console.error('Error creating custom scenario:', error);
    }
  };

  // Clear old/invalid alerts from database
  const clearOldAlerts = async (forceAll = false) => {
    try {
      const url = forceAll 
        ? 'http://localhost:3004/api/alerts/cleanup?force=true'
        : 'http://localhost:3004/api/alerts/cleanup';
        
      const response = await fetch(url, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`🧹 Alert cleanup successful:`, result);
        
        if (forceAll) {
          console.log(`🗑️ FORCE CLEANUP: Removed ALL ${result.deletedCount} alerts`);
        } else {
          console.log(`🧹 NORMAL CLEANUP: Removed ${result.deletedCount} old alerts`);
        }
        
        fetchAlerts(); // Refresh alerts after cleanup
      } else {
        console.error('Failed to cleanup alerts:', response.statusText);
      }
    } catch (error) {
      console.error('Error clearing alerts:', error);
    }
  };

  // Acknowledge alert
  const acknowledgeAlert = async (alertId: string) => {
    try {
      console.log(`🔄 Acknowledging alert: ${alertId}`);
      const response = await fetch(`http://localhost:3004/api/alerts/${alertId}/acknowledge`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          acknowledgedBy: 'Command Center Operator',
          notes: 'Alert acknowledged from Command Center Dashboard'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Alert acknowledged successfully:`, result);
        fetchAlerts(); // Refresh alerts
      } else {
        console.error('❌ Failed to acknowledge alert:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error details:', errorText);
      }
    } catch (error) {
      console.error('❌ Error acknowledging alert:', error);
    }
  };

  // Resolve alert
  const resolveAlert = async (alertId: string) => {
    try {
      console.log(`🔄 Resolving alert: ${alertId}`);
      const response = await fetch(`http://localhost:3004/api/alerts/${alertId}/resolve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resolvedBy: 'Command Center Operator',
          resolution: 'Alert resolved from Command Center Dashboard'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Alert resolved successfully:`, result);
        fetchAlerts(); // Refresh alerts
      } else {
        console.error('❌ Failed to resolve alert:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Error resolving alert:', error);
    }
  };

  // Dismiss alert
  const dismissAlert = async (alertId: string) => {
    try {
      console.log(`🔄 Dismissing alert: ${alertId}`);
      const response = await fetch(`http://localhost:3004/api/alerts/${alertId}/dismiss`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dismissedBy: 'Command Center Operator',
          reason: 'Alert dismissed from Command Center Dashboard'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Alert dismissed successfully:`, result);
        fetchAlerts(); // Refresh alerts
      } else {
        console.error('❌ Failed to dismiss alert:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Error dismissing alert:', error);
    }
  };

  // Escalate alert
  const escalateAlert = async (alertId: string) => {
    try {
      console.log(`🔄 Escalating alert: ${alertId}`);
      const response = await fetch(`http://localhost:3004/api/alerts/${alertId}/escalate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          escalatedBy: 'Command Center Operator',
          escalationLevel: 'EMERGENCY',
          notes: 'Alert escalated to emergency level from Command Center Dashboard'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Alert escalated successfully:`, result);
        fetchAlerts(); // Refresh alerts
      } else {
        console.error('❌ Failed to escalate alert:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Error escalating alert:', error);
    }
  };

  useEffect(() => {
    fetchFirefighters();
    fetchAlerts();
    
    // Set up real-time polling for alerts and firefighter data
    const interval = setInterval(() => {
      if (isRealTimeActive) {
        fetchAlerts(); // Fetch real alerts from backend
        fetchFirefighters(); // Fetch firefighter data with sensor data
        setLastUpdate(new Date()); // Update timestamp
      }
    }, 5000); // Every 5 seconds to prevent rate limiting

    return () => clearInterval(interval);
  }, [isRealTimeActive]);

  // Toggle real-time monitoring
  const toggleRealTimeMonitoring = () => {
    setIsRealTimeActive(!isRealTimeActive);
    if (!isRealTimeActive) {
      console.log('🟢 Real-time monitoring activated');
      fetchAlerts(); // Immediate fetch when activating
      fetchFirefighters();
    } else {
      console.log('🔴 Real-time monitoring deactivated');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#dc2626'; // red-600
      case 'high': return '#ea580c'; // orange-600
      case 'moderate': return '#d97706'; // amber-600
      case 'low': return '#2563eb'; // blue-600
      default: return '#6b7280'; // gray-500
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'HEART_RATE_CRITICAL':
      case 'HEART_RATE_HIGH':
      case 'HEART_RATE_MODERATE':
        return '💓';
      case 'TEMPERATURE_CRITICAL':
      case 'TEMPERATURE_HIGH':
      case 'TEMPERATURE_MODERATE':
        return '🌡️';
      case 'FALL_DETECTED':
        return '⬇️';
      case 'INACTIVITY_DETECTED':
        return '⏸️';
      case 'IMMOBILITY_DETECTED':
        return '🚫';
      case 'HELMET_OFF':
        return '⛑️';
      case 'SCBA_MALFUNCTION':
      case 'SCBA_LOW_PRESSURE':
      case 'EQUIPMENT_FAILURE':
        return '🛡️';
      case 'ENVIRONMENTAL_HAZARD':
        return '☢️';
      case 'HRV_STRESS':
        return '💔';
      case 'DEHYDRATION':
        return '🏜️';
      case 'MEDICAL_EMERGENCY':
        return '🚑';
      case 'COMMUNICATION_LOST':
        return '📡';
      case 'EVACUATION_NEEDED':
        return '🚨';
      case 'SEVERE_HEAT':
        return '🔥';
      case 'HYDRATION_REMINDER':
        return '💧';
      case 'CUSTOM_ALERT':
        return '⚙️';
      default:
        return '⚠️';
    }
  };

  const getVitalColor = (value: number, type: 'heartRate' | 'temperature', maxHR?: number) => {
    if (type === 'heartRate') {
      const hrPercent = maxHR ? (value / maxHR) * 100 : 0;
      if (value >= THRESHOLDS.HEART_RATE.CRITICAL.min || hrPercent >= 95) return '#dc2626';
      if (value >= THRESHOLDS.HEART_RATE.HIGH.min || hrPercent >= 90) return '#ea580c';
      if (value >= THRESHOLDS.HEART_RATE.MODERATE.min) return '#d97706';
      return '#16a34a';
    } else {
      if (value >= THRESHOLDS.TEMPERATURE.CRITICAL.min) return '#dc2626';
      if (value >= THRESHOLDS.TEMPERATURE.HIGH.min) return '#ea580c';
      if (value >= THRESHOLDS.TEMPERATURE.MODERATE.min) return '#d97706';
      return '#16a34a';
    }
  };

  // Filter alerts (all from backend API) - only show alerts for current firefighters
  const filteredAlerts = alerts.filter(alert => {
    // Filter by severity
    if (['CRITICAL', 'HIGH', 'MODERATE'].includes(alertFilter) && alert.severity.toUpperCase() !== alertFilter) {
      return false;
    }
    
    // Filter by status
    if (['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'].includes(alertFilter) && alert.status.toUpperCase() !== alertFilter) {
      return false;
    }
    
    // Only show alerts for firefighters that exist in current system
    const firefighterExists = firefighters.some(f => f._id === alert.firefighterId);
    if (!firefighterExists) {
      console.warn('⚠️ Filtering out alert for non-existent firefighter:', alert.firefighterId, 'Available firefighters:', firefighters.map(f => f._id));
      return false;
    }
    
    return true;
  })
  // Deduplicate similar alerts - keep only the most recent of each type per firefighter
  .reduce((uniqueAlerts: AlertData[], currentAlert) => {
    const existingAlertIndex = uniqueAlerts.findIndex(
      alert => alert.firefighterId === currentAlert.firefighterId && 
               alert.type === currentAlert.type
    );
    
    if (existingAlertIndex >= 0) {
      // If we already have this type of alert for this firefighter, keep the more recent one
      const existingAlert = uniqueAlerts[existingAlertIndex];
      const currentTime = new Date(currentAlert.timestamp).getTime();
      const existingTime = new Date(existingAlert.timestamp).getTime();
      
      if (currentTime > existingTime) {
        uniqueAlerts[existingAlertIndex] = currentAlert;
      }
    } else {
      uniqueAlerts.push(currentAlert);
    }
    
    return uniqueAlerts;
  }, [])
  // Sort by priority (highest first) and limit to most important alerts
  .sort((a, b) => b.priority - a.priority)
  .slice(0, 20); // Show only top 20 most important alerts

  console.log(`🔍 Alert filtering: ${alerts.length} total alerts → ${filteredAlerts.length} filtered & deduplicated alerts`);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '64vh' }}>
        <div>Loading command center...</div>
      </div>
    );
  }

  const activeFirefighters = firefighters.filter(f => f.status === 'active' || f.isActive);
  const activeAlerts = alerts.filter(a => a.status === 'active');
  const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');
  const highAlerts = activeAlerts.filter(a => a.severity === 'high');

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderBottom: '1px solid #e5e7eb', padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>🎯 Command Center</h1>
            <p style={{ color: '#6b7280' }}>Real-time firefighter monitoring with evidence-based alerts (Backend API)</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              padding: '0.5rem 0.75rem', 
              borderRadius: '9999px', 
              fontSize: '0.875rem', 
              fontWeight: '500',
              backgroundColor: isRealTimeActive ? '#dcfce7' : '#fef2f2',
              color: isRealTimeActive ? '#166534' : '#991b1b',
              border: isRealTimeActive ? '2px solid #16a34a' : '2px solid #dc2626'
            }}>
              <div 
                style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  backgroundColor: isRealTimeActive ? '#22c55e' : '#dc2626',
                  marginRight: '0.5rem',
                  animation: isRealTimeActive ? 'pulse 2s ease-in-out infinite' : 'none'
                }}
              />
              {isRealTimeActive ? '🟢 LIVE MONITORING' : '🔴 OFFLINE'}
            </div>
            
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Last Update: {lastUpdate.toLocaleTimeString()}
            </div>
            
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Active Alerts: <span style={{ fontWeight: '600', color: activeAlerts.length > 0 ? '#dc2626' : '#16a34a' }}>
                {activeAlerts.length}
              </span>
            </div>
            
            <button
              onClick={toggleRealTimeMonitoring}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                borderRadius: '0.375rem',
                border: 'none',
                backgroundColor: isRealTimeActive ? '#dc2626' : '#2563eb',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '500',
                marginRight: '0.5rem'
              }}
            >
              {isRealTimeActive ? 'Stop' : 'Start'} Monitoring
            </button>
            
            <button
              onClick={() => clearOldAlerts(true)}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                borderRadius: '0.375rem',
                border: '1px solid #dc2626',
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              🗑️ Clear ALL
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Alert Panel */}
        <div style={{ width: '320px', backgroundColor: 'white', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>🚨 Active Alerts (API)</h2>
            <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
              {['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setAlertFilter(filter as any)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: alertFilter === filter ? '#dc2626' : '#e5e7eb',
                    color: alertFilter === filter ? 'white' : '#374151'
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>
              Evidence-based NFPA 1582 thresholds • {filteredAlerts.length} alerts
            </div>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredAlerts.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✅</div>
                <p>No {alertFilter !== 'ALL' ? alertFilter.toLowerCase() : ''} alerts</p>
              </div>
            ) : (
              filteredAlerts.map((alert) => {
                const firefighter = firefighters.find(f => f._id === alert.firefighterId);
                const firefighterName = firefighter ? 
                  (firefighter.firstName && firefighter.lastName ? 
                    `${firefighter.firstName} ${firefighter.lastName}` : 
                    firefighter.name) : '❓ Unknown Firefighter';
                
                // Handle invalid timestamps
                const alertTime = new Date(alert.timestamp);
                const timeDisplay = isNaN(alertTime.getTime()) ? 
                  '⚠️ Invalid Date' : 
                  alertTime.toLocaleTimeString();
                
                return (
                  <div key={alert._id} style={{
                    padding: '0.75rem',
                    borderBottom: '1px solid #f3f4f6',
                    backgroundColor: alert.status !== 'acknowledged' ? 
                      (firefighter ? '#fef2f2' : '#fff3cd') : // Yellow background for unknown firefighters
                      '#f9fafb'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        backgroundColor: getSeverityColor(alert.severity),
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        {getAlertIcon(alert.type)}
                        <span style={{ marginLeft: '0.25rem' }}>{alert.severity.toUpperCase()}</span>
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827', marginBottom: '0.25rem' }}>
                          {alert.title}
                        </p>
                        <p style={{ 
                          fontSize: '0.75rem', 
                          color: firefighter ? '#6b7280' : '#dc2626', 
                          marginTop: '0.25rem',
                          fontWeight: firefighter ? 'normal' : '500'
                        }}>
                          {firefighterName}
                        </p>
                        <p style={{ 
                          fontSize: '0.75rem', 
                          color: isNaN(alertTime.getTime()) ? '#dc2626' : '#9ca3af', 
                          marginTop: '0.25rem',
                          fontWeight: isNaN(alertTime.getTime()) ? '500' : 'normal'
                        }}>
                          {timeDisplay}
                        </p>
                        {alert.details?.recommendedAction && (
                          <p style={{ fontSize: '0.75rem', color: '#2563eb', marginTop: '0.25rem', fontWeight: '500' }}>
                            📋 {alert.details.recommendedAction}
                          </p>
                        )}
                        
                        {/* Alert Status Badge */}
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.5rem', 
                          marginTop: '0.5rem' 
                        }}>
                          <span style={{
                            padding: '0.125rem 0.375rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.625rem',
                            fontWeight: '500',
                            backgroundColor: alert.status === 'active' ? '#ef4444' : 
                                           alert.status === 'acknowledged' ? '#f59e0b' :
                                           alert.status === 'resolved' ? '#10b981' :
                                           alert.status === 'dismissed' ? '#6b7280' :
                                           alert.status === 'escalated' ? '#8b5cf6' : '#6b7280',
                            color: 'white',
                            textTransform: 'uppercase'
                          }}>
                            {alert.status === 'active' ? '🔴 ACTIVE' :
                             alert.status === 'acknowledged' ? '👁️ SEEN' :
                             alert.status === 'resolved' ? '✅ RESOLVED' :
                             alert.status === 'dismissed' ? '❌ DISMISSED' :
                             alert.status === 'escalated' ? '⬆️ ESCALATED' : alert.status}
                          </span>
                        </div>
                        
                        {/* Action Buttons */}
                        {alert.status === 'active' && (
                          <div style={{ 
                            display: 'flex', 
                            gap: '0.5rem', 
                            marginTop: '0.5rem',
                            flexWrap: 'wrap'
                          }}>
                            <button
                              onClick={() => acknowledgeAlert(alert._id)}
                              style={{ 
                                fontSize: '0.625rem', 
                                color: '#2563eb', 
                                background: '#eff6ff',
                                border: '1px solid #3b82f6',
                                borderRadius: '0.25rem',
                                padding: '0.25rem 0.5rem',
                                cursor: 'pointer',
                                fontWeight: '500'
                              }}
                            >
                              👁️ Acknowledge
                            </button>
                            <button
                              onClick={() => resolveAlert(alert._id)}
                              style={{ 
                                fontSize: '0.625rem', 
                                color: '#16a34a', 
                                background: '#f0fdf4',
                                border: '1px solid #22c55e',
                                borderRadius: '0.25rem',
                                padding: '0.25rem 0.5rem',
                                cursor: 'pointer',
                                fontWeight: '500'
                              }}
                            >
                              ✅ Resolve
                            </button>
                          </div>
                        )}
                        
                        {alert.status === 'acknowledged' && (
                          <div style={{ 
                            display: 'flex', 
                            gap: '0.5rem', 
                            marginTop: '0.5rem',
                            flexWrap: 'wrap'
                          }}>
                            <button
                              onClick={() => resolveAlert(alert._id)}
                              style={{ 
                                fontSize: '0.625rem', 
                                color: '#16a34a', 
                                background: '#f0fdf4',
                                border: '1px solid #22c55e',
                                borderRadius: '0.25rem',
                                padding: '0.25rem 0.5rem',
                                cursor: 'pointer',
                                fontWeight: '500'
                              }}
                            >
                              ✅ Resolve
                            </button>
                            <button
                              onClick={() => escalateAlert(alert._id)}
                              style={{ 
                                fontSize: '0.625rem', 
                                color: '#7c3aed', 
                                background: '#f3e8ff',
                                border: '1px solid #8b5cf6',
                                borderRadius: '0.25rem',
                                padding: '0.25rem 0.5rem',
                                cursor: 'pointer',
                                fontWeight: '500'
                              }}
                            >
                              ⬆️ Escalate
                            </button>
                            <button
                              onClick={() => dismissAlert(alert._id)}
                              style={{ 
                                fontSize: '0.625rem', 
                                color: '#6b7280', 
                                background: '#f9fafb',
                                border: '1px solid #9ca3af',
                                borderRadius: '0.25rem',
                                padding: '0.25rem 0.5rem',
                                cursor: 'pointer',
                                fontWeight: '500'
                              }}
                            >
                              ❌ Dismiss
                            </button>
                          </div>
                        )}
                        
                        {/* Show escalation option for critical/high alerts */}
                        {alert.status === 'active' && (alert.severity === 'critical' || alert.severity === 'high') && (
                          <div style={{ marginTop: '0.25rem' }}>
                            <button
                              onClick={() => escalateAlert(alert._id)}
                              style={{ 
                                fontSize: '0.625rem', 
                                color: '#7c3aed', 
                                background: '#f3e8ff',
                                border: '1px solid #8b5cf6',
                                borderRadius: '0.25rem',
                                padding: '0.25rem 0.5rem',
                                cursor: 'pointer',
                                fontWeight: '500'
                              }}
                            >
                              🚨 Emergency Escalate
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Main Dashboard */}
        <div style={{ flex: 1, padding: '1.5rem' }}>
          {error && (
            <div style={{ 
              padding: '1rem', 
              backgroundColor: '#fef2f2', 
              border: '1px solid #fecaca', 
              borderRadius: '0.375rem', 
              marginBottom: '1.5rem',
              color: '#991b1b'
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Status Overview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '2rem', marginRight: '1rem' }}>👥</span>
                <div>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{activeFirefighters.length}</p>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Active Personnel</p>
                </div>
              </div>
            </div>
            
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '2rem', marginRight: '1rem', color: '#dc2626' }}>🚨</span>
                <div>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: '#dc2626' }}>{criticalAlerts.length}</p>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Critical Alerts</p>
                </div>
              </div>
            </div>
            
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '2rem', marginRight: '1rem', color: '#ea580c' }}>⚠️</span>
                <div>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: '#ea580c' }}>{highAlerts.length}</p>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>High Priority</p>
                </div>
              </div>
            </div>
            
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '2rem', marginRight: '1rem', color: '#16a34a' }}>📊</span>
                <div>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{alerts.length}</p>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Total Alerts</p>
                </div>
              </div>
            </div>
          </div>

          {/* Personnel Status */}
          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0, display: 'flex', alignItems: 'center' }}>
                <span style={{ marginRight: '0.5rem' }}>✅</span>
                Personnel Status - Real-Time Vitals
              </h3>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                {activeFirefighters.map((firefighter) => {
                  const firefighterAlerts = activeAlerts.filter(a => a.firefighterId === firefighter._id);
                  const hasCritical = firefighterAlerts.some(a => a.severity === 'critical');
                  const hasHigh = firefighterAlerts.some(a => a.severity === 'high');
                  const firefighterName = firefighter.firstName && firefighter.lastName ? 
                    `${firefighter.firstName} ${firefighter.lastName}` : 
                    firefighter.name;
                  
                  // Calculate age for HR percentage
                  const age = new Date().getFullYear() - new Date('1990-01-01').getFullYear(); // Default age
                  const maxHR = 208 - 0.7 * age;
                  
                  return (
                    <div key={firefighter._id} style={{
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      border: selectedFirefighter === firefighter._id ? '2px solid #3b82f6' :
                               hasCritical ? '2px solid #dc2626' : 
                               hasHigh ? '2px solid #ea580c' : 
                               '2px solid #16a34a',
                      backgroundColor: selectedFirefighter === firefighter._id ? '#eff6ff' :
                                      hasCritical ? '#fef2f2' : 
                                      hasHigh ? '#fff7ed' : 
                                      '#f0fdf4'
                    }}
                    onClick={() => setSelectedFirefighter(
                      selectedFirefighter === firefighter._id ? null : firefighter._id
                    )}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <h4 style={{ fontWeight: '600', margin: 0 }}>{firefighterName}</h4>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: hasCritical ? '#dc2626' : hasHigh ? '#ea580c' : '#6b7280',
                          color: 'white'
                        }}>
                          {firefighter.rank}
                        </span>
                      </div>
                      
                      {firefighter.sensorData && (
                        <div style={{ fontSize: '0.875rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center' }}>
                              💓 Heart Rate
                            </span>
                            <span style={{ fontWeight: '500', color: getVitalColor(firefighter.sensorData.heartRate, 'heartRate', maxHR) }}>
                              {firefighter.sensorData.heartRate} bpm
                            </span>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ display: 'flex', alignItems: 'center' }}>
                              🌡️ Temperature
                            </span>
                            <span style={{ fontWeight: '500', color: getVitalColor(firefighter.sensorData.temperature, 'temperature') }}>
                              {firefighter.sensorData.temperature.toFixed(1)}°C
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>
                        {firefighterAlerts.length} active alert(s)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandCenterDashboard;
