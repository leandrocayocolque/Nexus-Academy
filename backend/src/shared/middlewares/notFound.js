import { ErrorNoEncontrado } from '../errors/AppError.js';

export function rutaNoEncontrada(solicitud, _respuesta, siguiente) {
  siguiente(new ErrorNoEncontrado(`Ruta ${solicitud.method} ${solicitud.path} no encontrada.`));
}

export const notFound = rutaNoEncontrada;
