export function crearControladorCursos(servicioCursos, servicioImagenes) {
  return Object.freeze({
    async listarPublicos(solicitud, respuesta) {
      respuesta
        .status(200)
        .json(await servicioCursos.buscarCursos(solicitud.query, { soloActivos: true }));
    },

    async obtenerPublico(solicitud, respuesta) {
      respuesta
        .status(200)
        .json(await servicioCursos.obtenerCurso(solicitud.params.id, { soloActivos: true }));
    },

    async listar(solicitud, respuesta) {
      respuesta.status(200).json(await servicioCursos.buscarCursos(solicitud.query));
    },

    async obtener(solicitud, respuesta) {
      respuesta.status(200).json(await servicioCursos.obtenerCurso(solicitud.params.id));
    },

    async crear(solicitud, respuesta) {
      respuesta.status(201).json(await servicioCursos.crearCurso(solicitud.body));
    },

    async actualizar(solicitud, respuesta) {
      respuesta
        .status(200)
        .json(await servicioCursos.actualizarCurso(solicitud.params.id, solicitud.body));
    },

    async eliminar(solicitud, respuesta) {
      respuesta.status(200).json(await servicioCursos.eliminarCurso(solicitud.params.id));
    },

    async cambiarEstado(solicitud, respuesta) {
      respuesta
        .status(200)
        .json(await servicioCursos.activarCurso(solicitud.params.id, solicitud.body));
    },

    async cambiarDestacado(solicitud, respuesta) {
      respuesta
        .status(200)
        .json(await servicioCursos.destacarCurso(solicitud.params.id, solicitud.body));
    },

    async agregarImagenes(solicitud, respuesta) {
      respuesta
        .status(201)
        .json(
          await servicioImagenes.agregarImagenes(
            solicitud.params.id,
            solicitud.files,
            solicitud.body
          )
        );
    },

    async eliminarImagen(solicitud, respuesta) {
      respuesta
        .status(200)
        .json(
          await servicioImagenes.eliminarImagen(solicitud.params.id, solicitud.params.imagenId)
        );
    }
  });
}
