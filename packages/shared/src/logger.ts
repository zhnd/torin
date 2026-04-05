import type { Logger } from 'pino';
import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';
const level = process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'info');

export const loggerConfig: pino.LoggerOptions = {
  level,
  ...(isDev
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss.l',
            ignore: 'pid,hostname',
          },
        },
      }
    : {}),
};

export const logger: Logger = pino(loggerConfig);

export function createLogger(
  name: string,
  context?: Record<string, unknown>
): Logger {
  return logger.child({ module: name, ...context });
}

export type { Logger } from 'pino';
