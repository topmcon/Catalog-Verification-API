"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connect = connect;
exports.disconnect = disconnect;
exports.healthCheck = healthCheck;
exports.isConnectedToDatabase = isConnectedToDatabase;
exports.getStats = getStats;
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = __importDefault(require("../config"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Database Service
 * Handles MongoDB connection and operations
 */
let isConnected = false;
/**
 * Connect to MongoDB
 */
async function connect() {
    if (isConnected) {
        logger_1.default.debug('Using existing MongoDB connection');
        return;
    }
    try {
        logger_1.default.info('Connecting to MongoDB...', { uri: config_1.default.mongodb.uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') });
        mongoose_1.default.set('strictQuery', false);
        await mongoose_1.default.connect(config_1.default.mongodb.uri, {
            dbName: config_1.default.mongodb.dbName,
        });
        isConnected = true;
        logger_1.default.info('MongoDB connected successfully', { dbName: config_1.default.mongodb.dbName });
        // Handle connection events
        mongoose_1.default.connection.on('error', (error) => {
            logger_1.default.error('MongoDB connection error', { error: error.message });
            isConnected = false;
        });
        mongoose_1.default.connection.on('disconnected', () => {
            logger_1.default.warn('MongoDB disconnected');
            isConnected = false;
        });
        mongoose_1.default.connection.on('reconnected', () => {
            logger_1.default.info('MongoDB reconnected');
            isConnected = true;
        });
    }
    catch (error) {
        isConnected = false;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger_1.default.error('Failed to connect to MongoDB', { error: errorMessage });
        throw new Error(`MongoDB connection failed: ${errorMessage}`);
    }
}
/**
 * Disconnect from MongoDB
 */
async function disconnect() {
    if (!isConnected) {
        return;
    }
    try {
        await mongoose_1.default.disconnect();
        isConnected = false;
        logger_1.default.info('MongoDB disconnected');
    }
    catch (error) {
        logger_1.default.error('Error disconnecting from MongoDB', { error });
    }
}
/**
 * Check MongoDB connection health
 */
async function healthCheck() {
    const startTime = Date.now();
    try {
        if (!isConnected || mongoose_1.default.connection.readyState !== 1) {
            return {
                status: 'down',
                error: 'Not connected',
            };
        }
        // Ping the database
        await mongoose_1.default.connection.db?.admin().ping();
        return {
            status: 'up',
            latencyMs: Date.now() - startTime,
        };
    }
    catch (error) {
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
function isConnectedToDatabase() {
    return isConnected && mongoose_1.default.connection.readyState === 1;
}
/**
 * Get MongoDB stats
 */
async function getStats() {
    const db = mongoose_1.default.connection.db;
    if (!db) {
        throw new Error('Database not connected');
    }
    const collections = await db.listCollections().toArray();
    const documents = {};
    for (const collection of collections) {
        const count = await db.collection(collection.name).countDocuments();
        documents[collection.name] = count;
    }
    return {
        collections: collections.length,
        documents,
    };
}
exports.default = {
    connect,
    disconnect,
    healthCheck,
    isConnectedToDatabase,
    getStats,
};
//# sourceMappingURL=database.service.js.map