import mongoose from 'mongoose';

// Setup file for Jest tests

// Mock logger before anything else imports it
jest.mock('../utils/logger', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    silly: jest.fn(),
  },
  httpLogStream: {
    write: jest.fn(),
  },
}));

beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/catalog-verification-test';
});

afterAll(async () => {
  // Close database connection
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
});
