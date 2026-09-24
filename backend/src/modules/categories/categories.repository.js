import { ejecutarOperacionPersistencia } from '../../database/erroresPersistencia.js';
import { exigirDelegado, limpiarTexto, sinIndefinidos } from '../../database/repositorioBase.js';
import { crearResultadoPaginado, normalizarPaginacion } from '../../shared/utils/pagination.js';

export function crearRepositorioCategorias(cliente) {
  const categorias = exigirDelegado(cliente, 'categoria');
  const ejecutar = (operacion) =>
    ejecutarOperacionPersistencia(operacion, { entidad: 'Categoria' });

  return Object.freeze({
    buscarPorId(id) {
      return ejecutar(() => categorias.findUnique({ where: { id } }));
    },

    buscarPorSlug(slug) {
      return ejecutar(() => categorias.findUnique({ where: { slug: limpiarTexto(slug) } }));
    },

    async existePorSlug(slug, excluirId) {
      const encontrada = await ejecutar(() =>
        categorias.findFirst({
          where: {
            slug: limpiarTexto(slug),
            ...(excluirId ? { id: { not: excluirId } } : {})
          },
          select: { id: true }
        })
      );
      return Boolean(encontrada);
    },

    async existePorNombre(nombre, excluirId) {
      const encontrada = await ejecutar(() =>
        categorias.findFirst({
          where: {
            nombre: { equals: limpiarTexto(nombre), mode: 'insensitive' },
            ...(excluirId ? { id: { not: excluirId } } : {})
          },
          select: { id: true }
        })
      );
      return Boolean(encontrada);
    },

    async listar({ pagina, limite, activa, buscar } = {}) {
      const paginacion = normalizarPaginacion({ pagina, limite });
      const texto = limpiarTexto(buscar);
      const where = sinIndefinidos({
        activa,
        ...(texto
          ? {
              OR: [
                { nombre: { contains: texto, mode: 'insensitive' } },
                { descripcion: { contains: texto, mode: 'insensitive' } }
              ]
            }
          : {})
      });
      const [datos, total] = await ejecutar(() =>
        Promise.all([
          categorias.findMany({
            where,
            skip: paginacion.omitir,
            take: paginacion.limite,
            orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
            include: { _count: { select: { cursos: true } } }
          }),
          categorias.count({ where })
        ])
      );
      return crearResultadoPaginado({ ...paginacion, datos, total });
    },

    crear(datos) {
      return ejecutar(() => categorias.create({ data: datos }));
    },

    actualizar(id, datos) {
      return ejecutar(() => categorias.update({ where: { id }, data: datos }));
    },

    eliminar(id) {
      return ejecutar(() => categorias.delete({ where: { id } }));
    },

    crearOActualizarPorSlug(datos) {
      const { id: _id, slug, ...actualizacion } = datos;
      return ejecutar(() =>
        categorias.upsert({
          where: { slug },
          create: datos,
          update: actualizacion,
          select: { id: true, slug: true }
        })
      );
    }
  });
}

export const categoriesRepository = crearRepositorioCategorias;
