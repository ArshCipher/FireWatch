/**
 * 🔥 Dashboard Page
 * 
 * Main overview dashboard with real-time statistics and charts
 */

import React, { useState, useEffect } from 'react';
import { useSocket } from '@/providers/SocketProvider';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { 
  UsersIcon, 
  ExclamationTriangleIcon, 
  FireIcon,
  HeartIcon,
  ThermometerIcon,
  CloudIcon 
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalFirefighters: number;
  activeFirefighters: number;
  activeAlerts: number;
  criticalAlerts: number;
  averageHeartRate: number;
  averageTemperature: number;
  airQualityAverage: number;
}

const Dashboard: React.FC = () => {
  const { socket, isConnected } = useSocket();
  const [stats, setStats] = useState<DashboardStats>({
    totalFirefighters: 0,
    activeFirefighters: 0,
    activeAlerts: 0,
    criticalAlerts: 0,
    averageHeartRate: 0,
    averageTemperature: 0,
    airQualityAverage: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Request dashboard data
    const fetchDashboardData = () => {
      socket.emit('dashboard:getData');
    };

    // Listen for dashboard updates
    const handleDashboardData = (data: any) => {
      setStats(data.stats || stats);
      setRecentAlerts(data.recentAlerts || []);
      setLoading(false);
    };

    const handleStatsUpdate = (newStats: DashboardStats) => {
      setStats(newStats);
    };

    socket.on('dashboard:data', handleDashboardData);
    socket.on('dashboard:statsUpdate', handleStatsUpdate);

    // Initial data fetch
    fetchDashboardData();

    // Periodic updates every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);

    return () => {
      socket.off('dashboard:data', handleDashboardData);
      socket.off('dashboard:statsUpdate', handleStatsUpdate);
      clearInterval(interval);
    };
  }, [socket, isConnected]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Firefighters',
      value: stats.totalFirefighters,
      icon: UsersIcon,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Active on Duty',
      value: stats.activeFirefighters,
      icon: FireIcon,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Active Alerts',
      value: stats.activeAlerts,
      icon: ExclamationTriangleIcon,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Critical Alerts',
      value: stats.criticalAlerts,
      icon: ExclamationTriangleIcon,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  const vitalStats = [
    {
      title: 'Avg Heart Rate',
      value: `${Math.round(stats.averageHeartRate)} BPM`,
      icon: HeartIcon,
      color: 'text-red-500',
    },
    {
      title: 'Avg Temperature',
      value: `${Math.round(stats.averageTemperature)}°C`,
      icon: ThermometerIcon,
      color: 'text-orange-500',
    },
    {
      title: 'Air Quality',
      value: `${Math.round(stats.airQualityAverage)}%`,
      icon: CloudIcon,
      color: 'text-blue-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time overview of firefighter monitoring system</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            isConnected 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              isConnected ? 'bg-green-400' : 'bg-red-400'
            }`}></div>
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vital Statistics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Vital Statistics</h3>
            <p className="text-sm text-gray-600">Average readings from active firefighters</p>
          </div>
          <div className="p-6 space-y-4">
            {vitalStats.map((vital, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <vital.icon className={`w-5 h-5 ${vital.color} mr-3`} />
                  <span className="text-sm font-medium text-gray-900">{vital.title}</span>
                </div>
                <span className="text-lg font-bold text-gray-900">{vital.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Alerts</h3>
            <p className="text-sm text-gray-600">Latest system alerts and notifications</p>
          </div>
          <div className="divide-y divide-gray-200">
            {recentAlerts.length > 0 ? (
              recentAlerts.slice(0, 5).map((alert, index) => (
                <div key={index} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      <div className={`w-2 h-2 rounded-full mt-2 mr-3 ${
                        alert.severity === 'CRITICAL' ? 'bg-red-500' :
                        alert.severity === 'HIGH' ? 'bg-orange-500' :
                        alert.severity === 'MEDIUM' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {alert.firefighterName} • {new Date(alert.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      alert.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                      alert.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                      alert.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {alert.severity}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <ExclamationTriangleIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-sm text-gray-500">No recent alerts</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">99.9%</div>
              <div className="text-sm text-gray-600">System Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">1.2s</div>
              <div className="text-sm text-gray-600">Avg Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.activeFirefighters}/{stats.totalFirefighters}
              </div>
              <div className="text-sm text-gray-600">Active Monitors</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
