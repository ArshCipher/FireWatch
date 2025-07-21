/**
 * 🔥 Firefighter Detail Page
 * 
 * Detailed view of individual firefighter with real-time monitoring
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const FirefighterDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Firefighter Details</h1>
        <p className="text-gray-600 mt-1">Real-time monitoring for Firefighter ID: {id}</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-500">Loading firefighter details...</p>
          <p className="text-sm text-gray-400 mt-2">This page is under development</p>
        </div>
      </div>
    </div>
  );
};

export default FirefighterDetail;
