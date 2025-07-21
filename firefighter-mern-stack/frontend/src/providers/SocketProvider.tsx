/**
 * 🔥 Socket Provider
 * 
 * Provides real    const socketInstance = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:3004', {time Socket.IO connection throughout the app
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  isConnecting: false,
  connectionError: null,
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize socket connection
    setIsConnecting(true);
    setConnectionError(null);
    
    console.log('🔌 Initializing Socket.IO connection to backend...');
    
    const socketInstance = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:3004', {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      retries: 5,
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
      forceNew: true,
    });

    // Connection event handlers
    socketInstance.on('connect', () => {
      console.log('✅ Socket connected successfully:', socketInstance.id);
      setIsConnected(true);
      setIsConnecting(false);
      setConnectionError(null);
      toast.success('Connected to monitoring system', { duration: 2000 });
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
      setIsConnecting(false);
      setConnectionError(`Disconnected: ${reason}`);
      
      // Only show error toast for unexpected disconnections
      if (reason !== 'io client disconnect') {
        toast.error('Disconnected from monitoring system');
      }
    });

    socketInstance.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      setIsConnecting(false);
      setConnectionError(error.message || 'Connection failed');
      
      // Show more helpful error message
      if (error.message.includes('xhr poll error')) {
        toast.error('Backend server not responding - check if port 3004 is running');
      } else {
        toast.error('Failed to connect to monitoring system');
      }
    });

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
      setConnectionError(null);
      toast.success('Reconnected to monitoring system');
    });

    socketInstance.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 Socket reconnection attempt:', attemptNumber);
      setIsConnecting(true);
    });

    socketInstance.on('reconnect_error', (error) => {
      console.error('❌ Socket reconnection error:', error);
      setConnectionError(error.message || 'Reconnection failed');
    });

    socketInstance.on('reconnect_failed', () => {
      console.error('❌ Socket reconnection failed');
      toast.error('Unable to reconnect to monitoring system');
      setIsConnecting(false);
    });

    // Real-time event handlers
    socketInstance.on('firefighter:update', (data) => {
      console.log('📡 Firefighter update received:', data);
      // This will be handled by individual components
    });

    socketInstance.on('sensor:data', (data) => {
      console.log('📊 Sensor data received:', data);
      // This will be handled by individual components
    });

    socketInstance.on('alert:new', (alert) => {
      console.log('🚨 New alert received:', alert);
      
      // Show toast notification for new alerts
      const severityConfig = {
        CRITICAL: { icon: '🚨', duration: 0 }, // Don't auto-dismiss
        HIGH: { icon: '⚠️', duration: 8000 },
        MEDIUM: { icon: '⚡', duration: 6000 },
        LOW: { icon: 'ℹ️', duration: 4000 },
      };

      const config = severityConfig[alert.severity as keyof typeof severityConfig] || severityConfig.LOW;
      
      toast.error(`${config.icon} ${alert.message}`, {
        duration: config.duration,
        style: {
          background: alert.severity === 'CRITICAL' ? '#dc2626' : '#ea580c',
          color: 'white',
        },
      });
    });

    socketInstance.on('alert:resolved', (alert) => {
      console.log('✅ Alert resolved:', alert);
      toast.success(`Alert resolved: ${alert.message}`);
    });

    socketInstance.on('system:status', (status) => {
      console.log('⚡ System status update:', status);
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up socket connection');
      socketInstance.disconnect();
    };
  }, []);

  const value: SocketContextType = {
    socket,
    isConnected,
    isConnecting,
    connectionError,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
