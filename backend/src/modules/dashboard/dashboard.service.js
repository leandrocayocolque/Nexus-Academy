import { mapearCurso } from '../../shared/mappers/persistencia.js';
import {
  esquemaBajaDisponibilidad,
  esquemaDashboardCompleto,
  esquemaLimiteDashboard,
  esquemaPeriodoDashboard
} from './dashboard.schema.js';

function exigirMetodo(objeto, metodo, nombre) {
  if (!objeto || typeof objeto[metodo] !== 'function') {
    throw new TypeError(`La dependencia ${nombre} debe implementar ${metodo}().`);
  }
}

export function crearServicioDashboard({ repositorioDashboard, reloj = () => new Date() } = {}) {
  for (const metodo of [
    'obtenerResumen',
    'obtenerConsultasPorEstado',
    'obtenerConsultasPorMes',
    'obtenerCursosMasConsultados',
    'obtenerCategoriasMasConsultadas',
    'obtenerCursosConBajaDisponibilidad'
  ]) {
    exigirMetodo(repositorioDashboard, metodo, 'repositorioDashboard');
  }

  const servicio = {
    obtenerResumen() {
      return repositorioDashboard.obtenerResumen();
    },

    obtenerConsultasPorEstado() {
      return repositorioDashboard.obtenerConsultasPorEstado();
    },

    obtenerConsultasPorMes(entrada = {}) {
      const periodo = esquemaPeriodoDashboard.parse(entrada);
      return repositorioDashboard.obtenerConsultasPorMes({
        ...periodo,
        hasta: periodo.hasta ?? reloj()
      });
    },

    async obtenerCursosMasConsultados(entrada = {}) {
      const filtros = esquemaLimiteDashboard.parse(entrada);
      const cursos = await repositorioDashboard.obtenerCursosMasConsultados(filtros);
      return cursos.map(mapearCurso);
    },

    obtenerCategoriasMasConsultadas(entrada = {}) {
      return repositorioDashboard.obtenerCategoriasMasConsultadas(
        esquemaLimiteDashboard.parse(entrada)
      );
    },

    async obtenerCursosConBajaDisponibilidad(entrada = {}) {
      const cursos = await repositorioDashboard.obtenerCursosConBajaDisponibilidad(
        esquemaBajaDisponibilidad.parse(entrada)
      );
      return cursos.map(mapearCurso);
    }
  };

  servicio.obtenerDashboard = async (entrada = {}) => {
    const { periodo, limite, umbral } = esquemaDashboardCompleto.parse(entrada);
    const [
      resumen,
      consultasPorEstado,
      consultasPorMes,
      cursosMasConsultados,
      categoriasMasConsultadas,
      cursosConBajaDisponibilidad
    ] = await Promise.all([
      servicio.obtenerResumen(),
      servicio.obtenerConsultasPorEstado(),
      servicio.obtenerConsultasPorMes(periodo),
      servicio.obtenerCursosMasConsultados({ limite }),
      servicio.obtenerCategoriasMasConsultadas({ limite }),
      servicio.obtenerCursosConBajaDisponibilidad({ umbral, limite })
    ]);

    return {
      resumen,
      consultasPorEstado,
      consultasPorMes,
      cursosMasConsultados,
      categoriasMasConsultadas,
      cursosConBajaDisponibilidad
    };
  };

  return Object.freeze(servicio);
}

export const dashboardService = Object.freeze({ crear: crearServicioDashboard });
