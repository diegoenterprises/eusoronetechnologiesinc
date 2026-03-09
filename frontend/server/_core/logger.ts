/**
 * Centralized Logger — Winston-based structured logging
 * Replaces raw console.log/error/warn across the server codebase.
 *
 * Usage:
 *   import { logger } from "../_core/logger";
 *   logger.info("[Router] message", { key: "value" });
 *   logger.warn("[Service] warning");
 *   logger.error("[DB] error", error);
 */

import winston from "winston";

const { combine, timestamp, printf, colorize, errors } = winston.format;

const serverFormat = printf(({ level, message, timestamp: ts, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
  if (stack) return `${ts} [${level}] ${message}\n${stack}${metaStr}`;
  return `${ts} [${level}] ${message}${metaStr}`;
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "warn" : "info"),
  format: combine(
    errors({ stack: true }),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    serverFormat,
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        errors({ stack: true }),
        timestamp({ format: "HH:mm:ss" }),
        serverFormat,
      ),
    }),
  ],
  // Don't exit on uncaught exceptions — let the process manager handle it
  exitOnError: false,
});

// In production, also log errors to a file if LOG_FILE is set
if (process.env.LOG_FILE) {
  logger.add(
    new winston.transports.File({
      filename: process.env.LOG_FILE,
      level: "error",
      maxsize: 10 * 1024 * 1024, // 10 MB
      maxFiles: 5,
    }),
  );
}
