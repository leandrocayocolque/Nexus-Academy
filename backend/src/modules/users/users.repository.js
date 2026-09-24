import { ejecutarOperacionPersistencia } from '../../database/erroresPersistencia.js';
import { exigirDelegado, limpiarTexto, sinIndefinidos } from '../../database/repositorioBase.js';
import { normalizarCorreo } from '../../shared/security/correo.js';
import { crearResultadoPaginado, normalizarPaginacion } from '../../shared/utils/pagination.js';

export function crearRepositorioUsuarios(cliente) {
  const usuarios = exigirDelegado(cliente, 'usuario');
  const ejecutar = (operacion) => ejecutarOperacionPersistencia(operacion, { entidad: 'Usuario' });

  return Object.freeze({
    buscarPorId(id) {
      return ejecutar(() => usuarios.findUnique({ where: { id } }));
    },

    buscarPorCorreo(correo) {
      return ejecutar(() => usuarios.findUnique({ where: { correo: normalizarCorreo(correo) } }));
    },

    async existePorCorreo(correo, excluirId) {
      const encontrado = await ejecutar(() =>
        usuarios.findFirst({
          where: {
            correo: normalizarCorreo(correo),
            ...(excluirId ? { id: { not: excluirId } } : {})
          },
          select: { id: true }
        })
      );
      return Boolean(encontrado);
    },

    async listar({ pagina, limite, activo, rol, buscar } = {}) {
      const paginacion = normalizarPaginacion({ pagina, limite });
      const texto = limpiarTexto(buscar);
      const where = sinIndefinidos({
        activo,
        rol,
        ...(texto
          ? {
              OR: [
                { correo: { contains: texto.toLowerCase(), mode: 'insensitive' } },
                { nombre: { contains: texto, mode: 'insensitive' } },
                { apellido: { contains: texto, mode: 'insensitive' } }
              ]
            }
          : {})
      });

      const [datos, total] = await ejecutar(() =>
        Promise.all([
          usuarios.findMany({
            where,
            skip: paginacion.omitir,
            take: paginacion.limite,
            orderBy: [{ creadoEn: 'desc' }, { id: 'desc' }]
          }),
          usuarios.count({ where })
        ])
      );

      return crearResultadoPaginado({ ...paginacion, datos, total });
    },

    crear(datos) {
      return ejecutar(() =>
        usuarios.create({
          data: { ...datos, correo: normalizarCorreo(datos.correo) }
        })
      );
    },

    actualizar(id, datos) {
      const data = {
        ...datos,
        ...(datos.correo !== undefined ? { correo: normalizarCorreo(datos.correo) } : {})
      };
      return ejecutar(() => usuarios.update({ where: { id }, data }));
    },

    actualizarContrasena(id, hashContrasena) {
      return ejecutar(() => usuarios.update({ where: { id }, data: { hashContrasena } }));
    },

    eliminar(id) {
      return ejecutar(() => usuarios.delete({ where: { id } }));
    },

    crearOActualizarPorCorreo(datos) {
      const correo = normalizarCorreo(datos.correo);
      const { id: _id, ...actualizacion } = datos;
      return ejecutar(() =>
        usuarios.upsert({
          where: { correo },
          create: { ...datos, correo },
          update: { ...actualizacion, correo }
        })
      );
    }
  });
}

export const usersRepository = crearRepositorioUsuarios;
