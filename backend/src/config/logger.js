import pino from 'pino';
import pinoHttp from 'pino-http';
import { env } from './env.js';

const redact = {
  paths: [
    'req.headers.authorization',
    'req.headers.cookie',
    'res.headers["set-cookie"]',
    'password',
    'passwordHash',
    'token',
    'tokenHash',
    'accessToken',
    'refreshToken'
  ],
  censor: '[REDACTED]'
};

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (env.nodeEnv === 'test' ? 'silent' : 'info'),
  redact
});

export const loggerMiddleware = pinoHttp({
  logger,
  redact,
  customProps: () => ({ service: 'nexus-api' })
});
