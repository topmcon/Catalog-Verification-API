"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
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
    if (mongoose_1.default.connection.readyState !== 0) {
        await mongoose_1.default.disconnect();
    }
});
//# sourceMappingURL=setup.js.map