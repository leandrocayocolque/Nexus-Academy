import { ErrorValidacion } from '../errors/AppError.js';

export const validarSolicitud = (esquema) => async (solicitud, _respuesta, siguiente) => {
  if (!esquema || typeof esquema.safeParseAsync !== 'function') {
    return siguiente(new TypeError('Se requiere un esquema Zod válido.'));
  }

  try {
    const resultado = await esquema.safeParseAsync({
      body: solicitud.body,
      params: solicitud.params,
      query: solicitud.query
    });

    if (!resultado.success) {
      const detalles = resultado.error.issues.map(({ path, message }) => ({
        campo: path.join('.'),
        mensaje: message
      }));
      return siguiente(new ErrorValidacion('La solicitud contiene datos inválidos.', detalles));
    }

    if (resultado.data.body !== undefined) solicitud.body = resultado.data.body;
    if (resultado.data.params !== undefined) solicitud.params = resultado.data.params;
    if (resultado.data.query !== undefined) solicitud.query = resultado.data.query;
    return siguiente();
  } catch (error) {
    return siguiente(error);
  }
};

export const validateRequest = validarSolicitud;
