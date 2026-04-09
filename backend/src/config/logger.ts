import { env } from './env';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const formatMessage = (level: LogLevel, message: string, meta?: Record<string, unknown>) => {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(),
    env: env.nodeEnv,
    message,
    ...meta
  });
};

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    console.log(formatMessage('info', message, meta));
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    console.warn(formatMessage('warn', message, meta));
  },
  error: (message: string, meta?: Record<string, unknown>) => {
    console.error(formatMessage('error', message, meta));
  },
  debug: (message: string, meta?: Record<string, unknown>) => {
    if (env.nodeEnv !== 'production') {
      console.debug(formatMessage('debug', message, meta));
    }
  }
};
