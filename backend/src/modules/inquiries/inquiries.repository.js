import { ejecutarOperacionPersistencia } from '../../database/erroresPersistencia.js';
import { exigirDelegado, limpiarTexto, sinIndefinidos } from '../../database/repositorioBase.js';
import { normalizarCorreo } from '../../shared/security/correo.js';
import { crearResultadoPaginado, normalizarPaginacion } from '../../shared/utils/pagination.js';

export function crearRepositorioConsultas(cliente) {
  const consultas = exigirDelegado(cliente, 'consulta');
  const ejecutar = (operacion) => ejecutarOperacionPersistencia(operacion, { entidad: 'Consulta' });

  return Object.freeze({
    buscarPorId(id) {
      return ejecutar(() => consultas.findUnique({ where: { id }, include: { curso: true } }));
    },

    async listar({ pagina, limite, estado, cursoId, correo, buscar, fechaDesde, fechaHasta } = {}) {
      const paginacion = normalizarPaginacion({ pagina, limite });
      const texto = limpiarTexto(buscar);
      const where = sinIndefinidos({
        estado,
        cursoId,
        ...(correo ? { correo: normalizarCorreo(correo) } : {}),
        ...(texto
          ? {
              OR: [
                { nombre: { contains: texto, mode: 'insensitive' } },
                { correo: { contains: texto.toLowerCase(), mode: 'insensitive' } },
                { asunto: { contains: texto, mode: 'insensitive' } }
              ]
            }
          : {}),
        ...(fechaDesde !== undefined || fechaHasta !== undefined
          ? { creadaEn: sinIndefinidos({ gte: fechaDesde, lte: fechaHasta }) }
          : {})
      });
      const [datos, total] = await ejecutar(() =>
        Promise.all([
          consultas.findMany({
            where,
            skip: paginacion.omitir,
            take: paginacion.limite,
            orderBy: [{ creadaEn: 'desc' }, { id: 'desc' }],
            include: { curso: { select: { id: true, titulo: true, slug: true } } }
          }),
          consultas.count({ where })
        ])
      );
      return crearResultadoPaginado({ ...paginacion, datos, total });
    },

    crear(datos) {
      return ejecutar(() =>
        consultas.create({
          data: { ...datos, correo: normalizarCorreo(datos.correo) },
          include: { curso: { select: { id: true, titulo: true, slug: true } } }
        })
      );
    },

    actualizar(id, datos) {
      const data = {
        ...datos,
        ...(datos.correo !== undefined ? { correo: normalizarCorreo(datos.correo) } : {})
      };
      return ejecutar(() => consultas.update({ where: { id }, data }));
    },

    actualizarEstado(id, estado) {
      return ejecutar(() => consultas.update({ where: { id }, data: { estado } }));
    },

    eliminar(id) {
      return ejecutar(() => consultas.delete({ where: { id } }));
    },

    guardarPorId(datos) {
      const { id, ...actualizacion } = datos;
      const correo = normalizarCorreo(datos.correo);
      return ejecutar(() =>
        consultas.upsert({
          where: { id },
          create: { ...datos, correo },
          update: { ...actualizacion, correo }
        })
      );
    }
  });
}

export const inquiriesRepository = crearRepositorioConsultas;
