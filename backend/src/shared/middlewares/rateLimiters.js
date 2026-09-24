import rateLimit from 'express-rate-limit';
import { configuracionSeguridad } from '../../config/security.js';
import { ErrorLimiteSolicitudes } from '../errors/AppError.js';

export function crearLimitador({ ventanaMs, maximo }) {
  return rateLimit({
    windowMs: ventanaMs,
    limit: maximo,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler(_solicitud, _respuesta, siguiente) {
      siguiente(new ErrorLimiteSolicitudes());
    }
  });
}

export const limitadorGeneral = crearLimitador(configuracionSeguridad.limitesSolicitudes.general);
export const limitadorInicioSesion = crearLimitador(
  configuracionSeguridad.limitesSolicitudes.inicioSesion
);
export const limitadorRestablecimiento = crearLimitador(
  configuracionSeguridad.limitesSolicitudes.restablecimiento
);
export const limitadorConsulta = crearLimitador(configuracionSeguridad.limitesSolicitudes.consulta);

export const defaultRateLimiter = limitadorGeneral;
