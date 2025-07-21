/**
 * 📊 Data Simulation Dashboard
 * 
 * Realistic physiological data simulation for firefighters
 * Scientific scenario-based testing without physical sensors
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  duration: number; // minutes
  heartRateProfile: {
    baseline: number;
    peak: number;
    variability: number;
    spikeProbability: number;
  };
  temperatureProfile: {
    baseline: number;
    peak: number;
    riseRate: number; // °C per minute
  };
  movementProfile: {
    activityLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
    fallRisk: number; // 0-1 probability
    inactivityPeriods: boolean;
  };
  environmentalFactors: {
    ambientTemp: number;
    humidity: number;
    airQuality: number;
  };
}

interface BackendSimulation {
  firefighterId: string;
  scenarioId: string;
  startTime: string; // Backend sends ISO string
  status: string;
  scenario: any;
}

interface Firefighter {
  _id: string;
  firstName: string;
  lastName: string;
  badgeNumber: string;
  department: string;
  station: string;
  isActive: boolean;
}

const SIMULATION_SCENARIOS: SimulationScenario[] = [
  {
    id: 'routine_training',
    name: '🔥 Routine Training Exercise',
    description: 'Standard training drill with moderate exertion following NFPA standards',
    duration: 45,
    heartRateProfile: {
      baseline: 70,
      peak: 140,
      variability: 15,
      spikeProbability: 0.02
    },
    temperatureProfile: {
      baseline: 37.0, // 37.0°C - Normal body temperature
      peak: 38.2, // 38.2°C - Will trigger moderate alert (38.0°C+)
      riseRate: 0.18
    },
    movementProfile: {
      activityLevel: 'MODERATE',
      fallRisk: 0.01,
      inactivityPeriods: false
    },
    environmentalFactors: {
      ambientTemp: 22, // 22°C
      humidity: 45,
      airQuality: 85
    }
  },
  {
    id: 'structure_fire',
    name: '🏠 Structure Fire Response',
    description: 'High-intensity firefighting - triggers multiple NFPA 1582 thresholds',
    duration: 60,
    heartRateProfile: {
      baseline: 85,
      peak: 210, // Will trigger critical (200+) alerts
      variability: 25,
      spikeProbability: 0.15
    },
    temperatureProfile: {
      baseline: 37.2, // 37.2°C
      peak: 41.0, // 41.0°C - Will trigger all temp thresholds
      riseRate: 0.54
    },
    movementProfile: {
      activityLevel: 'HIGH',
      fallRisk: 0.04,
      inactivityPeriods: false
    },
    environmentalFactors: {
      ambientTemp: 45, // 45°C
      humidity: 70,
      airQuality: 40 // Poor air quality
    }
  },
  {
    id: 'heat_exhaustion',
    name: '🌡️ Heat Exhaustion Risk Scenario',
    description: 'Prolonged exposure leading to critical temperature and heart rate alerts',
    duration: 90,
    heartRateProfile: {
      baseline: 85,
      peak: 205, // Will trigger critical heart rate alerts
      variability: 30,
      spikeProbability: 0.15
    },
    temperatureProfile: {
      baseline: 37.0, // 37.0°C
      peak: 40.2, // 40.2°C - Will trigger critical temperature alerts
      riseRate: 0.72
    },
    movementProfile: {
      activityLevel: 'MODERATE',
      fallRisk: 0.08,
      inactivityPeriods: true
    },
    environmentalFactors: {
      ambientTemp: 42, // 42°C
      humidity: 85,
      airQuality: 65
    }
  },
  {
    id: 'fall_incident',
    name: '⚠️ Fall Incident Response',
    description: 'Emergency response with fall detection and potential injury',
    duration: 30,
    heartRateProfile: {
      baseline: 95,
      peak: 200, // Will trigger critical alerts
      variability: 35,
      spikeProbability: 0.25
    },
    temperatureProfile: {
      baseline: 37.1, // 37.1°C
      peak: 38.8, // 38.8°C - Will trigger moderate/high alerts
      riseRate: 0.54
    },
    movementProfile: {
      activityLevel: 'HIGH',
      fallRisk: 0.35, // High probability of fall detection
      inactivityPeriods: true
    },
    environmentalFactors: {
      ambientTemp: 25, // 25°C
      humidity: 60,
      airQuality: 75
    }
  },
  {
    id: 'inactivity_scenario',
    name: '😴 Firefighter Incapacitation Scenario',
    description: 'Simulates potential collapse or incapacitation with minimal movement',
    duration: 15,
    heartRateProfile: {
      baseline: 120,
      peak: 180, // Elevated but drops during inactivity
      variability: 20,
      spikeProbability: 0.05
    },
    temperatureProfile: {
      baseline: 37.5, // 37.5°C
      peak: 38.6, // 38.6°C - Moderate elevation
      riseRate: 0.36
    },
    movementProfile: {
      activityLevel: 'LOW',
      fallRisk: 0.02,
      inactivityPeriods: true // Will trigger inactivity alerts
    },
    environmentalFactors: {
      ambientTemp: 29, // 29°C
      humidity: 75,
      airQuality: 80
    }
  },
  {
    id: 'wildfire_suppression',
    name: '🔥 Wildfire Suppression',
    description: 'Extended wildfire fighting with extreme environmental conditions',
    duration: 120,
    heartRateProfile: {
      baseline: 80,
      peak: 195, // Will trigger high heart rate alerts
      variability: 28,
      spikeProbability: 0.18
    },
    temperatureProfile: {
      baseline: 37.0, // 37.0°C
      peak: 39.8, // 39.8°C - Will trigger critical temperature alerts
      riseRate: 0.63
    },
    movementProfile: {
      activityLevel: 'EXTREME',
      fallRisk: 0.06,
      inactivityPeriods: false
    },
    environmentalFactors: {
      ambientTemp: 38, // 38°C
      humidity: 25,
      airQuality: 30 // Poor air quality will trigger environmental alerts
    }
  },
  {
    id: 'search_rescue',
    name: '🔍 Search & Rescue Operations',
    description: 'Urban search and rescue with moderate to high physical demands',
    duration: 75,
    heartRateProfile: {
      baseline: 75,
      peak: 175, // Will trigger moderate heart rate alerts
      variability: 22,
      spikeProbability: 0.08
    },
    temperatureProfile: {
      baseline: 37.1, // 37.1°C
      peak: 38.8, // 38.8°C - Will trigger moderate/high alerts
      riseRate: 0.45
    },
    movementProfile: {
      activityLevel: 'MODERATE',
      fallRisk: 0.03,
      inactivityPeriods: false
    },
    environmentalFactors: {
      ambientTemp: 28, // 28°C
      humidity: 55,
      airQuality: 70
    }
  },
  {
    id: 'hazmat_response',
    name: '☢️ HAZMAT Response',
    description: 'Chemical/biological hazard response with critical air quality alerts',
    duration: 45,
    heartRateProfile: {
      baseline: 90,
      peak: 185, // Will trigger high heart rate alerts
      variability: 25,
      spikeProbability: 0.12
    },
    temperatureProfile: {
      baseline: 37.3, // 37.3°C
      peak: 39.2, // 39.2°C - Will trigger critical temperature alerts
      riseRate: 0.50
    },
    movementProfile: {
      activityLevel: 'MODERATE',
      fallRisk: 0.05,
      inactivityPeriods: false
    },
    environmentalFactors: {
      ambientTemp: 26, // 26°C
      humidity: 80,
      airQuality: 15 // Very poor air quality - will trigger critical environmental alerts
    }
  },
  {
    id: 'equipment_failure_scenario',
    name: '🛡️ Equipment Failure Emergency',
    description: 'SCBA malfunction and equipment failures with helmet removal simulation',
    duration: 25,
    heartRateProfile: {
      baseline: 110,
      peak: 190, // Elevated due to equipment stress
      variability: 30,
      spikeProbability: 0.20
    },
    temperatureProfile: {
      baseline: 37.1, // 37.1°C
      peak: 38.3, // 38.3°C - Moderate elevation
      riseRate: 0.30
    },
    movementProfile: {
      activityLevel: 'HIGH',
      fallRisk: 0.08,
      inactivityPeriods: false
    },
    environmentalFactors: {
      ambientTemp: 29, // 29°C
      humidity: 70,
      airQuality: 25 // Poor air quality due to equipment failure
    }
  },
  {
    id: 'medical_emergency_scenario',
    name: '🚑 Medical Emergency Simulation',
    description: 'Medical distress with dehydration and HRV stress indicators',
    duration: 20,
    heartRateProfile: {
      baseline: 130,
      peak: 210, // Critical heart rate during medical emergency
      variability: 40,
      spikeProbability: 0.25
    },
    temperatureProfile: {
      baseline: 37.9, // 37.9°C - Elevated baseline
      peak: 39.9, // 39.9°C - Near critical
      riseRate: 0.60
    },
    movementProfile: {
      activityLevel: 'LOW',
      fallRisk: 0.15,
      inactivityPeriods: true
    },
    environmentalFactors: {
      ambientTemp: 35, // 35°C - Hot environment
      humidity: 85,
      airQuality: 60
    }
  },
  {
    id: 'immobility_scenario',
    name: '🚫 Extended Immobility Crisis',
    description: 'Firefighter collapse with extended immobility and potential unconsciousness',
    duration: 10,
    heartRateProfile: {
      baseline: 85,
      peak: 120, // Lower due to immobility
      variability: 15,
      spikeProbability: 0.03
    },
    temperatureProfile: {
      baseline: 36.9, // 36.9°C
      peak: 37.8, // 37.8°C - Mild elevation
      riseRate: 0.20
    },
    movementProfile: {
      activityLevel: 'LOW',
      fallRisk: 0.05,
      inactivityPeriods: true // Extended periods of no movement
    },
    environmentalFactors: {
      ambientTemp: 27, // 27°C
      humidity: 65,
      airQuality: 75
    }
  },
  {
    id: 'communication_lost_scenario',
    name: '📡 Communication Breakdown',
    description: 'Lost communication with evacuation needs and operational alerts',
    duration: 35,
    heartRateProfile: {
      baseline: 95,
      peak: 175, // Moderate elevation due to stress
      variability: 25,
      spikeProbability: 0.10
    },
    temperatureProfile: {
      baseline: 37.2, // 37.2°C
      peak: 38.9, // 38.9°C - High temperature
      riseRate: 0.40
    },
    movementProfile: {
      activityLevel: 'MODERATE',
      fallRisk: 0.06,
      inactivityPeriods: false
    },
    environmentalFactors: {
      ambientTemp: 31, // 31°C
      humidity: 75,
      airQuality: 45 // Moderate air quality issues
    }
  },
  {
    id: 'multi_hazard_extreme',
    name: '⚡ Multi-Hazard Extreme Emergency',
    description: 'Comprehensive emergency with multiple equipment failures and environmental hazards',
    duration: 60,
    heartRateProfile: {
      baseline: 100,
      peak: 220, // Maximum stress response
      variability: 35,
      spikeProbability: 0.30
    },
    temperatureProfile: {
      baseline: 37.7, // 37.7°C
      peak: 40.3, // 40.3°C - Critical temperature
      riseRate: 0.80
    },
    movementProfile: {
      activityLevel: 'EXTREME',
      fallRisk: 0.12,
      inactivityPeriods: true
    },
    environmentalFactors: {
      ambientTemp: 43, // 43°C - Extreme heat
      humidity: 90,
      airQuality: 10 // Critical air quality
    }
  }
];

interface BackendSimulation {
  firefighterId: string;
  scenarioId: string;
  startTime: string; // Backend sends ISO string
  status: string;
  scenario: any;
}

interface Firefighter {
  _id: string;
  firstName: string;
  lastName: string;
  badgeNumber: string;
  department: string;
  station: string;
  isActive: boolean;
}

const DataSimulationDashboard: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [selectedFirefighters, setSelectedFirefighters] = useState<string[]>([]);
  const [showCustomScenario, setShowCustomScenario] = useState(false);
  const [customScenario, setCustomScenario] = useState<SimulationScenario>({
    id: 'custom',
    name: '',
    description: '',
    duration: 30,
    heartRateProfile: {
      baseline: 80,
      peak: 160,
      variability: 20,
      spikeProbability: 0.1
    },
    temperatureProfile: {
      baseline: 37.0,
      peak: 38.5,
      riseRate: 0.2
    },
    movementProfile: {
      activityLevel: 'MODERATE',
      fallRisk: 0.05,
      inactivityPeriods: false
    },
    environmentalFactors: {
      ambientTemp: 25,
      humidity: 50,
      airQuality: 80
    }
  });
  const queryClient = useQueryClient();

  // Fetch available firefighters
  const { data: firefighters = [] } = useQuery({
    queryKey: ['firefighters'],
    queryFn: async () => {
      const response = await fetch('http://localhost:3004/api/firefighters');
      if (!response.ok) throw new Error('Failed to fetch firefighters');
      const result = await response.json();
      console.log('API Response:', result);
      // Handle the API response structure
      if (result.success && result.data && result.data.firefighters) {
        return result.data.firefighters;
      }
      // Fallback for direct array response
      return Array.isArray(result) ? result : [];
    },
  });

  // Fetch active simulations from backend
  const { data: activeSimulations = [] } = useQuery({
    queryKey: ['activeSimulations'],
    queryFn: async () => {
      const response = await fetch('http://localhost:3004/api/simulations/active');
      if (!response.ok) throw new Error('Failed to fetch active simulations');
      const result = await response.json();
      return result.data || [];
    },
    refetchInterval: 2000, // Refresh every 2 seconds
  });

  // Start simulation mutation
  const startSimulationMutation = useMutation({
    mutationFn: async ({ firefighterIds, scenarioId, customScenarioData }: { 
      firefighterIds: string[], 
      scenarioId: string,
      customScenarioData?: SimulationScenario 
    }) => {
      const response = await fetch('http://localhost:3004/api/simulations/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firefighterIds, scenarioId, customScenarioData }),
      });
      if (!response.ok) throw new Error('Failed to start simulation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeSimulations'] });
    },
  });

  // Stop simulation mutation
  const stopSimulationMutation = useMutation({
    mutationFn: async (firefighterId: string) => {
      const response = await fetch(`http://localhost:3004/api/simulations/stop/${firefighterId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to stop simulation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeSimulations'] });
    },
  });

  // Simulate realistic physiological data based on scenario
  const generateRealisticData = (scenario: SimulationScenario, elapsedMinutes: number) => {
    const progress = Math.min(elapsedMinutes / scenario.duration, 1);
    
    // Heart rate simulation with realistic patterns
    const baseHR = scenario.heartRateProfile.baseline;
    const peakHR = scenario.heartRateProfile.peak;
    const hrVariability = scenario.heartRateProfile.variability;
    
    // Progressive increase with fatigue factor
    const progressiveHR = baseHR + (peakHR - baseHR) * Math.pow(progress, 0.7);
    const variabilityNoise = (Math.random() - 0.5) * hrVariability;
    const heartRate = Math.round(progressiveHR + variabilityNoise);

    // Temperature simulation following heat accumulation
    const baseTemp = scenario.temperatureProfile.baseline;
    const peakTemp = scenario.temperatureProfile.peak;
    const riseRate = scenario.temperatureProfile.riseRate;
    
    const tempIncrease = Math.min(riseRate * elapsedMinutes, peakTemp - baseTemp);
    const temperature = baseTemp + tempIncrease + (Math.random() - 0.5) * 0.3;

    // Air quality based on environment and equipment
    const baseAirQuality = scenario.environmentalFactors.airQuality;
    const airQualityVariation = (Math.random() - 0.5) * 20;
    const airQuality = Math.max(0, Math.min(100, baseAirQuality + airQualityVariation));

    // Movement/acceleration simulation
    let acceleration = 1.0; // Normal gravity
    const activityMultiplier = {
      'LOW': 1.2,
      'MODERATE': 2.5,
      'HIGH': 4.0,
      'EXTREME': 6.0
    }[scenario.movementProfile.activityLevel];
    
    // Add realistic movement patterns
    acceleration += Math.random() * activityMultiplier;
    
    // Simulate fall events based on risk probability
    if (Math.random() < scenario.movementProfile.fallRisk * 0.01) {
      acceleration = 20 + Math.random() * 10; // Fall detected
    }

    return {
      heartRate: Math.max(40, Math.min(220, heartRate)),
      temperature: Math.max(35, Math.min(42, temperature)),
      airQuality: Math.round(airQuality),
      acceleration: acceleration,
      isActive: acceleration > 1.5
    };
  };

  const startSimulation = () => {
    if (!selectedScenario || selectedFirefighters.length === 0) return;

    console.log('🚀 Starting simulation for firefighters:', selectedFirefighters, 'with scenario:', selectedScenario);

    // Call the backend API to start simulation
    startSimulationMutation.mutate({ 
      firefighterIds: selectedFirefighters, 
      scenarioId: selectedScenario,
      customScenarioData: selectedScenario === 'custom' ? customScenario : undefined
    });

    // Clear selections
    setSelectedFirefighters([]);
    setSelectedScenario('');
  };

  const stopSimulation = (firefighterId: string) => {
    stopSimulationMutation.mutate(firefighterId);
  };

  const stopAllSimulations = async () => {
    try {
      const response = await fetch('http://localhost:3004/api/simulations/stop-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) throw new Error('Failed to stop all simulations');
      
      const result = await response.json();
      console.log('✅ Stopped all simulations:', result.message);
      
      // Refresh the active simulations list
      queryClient.invalidateQueries({ queryKey: ['activeSimulations'] });
    } catch (error) {
      console.error('❌ Error stopping all simulations:', error);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">📊 Data Simulation Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Realistic physiological data simulation for testing and training scenarios
        </p>
      </div>

      {/* Simulation Controls */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">🎮 Simulation Controls</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scenario Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Scenario
            </label>
            <select
              value={selectedScenario}
              onChange={(e) => {
                setSelectedScenario(e.target.value);
                setShowCustomScenario(e.target.value === 'custom');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a scenario...</option>
              {SIMULATION_SCENARIOS.map(scenario => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.name}
                </option>
              ))}
              <option value="custom">🛠️ Create Custom Scenario</option>
            </select>
            {selectedScenario && selectedScenario !== 'custom' && (
              <div className="mt-2 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  {SIMULATION_SCENARIOS.find(s => s.id === selectedScenario)?.description}
                </p>
              </div>
            )}
          </div>

          {/* Firefighter Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Firefighters
            </label>
            <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md">
              {firefighters.map((firefighter: any) => (
                <label key={firefighter._id} className="flex items-center p-2 hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedFirefighters.includes(firefighter._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedFirefighters(prev => [...prev, firefighter._id]);
                      } else {
                        setSelectedFirefighters(prev => prev.filter(id => id !== firefighter._id));
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm">
                    {firefighter.firstName} {firefighter.lastName} (#{firefighter.badgeNumber})
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex flex-col space-y-3">
            <button
              onClick={startSimulation}
              disabled={!selectedScenario || selectedFirefighters.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🚀 Start Simulation
            </button>
            <button
              onClick={stopAllSimulations}
              disabled={activeSimulations.length === 0}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ⏹️ Stop All Simulations
            </button>
            <div className="text-sm text-gray-600">
              Active: {activeSimulations.length} simulation(s)
            </div>
          </div>
        </div>
      </div>

      {/* Custom Scenario Creator */}
      {showCustomScenario && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">🛠️ Custom Scenario Creator</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scenario Name</label>
                <input
                  type="text"
                  value={customScenario.name}
                  onChange={(e) => setCustomScenario({...customScenario, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Custom High-Stress Test"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={customScenario.description}
                  onChange={(e) => setCustomScenario({...customScenario, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe the scenario purpose and conditions..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={customScenario.duration}
                  onChange={(e) => setCustomScenario({...customScenario, duration: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Heart Rate Profile */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">💓 Heart Rate Profile</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Baseline HR (bpm)</label>
                  <input
                    type="number"
                    min="50"
                    max="120"
                    value={customScenario.heartRateProfile.baseline}
                    onChange={(e) => setCustomScenario({
                      ...customScenario,
                      heartRateProfile: {...customScenario.heartRateProfile, baseline: parseInt(e.target.value)}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Peak HR (bpm)</label>
                  <input
                    type="number"
                    min="120"
                    max="220"
                    value={customScenario.heartRateProfile.peak}
                    onChange={(e) => setCustomScenario({
                      ...customScenario,
                      heartRateProfile: {...customScenario.heartRateProfile, peak: parseInt(e.target.value)}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Variability (±bpm)</label>
                  <input
                    type="number"
                    min="5"
                    max="50"
                    value={customScenario.heartRateProfile.variability}
                    onChange={(e) => setCustomScenario({
                      ...customScenario,
                      heartRateProfile: {...customScenario.heartRateProfile, variability: parseInt(e.target.value)}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Spike Probability</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={customScenario.heartRateProfile.spikeProbability}
                    onChange={(e) => setCustomScenario({
                      ...customScenario,
                      heartRateProfile: {...customScenario.heartRateProfile, spikeProbability: parseFloat(e.target.value)}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Temperature Profile */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">🌡️ Temperature Profile</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Baseline Temp (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="36"
                    max="38"
                    value={customScenario.temperatureProfile.baseline}
                    onChange={(e) => setCustomScenario({
                      ...customScenario,
                      temperatureProfile: {...customScenario.temperatureProfile, baseline: parseFloat(e.target.value)}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Peak Temp (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="37"
                    max="42"
                    value={customScenario.temperatureProfile.peak}
                    onChange={(e) => setCustomScenario({
                      ...customScenario,
                      temperatureProfile: {...customScenario.temperatureProfile, peak: parseFloat(e.target.value)}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rise Rate (°C/min)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="-1"
                    max="2"
                    value={customScenario.temperatureProfile.riseRate}
                    onChange={(e) => setCustomScenario({
                      ...customScenario,
                      temperatureProfile: {...customScenario.temperatureProfile, riseRate: parseFloat(e.target.value)}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Movement & Environmental */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">🏃 Movement & Environment</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Activity Level</label>
                <select
                  value={customScenario.movementProfile.activityLevel}
                  onChange={(e) => setCustomScenario({
                    ...customScenario,
                    movementProfile: {...customScenario.movementProfile, activityLevel: e.target.value as 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME'}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="LOW">Low Activity</option>
                  <option value="MODERATE">Moderate Activity</option>
                  <option value="HIGH">High Activity</option>
                  <option value="EXTREME">Extreme Activity</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fall Risk (0-1)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={customScenario.movementProfile.fallRisk}
                    onChange={(e) => setCustomScenario({
                      ...customScenario,
                      movementProfile: {...customScenario.movementProfile, fallRisk: parseFloat(e.target.value)}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ambient Temp (°C)</label>
                  <input
                    type="number"
                    min="-10"
                    max="50"
                    value={customScenario.environmentalFactors.ambientTemp}
                    onChange={(e) => setCustomScenario({
                      ...customScenario,
                      environmentalFactors: {...customScenario.environmentalFactors, ambientTemp: parseInt(e.target.value)}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Humidity (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={customScenario.environmentalFactors.humidity}
                    onChange={(e) => setCustomScenario({
                      ...customScenario,
                      environmentalFactors: {...customScenario.environmentalFactors, humidity: parseInt(e.target.value)}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Air Quality (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={customScenario.environmentalFactors.airQuality}
                    onChange={(e) => setCustomScenario({
                      ...customScenario,
                      environmentalFactors: {...customScenario.environmentalFactors, airQuality: parseInt(e.target.value)}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={customScenario.movementProfile.inactivityPeriods}
                  onChange={(e) => setCustomScenario({
                    ...customScenario,
                    movementProfile: {...customScenario.movementProfile, inactivityPeriods: e.target.checked}
                  })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Include inactivity periods</span>
              </label>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">🎯 Evidence-Based Thresholds Preview</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Heart Rate Alerts:</span>
                <ul className="text-gray-600 mt-1">
                  <li>• Moderate: {customScenario.heartRateProfile.baseline + 70}+ bpm</li>
                  <li>• High: 185+ bpm (90% max)</li>
                  <li>• Critical: 200+ bpm (95% max)</li>
                </ul>
              </div>
              <div>
                <span className="font-medium">Temperature Alerts:</span>
                <ul className="text-gray-600 mt-1">
                  <li>• Moderate: 38.0°C+</li>
                  <li>• High: 38.5°C+</li>
                  <li>• Critical: 39.0°C+</li>
                </ul>
              </div>
              <div>
                <span className="font-medium">Movement Alerts:</span>
                <ul className="text-gray-600 mt-1">
                  <li>• Fall: &gt;20g acceleration</li>
                  <li>• Inactivity: &gt;60s no movement</li>
                  <li>• Risk Level: {customScenario.movementProfile.fallRisk > 0.1 ? 'High' : 'Normal'}</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => {
                // Use custom scenario
                setSelectedScenario('custom');
                setShowCustomScenario(false);
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Use This Scenario
            </button>
            <button
              onClick={() => setShowCustomScenario(false)}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                // Reset to default values
                setCustomScenario({
                  id: 'custom',
                  name: '',
                  description: '',
                  duration: 30,
                  heartRateProfile: {
                    baseline: 70,
                    peak: 180,
                    variability: 15,
                    spikeProbability: 0.1
                  },
                  temperatureProfile: {
                    baseline: 37.0,
                    peak: 39.0,
                    riseRate: 0.1
                  },
                  movementProfile: {
                    activityLevel: 'MODERATE',
                    fallRisk: 0.05,
                    inactivityPeriods: false
                  },
                  environmentalFactors: {
                    ambientTemp: 20,
                    humidity: 50,
                    airQuality: 85
                  }
                });
              }}
              className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      )}

      {/* Scenario Templates */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">📋 Available Scenarios</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SIMULATION_SCENARIOS.map(scenario => (
            <div
              key={scenario.id}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                selectedScenario === scenario.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedScenario(scenario.id)}
            >
              <h3 className="font-semibold text-gray-900 mb-2">{scenario.name}</h3>
              <p className="text-sm text-gray-600 mb-3">{scenario.description}</p>
              <div className="text-xs space-y-1">
                <div>Duration: {scenario.duration} minutes</div>
                <div>HR Range: {scenario.heartRateProfile.baseline}-{scenario.heartRateProfile.peak} bpm</div>
                <div>Temp Range: {scenario.temperatureProfile.baseline}-{scenario.temperatureProfile.peak}°C</div>
                <div>Activity: {scenario.movementProfile.activityLevel}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Simulations */}
      {activeSimulations.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">🔄 Active Simulations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeSimulations.map((sim: BackendSimulation) => {
              const firefighter = firefighters.find((f: Firefighter) => f._id === sim.firefighterId);
              const scenario = SIMULATION_SCENARIOS.find(s => s.id === sim.scenarioId);
              const elapsedMinutes = (Date.now() - new Date(sim.startTime).getTime()) / (1000 * 60);

              return (
                <div key={sim.firefighterId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {firefighter?.firstName} {firefighter?.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">{scenario?.name}</p>
                      <p className="text-xs text-gray-500">Badge: {firefighter?.badgeNumber}</p>
                    </div>
                    <button
                      onClick={() => stopSimulation(sim.firefighterId)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Stop
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      <span className={`font-semibold ${
                        sim.status === 'running' ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        {sim.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Duration</span>
                      <span className="font-semibold text-blue-600">
                        {Math.round(elapsedMinutes)} minutes
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Scenario</span>
                      <span className="font-semibold text-gray-600">
                        {scenario?.duration}m total
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-xs text-gray-500">
                      Progress: {Math.round(elapsedMinutes)}m / {scenario?.duration}m
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${Math.min((elapsedMinutes / (scenario?.duration || 1)) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      🔴 Real-time data visible in Command Center
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataSimulationDashboard;
