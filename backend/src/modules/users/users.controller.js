export function crearControladorUsuarios(servicio) {
  return Object.freeze({
    async obtenerPerfil(solicitud, respuesta) {
      respuesta
        .status(200)
        .json(await servicio.obtenerUsuarioActual(solicitud.usuarioAutenticado.id));
    },

    async actualizarPerfil(solicitud, respuesta) {
      respuesta
        .status(200)
        .json(await servicio.actualizarPerfil(solicitud.usuarioAutenticado.id, solicitud.body));
    }
  });
}
