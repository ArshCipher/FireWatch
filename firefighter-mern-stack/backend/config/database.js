/**
 * 🔥 Database Configuration - MongoDB Connection
 * 
 * Handles MongoDB connection with proper error handling and reconnection logic
 * Optimized for production deployment with connection pooling
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/firefighter_monitoring';
    
    const options = {
      // Connection settings
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
      
      // Write concern
      writeConcern: {
        w: 'majority',
        j: true,
        wtimeout: 1000
      },
      
      // Read preference
      readPreference: 'primary'
    };

    // Connect to MongoDB
    const connection = await mongoose.connect(mongoUri, options);
    
    console.log(`
🔥 MongoDB Connected Successfully
🗄️  Database: ${connection.connection.name}
🌐 Host: ${connection.connection.host}:${connection.connection.port}
⚡ Ready State: ${connection.connection.readyState === 1 ? 'Connected' : 'Connecting'}
    `);

    // Connection event listeners
    mongoose.connection.on('connected', () => {
      console.log('📡 Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('📴 Mongoose disconnected from MongoDB');
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed through app termination');
      process.exit(0);
    });

    return connection;

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    
    // Log additional error details in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Full error details:', error);
    }
    
    // Exit process with failure
    process.exit(1);
  }
};

// Database health check function
export const checkDatabaseHealth = async () => {
  try {
    const state = mongoose.connection.readyState;
    const stateMap = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    return {
      status: stateMap[state] || 'unknown',
      readyState: state,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
      collections: mongoose.connection.collections ? Object.keys(mongoose.connection.collections).length : 0
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
};

// Graceful shutdown function
export const closeDatabaseConnection = async () => {
  try {
    await mongoose.connection.close();
    console.log('✅ Database connection closed gracefully');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
};

export { connectDatabase };
export default connectDatabase;
