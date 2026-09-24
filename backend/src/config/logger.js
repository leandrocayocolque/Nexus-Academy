import { randomUUID } from 'node:crypto';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { entorno } from './env.js';

const redaccion = Object.freeze({
  paths: [
    'req.headers.authorization',
    'req.headers.cookie',
    'res.headers["set-cookie"]',
    '*.contrasena',
    '*.hashContrasena',
    '*.token',
    '*.hashToken',
    '*.jwt',
    '*.secreto',
    '*.apiKey',
    '*.apiSecret',
    '*.smtpPassword',
    'password',
    'passwordHash',
    'accessToken',
    'refreshToken'
  ],
  censor: '[DATO_PROTEGIDO]'
});

export const registro = pino({
  name: 'nexus-api',
  level: entorno.nivelRegistro,
  redact: redaccion,
  base: { servicio: 'nexus-api', ambiente: entorno.ambiente }
});

export const middlewareRegistroHttp = pinoHttp({
  logger: registro,
  redact: redaccion,
  genReqId(solicitud, respuesta) {
    const idExistente = solicitud.headers['x-request-id'];
    const id =
      typeof idExistente === 'string' && idExistente.length <= 128 ? idExistente : randomUUID();
    respuesta.setHeader('X-Request-Id', id);
    return id;
  },
  customLogLevel(_solicitud, respuesta, error) {
    if (error || respuesta.statusCode >= 500) return 'error';
    if (respuesta.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: () => 'Solicitud completada',
  customErrorMessage: () => 'Solicitud finalizada con error',
  quietReqLogger: true,
  quietResLogger: true
});

export const logger = registro;
export const loggerMiddleware = middlewareRegistroHttp;
