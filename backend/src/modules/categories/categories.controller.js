export function crearControladorCategorias(servicio) {
  return Object.freeze({
    async listarPublicas(solicitud, respuesta) {
      respuesta
        .status(200)
        .json(await servicio.listarCategorias({ ...solicitud.query, activa: true }));
    },

    async listar(solicitud, respuesta) {
      respuesta.status(200).json(await servicio.listarCategorias(solicitud.query));
    },

    async crear(solicitud, respuesta) {
      respuesta.status(201).json(await servicio.crearCategoria(solicitud.body));
    },

    async actualizar(solicitud, respuesta) {
      respuesta
        .status(200)
        .json(await servicio.actualizarCategoria(solicitud.params.id, solicitud.body));
    },

    async eliminar(solicitud, respuesta) {
      respuesta.status(200).json(await servicio.eliminarCategoria(solicitud.params.id));
    }
  });
}
