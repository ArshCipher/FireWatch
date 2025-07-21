/**
 * 🔥 Alerts Page
 * 
 * View and manage system alerts and notifications
 */

import React from 'react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const Alerts: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
        <p className="text-gray-600 mt-1">System alerts and emergency notifications</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-500">Loading alerts...</p>
          <p className="text-sm text-gray-400 mt-2">This page is under development</p>
        </div>
      </div>
    </div>
  );
};

export default Alerts;
