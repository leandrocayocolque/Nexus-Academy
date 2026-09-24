import { ejecutarOperacionPersistencia } from '../../database/erroresPersistencia.js';
import { exigirDelegado } from '../../database/repositorioBase.js';

export function crearRepositorioTokensRestablecimiento(cliente) {
  const tokens = exigirDelegado(cliente, 'tokenRestablecimiento');
  const ejecutar = (operacion) =>
    ejecutarOperacionPersistencia(operacion, { entidad: 'TokenRestablecimiento' });

  return Object.freeze({
    crear(datos) {
      return ejecutar(() => tokens.create({ data: datos }));
    },

    buscarPorHash(hashToken) {
      return ejecutar(() =>
        tokens.findUnique({
          where: { hashToken },
          include: { usuario: { select: { id: true, activo: true } } }
        })
      );
    },

    buscarActivoPorHash(hashToken, ahora = new Date()) {
      return ejecutar(() =>
        tokens.findFirst({
          where: {
            hashToken,
            usadoEn: null,
            expiraEn: { gt: ahora }
          },
          include: { usuario: true }
        })
      );
    },

    invalidarActivosDeUsuario(usuarioId, usadoEn = new Date()) {
      return ejecutar(() =>
        tokens.updateMany({
          where: { usuarioId, usadoEn: null, expiraEn: { gt: usadoEn } },
          data: { usadoEn }
        })
      );
    },

    marcarUsado(id, usadoEn = new Date()) {
      return ejecutar(() => tokens.update({ where: { id }, data: { usadoEn } }));
    },

    consumirActivo(id, usadoEn = new Date()) {
      return ejecutar(() =>
        tokens.updateMany({
          where: { id, usadoEn: null, expiraEn: { gt: usadoEn } },
          data: { usadoEn }
        })
      );
    },

    eliminarExpirados(ahora = new Date()) {
      return ejecutar(() =>
        tokens.deleteMany({
          where: { OR: [{ expiraEn: { lte: ahora } }, { usadoEn: { not: null } }] }
        })
      );
    }
  });
}

export const crearRepositorioAutenticacion = crearRepositorioTokensRestablecimiento;
export const authRepository = crearRepositorioTokensRestablecimiento;
