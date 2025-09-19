import { NextFunction, Request, Response } from 'express';
import path from 'path';
import winston from 'winston';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston about the colors
winston.addColors(colors);

// Define the format for logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info: any) => `${info.timestamp} ${info.level}: ${info.message}`),
);

// Define transports
const transports = [
  // Console transport for development
  new winston.transports.Console({
    format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
  }),

  // Error log file
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'error.log'),
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    ),
  }),

  // All logs file
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'all.log'),
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  }),

  // HTTP requests log file
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'http.log'),
    level: 'http',
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  }),
];

// Create the logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format,
  transports,
});

// HTTP request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  // Log request
  logger.http(
    `${req.method} ${req.originalUrl} - ${req.ip} - ${req.get('User-Agent') || 'Unknown'}`,
  );

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const statusMessage = res.statusMessage || '';

    if (statusCode >= 400) {
      logger.warn(
        `${req.method} ${req.originalUrl} - ${statusCode} ${statusMessage} - ${duration}ms`,
      );
    } else {
      logger.info(
        `${req.method} ${req.originalUrl} - ${statusCode} ${statusMessage} - ${duration}ms`,
      );
    }
  });

  next();
};

// Database operation logger
export const logDatabaseOperation = (operation: string, table: string, data?: any) => {
  logger.info(`DB Operation: ${operation} on ${table}`, { data });
};

// Authentication logger
export const logAuth = (action: string, userId?: string, details?: any) => {
  logger.info(`Auth: ${action}${userId ? ` - User: ${userId}` : ''}`, { details });
};

// Payment logger
export const logPayment = (action: string, orderId: string, amount?: number, details?: any) => {
  logger.info(`Payment: ${action} - Order: ${orderId}${amount ? ` - Amount: ${amount}` : ''}`, {
    details,
  });
};

// Error logger (for manual error logging)
export const logError = (error: Error, context?: string, additionalData?: any) => {
  logger.error(`${context ? `${context}: ` : ''}${error.message}`, {
    stack: error.stack,
    ...additionalData,
  });
};

// Performance logger
export const logPerformance = (operation: string, duration: number, details?: any) => {
  logger.info(`Performance: ${operation} - ${duration}ms`, { details });
};

// Create logs directory if it doesn't exist
import fs from 'fs';
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}
