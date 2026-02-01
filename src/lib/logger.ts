/**
 * Centralized logger utility
 * Environment-aware logging with consistent formatting
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  /**
   * Debug level - only shows in development
   */
  debug: (message: string, ...args: unknown[]) => {
    if (isDev) console.debug(`[DEBUG] ${message}`, ...args);
  },

  /**
   * Info level - only shows in development
   */
  info: (message: string, ...args: unknown[]) => {
    if (isDev) console.info(`[INFO] ${message}`, ...args);
  },

  /**
   * Warning level - always shows
   */
  warn: (message: string, ...args: unknown[]) => {
    console.warn(`[WARN] ${message}`, ...args);
  },

  /**
   * Error level - always shows
   */
  error: (message: string, error?: unknown) => {
    console.error(`[ERROR] ${message}`, error);
    // Future: integrate with error tracking service (e.g., Sentry)
  },
};
