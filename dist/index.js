"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const config_1 = __importDefault(require("./config"));
const services_1 = require("./services");
const logger_1 = __importDefault(require("./utils/logger"));
/**
 * Application Entry Point
 * Build version: 2026-01-09-v2 (text cleaner with brand corrections)
 */
async function main() {
    try {
        // Connect to database
        logger_1.default.info('Starting Catalog Verification API...');
        await services_1.databaseService.connect();
        // Create and start Express app
        const app = (0, app_1.createApp)();
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
            // Force shutdown after 30 seconds
            setTimeout(() => {
                logger_1.default.error('Forced shutdown due to timeout');
                process.exit(1);
            }, 30000);
        };
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
        // Handle uncaught exceptions
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
main();
//# sourceMappingURL=index.js.map