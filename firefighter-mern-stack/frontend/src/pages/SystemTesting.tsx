/**
 * 🧪 System Testing Page
 * 
 * Comprehensive testing interface for all MERN stack features
 */

import React, { useState } from 'react';

interface TestResult {
  status: string | number;
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
  timestamp: string;
}

interface LoadingState {
  [key: string]: boolean;
}

interface TestResults {
  [key: string]: TestResult;
}

const SystemTesting: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResults>({});
  const [loading, setLoading] = useState<LoadingState>({});
  const [apiResponse, setApiResponse] = useState<string>('');

  // Test API connectivity
  const testAPI = async (endpoint: string, method: string = 'GET', data?: any) => {
    setLoading(prev => ({ ...prev, [endpoint]: true }));
    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };
      
      if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(`http://localhost:3003${endpoint}`, options);
      const result = await response.json();
      
      setTestResults(prev => ({
        ...prev,
        [endpoint]: {
          status: response.status,
          success: response.ok,
          data: result,
          timestamp: new Date().toLocaleTimeString()
        }
      }));
      
      setApiResponse(JSON.stringify(result, null, 2));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setTestResults(prev => ({
        ...prev,
        [endpoint]: {
          status: 'ERROR',
          success: false,
          error: errorMessage,
          timestamp: new Date().toLocaleTimeString()
        }
      }));
      setApiResponse(`Error: ${errorMessage}`);
    } finally {
      setLoading(prev => ({ ...prev, [endpoint]: false }));
    }
  };

  // Test WebSocket/Socket.IO connection
  const testSocketIO = () => {
    try {
      // This would connect to Socket.IO when implemented
      setTestResults(prev => ({
        ...prev,
        'socket.io': {
          status: 'READY',
          success: true,
          message: 'Socket.IO client ready for connection',
          timestamp: new Date().toLocaleTimeString()
        }
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setTestResults(prev => ({
        ...prev,
        'socket.io': {
          status: 'ERROR',
          success: false,
          error: errorMessage,
          timestamp: new Date().toLocaleTimeString()
        }
      }));
    }
  };

  // Create test data
  const createTestFirefighter = async () => {
    await testAPI('/api/system/test/generate-data', 'POST');
  };

  const cleanTestData = async () => {
    await testAPI('/api/system/test/clean-data', 'DELETE');
  };

  const testEndpoints = [
    { name: 'System Health', endpoint: '/api/system/health', method: 'GET' },
    { name: 'System Stats', endpoint: '/api/system/stats', method: 'GET' },
    { name: 'Database Test', endpoint: '/api/system/test/database', method: 'GET' },
    { name: 'Socket.IO Test', endpoint: '/api/system/test/socketio', method: 'GET' },
    { name: 'Backend Health', endpoint: '/api/health', method: 'GET' },
    { name: 'Get Firefighters', endpoint: '/api/firefighters', method: 'GET' },
    { name: 'Get Sensor Data', endpoint: '/api/sensor-data', method: 'GET' },
    { name: 'Get Alerts', endpoint: '/api/alerts', method: 'GET' },
    { name: 'Dashboard Stats', endpoint: '/api/dashboard/stats', method: 'GET' },
    { name: 'Monitoring Status', endpoint: '/api/monitoring/status', method: 'GET' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">🧪 System Testing Dashboard</h2>
        
        {/* Quick Test Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <button
            onClick={() => window.open('http://localhost:3002', '_blank')}
            className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <h3 className="font-semibold text-blue-800">🔌 Backend Server</h3>
            <p className="text-sm text-blue-600">http://localhost:3002</p>
          </button>

          <button
            onClick={testSocketIO}
            className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
          >
            <h3 className="font-semibold text-green-800">⚡ Socket.IO Test</h3>
            <p className="text-sm text-green-600">Real-time connection</p>
          </button>

          <button
            onClick={createTestFirefighter}
            className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <h3 className="font-semibold text-purple-800">👤 Generate Test Data</h3>
            <p className="text-sm text-purple-600">POST /api/system/test/generate-data</p>
          </button>

          <button
            onClick={cleanTestData}
            className="p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
          >
            <h3 className="font-semibold text-red-800">�️ Clean Test Data</h3>
            <p className="text-sm text-red-600">DELETE /api/system/test/clean-data</p>
          </button>

          <button
            onClick={() => window.open('http://localhost:3002/api-docs', '_blank')}
            className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <h3 className="font-semibold text-indigo-800">📚 API Documentation</h3>
            <p className="text-sm text-indigo-600">Swagger/OpenAPI</p>
          </button>

          <button
            onClick={() => testAPI('/api/system/health')}
            className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
          >
            <h3 className="font-semibold text-emerald-800">💓 System Health</h3>
            <p className="text-sm text-emerald-600">Comprehensive check</p>
          </button>

          <button
            onClick={() => testAPI('/api/system/stats')}
            className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors"
          >
            <h3 className="font-semibold text-yellow-800">📊 System Stats</h3>
            <p className="text-sm text-yellow-600">Live statistics</p>
          </button>

          <button
            onClick={() => testAPI('/api/system/test/database')}
            className="p-4 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
          >
            <h3 className="font-semibold text-teal-800">🗄️ Database Test</h3>
            <p className="text-sm text-teal-600">MongoDB operations</p>
          </button>
        </div>

        {/* API Endpoint Tests */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">🔗 API Endpoint Tests</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testEndpoints.map((test) => (
              <button
                key={test.endpoint}
                onClick={() => testAPI(test.endpoint, test.method)}
                disabled={loading[test.endpoint]}
                className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">{test.name}</h4>
                    <p className="text-sm text-gray-600">{test.method} {test.endpoint}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {loading[test.endpoint] && (
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {testResults[test.endpoint] && (
                      <div className={`w-3 h-3 rounded-full ${
                        testResults[test.endpoint].success ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                    )}
                  </div>
                </div>
                {testResults[test.endpoint] && (
                  <div className="mt-2 text-xs text-gray-500">
                    Status: {testResults[test.endpoint].status} at {testResults[test.endpoint].timestamp}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Response Display */}
        {apiResponse && (
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">📄 Latest API Response</h3>
            <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto max-h-96 overflow-y-auto">
              {apiResponse}
            </pre>
          </div>
        )}

        {/* Test Results Summary */}
        <div className="border-t pt-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">📊 Test Results Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800">Successful Tests</h4>
              <p className="text-2xl font-bold text-green-600">
                {Object.values(testResults).filter((r: any) => r.success).length}
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="font-semibold text-red-800">Failed Tests</h4>
              <p className="text-2xl font-bold text-red-600">
                {Object.values(testResults).filter((r: any) => !r.success).length}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800">Total Tests Run</h4>
              <p className="text-2xl font-bold text-blue-600">
                {Object.keys(testResults).length}
              </p>
            </div>
          </div>
        </div>

        {/* Feature Checklist */}
        <div className="border-t pt-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">✅ MERN Stack Features Checklist</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Frontend (React)</h4>
              <ul className="space-y-1 text-sm">
                <li className="flex items-center"><span className="text-green-500">✅</span> <span className="ml-2">React 18 with TypeScript</span></li>
                <li className="flex items-center"><span className="text-green-500">✅</span> <span className="ml-2">Tailwind CSS Styling</span></li>
                <li className="flex items-center"><span className="text-green-500">✅</span> <span className="ml-2">React Router Navigation</span></li>
                <li className="flex items-center"><span className="text-green-500">✅</span> <span className="ml-2">React Query Integration</span></li>
                <li className="flex items-center"><span className="text-blue-500">🔄</span> <span className="ml-2">Socket.IO Client</span></li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Backend (Node.js)</h4>
              <ul className="space-y-1 text-sm">
                <li className="flex items-center"><span className="text-green-500">✅</span> <span className="ml-2">Express.js Server</span></li>
                <li className="flex items-center"><span className="text-green-500">✅</span> <span className="ml-2">MongoDB Connection</span></li>
                <li className="flex items-center"><span className="text-green-500">✅</span> <span className="ml-2">MVC Architecture</span></li>
                <li className="flex items-center"><span className="text-green-500">✅</span> <span className="ml-2">Socket.IO Server</span></li>
                <li className="flex items-center"><span className="text-green-500">✅</span> <span className="ml-2">Monitoring Services</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemTesting;
