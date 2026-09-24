import multer from 'multer';
import { ZodError } from 'zod';
import { registro } from '../../config/logger.js';
import { AppError, ErrorArchivoInvalido, ErrorValidacion } from './AppError.js';
import { codigosError } from './errorCodes.js';

function normalizarError(error) {
  if (error instanceof AppError) return error;

  if (error instanceof ZodError) {
    return new ErrorValidacion(
      'Los datos enviados no son válidos.',
      error.issues.map(({ path, message }) => ({ campo: path.join('.'), mensaje: message }))
    );
  }

  if (error instanceof SyntaxError && error.status === 400 && Object.hasOwn(error, 'body')) {
    return new ErrorValidacion('El cuerpo JSON de la solicitud no es válido.');
  }

  if (error instanceof multer.MulterError) {
    const mensaje =
      error.code === 'LIMIT_FILE_SIZE'
        ? 'El archivo supera el tamaño máximo permitido.'
        : 'No se pudo procesar el archivo enviado.';
    return new ErrorArchivoInvalido(mensaje);
  }

  return new AppError('Ocurrió un error interno.', 500, codigosError.ERROR_INTERNO);
}

export function manejarError(error, solicitud, respuesta, _siguiente) {
  const errorNormalizado = normalizarError(error);
  const registrador = solicitud.log ?? registro;
  const contexto = {
    error,
    codigo: errorNormalizado.codigo,
    metodo: solicitud.method,
    ruta: solicitud.path,
    idSolicitud: solicitud.id
  };

  if (errorNormalizado.codigoEstado >= 500) {
    registrador.error(contexto, 'Error no controlado durante la solicitud');
  } else {
    registrador.warn(contexto, 'Solicitud rechazada');
  }

  const cuerpo = {
    error: {
      codigo: errorNormalizado.codigo,
      mensaje: errorNormalizado.message
    }
  };

  if (errorNormalizado.detalles !== undefined) {
    cuerpo.error.detalles = errorNormalizado.detalles;
  }

  respuesta.status(errorNormalizado.codigoEstado).json(cuerpo);
}

export const errorHandler = manejarError;
