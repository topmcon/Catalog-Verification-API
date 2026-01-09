"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
exports.default = handler;
const app_1 = require("./app");
const config_1 = __importDefault(require("./config"));
const services_1 = require("./services");
const logger_1 = __importDefault(require("./utils/logger"));
/**
 * Application Entry Point
 * Build version: 2026-01-09-v3 (Vercel serverless compatible)
 *
 * Supports both:
 * - Vercel serverless: exports handler, lazy DB connection
 * - Traditional server: npm start runs main()
 */
// Create Express app (always available)
const app = (0, app_1.createApp)();
exports.app = app;
// Database connection state for serverless
let dbConnected = false;
/**
 * Ensure database is connected (for serverless cold starts)
 */
async function ensureDbConnected() {
    if (!dbConnected && process.env.MONGODB_URI) {
        try {
            await services_1.databaseService.connect();
            dbConnected = true;
        }
        catch (error) {
            logger_1.default.error('Database connection failed', { error });
            // Continue without DB - some routes may still work
        }
    }
}
/**
 * Vercel Serverless Handler
 * Exported for Vercel to use as the request handler
 */
async function handler(req, res) {
    await ensureDbConnected();
    return app(req, res);
}
/**
 * Traditional Server Mode
 * Only runs when executed directly (not imported by Vercel)
 */
async function main() {
    try {
        logger_1.default.info('Starting Catalog Verification API...');
        await services_1.databaseService.connect();
        dbConnected = true;
        const server = app.listen(config_1.default.port, () => {
            logger_1.default.info(`Server started on port ${config_1.default.port}`, {
                environment: config_1.default.env,
                port: config_1.default.port,
                apiBaseUrl: config_1.default.apiBaseUrl,
            });
        });
        // Graceful shutdown handling
        const shutdown = async (signal) => {
            logger_1.default.info(`${signal} received, shutting down gracefully...`);
            server.close(async () => {
                logger_1.default.info('HTTP server closed');
                try {
                    await services_1.databaseService.disconnect();
                    logger_1.default.info('Database connection closed');
                    process.exit(0);
                }
                catch (error) {
                    logger_1.default.error('Error during shutdown', { error });
                    process.exit(1);
                }
            });
            setTimeout(() => {
                logger_1.default.error('Forced shutdown due to timeout');
                process.exit(1);
            }, 30000);
        };
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('uncaughtException', (error) => {
            logger_1.default.error('Uncaught Exception', { error: error.message, stack: error.stack });
            process.exit(1);
        });
        process.on('unhandledRejection', (reason) => {
            logger_1.default.error('Unhandled Rejection', { reason });
            process.exit(1);
        });
    }
    catch (error) {
        logger_1.default.error('Failed to start server', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        process.exit(1);
    }
}
// Only start server if running directly (not in Vercel serverless)
// Vercel sets VERCEL=1 environment variable
if (!process.env.VERCEL) {
    main();
}
//# sourceMappingURL=index.js.map