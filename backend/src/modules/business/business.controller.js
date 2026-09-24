export function crearControladorNegocio(servicio) {
  return Object.freeze({
    async obtener(_solicitud, respuesta) {
      respuesta.status(200).json(await servicio.obtenerNegocio());
    },

    async actualizar(solicitud, respuesta) {
      respuesta.status(200).json(await servicio.actualizarNegocio(solicitud.body));
    }
  });
}
