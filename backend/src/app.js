import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { middlewareCors } from './config/cors.config.js';
import { middlewareRegistroHttp } from './config/logger.js';
import { configuracionSeguridad, middlewaresSeguridad } from './config/security.js';
import { especificacionOpenApi, opcionesSwaggerUi } from './docs/openapi.js';
import { crearRutasApi } from './routes.js';
import { manejarError } from './shared/errors/errorHandler.js';
import { limitadorGeneral } from './shared/middlewares/rateLimiters.js';
import { rutaNoEncontrada } from './shared/middlewares/notFound.js';

export function crearAplicacion({
  cors = middlewareCors,
  registroHttp = middlewareRegistroHttp,
  seguridad = middlewaresSeguridad,
  limitador = limitadorGeneral,
  servicios,
  limitadoresRutas
} = {}) {
  const aplicacion = express();

  aplicacion.disable('x-powered-by');
  aplicacion.use(registroHttp);
  aplicacion.use(...seguridad);
  aplicacion.use(cors);
  aplicacion.use(limitador);
  aplicacion.use(express.json({ limit: configuracionSeguridad.limiteJson }));
  aplicacion.use(express.urlencoded({ extended: false, limit: configuracionSeguridad.limiteJson }));

  aplicacion.get('/api/health', (_solicitud, respuesta) => {
    respuesta.status(200).json({ estado: 'ok', servicio: 'nexus-api' });
  });

  aplicacion.get('/api/docs.json', (_solicitud, respuesta) => {
    respuesta.status(200).json(especificacionOpenApi);
  });
  aplicacion.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(especificacionOpenApi, opcionesSwaggerUi)
  );

  if (servicios && Object.keys(servicios).length > 0) {
    aplicacion.use('/api', crearRutasApi({ servicios, limitadores: limitadoresRutas }));
  }

  aplicacion.use(rutaNoEncontrada);
  aplicacion.use(manejarError);

  return aplicacion;
}

export const createApp = crearAplicacion;
