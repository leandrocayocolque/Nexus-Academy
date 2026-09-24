import jwt from 'jsonwebtoken';
import { entorno } from '../../config/env.js';
import { ErrorAutenticacion } from '../errors/AppError.js';
import { ROLES } from '../constants/roles.js';

const RECLAMOS_ESTANDAR = new Set(['iss', 'sub', 'aud', 'exp', 'nbf', 'iat', 'jti']);

function validarIdentidad({ sub, rol }) {
  if (typeof sub !== 'string' || !sub.trim()) {
    throw new TypeError('El identificador del usuario es obligatorio.');
  }

  if (rol !== ROLES.ADMIN) {
    throw new TypeError('El rol del usuario no es válido.');
  }

  return { sub: sub.trim(), rol };
}

export function crearServicioJwt({
  secreto = entorno.jwt.secreto,
  expiracion = entorno.jwt.expiracion
} = {}) {
  if (typeof secreto !== 'string' || secreto.length < 32) {
    throw new TypeError('El secreto JWT debe tener al menos 32 caracteres.');
  }

  return Object.freeze({
    firmarAcceso(identidad) {
      const { sub, rol } = validarIdentidad(identidad);
      return jwt.sign({ sub, rol }, secreto, {
        algorithm: 'HS256',
        expiresIn: expiracion
      });
    },

    verificarAcceso(token) {
      try {
        const contenido = jwt.verify(token, secreto, { algorithms: ['HS256'] });
        if (!contenido || typeof contenido === 'string') throw new Error('Contenido inválido');

        const reclamosPersonalizados = Object.keys(contenido).filter(
          (reclamo) => !RECLAMOS_ESTANDAR.has(reclamo)
        );
        if (reclamosPersonalizados.some((reclamo) => reclamo !== 'rol')) {
          throw new Error('El token contiene reclamos no permitidos');
        }

        return validarIdentidad({ sub: contenido.sub, rol: contenido.rol });
      } catch {
        throw new ErrorAutenticacion('El token de acceso no es válido o expiró.');
      }
    }
  });
}

export const servicioJwt = crearServicioJwt();
export const firmarTokenAcceso = (identidad) => servicioJwt.firmarAcceso(identidad);
export const verificarTokenAcceso = (token) => servicioJwt.verificarAcceso(token);
