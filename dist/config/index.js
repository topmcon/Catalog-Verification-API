"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '.env') });
const config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/catalog-verification',
        dbName: process.env.MONGODB_DB_NAME || 'catalog-verification',
    },
    openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4096', 10),
    },
    xai: {
        apiKey: process.env.XAI_API_KEY || '',
        apiUrl: process.env.XAI_API_URL || 'https://api.x.ai/v1',
        model: process.env.XAI_MODEL || 'grok-beta',
    },
    salesforce: {
        loginUrl: process.env.SALESFORCE_LOGIN_URL || 'https://login.salesforce.com',
        clientId: process.env.SALESFORCE_CLIENT_ID || '',
        clientSecret: process.env.SALESFORCE_CLIENT_SECRET || '',
        username: process.env.SALESFORCE_USERNAME || '',
        password: process.env.SALESFORCE_PASSWORD || '',
        securityToken: process.env.SALESFORCE_SECURITY_TOKEN || '',
    },
    aiConsensus: {
        threshold: parseFloat(process.env.AI_CONSENSUS_THRESHOLD || '0.9'),
        maxRetries: parseInt(process.env.AI_MAX_RETRIES || '3', 10),
        retryDelayMs: parseInt(process.env.AI_RETRY_DELAY_MS || '1000', 10),
    },
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    },
    batch: {
        size: parseInt(process.env.BATCH_SIZE || '100', 10),
        delayMs: parseInt(process.env.BATCH_DELAY_MS || '500', 10),
    },
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        filePath: process.env.LOG_FILE_PATH || './logs',
    },
    security: {
        apiKeyHeader: process.env.API_KEY_HEADER || 'x-api-key',
        webhookSecret: process.env.WEBHOOK_SECRET || '',
    },
};
exports.default = config;
// Re-export master category attributes
__exportStar(require("./master-category-attributes"), exports);
//# sourceMappingURL=index.js.map