/**
 * 🔥 Redis Configuration - Caching and Session Management
 * 
 * Handles Redis connection for caching, session storage, and real-time data
 * Provides fallback mechanisms when Redis is unavailable
 */

import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

// Redis configuration
const redisConfig = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  password: process.env.REDIS_PASSWORD || undefined,
  database: parseInt(process.env.REDIS_DB) || 0,
  retryDelayOnFailover: 100,
  retryDelayOnClusterDown: 300,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true
};

// Create Redis client
let redisClient = null;
let isRedisConnected = false;

// In-memory cache fallback when Redis is unavailable
const memoryCache = new Map();
const MEMORY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const connectRedis = async () => {
  try {
    // Check if Redis should be disabled
    if (process.env.DISABLE_REDIS === 'true') {
      console.log('⚠️  Redis disabled by environment variable - using memory cache fallback');
      return null;
    }

    console.log('🔄 Attempting to connect to Redis...');
    
    redisClient = createClient({
      ...redisConfig,
      socket: {
        reconnectStrategy: (retries) => {
          // Stop trying after 3 attempts
          if (retries > 3) {
            console.log('❌ Redis connection failed after 3 attempts - using memory cache fallback');
            isRedisConnected = false;
            return false; // Stop reconnecting
          }
          return Math.min(retries * 50, 3000);
        }
      }
    });
    
    // Error handling - don't spam reconnections
    redisClient.on('error', (err) => {
      if (!err.message.includes('ECONNREFUSED')) {
        console.error('❌ Redis Client Error:', err.message);
      }
      isRedisConnected = false;
    });
    
    redisClient.on('connect', () => {
      console.log('🔗 Redis client connecting...');
    });
    
    redisClient.on('ready', () => {
      console.log('✅ Redis client connected and ready!');
      isRedisConnected = true;
    });
    
    redisClient.on('end', () => {
      console.log('📴 Redis client disconnected');
      isRedisConnected = false;
    });
    
    // Remove the verbose reconnecting handler
    // redisClient.on('reconnecting', () => {
    //   console.log('🔄 Redis client reconnecting...');
    // });
    
    // Connect to Redis with timeout
    const connectPromise = redisClient.connect();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout')), 5000)
    );
    
    await Promise.race([connectPromise, timeoutPromise]);
    
    // Test connection
    await redisClient.ping();
    
    console.log(`
🔥 Redis Connected Successfully
🌐 URL: ${redisConfig.url}
💾 Database: ${redisConfig.database}
⚡ Status: Ready for caching operations
    `);
    
    return redisClient;
    
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
    console.log('📝 Falling back to in-memory cache...');
    
    // Fallback to memory cache
    isRedisConnected = false;
    redisClient = null;
    
    // Don't throw error - allow app to continue with memory cache
    return null;
  }
};

// Cache interface that works with both Redis and memory fallback
const cache = {
  async get(key) {
    try {
      if (isRedisConnected && redisClient) {
        const value = await redisClient.get(key);
        return value ? JSON.parse(value) : null;
      } else {
        // Memory cache fallback
        const item = memoryCache.get(key);
        if (item && item.expiry > Date.now()) {
          return item.value;
        } else {
          memoryCache.delete(key);
          return null;
        }
      }
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },
  
  async set(key, value, ttlSeconds = 300) {
    try {
      if (isRedisConnected && redisClient) {
        await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
      } else {
        // Memory cache fallback
        const expiry = Date.now() + (ttlSeconds * 1000);
        memoryCache.set(key, { value, expiry });
        
        // Clean up expired entries periodically
        setTimeout(() => {
          const item = memoryCache.get(key);
          if (item && item.expiry <= Date.now()) {
            memoryCache.delete(key);
          }
        }, ttlSeconds * 1000);
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  },
  
  async del(key) {
    try {
      if (isRedisConnected && redisClient) {
        await redisClient.del(key);
      } else {
        memoryCache.delete(key);
      }
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  },
  
  async exists(key) {
    try {
      if (isRedisConnected && redisClient) {
        return await redisClient.exists(key) === 1;
      } else {
        const item = memoryCache.get(key);
        return item && item.expiry > Date.now();
      }
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  },
  
  async flush() {
    try {
      if (isRedisConnected && redisClient) {
        await redisClient.flushDb();
      } else {
        memoryCache.clear();
      }
    } catch (error) {
      console.error('Cache flush error:', error);
    }
  },
  
  async keys(pattern = '*') {
    try {
      if (isRedisConnected && redisClient) {
        return await redisClient.keys(pattern);
      } else {
        // Simple pattern matching for memory cache
        const allKeys = Array.from(memoryCache.keys());
        if (pattern === '*') {
          return allKeys;
        }
        // Basic pattern matching (you can enhance this)
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return allKeys.filter(key => regex.test(key));
      }
    } catch (error) {
      console.error('Cache keys error:', error);
      return [];
    }
  }
};

// Health check function
const checkRedisHealth = async () => {
  try {
    if (isRedisConnected && redisClient) {
      await redisClient.ping();
      return {
        status: 'connected',
        type: 'redis',
        url: redisConfig.url,
        database: redisConfig.database
      };
    } else {
      return {
        status: 'fallback',
        type: 'memory',
        entries: memoryCache.size,
        message: 'Using in-memory cache fallback'
      };
    }
  } catch (error) {
    return {
      status: 'error',
      type: 'unknown',
      error: error.message
    };
  }
};

// Graceful shutdown
const closeRedisConnection = async () => {
  try {
    if (redisClient) {
      await redisClient.quit();
      console.log('✅ Redis connection closed gracefully');
    }
    memoryCache.clear();
  } catch (error) {
    console.error('❌ Error closing Redis connection:', error);
  }
};

// Session store for Express (if needed)
const createSessionStore = () => {
  if (isRedisConnected && redisClient) {
    // Return Redis session store (you can implement this if needed)
    return null;
  }
  return null; // Use default memory store
};

export {
  connectRedis,
  cache,
  checkRedisHealth,
  closeRedisConnection,
  createSessionStore,
  redisClient
};

export default connectRedis;
