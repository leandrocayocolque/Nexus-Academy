import { ejecutarOperacionPersistencia } from '../../database/erroresPersistencia.js';
import { exigirDelegado, limpiarTexto, sinIndefinidos } from '../../database/repositorioBase.js';
import { crearResultadoPaginado, normalizarPaginacion } from '../../shared/utils/pagination.js';

const CAMPOS_ORDEN_CURSO = new Set([
  'titulo',
  'precio',
  'fechaInicio',
  'creadoEn',
  'cuposDisponibles',
  'destacado'
]);

const INCLUSION_CURSO = Object.freeze({
  categoria: true,
  imagenes: { orderBy: [{ orden: 'asc' }, { id: 'asc' }] }
});

function crearFiltroCursos(filtros) {
  const condiciones = [];
  const texto = limpiarTexto(filtros.buscar);

  if (texto) {
    condiciones.push({
      OR: [
        { titulo: { contains: texto, mode: 'insensitive' } },
        { descripcion: { contains: texto, mode: 'insensitive' } }
      ]
    });
  }

  const directos = sinIndefinidos({
    categoriaId: filtros.categoriaId,
    nivel: filtros.nivel,
    modalidad: filtros.modalidad,
    activo: filtros.activo,
    destacado: filtros.destacado
  });
  if (Object.keys(directos).length > 0) condiciones.push(directos);

  if (filtros.slugCategoria) {
    condiciones.push({ categoria: { slug: limpiarTexto(filtros.slugCategoria) } });
  }

  if (filtros.precioMinimo !== undefined || filtros.precioMaximo !== undefined) {
    condiciones.push({
      precio: sinIndefinidos({ gte: filtros.precioMinimo, lte: filtros.precioMaximo })
    });
  }

  if (filtros.fechaDesde !== undefined || filtros.fechaHasta !== undefined) {
    condiciones.push({
      fechaInicio: sinIndefinidos({ gte: filtros.fechaDesde, lte: filtros.fechaHasta })
    });
  }

  if (filtros.disponible === true) {
    condiciones.push({ activo: true, cuposDisponibles: { gt: 0 } });
  } else if (filtros.disponible === false) {
    condiciones.push({ OR: [{ activo: false }, { cuposDisponibles: { lte: 0 } }] });
  }

  return condiciones.length > 0 ? { AND: condiciones } : {};
}

function crearOrdenCursos(campoSolicitado, direccionSolicitada) {
  const campo = CAMPOS_ORDEN_CURSO.has(campoSolicitado) ? campoSolicitado : 'fechaInicio';
  const direccion = direccionSolicitada === 'asc' ? 'asc' : 'desc';
  return [{ [campo]: direccion }, { id: direccion }];
}

export function crearRepositorioCursos(cliente) {
  const cursos = exigirDelegado(cliente, 'curso');
  const ejecutar = (operacion) => ejecutarOperacionPersistencia(operacion, { entidad: 'Curso' });

  return Object.freeze({
    buscarPorId(id) {
      return ejecutar(() => cursos.findUnique({ where: { id }, include: INCLUSION_CURSO }));
    },

    buscarPorSlug(slug) {
      return ejecutar(() =>
        cursos.findUnique({
          where: { slug: limpiarTexto(slug) },
          include: INCLUSION_CURSO
        })
      );
    },

    async existePorSlug(slug, excluirId) {
      const encontrado = await ejecutar(() =>
        cursos.findFirst({
          where: {
            slug: limpiarTexto(slug),
            ...(excluirId ? { id: { not: excluirId } } : {})
          },
          select: { id: true }
        })
      );
      return Boolean(encontrado);
    },

    async listar(filtros = {}) {
      const paginacion = normalizarPaginacion(filtros);
      const where = crearFiltroCursos(filtros);
      const orderBy = crearOrdenCursos(filtros.ordenarPor, filtros.direccion);
      const [datos, total] = await ejecutar(() =>
        Promise.all([
          cursos.findMany({
            where,
            orderBy,
            skip: paginacion.omitir,
            take: paginacion.limite,
            include: INCLUSION_CURSO
          }),
          cursos.count({ where })
        ])
      );
      return crearResultadoPaginado({ ...paginacion, datos, total });
    },

    crear(datos) {
      return ejecutar(() => cursos.create({ data: datos, include: INCLUSION_CURSO }));
    },

    actualizar(id, datos) {
      return ejecutar(() =>
        cursos.update({ where: { id }, data: datos, include: INCLUSION_CURSO })
      );
    },

    eliminar(id) {
      return ejecutar(() => cursos.delete({ where: { id } }));
    },

    crearOActualizarPorSlug(datos) {
      const { id: _id, slug, ...actualizacion } = datos;
      return ejecutar(() =>
        cursos.upsert({
          where: { slug },
          create: datos,
          update: actualizacion,
          select: { id: true, slug: true }
        })
      );
    }
  });
}

export function crearRepositorioImagenesCurso(cliente) {
  const imagenes = exigirDelegado(cliente, 'imagenCurso');
  const ejecutar = (operacion) =>
    ejecutarOperacionPersistencia(operacion, { entidad: 'ImagenCurso' });

  return Object.freeze({
    buscarPorId(id) {
      return ejecutar(() => imagenes.findUnique({ where: { id } }));
    },

    listarPorCurso(cursoId) {
      return ejecutar(() =>
        imagenes.findMany({
          where: { cursoId },
          orderBy: [{ orden: 'asc' }, { id: 'asc' }]
        })
      );
    },

    crear(datos) {
      return ejecutar(() => imagenes.create({ data: datos }));
    },

    actualizar(id, datos) {
      return ejecutar(() => imagenes.update({ where: { id }, data: datos }));
    },

    eliminar(id) {
      return ejecutar(() => imagenes.delete({ where: { id } }));
    }
  });
}

export const coursesRepository = crearRepositorioCursos;
