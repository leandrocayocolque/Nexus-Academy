import { ErrorNegocioNoEncontrado } from '../../shared/errors/AppError.js';
import { esquemaActualizarNegocio } from './business.schema.js';

function exigirMetodo(objeto, metodo, nombre) {
  if (!objeto || typeof objeto[metodo] !== 'function') {
    throw new TypeError(`La dependencia ${nombre} debe implementar ${metodo}().`);
  }
}

export function crearServicioNegocio({ repositorioNegocio } = {}) {
  exigirMetodo(repositorioNegocio, 'obtener', 'repositorioNegocio');
  exigirMetodo(repositorioNegocio, 'actualizar', 'repositorioNegocio');

  return Object.freeze({
    async obtenerNegocio() {
      const negocio = await repositorioNegocio.obtener();
      if (!negocio) throw new ErrorNegocioNoEncontrado();
      return negocio;
    },

    async actualizarNegocio(entrada) {
      const datos = esquemaActualizarNegocio.parse(entrada);
      if (!(await repositorioNegocio.obtener())) throw new ErrorNegocioNoEncontrado();
      return repositorioNegocio.actualizar(datos);
    }
  });
}

export const businessService = Object.freeze({ crear: crearServicioNegocio });
