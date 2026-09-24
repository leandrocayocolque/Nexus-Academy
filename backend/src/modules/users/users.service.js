import { ErrorUnicidadPersistencia } from '../../database/erroresPersistencia.js';
import {
  ErrorContrasenaActualInvalida,
  ErrorCorreoDuplicado,
  ErrorUsuarioNoEncontrado
} from '../../shared/errors/AppError.js';
import { servicioContrasenas } from '../../shared/security/contrasenas.js';
import { serializarUsuario } from '../../shared/utils/sanitizeUser.js';
import { esquemaActualizarPerfil, esquemaCambiarContrasena } from './users.schema.js';

function exigirMetodo(objeto, metodo, nombre) {
  if (!objeto || typeof objeto[metodo] !== 'function') {
    throw new TypeError(`La dependencia ${nombre} debe implementar ${metodo}().`);
  }
}

function traducirDuplicado(error) {
  if (error instanceof ErrorUnicidadPersistencia || error?.codigo === 'VALOR_DUPLICADO') {
    throw new ErrorCorreoDuplicado();
  }
  throw error;
}

export function crearServicioUsuarios({
  repositorioUsuarios,
  gestorTransacciones,
  contrasenas = servicioContrasenas,
  reloj = () => new Date()
} = {}) {
  exigirMetodo(repositorioUsuarios, 'buscarPorId', 'repositorioUsuarios');
  exigirMetodo(repositorioUsuarios, 'existePorCorreo', 'repositorioUsuarios');
  exigirMetodo(repositorioUsuarios, 'actualizar', 'repositorioUsuarios');
  exigirMetodo(gestorTransacciones, 'ejecutar', 'gestorTransacciones');
  exigirMetodo(contrasenas, 'hashear', 'contrasenas');
  exigirMetodo(contrasenas, 'verificar', 'contrasenas');

  return Object.freeze({
    async obtenerUsuarioActual(usuarioId) {
      const usuario = await repositorioUsuarios.buscarPorId(usuarioId);
      if (!usuario) throw new ErrorUsuarioNoEncontrado();
      return serializarUsuario(usuario);
    },

    async actualizarPerfil(usuarioId, entrada) {
      const datos = esquemaActualizarPerfil.parse(entrada);
      const actual = await repositorioUsuarios.buscarPorId(usuarioId);
      if (!actual) throw new ErrorUsuarioNoEncontrado();

      if (
        datos.correo !== undefined &&
        datos.correo !== actual.correo &&
        (await repositorioUsuarios.existePorCorreo(datos.correo, usuarioId))
      ) {
        throw new ErrorCorreoDuplicado();
      }

      try {
        const usuario = await repositorioUsuarios.actualizar(usuarioId, datos);
        return serializarUsuario(usuario);
      } catch (error) {
        return traducirDuplicado(error);
      }
    },

    async cambiarContrasena(usuarioId, entrada) {
      const datos = esquemaCambiarContrasena.parse(entrada);
      const usuario = await repositorioUsuarios.buscarPorId(usuarioId);
      if (!usuario) throw new ErrorUsuarioNoEncontrado();

      const actualValida = await contrasenas.verificar(
        datos.contrasenaActual,
        usuario.hashContrasena
      );
      if (!actualValida) throw new ErrorContrasenaActualInvalida();

      const hashContrasena = await contrasenas.hashear(datos.contrasenaNueva);
      const ahora = reloj();
      await gestorTransacciones.ejecutar(async (repositorios) => {
        await repositorios.usuarios.actualizarContrasena(usuarioId, hashContrasena);
        await repositorios.tokensRestablecimiento.invalidarActivosDeUsuario(usuarioId, ahora);
      });

      return { mensaje: 'La contraseña fue actualizada correctamente.' };
    }
  });
}

export const usersService = Object.freeze({ crear: crearServicioUsuarios });
