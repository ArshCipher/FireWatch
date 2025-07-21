/**
 * 🔧 DIAGNOSTIC COMPONENT - Test Both Issues
 * 
 * This component will help diagnose:
 * 1. DataSimulation blank screen issue
 * 2. Onboarding form not saving to database
 */

import React, { useState, useEffect } from 'react';

const DiagnosticDashboard: React.FC = () => {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'failed'>('checking');
  const [apiTests, setApiTests] = useState<any[]>([]);
  const [testFirefighter, setTestFirefighter] = useState({
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    phone: '555-123-4567',
    dateOfBirth: '1990-01-01',
    gender: 'male',
    height: 180,
    weight: 75,
    badgeNumber: 'TEST001',
    department: 'Test Department',
    station: 'Station 1',
    shift: 'A',
    rank: 'Firefighter',
    yearsOfService: 5,
    createdBy: '507f1f77bcf86cd799439011', // Valid ObjectId
    isActive: true
  });

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    console.log('🔧 Running diagnostic tests...');
    const tests: any[] = [];

    // Test 1: Backend Health Check
    try {
      const healthResponse = await fetch('http://localhost:3004/api/health');
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        tests.push({ name: 'Backend Health', status: 'PASS', data: healthData });
        setBackendStatus('connected');
      } else {
        tests.push({ name: 'Backend Health', status: 'FAIL', error: `HTTP ${healthResponse.status}` });
        setBackendStatus('failed');
      }
    } catch (error: any) {
      tests.push({ name: 'Backend Health', status: 'FAIL', error: error.message });
      setBackendStatus('failed');
    }

    // Test 2: Get Firefighters (for DataSimulation)
    try {
      const firefightersResponse = await fetch('http://localhost:3004/api/firefighters');
      if (firefightersResponse.ok) {
        const firefighters = await firefightersResponse.json();
        tests.push({ 
          name: 'Get Firefighters (DataSim)', 
          status: 'PASS', 
          data: `Found ${firefighters.length} firefighters` 
        });
      } else {
        tests.push({ 
          name: 'Get Firefighters (DataSim)', 
          status: 'FAIL', 
          error: `HTTP ${firefightersResponse.status}` 
        });
      }
    } catch (error: any) {
      tests.push({ 
        name: 'Get Firefighters (DataSim)', 
        status: 'FAIL', 
        error: error.message 
      });
    }

    // Test 3: Create Firefighter (for Onboarding)
    try {
      const createResponse = await fetch('http://localhost:3004/api/firefighters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testFirefighter),
      });
      
      if (createResponse.ok) {
        const created = await createResponse.json();
        tests.push({ 
          name: 'Create Firefighter (Onboarding)', 
          status: 'PASS', 
          data: `Created firefighter with ID: ${created._id}` 
        });
      } else {
        const errorText = await createResponse.text();
        tests.push({ 
          name: 'Create Firefighter (Onboarding)', 
          status: 'FAIL', 
          error: `HTTP ${createResponse.status}: ${errorText}` 
        });
      }
    } catch (error: any) {
      tests.push({ 
        name: 'Create Firefighter (Onboarding)', 
        status: 'FAIL', 
        error: error.message 
      });
    }

    // Test 4: Database Connection
    try {
      const dbResponse = await fetch('http://localhost:3004/api/health/database');
      if (dbResponse.ok) {
        const dbData = await dbResponse.json();
        tests.push({ name: 'Database Connection', status: 'PASS', data: dbData });
      } else {
        tests.push({ name: 'Database Connection', status: 'FAIL', error: `HTTP ${dbResponse.status}` });
      }
    } catch (error: any) {
      tests.push({ name: 'Database Connection', status: 'FAIL', error: error.message });
    }

    setApiTests(tests);
  };

  const testOnboardingForm = async () => {
    try {
      console.log('🧪 Testing Onboarding Form Submission...');
      const response = await fetch('http://localhost:3004/api/firefighters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...testFirefighter,
          badgeNumber: `TEST${Date.now()}`, // Unique badge number
          email: `test${Date.now()}@example.com` // Unique email
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ SUCCESS! Firefighter created with ID: ${result._id}`);
        runDiagnostics(); // Refresh tests
      } else {
        const errorText = await response.text();
        alert(`❌ FAILED! ${response.status}: ${errorText}`);
      }
    } catch (error: any) {
      alert(`❌ ERROR! ${error.message}`);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🔧 System Diagnostic Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Diagnosing DataSimulation blank screen and Onboarding form issues
          </p>
        </div>

        {/* Backend Status */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🌐 Backend Status</h2>
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            backendStatus === 'connected' ? 'bg-green-100 text-green-800' :
            backendStatus === 'failed' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {backendStatus === 'connected' && '✅ Connected'}
            {backendStatus === 'failed' && '❌ Failed'}
            {backendStatus === 'checking' && '⏳ Checking...'}
          </div>
        </div>

        {/* API Tests */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">🧪 API Tests</h2>
            <button
              onClick={runDiagnostics}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              🔄 Run Tests
            </button>
          </div>
          
          <div className="space-y-3">
            {apiTests.map((test, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{test.name}</h3>
                    {test.status === 'PASS' && (
                      <p className="text-green-600 text-sm mt-1">✅ {test.data}</p>
                    )}
                    {test.status === 'FAIL' && (
                      <p className="text-red-600 text-sm mt-1">❌ {test.error}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    test.status === 'PASS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {test.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Manual Tests */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🧪 Manual Tests</h2>
          
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">📋 Test Onboarding Form</h3>
              <p className="text-gray-600 text-sm mb-3">
                This will test if the form submission to the backend works correctly.
              </p>
              <button
                onClick={testOnboardingForm}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                🧪 Test Form Submission
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">📊 Test DataSimulation</h3>
              <p className="text-gray-600 text-sm mb-3">
                If this page loads correctly, DataSimulation should work. Check console for errors.
              </p>
              <div className="flex space-x-2">
                <a
                  href="http://localhost:3003"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  🔗 Open DataSimulation
                </a>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  🔄 Reload This Page
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Console Logs */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">📝 Instructions</h2>
          <div className="space-y-3 text-sm">
            <div className="bg-blue-50 p-3 rounded-md">
              <h4 className="font-semibold text-blue-900">For DataSimulation Blank Screen:</h4>
              <ol className="list-decimal list-inside mt-2 space-y-1 text-blue-800">
                <li>Open browser console (F12) on DataSimulation page</li>
                <li>Look for JavaScript errors or React component errors</li>
                <li>Check if API calls are failing</li>
                <li>Verify React Query is working properly</li>
              </ol>
            </div>
            
            <div className="bg-green-50 p-3 rounded-md">
              <h4 className="font-semibold text-green-900">For Onboarding Form Not Saving:</h4>
              <ol className="list-decimal list-inside mt-2 space-y-1 text-green-800">
                <li>Click "Test Form Submission" above</li>
                <li>Check if the API endpoint returns success</li>
                <li>Verify database connection is working</li>
                <li>Check browser console for form validation errors</li>
              </ol>
            </div>

            <div className="bg-yellow-50 p-3 rounded-md">
              <h4 className="font-semibold text-yellow-900">Expected Results:</h4>
              <ul className="list-disc list-inside mt-2 space-y-1 text-yellow-800">
                <li>All API tests should show "PASS"</li>
                <li>Backend status should be "Connected"</li>
                <li>Form submission should create a firefighter with an ID</li>
                <li>DataSimulation should load without console errors</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticDashboard;
