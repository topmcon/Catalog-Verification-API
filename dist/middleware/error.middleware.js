"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = void 0;
exports.errorHandler = errorHandler;
exports.notFoundHandler = notFoundHandler;
exports.asyncHandler = asyncHandler;
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Custom API Error Class
 */
class ApiError extends Error {
    statusCode;
    code;
    details;
    constructor(statusCode, code, message, details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.name = 'ApiError';
    }
}
exports.ApiError = ApiError;
/**
 * Error Handler Middleware
 */
function errorHandler(error, req, res, _next) {
    // Log the error
    logger_1.default.error('Request error', {
        method: req.method,
        path: req.path,
        error: error.message,
        stack: error.stack,
    });
    // Handle ApiError
    if (error instanceof ApiError) {
        res.status(error.statusCode).json({
            success: false,
            error: {
                code: error.code,
                message: error.message,
                details: error.details,
            },
            timestamp: new Date().toISOString(),
        });
        return;
    }
    // Handle validation errors (Joi)
    if (error.name === 'ValidationError') {
        res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: error.message,
            },
            timestamp: new Date().toISOString(),
        });
        return;
    }
    // Handle MongoDB errors
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
        res.status(500).json({
            success: false,
            error: {
                code: 'DATABASE_ERROR',
                message: 'Database operation failed',
            },
            timestamp: new Date().toISOString(),
        });
        return;
    }
    // Handle unknown errors
    res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: process.env.NODE_ENV === 'production'
                ? 'An unexpected error occurred'
                : error.message,
        },
        timestamp: new Date().toISOString(),
    });
}
/**
 * Not Found Handler
 */
function notFoundHandler(req, res) {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `Route ${req.method} ${req.path} not found`,
        },
        timestamp: new Date().toISOString(),
    });
}
/**
 * Async Handler Wrapper
 * Wraps async route handlers to catch errors
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
exports.default = {
    errorHandler,
    notFoundHandler,
    asyncHandler,
    ApiError,
};
//# sourceMappingURL=error.middleware.js.map