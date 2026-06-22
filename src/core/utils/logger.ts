/**
 * Structured logger built on Pino.
 *
 * Emits JSON logs with correlation metadata — compatible with
 * log aggregation tools (Loki, Datadog, CloudWatch).
 *
 * @module utils/logger
 */

import pino, { type Logger } from 'pino';

export interface LoggerContext {
  module?: string;
  service?: string;
  correlationId?: string;
  [key: string]: unknown;
}

/**
 * Create a logger instance with optional context.
 *
 * @param context - Metadata automatically appended to every log line
 * @returns A configured Pino logger
 *
 * @example
 *   const log = getLogger({ module: 'OrderProcessor' });
 *   log.info({ count: 10 }, 'Orders processed');
 */
export function getLogger(context: LoggerContext = {}): Logger {
  const isProduction = process.env.NODE_ENV === 'production';
  const logLevel = process.env.LOG_LEVEL ?? (isProduction ? 'info' : 'debug');

  const transport = isProduction
    ? undefined // JSON output for production
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:HH:MM:ss.l',
          ignore: 'pid,hostname',
        },
      };

  return pino({
    level: logLevel,
    name: 'flowgate',
    base: {
      service: 'flowgate-automation',
      ...context,
    },
    transport,
    serializers: {
      err: pino.stdSerializers.err,
      error: pino.stdSerializers.err,
    },
    redact: {
      paths: ['password', 'token', 'secret', 'authorization'],
      censor: '[REDACTED]',
    },
  });
}

/**
 * Default logger instance for the application.
 */
export const logger = getLogger();
