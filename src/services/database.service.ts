import mongoose from 'mongoose';
import config from '../config';
import logger from '../utils/logger';

/**
 * Database Service
 * Handles MongoDB connection and operations
 */

let isConnected = false;

/**
 * Connect to MongoDB
 */
export async function connect(): Promise<void> {
  if (isConnected) {
    logger.debug('Using existing MongoDB connection');
    return;
  }

  try {
    logger.info('Connecting to MongoDB...', { uri: config.mongodb.uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') });

    mongoose.set('strictQuery', false);

    await mongoose.connect(config.mongodb.uri, {
      dbName: config.mongodb.dbName,
    });

    isConnected = true;
    logger.info('MongoDB connected successfully', { dbName: config.mongodb.dbName });

    // Handle connection events
    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error', { error: error.message });
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
      isConnected = true;
    });

  } catch (error) {
    isConnected = false;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to connect to MongoDB', { error: errorMessage });
    throw new Error(`MongoDB connection failed: ${errorMessage}`);
  }
}

/**
 * Disconnect from MongoDB
 */
export async function disconnect(): Promise<void> {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB disconnected');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB', { error });
  }
}

/**
 * Check MongoDB connection health
 */
export async function healthCheck(): Promise<{
  status: 'up' | 'down';
  latencyMs?: number;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    if (!isConnected || mongoose.connection.readyState !== 1) {
      return {
        status: 'down',
        error: 'Not connected',
      };
    }

    // Ping the database
    await mongoose.connection.db?.admin().ping();

    return {
      status: 'up',
      latencyMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      status: 'down',
      latencyMs: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get connection status
 */
export function isConnectedToDatabase(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

/**
 * Get MongoDB stats
 */
export async function getStats(): Promise<{
  collections: number;
  documents: Record<string, number>;
}> {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database not connected');
  }

  const collections = await db.listCollections().toArray();
  const documents: Record<string, number> = {};

  for (const collection of collections) {
    const count = await db.collection(collection.name).countDocuments();
    documents[collection.name] = count;
  }

  return {
    collections: collections.length,
    documents,
  };
}

export default {
  connect,
  disconnect,
  healthCheck,
  isConnectedToDatabase,
  getStats,
};
