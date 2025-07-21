/**
 * 🔥 System Health Hook
 * 
 * Monitors system connectivity and health status
 */

import { useState, useEffect } from 'react';
import { useSocket } from '@/providers/SocketProvider';

interface SystemHealth {
  isConnected: boolean;
  isLoading: boolean;
  lastUpdate: Date | null;
  metrics: {
    activeFirefighters: number;
    activeAlerts: number;
    systemUptime: number;
    dataLatency: number;
  };
}

export const useSystemHealth = () => {
  const { socket, isConnected, isConnecting } = useSocket();
  const [health, setHealth] = useState<SystemHealth>({
    isConnected: false,
    isLoading: true,
    lastUpdate: null,
    metrics: {
      activeFirefighters: 0,
      activeAlerts: 0,
      systemUptime: 0,
      dataLatency: 0,
    },
  });

  useEffect(() => {
    setHealth(prev => ({
      ...prev,
      isConnected,
      isLoading: isConnecting,
    }));
  }, [isConnected, isConnecting]);

  useEffect(() => {
    if (!socket) return;

    // Listen for system health updates
    const handleSystemStatus = (status: any) => {
      setHealth(prev => ({
        ...prev,
        lastUpdate: new Date(),
        metrics: {
          activeFirefighters: status.activeFirefighters || 0,
          activeAlerts: status.activeAlerts || 0,
          systemUptime: status.uptime || 0,
          dataLatency: status.dataLatency || 0,
        },
      }));
    };

    socket.on('system:status', handleSystemStatus);

    // Request initial system status
    socket.emit('system:requestStatus');

    // Periodic health check
    const healthCheckInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('system:requestStatus');
      }
    }, 30000); // Every 30 seconds

    return () => {
      socket.off('system:status', handleSystemStatus);
      clearInterval(healthCheckInterval);
    };
  }, [socket]);

  return health;
};
