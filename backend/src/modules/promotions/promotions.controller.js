export function crearControladorPromociones(servicio) {
  return Object.freeze({
    async listarActivas(solicitud, respuesta) {
      respuesta.status(200).json(await servicio.listarPromocionesActivas(solicitud.query));
    },

    async listar(solicitud, respuesta) {
      respuesta.status(200).json(await servicio.listarPromocionesAdministracion(solicitud.query));
    },

    async obtener(solicitud, respuesta) {
      respuesta.status(200).json(await servicio.obtenerPromocion(solicitud.params.id));
    },

    async crear(solicitud, respuesta) {
      respuesta.status(201).json(await servicio.crearPromocion(solicitud.body));
    },

    async actualizar(solicitud, respuesta) {
      respuesta
        .status(200)
        .json(await servicio.actualizarPromocion(solicitud.params.id, solicitud.body));
    },

    async eliminar(solicitud, respuesta) {
      respuesta.status(200).json(await servicio.eliminarPromocion(solicitud.params.id));
    }
  });
}
