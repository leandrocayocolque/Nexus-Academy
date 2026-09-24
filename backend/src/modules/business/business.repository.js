import { ejecutarOperacionPersistencia } from '../../database/erroresPersistencia.js';
import { exigirDelegado } from '../../database/repositorioBase.js';

const CLAVE_NEGOCIO = 'negocio';

export function crearRepositorioNegocio(cliente) {
  const negocios = exigirDelegado(cliente, 'negocio');
  const ejecutar = (operacion) => ejecutarOperacionPersistencia(operacion, { entidad: 'Negocio' });

  return Object.freeze({
    obtener() {
      return ejecutar(() => negocios.findUnique({ where: { claveUnica: CLAVE_NEGOCIO } }));
    },

    crear(datos) {
      return ejecutar(() => negocios.create({ data: { ...datos, claveUnica: CLAVE_NEGOCIO } }));
    },

    actualizar(datos) {
      return ejecutar(() => negocios.update({ where: { claveUnica: CLAVE_NEGOCIO }, data: datos }));
    },

    guardar(datos) {
      const { id: _id, claveUnica: _claveIgnorada, ...actualizacion } = datos;
      return ejecutar(() =>
        negocios.upsert({
          where: { claveUnica: CLAVE_NEGOCIO },
          create: { ...datos, claveUnica: CLAVE_NEGOCIO },
          update: actualizacion
        })
      );
    }
  });
}

export const businessRepository = crearRepositorioNegocio;
