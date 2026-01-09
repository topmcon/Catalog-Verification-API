"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiKeyAuth = apiKeyAuth;
exports.verifySalesforceWebhook = verifySalesforceWebhook;
exports.requestLogger = requestLogger;
exports.attachRequestId = attachRequestId;
const crypto_1 = __importDefault(require("crypto"));
const config_1 = __importDefault(require("../config"));
const error_middleware_1 = require("./error.middleware");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * API Key Authentication Middleware
 */
function apiKeyAuth(req, _res, next) {
    const apiKey = req.headers[config_1.default.security.apiKeyHeader.toLowerCase()];
    if (!apiKey) {
        throw new error_middleware_1.ApiError(401, 'UNAUTHORIZED', 'API key is required');
    }
    // In production, validate against stored API keys
    // For now, check against webhook secret
    if (apiKey !== config_1.default.security.webhookSecret) {
        logger_1.default.warn('Invalid API key attempt', {
            ip: req.ip,
            path: req.path,
        });
        throw new error_middleware_1.ApiError(403, 'FORBIDDEN', 'Invalid API key');
    }
    next();
}
/**
 * Salesforce Webhook Signature Verification
 * Validates that the request came from Salesforce
 */
function verifySalesforceWebhook(req, _res, next) {
    const signature = req.headers['x-salesforce-signature'];
    // Skip verification in development if no signature provided
    if (config_1.default.env === 'development' && !signature) {
        logger_1.default.debug('Skipping Salesforce webhook verification in development');
        next();
        return;
    }
    if (!signature) {
        throw new error_middleware_1.ApiError(401, 'UNAUTHORIZED', 'Salesforce signature is required');
    }
    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto_1.default
        .createHmac('sha256', config_1.default.security.webhookSecret)
        .update(payload)
        .digest('hex');
    if (signature !== expectedSignature) {
        logger_1.default.warn('Invalid Salesforce webhook signature', {
            ip: req.ip,
            path: req.path,
        });
        throw new error_middleware_1.ApiError(403, 'FORBIDDEN', 'Invalid webhook signature');
    }
    next();
}
/**
 * Request Logger Middleware
 */
function requestLogger(req, res, next) {
    const startTime = Date.now();
    // Log request
    logger_1.default.info('Incoming request', {
        method: req.method,
        path: req.path,
        query: req.query,
        ip: req.ip,
        userAgent: req.get('user-agent'),
    });
    // Log response when finished
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        logger_1.default.info('Request completed', {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
        });
    });
    next();
}
/**
 * Attach request ID middleware
 */
function attachRequestId(req, _res, next) {
    req.id = req.headers['x-request-id'] || crypto_1.default.randomUUID();
    next();
}
exports.default = {
    apiKeyAuth,
    verifySalesforceWebhook,
    requestLogger,
    attachRequestId,
};
//# sourceMappingURL=auth.middleware.js.map