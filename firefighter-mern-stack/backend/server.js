/**
 * 🔥 Firefighter Physiological Monitoring System - MERN Stack Server
 * 
 * Production-ready Node.js Express server with MVC architecture
 * Real-time monitoring with WebSocket support
 * 
 * Features:
 * - MVC Architecture Pattern
 * - Real-time physiological data processing
 * - Evidence-based alerting system
 * - MongoDB with Mongoose ODM
 * - Redis caching for performance
 * - Socket.IO for real-time updates
 * - Comprehensive security middleware
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import configurations
import { connectDatabase } from './config/database.js';
import { connectRedis } from './config/redis.js';

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { authMiddleware } from './middleware/auth.js';
import { requestLogger } from './middleware/logger.js';

// Import routes (MVC Pattern)
import firefighterRoutes from './routes/firefighterRoutes.js';
import sensorDataRoutes from './routes/sensorDataRoutes.js';
import simulationRoutes from './routes/simulationRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import authRoutes from './routes/authRoutes.js';
import monitoringRoutes from './routes/monitoringRoutes.js';
import systemRoutes from './routes/systemRoutes.js';

// Import services for real-time features
import { initializeSocketHandlers } from './services/socketService.js';
import { startDataProcessingService } from './services/dataProcessingService.js';
import { startAlertService } from './services/alertService.js';
import { startMonitoringService } from './services/monitoringService.js';

// Load environment variables
dotenv.config();

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// Socket.IO setup with CORS
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003"];

const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Constants
const PORT = process.env.PORT || 3004;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Trust proxy for production deployments
if (NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: NODE_ENV === 'production' ? 100 : 5000, // Much higher limit for development
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// CORS configuration
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(requestLogger);

// Store Socket.IO instance for access in controllers
app.set('socketio', io);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: process.env.npm_package_version || '2.0.0'
  });
});

// API Routes (MVC Pattern)
app.use('/api/auth', authRoutes);
app.use('/api/firefighters', firefighterRoutes);
app.use('/api/sensor-data', sensorDataRoutes);
app.use('/api/simulations', simulationRoutes);  // Changed to plural to match frontend calls
app.use('/api/alerts', alertRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/system', systemRoutes);

// Serve static files in production
if (NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
  });
}

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize services and start server
async function startServer() {
  try {
    // Connect to databases
    await connectDatabase();
    await connectRedis();
    
    // Initialize real-time services
    initializeSocketHandlers(io);
    startDataProcessingService(io);
    startAlertService(io);
    startMonitoringService(io);
    
    // Start server
    server.listen(PORT, () => {
      console.log(`
🔥 Firefighter Monitoring System Server Started
🌐 Environment: ${NODE_ENV}
🚀 Server running on port ${PORT}
📊 Health check: http://localhost:${PORT}/api/health
🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}
      `);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('📴 SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Process terminated');
  });
});

// Start the server
startServer();

export default app;
