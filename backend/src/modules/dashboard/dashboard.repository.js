import { ejecutarOperacionPersistencia } from '../../database/erroresPersistencia.js';
import { exigirDelegado } from '../../database/repositorioBase.js';

function inicioPeriodoMensual(fechaHasta) {
  const inicio = new Date(fechaHasta);
  inicio.setUTCDate(1);
  inicio.setUTCHours(0, 0, 0, 0);
  inicio.setUTCMonth(inicio.getUTCMonth() - 11);
  return inicio;
}

function claveMes(fecha) {
  return `${fecha.getUTCFullYear()}-${String(fecha.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function crearRepositorioDashboard(cliente) {
  const usuarios = exigirDelegado(cliente, 'usuario');
  const categorias = exigirDelegado(cliente, 'categoria');
  const cursos = exigirDelegado(cliente, 'curso');
  const consultas = exigirDelegado(cliente, 'consulta');
  const promociones = exigirDelegado(cliente, 'promocion');
  const ejecutar = (operacion) =>
    ejecutarOperacionPersistencia(operacion, { entidad: 'Dashboard' });

  return Object.freeze({
    async obtenerResumen() {
      const [
        usuariosActivos,
        categoriasActivas,
        cursosActivos,
        cursosDisponibles,
        consultasPendientes,
        promocionesActivas
      ] = await ejecutar(() =>
        Promise.all([
          usuarios.count({ where: { activo: true } }),
          categorias.count({ where: { activa: true } }),
          cursos.count({ where: { activo: true } }),
          cursos.count({ where: { activo: true, cuposDisponibles: { gt: 0 } } }),
          consultas.count({ where: { estado: 'PENDIENTE' } }),
          promociones.count({ where: { estado: 'ACTIVA' } })
        ])
      );

      return {
        usuariosActivos,
        categoriasActivas,
        cursosActivos,
        cursosDisponibles,
        consultasPendientes,
        promocionesActivas
      };
    },

    async obtenerConsultasPorEstado() {
      const grupos = await ejecutar(() =>
        consultas.groupBy({
          by: ['estado'],
          _count: { _all: true },
          orderBy: { estado: 'asc' }
        })
      );
      return grupos.map((grupo) => ({ estado: grupo.estado, cantidad: grupo._count._all }));
    },

    async obtenerConsultasPorMes({ desde, hasta } = {}) {
      const fechaHasta = hasta ?? new Date();
      const fechaDesde = desde ?? inicioPeriodoMensual(fechaHasta);
      const registros = await ejecutar(() =>
        consultas.findMany({
          where: { creadaEn: { gte: fechaDesde, lte: fechaHasta } },
          select: { creadaEn: true },
          orderBy: [{ creadaEn: 'asc' }, { id: 'asc' }]
        })
      );
      const cantidades = new Map();
      for (const { creadaEn } of registros) {
        const mes = claveMes(creadaEn);
        cantidades.set(mes, (cantidades.get(mes) ?? 0) + 1);
      }
      return [...cantidades.entries()].map(([mes, cantidad]) => ({ mes, cantidad }));
    },

    async obtenerCursosMasConsultados({ limite = 10 } = {}) {
      const limiteSeguro = Math.min(Math.max(Math.trunc(Number(limite)) || 10, 1), 50);
      const registros = await ejecutar(() =>
        cursos.findMany({
          where: { consultas: { some: {} } },
          take: limiteSeguro,
          orderBy: [{ consultas: { _count: 'desc' } }, { id: 'asc' }],
          select: {
            id: true,
            titulo: true,
            slug: true,
            cuposDisponibles: true,
            activo: true,
            categoria: { select: { id: true, nombre: true, slug: true } },
            _count: { select: { consultas: true } }
          }
        })
      );
      return registros.map(({ _count, ...curso }) => ({
        ...curso,
        cantidadConsultas: _count.consultas
      }));
    },

    async obtenerCategoriasMasConsultadas({ limite = 10 } = {}) {
      const limiteSeguro = Math.min(Math.max(Math.trunc(Number(limite)) || 10, 1), 50);
      const grupos = await ejecutar(() =>
        consultas.groupBy({
          by: ['cursoId'],
          where: { cursoId: { not: null } },
          _count: { _all: true }
        })
      );
      const idsCursos = grupos.map((grupo) => grupo.cursoId).filter(Boolean);
      if (idsCursos.length === 0) return [];

      const cursosConCategoria = await ejecutar(() =>
        cursos.findMany({
          where: { id: { in: idsCursos } },
          select: { id: true, categoria: { select: { id: true, nombre: true, slug: true } } }
        })
      );
      const porCurso = new Map(grupos.map((grupo) => [grupo.cursoId, grupo._count._all]));
      const acumulado = new Map();

      for (const curso of cursosConCategoria) {
        const categoria = curso.categoria;
        const actual = acumulado.get(categoria.id) ?? { ...categoria, cantidadConsultas: 0 };
        actual.cantidadConsultas += porCurso.get(curso.id) ?? 0;
        acumulado.set(categoria.id, actual);
      }

      return [...acumulado.values()]
        .sort(
          (primera, segunda) =>
            segunda.cantidadConsultas - primera.cantidadConsultas ||
            primera.id.localeCompare(segunda.id)
        )
        .slice(0, limiteSeguro);
    },

    obtenerCursosConBajaDisponibilidad({ umbral = 5, limite = 10 } = {}) {
      const umbralSeguro = Math.max(Math.trunc(Number(umbral)) || 0, 0);
      const limiteSeguro = Math.min(Math.max(Math.trunc(Number(limite)) || 10, 1), 50);
      return ejecutar(() =>
        cursos.findMany({
          where: { activo: true, cuposDisponibles: { lte: umbralSeguro } },
          take: limiteSeguro,
          orderBy: [{ cuposDisponibles: 'asc' }, { fechaInicio: 'asc' }, { id: 'asc' }],
          select: {
            id: true,
            titulo: true,
            slug: true,
            cuposDisponibles: true,
            activo: true,
            fechaInicio: true,
            categoria: { select: { id: true, nombre: true, slug: true } }
          }
        })
      );
    }
  });
}

export const dashboardRepository = crearRepositorioDashboard;
