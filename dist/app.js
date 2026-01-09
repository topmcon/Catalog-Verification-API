"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const config_1 = __importDefault(require("./config"));
const routes_1 = __importDefault(require("./routes"));
const middleware_1 = require("./middleware");
const logger_1 = require("./utils/logger");
/**
 * Create and configure Express application
 */
function createApp() {
    const app = (0, express_1.default)();
    // Security middleware
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)({
        origin: config_1.default.env === 'production'
            ? process.env.ALLOWED_ORIGINS?.split(',')
            : '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-request-id'],
    }));
    // Rate limiting
    const limiter = (0, express_rate_limit_1.default)({
        windowMs: config_1.default.rateLimit.windowMs,
        max: config_1.default.rateLimit.maxRequests,
        message: {
            success: false,
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many requests, please try again later',
            },
        },
        standardHeaders: true,
        legacyHeaders: false,
    });
    app.use('/api/', limiter);
    // Body parsing
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
    // Request ID and logging
    app.use(middleware_1.attachRequestId);
    app.use(middleware_1.requestLogger);
    // HTTP request logging (Morgan)
    if (config_1.default.env !== 'test') {
        app.use((0, morgan_1.default)('combined', { stream: logger_1.httpLogStream }));
    }
    // Routes
    app.use(routes_1.default);
    // Error handling
    app.use(middleware_1.notFoundHandler);
    app.use(middleware_1.errorHandler);
    return app;
}
exports.default = createApp;
//# sourceMappingURL=app.js.map