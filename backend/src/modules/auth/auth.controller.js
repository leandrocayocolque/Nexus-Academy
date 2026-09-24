export function crearControladorAutenticacion(servicio) {
  return Object.freeze({
    async registrar(solicitud, respuesta) {
      const usuario = await servicio.registrarAdministrador(solicitud.body);
      respuesta.status(201).json(usuario);
    },

    async iniciarSesion(solicitud, respuesta) {
      respuesta.status(200).json(await servicio.autenticar(solicitud.body));
    },

    cerrarSesion(_solicitud, respuesta) {
      // Los JWT no tienen estado en el servidor: el cliente descarta el token.
      respuesta.status(200).json({ mensaje: 'La sesión fue cerrada correctamente.' });
    },

    async solicitarRestablecimiento(solicitud, respuesta) {
      respuesta.status(200).json(await servicio.solicitarRestablecimiento(solicitud.body));
    },

    async restablecerContrasena(solicitud, respuesta) {
      respuesta.status(200).json(await servicio.restablecerContrasena(solicitud.body));
    }
  });
}
