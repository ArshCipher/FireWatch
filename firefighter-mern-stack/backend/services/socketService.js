/**
 * 🔥 Socket Service
 * 
 * Real-time communication service using Socket.IO
 */

import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger, logSystemEvent, logSecurityEvent } from '../middleware/logger.js';
import { User } from '../models/User.js';
import { Firefighter } from '../models/Firefighter.js';

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socket info
    this.activeRooms = new Set(); // Track active rooms
    this.connectionStats = {
      total: 0,
      current: 0,
      peak: 0,
      byRole: {}
    };
  }

  /**
   * Initialize Socket.IO server
   */
  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    
    logSystemEvent('SOCKET_SERVICE_INITIALIZED', {
      cors: process.env.FRONTEND_URL || "http://localhost:3000"
    });

    return this.io;
  }

  /**
   * Setup authentication middleware
   */
  setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          logSecurityEvent('SOCKET_AUTH_MISSING_TOKEN', { socketId: socket.id });
          return next(new Error('Authentication token required'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user details
        const user = await User.findById(decoded.id).select('-password');
        if (!user || !user.isActive) {
          logSecurityEvent('SOCKET_AUTH_INVALID_USER', { userId: decoded.id, socketId: socket.id });
          return next(new Error('Invalid user'));
        }

        // Get firefighter profile if applicable
        let firefighterProfile = null;
        if (user.role === 'firefighter' && user.firefighterProfile) {
          firefighterProfile = await Firefighter.findById(user.firefighterProfile);
        }

        // Attach user info to socket
        socket.user = user;
        socket.firefighterProfile = firefighterProfile;
        
        logSystemEvent('SOCKET_USER_AUTHENTICATED', {
          userId: user._id,
          userRole: user.role,
          socketId: socket.id
        });

        next();
      } catch (error) {
        logSecurityEvent('SOCKET_AUTH_ERROR', { 
          error: error.message, 
          socketId: socket.id 
        });
        next(new Error('Authentication failed'));
      }
    });
  }

  /**
   * Setup main event handlers
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
      
      // Core event handlers
      socket.on('join-room', (data) => this.handleJoinRoom(socket, data));
      socket.on('leave-room', (data) => this.handleLeaveRoom(socket, data));
      socket.on('firefighter-location', (data) => this.handleLocationUpdate(socket, data));
      socket.on('emergency-signal', (data) => this.handleEmergencySignal(socket, data));
      socket.on('acknowledge-alert', (data) => this.handleAcknowledgeAlert(socket, data));
      socket.on('status-update', (data) => this.handleStatusUpdate(socket, data));
      socket.on('message', (data) => this.handleMessage(socket, data));
      
      // Dashboard specific events
      socket.on('request-dashboard-data', () => this.sendDashboardData(socket));
      socket.on('subscribe-firefighter', (data) => this.handleSubscribeFirefighter(socket, data));
      socket.on('unsubscribe-firefighter', (data) => this.handleUnsubscribeFirefighter(socket, data));
      
      // Disconnect handler
      socket.on('disconnect', () => this.handleDisconnection(socket));
    });
  }

  /**
   * Handle new connection
   */
  handleConnection(socket) {
    const user = socket.user;
    
    // Update connection stats
    this.connectionStats.total++;
    this.connectionStats.current++;
    this.connectionStats.peak = Math.max(this.connectionStats.peak, this.connectionStats.current);
    this.connectionStats.byRole[user.role] = (this.connectionStats.byRole[user.role] || 0) + 1;
    
    // Store user connection info
    this.connectedUsers.set(user._id.toString(), {
      socketId: socket.id,
      user: user,
      firefighterProfile: socket.firefighterProfile,
      connectedAt: new Date(),
      rooms: new Set()
    });

    // Auto-join user to their role-based room
    const roleRoom = `role:${user.role}`;
    socket.join(roleRoom);
    this.activeRooms.add(roleRoom);

    // Auto-join department room
    const deptRoom = `dept:${user.department}`;
    socket.join(deptRoom);
    this.activeRooms.add(deptRoom);

    // If firefighter, join firefighter-specific room
    if (socket.firefighterProfile) {
      const firefighterRoom = `firefighter:${socket.firefighterProfile._id}`;
      socket.join(firefighterRoom);
      this.activeRooms.add(firefighterRoom);
    }

    logSystemEvent('SOCKET_USER_CONNECTED', {
      userId: user._id,
      userRole: user.role,
      department: user.department,
      socketId: socket.id,
      currentConnections: this.connectionStats.current
    });

    // Send welcome message with connection info
    socket.emit('connected', {
      message: 'Connected to firefighter monitoring system',
      userId: user._id,
      role: user.role,
      connectedAt: new Date(),
      activeConnections: this.connectionStats.current
    });

    // Notify other users in the same department
    socket.to(deptRoom).emit('user-connected', {
      user: {
        id: user._id,
        name: user.name,
        role: user.role
      },
      timestamp: new Date()
    });
  }

  /**
   * Handle disconnection
   */
  handleDisconnection(socket) {
    const user = socket.user;
    
    if (user) {
      // Update connection stats
      this.connectionStats.current--;
      this.connectionStats.byRole[user.role] = Math.max(0, (this.connectionStats.byRole[user.role] || 1) - 1);
      
      // Remove from connected users
      this.connectedUsers.delete(user._id.toString());
      
      logSystemEvent('SOCKET_USER_DISCONNECTED', {
        userId: user._id,
        userRole: user.role,
        socketId: socket.id,
        currentConnections: this.connectionStats.current
      });

      // Notify other users in the same department
      const deptRoom = `dept:${user.department}`;
      socket.to(deptRoom).emit('user-disconnected', {
        user: {
          id: user._id,
          name: user.name,
          role: user.role
        },
        timestamp: new Date()
      });
    }
  }

  /**
   * Handle room joining
   */
  handleJoinRoom(socket, data) {
    const { room } = data;
    
    if (!room || typeof room !== 'string') {
      socket.emit('error', { message: 'Invalid room name' });
      return;
    }

    socket.join(room);
    this.activeRooms.add(room);
    
    const userInfo = this.connectedUsers.get(socket.user._id.toString());
    if (userInfo) {
      userInfo.rooms.add(room);
    }

    socket.emit('joined-room', { room, timestamp: new Date() });
    socket.to(room).emit('user-joined-room', {
      user: {
        id: socket.user._id,
        name: socket.user.name,
        role: socket.user.role
      },
      room,
      timestamp: new Date()
    });

    logger.info('User joined room', {
      userId: socket.user._id,
      room,
      socketId: socket.id
    });
  }

  /**
   * Handle room leaving
   */
  handleLeaveRoom(socket, data) {
    const { room } = data;
    
    socket.leave(room);
    
    const userInfo = this.connectedUsers.get(socket.user._id.toString());
    if (userInfo) {
      userInfo.rooms.delete(room);
    }

    socket.emit('left-room', { room, timestamp: new Date() });
    socket.to(room).emit('user-left-room', {
      user: {
        id: socket.user._id,
        name: socket.user.name,
        role: socket.user.role
      },
      room,
      timestamp: new Date()
    });
  }

  /**
   * Handle location updates from firefighters
   */
  handleLocationUpdate(socket, data) {
    const { location, firefighterId } = data;
    
    if (!socket.firefighterProfile && socket.user.role !== 'admin') {
      socket.emit('error', { message: 'Unauthorized to send location updates' });
      return;
    }

    // Broadcast location update to commanders and admins
    this.io.to('role:commander').to('role:admin').emit('location-update', {
      firefighterId: firefighterId || socket.firefighterProfile?._id,
      location,
      timestamp: new Date(),
      firefighter: {
        name: socket.firefighterProfile?.name || socket.user.name,
        position: socket.firefighterProfile?.position
      }
    });

    logger.info('Location update received', {
      firefighterId: firefighterId || socket.firefighterProfile?._id,
      location,
      socketId: socket.id
    });
  }

  /**
   * Handle emergency signals
   */
  handleEmergencySignal(socket, data) {
    const { type, location, message } = data;
    
    const emergencyData = {
      id: `emergency_${Date.now()}`,
      type,
      location,
      message,
      firefighter: {
        id: socket.firefighterProfile?._id || socket.user._id,
        name: socket.firefighterProfile?.name || socket.user.name,
        position: socket.firefighterProfile?.position || socket.user.role
      },
      timestamp: new Date(),
      status: 'ACTIVE'
    };

    // Broadcast emergency to all connected users
    this.io.emit('emergency-alert', emergencyData);

    logSystemEvent('EMERGENCY_SIGNAL_RECEIVED', {
      emergencyId: emergencyData.id,
      type,
      firefighterId: socket.firefighterProfile?._id || socket.user._id,
      socketId: socket.id
    });

    socket.emit('emergency-sent', { 
      message: 'Emergency signal sent successfully',
      emergencyId: emergencyData.id 
    });
  }

  /**
   * Handle alert acknowledgments
   */
  handleAcknowledgeAlert(socket, data) {
    const { alertId, notes } = data;
    
    // Broadcast acknowledgment to relevant users
    this.io.to('role:commander').to('role:admin').emit('alert-acknowledged', {
      alertId,
      acknowledgedBy: {
        id: socket.user._id,
        name: socket.user.name,
        role: socket.user.role
      },
      notes,
      timestamp: new Date()
    });

    socket.emit('alert-ack-confirmed', { alertId, timestamp: new Date() });
  }

  /**
   * Handle status updates
   */
  handleStatusUpdate(socket, data) {
    const { status, location } = data;
    
    if (!socket.firefighterProfile) {
      socket.emit('error', { message: 'Only firefighters can send status updates' });
      return;
    }

    // Broadcast status update
    this.io.to('role:commander').to('role:admin').emit('firefighter-status-update', {
      firefighter: {
        id: socket.firefighterProfile._id,
        name: socket.firefighterProfile.name,
        position: socket.firefighterProfile.position
      },
      status,
      location,
      timestamp: new Date()
    });
  }

  /**
   * Handle messages
   */
  handleMessage(socket, data) {
    const { to, message, type = 'text' } = data;
    
    const messageData = {
      id: `msg_${Date.now()}`,
      from: {
        id: socket.user._id,
        name: socket.user.name,
        role: socket.user.role
      },
      message,
      type,
      timestamp: new Date()
    };

    if (to === 'broadcast' && ['admin', 'commander'].includes(socket.user.role)) {
      // Broadcast message to all users
      this.io.emit('broadcast-message', messageData);
    } else if (to.startsWith('room:')) {
      // Send to specific room
      const room = to.substring(5);
      this.io.to(room).emit('room-message', messageData);
    } else {
      // Send to specific user
      const targetUser = this.connectedUsers.get(to);
      if (targetUser) {
        this.io.to(targetUser.socketId).emit('direct-message', messageData);
        socket.emit('message-sent', { messageId: messageData.id, to });
      } else {
        socket.emit('error', { message: 'User not found or offline' });
      }
    }
  }

  /**
   * Send dashboard data to requesting socket
   */
  async sendDashboardData(socket) {
    try {
      // This would typically fetch from your database
      const dashboardData = {
        activeFirefighters: this.getActiveFirefighters(),
        connectionStats: this.connectionStats,
        activeRooms: Array.from(this.activeRooms),
        timestamp: new Date()
      };

      socket.emit('dashboard-data', dashboardData);
    } catch (error) {
      logger.error('Error sending dashboard data', { error: error.message, socketId: socket.id });
      socket.emit('error', { message: 'Failed to load dashboard data' });
    }
  }

  /**
   * Handle firefighter subscription for monitoring
   */
  handleSubscribeFirefighter(socket, data) {
    const { firefighterId } = data;
    
    if (!['admin', 'commander'].includes(socket.user.role)) {
      socket.emit('error', { message: 'Unauthorized to subscribe to firefighter data' });
      return;
    }

    const room = `monitor:${firefighterId}`;
    socket.join(room);
    socket.emit('subscribed', { firefighterId, room });
  }

  /**
   * Handle firefighter unsubscription
   */
  handleUnsubscribeFirefighter(socket, data) {
    const { firefighterId } = data;
    const room = `monitor:${firefighterId}`;
    socket.leave(room);
    socket.emit('unsubscribed', { firefighterId, room });
  }

  /**
   * Broadcast sensor data update
   */
  broadcastSensorData(firefighterId, sensorData, alerts = []) {
    if (!this.io) return;

    const updateData = {
      firefighterId,
      sensorData,
      alerts,
      timestamp: new Date()
    };

    // Send to monitoring rooms
    this.io.to(`monitor:${firefighterId}`).emit('sensor-data-update', updateData);
    
    // Send to commanders and admins
    this.io.to('role:commander').to('role:admin').emit('sensor-data-update', updateData);
    
    // Send to specific firefighter
    this.io.to(`firefighter:${firefighterId}`).emit('personal-sensor-update', updateData);
  }

  /**
   * Broadcast new alert
   */
  broadcastAlert(alert) {
    if (!this.io) return;

    // Send to all users
    this.io.emit('new-alert', alert);
    
    // Send specific notification to the firefighter
    if (alert.firefighterId) {
      this.io.to(`firefighter:${alert.firefighterId}`).emit('personal-alert', alert);
    }
  }

  /**
   * Get active firefighter connections
   */
  getActiveFirefighters() {
    const activeFirefighters = [];
    
    for (const [userId, userInfo] of this.connectedUsers) {
      if (userInfo.firefighterProfile) {
        activeFirefighters.push({
          id: userInfo.firefighterProfile._id,
          name: userInfo.firefighterProfile.name,
          position: userInfo.firefighterProfile.position,
          connectedAt: userInfo.connectedAt,
          socketId: userInfo.socketId
        });
      }
    }
    
    return activeFirefighters;
  }

  /**
   * Get connection statistics
   */
  getConnectionStats() {
    return {
      ...this.connectionStats,
      activeRooms: this.activeRooms.size,
      connectedUsers: this.connectedUsers.size
    };
  }

  /**
   * Send system notification to all users
   */
  sendSystemNotification(message, type = 'info', targetRoles = null) {
    if (!this.io) return;

    const notification = {
      id: `sys_${Date.now()}`,
      message,
      type,
      timestamp: new Date(),
      source: 'system'
    };

    if (targetRoles) {
      targetRoles.forEach(role => {
        this.io.to(`role:${role}`).emit('system-notification', notification);
      });
    } else {
      this.io.emit('system-notification', notification);
    }
  }

  /**
   * Cleanup expired connections and rooms
   */
  cleanup() {
    // This method can be called periodically to clean up stale data
    const now = new Date();
    const staleThreshold = 30 * 60 * 1000; // 30 minutes

    for (const [userId, userInfo] of this.connectedUsers) {
      if (now - userInfo.connectedAt > staleThreshold) {
        // Connection is stale, remove it
        this.connectedUsers.delete(userId);
        this.connectionStats.current--;
      }
    }
  }
}

// Create singleton instance
const socketService = new SocketService();

// Export initialize function as expected by server.js
export const initializeSocketHandlers = (server) => {
  return socketService.initialize(server);
};

export default socketService;
