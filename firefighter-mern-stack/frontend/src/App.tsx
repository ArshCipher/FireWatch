/**
 * 🔥 Firefighter Monitoring System - Distributed App Router
 * 
 * Multi-port distributed MERN application with intelligent routing
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SocketProvider } from './providers/SocketProvider';

// Import pages for distributed routing
import Onboarding from './pages/OnboardingDashboard';
import CommandCenter from './pages/CommandCenterDashboard';
import DataSimulation from './pages/DataSimulationDashboard';
import DiagnosticDashboard from './pages/DiagnosticDashboard';
import Firefighters from './pages/Firefighters';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Embedded Layout Component
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-red-600">🔥</span>
              <h1 className="ml-2 text-xl font-semibold text-gray-900">
                Firefighter Monitoring System
              </h1>
            </div>
            <div className="text-sm text-gray-500">
              Port: {window.location.port || '3000'} | Mode: {getAppType()}
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

// Detect application type based on port
const getAppType = (): string => {
  const port = window.location.port;
  console.log('🔍 Detecting app type for port:', port);
  
  switch (port) {
    case '3001':
      console.log('📋 Running Onboarding Dashboard');
      return 'onboarding';
    case '3002':
      console.log('🎯 Running Command Center Dashboard');
      return 'command-center';
    case '3003':
      console.log('📊 Running Data Simulation Dashboard');
      return 'data-simulation';
    default:
      console.log('🌐 Running in development mode');
      return 'development';
  }
};

const App: React.FC = () => {
  const appType = getAppType();
  console.log('🚀 App starting with type:', appType);

  return (
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        <Router>
          <Layout>
            <Routes>
              {appType === 'onboarding' && (
                <>
                  <Route path="/" element={<Onboarding />} />
                  <Route path="/diagnostic" element={<DiagnosticDashboard />} />
                  <Route path="/firefighters" element={<Firefighters />} />
                </>
              )}
              
              {appType === 'command-center' && (
                <>
                  <Route path="/" element={<CommandCenter />} />
                  <Route path="/firefighters" element={<Firefighters />} />
                </>
              )}
              
              {appType === 'data-simulation' && (
                <>
                  <Route path="/" element={<DataSimulation />} />
                  <Route path="/diagnostic" element={<DiagnosticDashboard />} />
                  <Route path="/firefighters" element={<Firefighters />} />
                </>
              )}
              
              {appType === 'development' && (
                <>
                  <Route path="/" element={<Onboarding />} />
                  <Route path="/command-center" element={<CommandCenter />} />
                  <Route path="/data-simulation" element={<DataSimulation />} />
                  <Route path="/firefighters" element={<Firefighters />} />
                </>
              )}
              
              {/* Fallback route */}
              <Route path="*" element={
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    🔥 Firefighter Monitoring System
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Application Type: {appType} | Port: {window.location.port || '3000'}
                  </p>
                  <div className="space-y-2 text-sm text-gray-500">
                    <p>Available routes for this application type:</p>
                    <ul className="list-disc list-inside">
                      {appType === 'onboarding' && (
                        <>
                          <li>/ - Onboarding Dashboard</li>
                          <li>/firefighters - Firefighter Management</li>
                        </>
                      )}
                      {appType === 'command-center' && (
                        <>
                          <li>/ - Command Center Dashboard</li>
                          <li>/firefighters - Firefighter Management</li>
                        </>
                      )}
                      {appType === 'data-simulation' && (
                        <>
                          <li>/ - Data Simulation Dashboard</li>
                          <li>/firefighters - Firefighter Management</li>
                        </>
                      )}
                      {appType === 'development' && (
                        <>
                          <li>/ - Onboarding (default)</li>
                          <li>/command-center - Command Center</li>
                          <li>/data-simulation - Data Simulation</li>
                          <li>/firefighters - Firefighter Management</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              } />
            </Routes>
          </Layout>
        </Router>
      </SocketProvider>
    </QueryClientProvider>
  );
};

export default App;
