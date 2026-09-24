import { ejecutarOperacionPersistencia } from '../../database/erroresPersistencia.js';
import { exigirDelegado, limpiarTexto, sinIndefinidos } from '../../database/repositorioBase.js';
import { crearResultadoPaginado, normalizarPaginacion } from '../../shared/utils/pagination.js';

export function crearRepositorioPromociones(cliente) {
  const promociones = exigirDelegado(cliente, 'promocion');
  const ejecutar = (operacion) =>
    ejecutarOperacionPersistencia(operacion, { entidad: 'Promocion' });

  return Object.freeze({
    buscarPorId(id) {
      return ejecutar(() => promociones.findUnique({ where: { id }, include: { curso: true } }));
    },

    async listar({ pagina, limite, estado, cursoId, buscar, efectivaEn } = {}) {
      const paginacion = normalizarPaginacion({ pagina, limite });
      const texto = limpiarTexto(buscar);
      const condiciones = [];
      const directos = sinIndefinidos({ estado, cursoId });
      if (Object.keys(directos).length > 0) condiciones.push(directos);
      if (texto) {
        condiciones.push({
          OR: [
            { titulo: { contains: texto, mode: 'insensitive' } },
            { descripcion: { contains: texto, mode: 'insensitive' } }
          ]
        });
      }
      if (efectivaEn) {
        condiciones.push(
          { estado: 'ACTIVA' },
          { OR: [{ fechaInicio: null }, { fechaInicio: { lte: efectivaEn } }] },
          { OR: [{ fechaFin: null }, { fechaFin: { gte: efectivaEn } }] }
        );
      }
      const where = condiciones.length > 0 ? { AND: condiciones } : {};
      const [datos, total] = await ejecutar(() =>
        Promise.all([
          promociones.findMany({
            where,
            skip: paginacion.omitir,
            take: paginacion.limite,
            orderBy: [{ fechaInicio: 'desc' }, { id: 'desc' }],
            include: { curso: { select: { id: true, titulo: true, slug: true } } }
          }),
          promociones.count({ where })
        ])
      );
      return crearResultadoPaginado({ ...paginacion, datos, total });
    },

    crear(datos) {
      return ejecutar(() => promociones.create({ data: datos, include: { curso: true } }));
    },

    actualizar(id, datos) {
      return ejecutar(() =>
        promociones.update({ where: { id }, data: datos, include: { curso: true } })
      );
    },

    eliminar(id) {
      return ejecutar(() => promociones.delete({ where: { id } }));
    },

    guardarPorId(datos) {
      const { id, ...actualizacion } = datos;
      return ejecutar(() =>
        promociones.upsert({ where: { id }, create: datos, update: actualizacion })
      );
    }
  });
}

export const promotionsRepository = crearRepositorioPromociones;
