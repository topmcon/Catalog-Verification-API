import winston from 'winston';
import path from 'path';
import fs from 'fs';
import config from '../config';

// Ensure logs directory exists
const logsDir = config.logging.filePath;
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom timestamp formatter for EST timezone
const estTimestamp = winston.format((info) => {
  const date = new Date();
  // Convert to EST (UTC-5)
  const estDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const year = estDate.getFullYear();
  const month = String(estDate.getMonth() + 1).padStart(2, '0');
  const day = String(estDate.getDate()).padStart(2, '0');
  const hours = String(estDate.getHours()).padStart(2, '0');
  const minutes = String(estDate.getMinutes()).padStart(2, '0');
  const seconds = String(estDate.getSeconds()).padStart(2, '0');
  info.timestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds} EST`;
  return info;
});

const logFormat = winston.format.combine(
  estTimestamp(),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    if (stack) {
      log += `\n${stack}`;
    }
    return log;
  })
);

const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { service: 'catalog-verification' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      ),
    }),
    // File transport for errors
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
    }),
    // File transport for all logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
    }),
  ],
});

// Create a stream for Morgan HTTP logging
export const httpLogStream = {
  write: (message: string): void => {
    logger.info(message.trim());
  },
};

export default logger;
