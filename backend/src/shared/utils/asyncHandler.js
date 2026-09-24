// Express 4 no captura promesas rechazadas: se derivan al manejador de errores.
export const manejadorAsync = (controlador) => (solicitud, respuesta, siguiente) =>
  Promise.resolve(controlador(solicitud, respuesta, siguiente)).catch(siguiente);

export const asyncHandler = manejadorAsync;
