"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpLogStream = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const config_1 = __importDefault(require("../config"));
// Ensure logs directory exists
const logsDir = config_1.default.logging.filePath;
if (!fs_1.default.existsSync(logsDir)) {
    fs_1.default.mkdirSync(logsDir, { recursive: true });
}
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (Object.keys(meta).length > 0) {
        log += ` ${JSON.stringify(meta)}`;
    }
    if (stack) {
        log += `\n${stack}`;
    }
    return log;
}));
const logger = winston_1.default.createLogger({
    level: config_1.default.logging.level,
    format: logFormat,
    defaultMeta: { service: 'catalog-verification' },
    transports: [
        // Console transport
        new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.colorize(), logFormat),
        }),
        // File transport for errors
        new winston_1.default.transports.File({
            filename: path_1.default.join(logsDir, 'error.log'),
            level: 'error',
        }),
        // File transport for all logs
        new winston_1.default.transports.File({
            filename: path_1.default.join(logsDir, 'combined.log'),
        }),
    ],
});
// Create a stream for Morgan HTTP logging
exports.httpLogStream = {
    write: (message) => {
        logger.info(message.trim());
    },
};
exports.default = logger;
//# sourceMappingURL=logger.js.map