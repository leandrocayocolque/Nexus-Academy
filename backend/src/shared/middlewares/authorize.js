import { ROLES } from '../constants/roles.js';
import { ErrorAutenticacion, ErrorAutorizacion } from '../errors/AppError.js';

export function requerirRol(...rolesPermitidos) {
  if (rolesPermitidos.length === 0) {
    throw new TypeError('Se requiere al menos un rol permitido.');
  }

  const rolesConocidos = new Set(Object.values(ROLES));
  if (rolesPermitidos.some((rol) => !rolesConocidos.has(rol))) {
    throw new TypeError('Se configuró un rol no reconocido.');
  }

  const roles = new Set(rolesPermitidos);

  return (solicitud, _respuesta, siguiente) => {
    if (!solicitud.usuarioAutenticado) {
      return siguiente(new ErrorAutenticacion());
    }

    if (!roles.has(solicitud.usuarioAutenticado.rol)) {
      return siguiente(new ErrorAutorizacion());
    }

    return siguiente();
  };
}

export const requerirAdmin = requerirRol(ROLES.ADMIN);
export const authorize = requerirRol;
