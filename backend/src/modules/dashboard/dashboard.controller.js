import { sinIndefinidos } from '../../database/repositorioBase.js';

export function crearControladorDashboard(servicio) {
  return Object.freeze({
    async obtener(solicitud, respuesta) {
      const { desde, hasta, ...resto } = solicitud.query;
      respuesta
        .status(200)
        .json(
          await servicio.obtenerDashboard({ ...resto, periodo: sinIndefinidos({ desde, hasta }) })
        );
    }
  });
}
