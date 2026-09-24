import { ErrorAutenticacion } from '../errors/AppError.js';
import { verificarTokenAcceso } from '../security/jwt.js';

export function crearMiddlewareAutenticacion(verificarToken = verificarTokenAcceso) {
  return (solicitud, _respuesta, siguiente) => {
    const autorizacion = solicitud.get('authorization');
    const coincidencia =
      typeof autorizacion === 'string' ? autorizacion.match(/^Bearer\s+([^\s]+)$/i) : null;

    if (!coincidencia) {
      return siguiente(new ErrorAutenticacion('Se requiere un token Bearer.'));
    }

    try {
      const identidad = verificarToken(coincidencia[1]);
      solicitud.usuarioAutenticado = Object.freeze({ id: identidad.sub, rol: identidad.rol });
      solicitud.auth = solicitud.usuarioAutenticado;
      return siguiente();
    } catch {
      return siguiente(new ErrorAutenticacion('El token de acceso no es válido o expiró.'));
    }
  };
}

export const autenticar = crearMiddlewareAutenticacion();
export const authenticate = autenticar;
