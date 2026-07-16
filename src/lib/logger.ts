/**
 * Centralized logger utility
 * Environment-aware logging with consistent formatting for OpenTelemetry (JSON)
 */

import { type NextRequest } from 'next/server';

const isDev = process.env.NODE_ENV === 'development';

/**
 * Extracts safe, non-sensitive metadata from NextRequest.
 * Avoids logging full headers or body which might contain PII or tokens.
 */
export function extractRequestMetadata(req: NextRequest) {
  try {
    return {
      http: {
        method: req.method,
        url: req.url,
        ip: req.headers.get('x-forwarded-for') ?? undefined,
        user_agent: req.headers.get('user-agent') ?? undefined,
      }
    };
  } catch {
    return {};
  }
}

/**
 * Safely stringifies log payload into JSON.
 * Extracts enumerable properties and error stack traces.
 */
function formatJsonLog(message: string, metadata?: Record<string, unknown>, error?: unknown) {
  const payload: Record<string, unknown> = { message, ...metadata };

  if (error instanceof Error) {
    payload.error = {
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
  } else if (error !== undefined) {
    payload.error = error;
  }

  return JSON.stringify(payload);
}

export const logger = {
  /**
   * Debug level - only shows in development
   */
  debug: (message: string, metadata?: Record<string, unknown>) => {
    if (isDev) console.debug(formatJsonLog(message, metadata));
  },

  /**
   * Info level
   */
  info: (message: string, metadata?: Record<string, unknown>) => {
    console.info(formatJsonLog(message, metadata));
  },

  /**
   * Warning level
   */
  warn: (message: string, metadata?: Record<string, unknown>, error?: unknown) => {
    console.warn(formatJsonLog(message, metadata, error));
  },

  /**
   * Error level - strictly formats errors for OpenObserve
   */
  error: (message: string, error?: unknown, metadata?: Record<string, unknown>) => {
    console.error(formatJsonLog(message, metadata, error));
  },
};
