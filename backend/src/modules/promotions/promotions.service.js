import { ErrorReferenciaPersistencia } from '../../database/erroresPersistencia.js';
import {
  ErrorCursoNoEncontrado,
  ErrorPromocionNoEncontrada,
  ErrorValidacion
} from '../../shared/errors/AppError.js';
import { serializarDecimales } from '../../shared/mappers/persistencia.js';
import {
  esquemaActualizarPromocion,
  esquemaCrearPromocion,
  esquemaIdentificadorPromocion,
  esquemaListarPromocionesActivas,
  esquemaListarPromocionesAdministracion
} from './promotions.schema.js';

function exigirMetodo(objeto, metodo, nombre) {
  if (!objeto || typeof objeto[metodo] !== 'function') {
    throw new TypeError(`La dependencia ${nombre} debe implementar ${metodo}().`);
  }
}

function validarPeriodo(fechaInicio, fechaFin) {
  if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
    throw new ErrorValidacion('La fecha final debe ser posterior o igual a la fecha inicial.');
  }
}

function mapearPromocion(promocion, ahora) {
  if (!promocion) return promocion;
  const vigente = Boolean(
    promocion.estado === 'ACTIVA' &&
    (!promocion.fechaInicio || promocion.fechaInicio <= ahora) &&
    (!promocion.fechaFin || promocion.fechaFin >= ahora)
  );
  return { ...serializarDecimales(promocion), vigente };
}

export function crearServicioPromociones({
  repositorioPromociones,
  repositorioCursos,
  reloj = () => new Date()
} = {}) {
  for (const metodo of ['buscarPorId', 'listar', 'crear', 'actualizar', 'eliminar']) {
    exigirMetodo(repositorioPromociones, metodo, 'repositorioPromociones');
  }
  exigirMetodo(repositorioCursos, 'buscarPorId', 'repositorioCursos');

  async function exigirCurso(cursoId) {
    if (cursoId && !(await repositorioCursos.buscarPorId(cursoId))) {
      throw new ErrorCursoNoEncontrado();
    }
  }

  return Object.freeze({
    async crearPromocion(entrada) {
      const datos = esquemaCrearPromocion.parse(entrada);
      await exigirCurso(datos.cursoId);
      let promocion;
      try {
        promocion = await repositorioPromociones.crear({
          ...datos,
          cursoId: datos.cursoId ?? null,
          fechaInicio: datos.fechaInicio ?? null,
          fechaFin: datos.fechaFin ?? null
        });
      } catch (error) {
        if (
          error instanceof ErrorReferenciaPersistencia ||
          error?.codigo === 'REFERENCIA_INVALIDA'
        ) {
          throw new ErrorCursoNoEncontrado();
        }
        throw error;
      }
      return mapearPromocion(promocion, reloj());
    },

    async actualizarPromocion(id, entrada) {
      const promocionId = esquemaIdentificadorPromocion.parse(id);
      const datos = esquemaActualizarPromocion.parse(entrada);
      const actual = await repositorioPromociones.buscarPorId(promocionId);
      if (!actual) throw new ErrorPromocionNoEncontrada();
      if (datos.cursoId !== undefined) await exigirCurso(datos.cursoId);

      validarPeriodo(
        datos.fechaInicio !== undefined ? datos.fechaInicio : actual.fechaInicio,
        datos.fechaFin !== undefined ? datos.fechaFin : actual.fechaFin
      );
      try {
        return mapearPromocion(
          await repositorioPromociones.actualizar(promocionId, datos),
          reloj()
        );
      } catch (error) {
        if (
          error instanceof ErrorReferenciaPersistencia ||
          error?.codigo === 'REFERENCIA_INVALIDA'
        ) {
          throw new ErrorCursoNoEncontrado();
        }
        throw error;
      }
    },

    async eliminarPromocion(id) {
      const promocionId = esquemaIdentificadorPromocion.parse(id);
      if (!(await repositorioPromociones.buscarPorId(promocionId))) {
        throw new ErrorPromocionNoEncontrada();
      }
      await repositorioPromociones.eliminar(promocionId);
      return { mensaje: 'La promoción fue eliminada correctamente.' };
    },

    async obtenerPromocion(id) {
      const promocion = await repositorioPromociones.buscarPorId(
        esquemaIdentificadorPromocion.parse(id)
      );
      if (!promocion) throw new ErrorPromocionNoEncontrada();
      return mapearPromocion(promocion, reloj());
    },

    async listarPromocionesActivas(entrada = {}) {
      const filtros = esquemaListarPromocionesActivas.parse(entrada);
      const ahora = reloj();
      const resultado = await repositorioPromociones.listar({ ...filtros, efectivaEn: ahora });
      return {
        ...resultado,
        datos: resultado.datos.map((promocion) => mapearPromocion(promocion, ahora))
      };
    },

    async listarPromocionesAdministracion(entrada = {}) {
      const filtros = esquemaListarPromocionesAdministracion.parse(entrada);
      const ahora = reloj();
      const resultado = await repositorioPromociones.listar(filtros);
      return {
        ...resultado,
        datos: resultado.datos.map((promocion) => mapearPromocion(promocion, ahora))
      };
    }
  });
}

export const promotionsService = Object.freeze({ crear: crearServicioPromociones });
