import { registro } from '../../config/logger.js';
import { ErrorReferenciaPersistencia } from '../../database/erroresPersistencia.js';
import {
  AppError,
  ErrorConflicto,
  ErrorConsultaNoEncontrada,
  ErrorCursoNoEncontrado
} from '../../shared/errors/AppError.js';
import { serializarDecimales } from '../../shared/mappers/persistencia.js';
import {
  esquemaCambiarEstadoConsulta,
  esquemaCrearConsulta,
  esquemaIdentificadorConsulta,
  esquemaListarConsultas,
  esquemaResponderConsulta
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

    async responderConsulta(id, entrada, actorId) {
      const consultaId = esquemaIdentificadorConsulta.parse(id);
      const datos = esquemaResponderConsulta.parse(entrada);
      const actor = esquemaIdentificadorConsulta.parse(actorId);
      const consulta = await repositorioConsultas.buscarPorId(consultaId);
      if (!consulta) throw new ErrorConsultaNoEncontrada();
      const { creada, respuesta } = await repositorioConsultas.reservarRespuesta({
        consultaId,
        ...datos,
        actorId: actor,
        destinatario: consulta.correo,
        asunto: `Re: ${Array.from(consulta.asunto, (caracter) =>
          caracter.codePointAt(0) < 32 || caracter.codePointAt(0) === 127 ? ' ' : caracter
        )
          .join('')
          .replace(/ +/g, ' ')}`.slice(0, 204)
      });
      if (!creada) {
        if (respuesta.mensaje !== datos.mensaje) {
          throw new ErrorConflicto('La clave de idempotencia ya corresponde a otro mensaje.');
        }
        return { repetida: true, respuesta: serializarDecimales(respuesta) };
      }

      let resultado;
      try {
        resultado = await proveedorCorreo.enviarRespuestaConsulta({
          destinatario: respuesta.destinatario,
          asunto: respuesta.asunto,
          mensaje: respuesta.mensaje
        });
      } catch {
        // Un error sin clasificación no demuestra que el servidor no aceptó el envío.
        resultado = { estado: 'INCIERTA', errorCodigo: 'RESULTADO_DESCONOCIDO' };
      }
      const estado = ['ACEPTADA', 'FALLIDA', 'INCIERTA'].includes(resultado?.estado)
        ? resultado.estado
        : 'INCIERTA';
      // Nunca almacenar respuestas SMTP crudas ni excepciones del proveedor.
      const codigosSeguros = [
        'SMTP_RECHAZADO',
        'SMTP_NO_ACEPTADO',
        'SMTP_RESULTADO_INCIERTO',
        'CORREO_NO_DISPONIBLE',
        'CORREO_SIMULADO',
        'RESULTADO_DESCONOCIDO'
      ];
      try {
        const finalizada = await repositorioConsultas.finalizarRespuesta(respuesta.id, {
          estado,
          proveedorId:
            typeof resultado?.id === 'string'
              ? resultado.id.replace(/[\r\n]/g, '').slice(0, 500)
              : null,
          errorCodigo:
            estado === 'ACEPTADA'
              ? null
              : codigosSeguros.includes(resultado?.errorCodigo)
                ? resultado.errorCodigo
                : 'RESULTADO_DESCONOCIDO'
        });
        return { repetida: false, respuesta: serializarDecimales(finalizada) };
      } catch {
        registrador.warn(
          { consultaId, respuestaId: respuesta.id, estado },
          'No se pudo confirmar la respuesta; no reenviar automáticamente'
        );
        throw new AppError(
          'El envío no pudo confirmarse. Consulte el historial y no genere otra clave para reintentar.',
          503,
          'RESPUESTA_NO_CONFIRMADA',
          { respuestaId: respuesta.id }
        );
      }
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
      try {
        await repositorioConsultas.eliminar(consultaId);
      } catch (error) {
        if (error?.codigo === 'REFERENCIA_INVALIDA') {
          throw new ErrorConflicto(
            'No se puede eliminar una consulta con historial de respuestas.'
          );
        }
        throw error;
      }
      return { mensaje: 'La consulta fue eliminada correctamente.' };
    }
  });
}

export const inquiriesService = Object.freeze({ crear: crearServicioConsultas });
