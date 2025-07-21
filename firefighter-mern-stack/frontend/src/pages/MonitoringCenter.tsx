/**
 * 🔥 Monitoring Center Page
 * 
 * Real-time monitoring dashboard with live data visualization
 */

import React from 'react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const MonitoringCenter: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Monitoring Center</h1>
        <p className="text-gray-600 mt-1">Real-time physiological and environmental monitoring</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-500">Loading monitoring data...</p>
          <p className="text-sm text-gray-400 mt-2">This page is under development</p>
        </div>
      </div>
    </div>
  );
};

export default MonitoringCenter;
