import cors from 'cors';
import { entorno } from './env.js';

export function crearMiddlewareCors(origenesPermitidos = entorno.origenesCors) {
  const origenes = new Set(origenesPermitidos);

  return cors({
    origin(origen, resolver) {
      if (!origen || origenes.has(origen)) return resolver(null, true);
      return resolver(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Accept', 'Authorization', 'Content-Type', 'X-Request-Id'],
    exposedHeaders: ['RateLimit', 'RateLimit-Policy', 'X-Request-Id'],
    maxAge: 600
  });
}

export const middlewareCors = crearMiddlewareCors();
export const corsMiddleware = middlewareCors;
