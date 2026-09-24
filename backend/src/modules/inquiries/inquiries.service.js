import { registro } from '../../config/logger.js';
import { ErrorReferenciaPersistencia } from '../../database/erroresPersistencia.js';
import { ErrorConsultaNoEncontrada, ErrorCursoNoEncontrado } from '../../shared/errors/AppError.js';
import { serializarDecimales } from '../../shared/mappers/persistencia.js';
import {
  esquemaCambiarEstadoConsulta,
  esquemaCrearConsulta,
  esquemaIdentificadorConsulta,
  esquemaListarConsultas
} from './inquiries.schema.js';

function exigirMetodo(objeto, metodo, nombre) {
  if (!objeto || typeof objeto[metodo] !== 'function') {
    throw new TypeError(`La dependencia ${nombre} debe implementar ${metodo}().`);
  }
}

export function crearServicioConsultas({
  repositorioConsultas,
  repositorioCursos,
  proveedorCorreo,
  registrador = registro
} = {}) {
  for (const metodo of ['buscarPorId', 'listar', 'crear', 'actualizarEstado', 'eliminar']) {
    exigirMetodo(repositorioConsultas, metodo, 'repositorioConsultas');
  }
  exigirMetodo(repositorioCursos, 'buscarPorId', 'repositorioCursos');
  exigirMetodo(proveedorCorreo, 'enviarNotificacionNuevaConsulta', 'proveedorCorreo');
  exigirMetodo(registrador, 'warn', 'registrador');

  return Object.freeze({
    async crearConsulta(entrada) {
      const datos = esquemaCrearConsulta.parse(entrada);
      if (datos.cursoId && !(await repositorioCursos.buscarPorId(datos.cursoId))) {
        throw new ErrorCursoNoEncontrado();
      }

      let consulta;
      try {
        consulta = await repositorioConsultas.crear({
          ...datos,
          cursoId: datos.cursoId ?? null,
          estado: 'PENDIENTE'
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

      try {
        await proveedorCorreo.enviarNotificacionNuevaConsulta({
          consulta: serializarDecimales(consulta)
        });
      } catch (error) {
        registrador.warn(
          { error, consultaId: consulta.id },
          'La consulta se guardó, pero no se pudo enviar su notificación por correo'
        );
      }

      return serializarDecimales(consulta);
    },

    async obtenerConsulta(id) {
      const consulta = await repositorioConsultas.buscarPorId(
        esquemaIdentificadorConsulta.parse(id)
      );
      if (!consulta) throw new ErrorConsultaNoEncontrada();
      return serializarDecimales(consulta);
    },

    async listarConsultas(entrada = {}) {
      const resultado = await repositorioConsultas.listar(esquemaListarConsultas.parse(entrada));
      return { ...resultado, datos: serializarDecimales(resultado.datos) };
    },

    async cambiarEstadoConsulta(id, entrada) {
      const consultaId = esquemaIdentificadorConsulta.parse(id);
      const { estado } = esquemaCambiarEstadoConsulta.parse(entrada);
      if (!(await repositorioConsultas.buscarPorId(consultaId))) {
        throw new ErrorConsultaNoEncontrada();
      }
      return serializarDecimales(await repositorioConsultas.actualizarEstado(consultaId, estado));
    },

    async eliminarConsulta(id) {
      const consultaId = esquemaIdentificadorConsulta.parse(id);
      if (!(await repositorioConsultas.buscarPorId(consultaId))) {
        throw new ErrorConsultaNoEncontrada();
      }
      await repositorioConsultas.eliminar(consultaId);
      return { mensaje: 'La consulta fue eliminada correctamente.' };
    }
  });
}

export const inquiriesService = Object.freeze({ crear: crearServicioConsultas });
