
import { type NextRequest } from 'next/server';

const isDev = process.env.NODE_ENV === 'development';

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
  debug: (message: string, metadata?: Record<string, unknown>) => {
    if (isDev) console.debug(formatJsonLog(message, metadata));
  },

  info: (message: string, metadata?: Record<string, unknown>) => {
    console.info(formatJsonLog(message, metadata));
  },

  warn: (message: string, metadata?: Record<string, unknown>, error?: unknown) => {
    console.warn(formatJsonLog(message, metadata, error));
  },

  error: (message: string, error?: unknown, metadata?: Record<string, unknown>) => {
    console.error(formatJsonLog(message, metadata, error));
  },
};
