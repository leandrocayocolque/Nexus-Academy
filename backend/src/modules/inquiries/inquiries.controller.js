export function crearControladorConsultas(servicio) {
  return Object.freeze({
    async crear(solicitud, respuesta) {
      respuesta.status(201).json(await servicio.crearConsulta(solicitud.body));
    },

    async responder(solicitud, respuesta) {
      respuesta
        .status(200)
        .json(
          await servicio.responderConsulta(
            solicitud.params.id,
            solicitud.body,
            solicitud.usuarioAutenticado.id
          )
        );
    },

    async listar(solicitud, respuesta) {
      respuesta.status(200).json(await servicio.listarConsultas(solicitud.query));
    },

    async obtener(solicitud, respuesta) {
      respuesta.status(200).json(await servicio.obtenerConsulta(solicitud.params.id));
    },

    async cambiarEstado(solicitud, respuesta) {
      respuesta
        .status(200)
        .json(await servicio.cambiarEstadoConsulta(solicitud.params.id, solicitud.body));
    },

    async eliminar(solicitud, respuesta) {
      respuesta.status(200).json(await servicio.eliminarConsulta(solicitud.params.id));
    }
  });
}
