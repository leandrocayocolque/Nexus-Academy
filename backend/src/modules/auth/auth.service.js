import { entorno } from '../../config/env.js';
import { registro } from '../../config/logger.js';
import { ErrorUnicidadPersistencia } from '../../database/erroresPersistencia.js';
import {
  ErrorCorreoDuplicado,
  ErrorCredencialesInvalidas,
  ErrorTokenRestablecimientoInvalido
} from '../../shared/errors/AppError.js';
import { ROLES } from '../../shared/constants/roles.js';
import { servicioContrasenas } from '../../shared/security/contrasenas.js';
import { servicioJwt } from '../../shared/security/jwt.js';
import {
  crearTokenRestablecimiento,
  hashearTokenRestablecimiento
} from '../../shared/security/tokensRestablecimiento.js';
import { serializarUsuario } from '../../shared/utils/sanitizeUser.js';
import {
  esquemaLogin,
  esquemaRegistroAdministrador,
  esquemaRestablecimientoContrasena,
  esquemaSolicitudRestablecimiento
} from './auth.schema.js';

const HASH_COMPARACION = '$2a$12$KB3GLG33vcyExN7LxRjVn.bgT2IWE3Yjbv/T361qsu4btVWrMzaVu';
const DURACION_RESTABLECIMIENTO_MS = 60 * 60 * 1000;
const RESPUESTA_SOLICITUD = Object.freeze({
  mensaje: 'Si el correo corresponde a una cuenta, recibirá instrucciones para restablecerla.'
});
const RESPUESTA_RESTABLECIMIENTO = Object.freeze({
  mensaje: 'La contraseña fue restablecida correctamente.'
});

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

function crearEnlaceRestablecimiento(urlFrontend, token) {
  const enlace = new URL('/restablecer-contrasena', urlFrontend);
  enlace.searchParams.set('token', token);
  return enlace.toString();
}

export function crearServicioAutenticacion({
  repositorioUsuarios,
  repositorioTokens,
  gestorTransacciones,
  contrasenas = servicioContrasenas,
  tokens = Object.freeze({
    crear: crearTokenRestablecimiento,
    hashear: hashearTokenRestablecimiento
  }),
  jwt = servicioJwt,
  proveedorCorreo,
  registrador = registro,
  reloj = () => new Date(),
  duracionRestablecimientoMs = DURACION_RESTABLECIMIENTO_MS,
  urlFrontend = entorno.urlFrontend
} = {}) {
  exigirMetodo(repositorioUsuarios, 'buscarPorCorreo', 'repositorioUsuarios');
  exigirMetodo(repositorioUsuarios, 'existePorCorreo', 'repositorioUsuarios');
  exigirMetodo(repositorioUsuarios, 'crear', 'repositorioUsuarios');
  exigirMetodo(repositorioTokens, 'buscarPorHash', 'repositorioTokens');
  exigirMetodo(gestorTransacciones, 'ejecutar', 'gestorTransacciones');
  exigirMetodo(contrasenas, 'hashear', 'contrasenas');
  exigirMetodo(contrasenas, 'verificar', 'contrasenas');
  exigirMetodo(tokens, 'crear', 'tokens');
  exigirMetodo(tokens, 'hashear', 'tokens');
  exigirMetodo(jwt, 'firmarAcceso', 'jwt');
  exigirMetodo(jwt, 'verificarAcceso', 'jwt');
  exigirMetodo(proveedorCorreo, 'enviarRestablecimientoContrasena', 'proveedorCorreo');

  if (!Number.isFinite(duracionRestablecimientoMs) || duracionRestablecimientoMs <= 0) {
    throw new TypeError('La duración del restablecimiento debe ser positiva.');
  }

  return Object.freeze({
    async registrarAdministrador(entrada) {
      const datos = esquemaRegistroAdministrador.parse(entrada);
      if (await repositorioUsuarios.existePorCorreo(datos.correo)) {
        throw new ErrorCorreoDuplicado();
      }

      const hashContrasena = await contrasenas.hashear(datos.contrasena);
      try {
        const usuario = await repositorioUsuarios.crear({
          correo: datos.correo,
          nombre: datos.nombre,
          apellido: datos.apellido,
          hashContrasena,
          rol: ROLES.ADMIN,
          activo: true
        });
        return serializarUsuario(usuario);
      } catch (error) {
        return traducirDuplicado(error);
      }
    },

    crearTokenAcceso(usuario) {
      return jwt.firmarAcceso({ sub: usuario.id, rol: usuario.rol });
    },

    verificarTokenAcceso(token) {
      return jwt.verificarAcceso(token);
    },

    async autenticar(entrada) {
      const datos = esquemaLogin.parse(entrada);
      const usuario = await repositorioUsuarios.buscarPorCorreo(datos.correo);
      const hash = usuario?.hashContrasena ?? HASH_COMPARACION;
      const contrasenaValida = await contrasenas.verificar(datos.contrasena, hash);

      if (!usuario || !contrasenaValida || !usuario.activo || usuario.rol !== ROLES.ADMIN) {
        throw new ErrorCredencialesInvalidas();
      }

      return {
        tokenAcceso: jwt.firmarAcceso({ sub: usuario.id, rol: usuario.rol }),
        usuario: serializarUsuario(usuario)
      };
    },

    async solicitarRestablecimiento(entrada) {
      const { correo } = esquemaSolicitudRestablecimiento.parse(entrada);
      const usuario = await repositorioUsuarios.buscarPorCorreo(correo);
      if (!usuario || !usuario.activo) return { ...RESPUESTA_SOLICITUD };

      const token = tokens.crear();
      const hashToken = tokens.hashear(token);
      const ahora = reloj();
      const expiraEn = new Date(ahora.getTime() + duracionRestablecimientoMs);

      await gestorTransacciones.ejecutar(async (repositorios) => {
        await repositorios.tokensRestablecimiento.invalidarActivosDeUsuario(usuario.id, ahora);
        await repositorios.tokensRestablecimiento.crear({
          usuarioId: usuario.id,
          hashToken,
          expiraEn
        });
      });

      try {
        await proveedorCorreo.enviarRestablecimientoContrasena({
          destinatario: usuario.correo,
          nombre: usuario.nombre,
          enlace: crearEnlaceRestablecimiento(urlFrontend, token),
          expiraEn
        });
      } catch (error) {
        registrador.warn(
          { error, usuarioId: usuario.id },
          'No se pudo enviar el correo de restablecimiento'
        );
      }

      return { ...RESPUESTA_SOLICITUD };
    },

    async restablecerContrasena(entrada) {
      const datos = esquemaRestablecimientoContrasena.parse(entrada);
      const hashToken = tokens.hashear(datos.token);
      const hashContrasena = await contrasenas.hashear(datos.contrasenaNueva);
      const ahora = reloj();

      await gestorTransacciones.ejecutar(async (repositorios) => {
        const tokenPersistido = await repositorios.tokensRestablecimiento.buscarPorHash(hashToken);
        const invalido =
          !tokenPersistido ||
          tokenPersistido.usadoEn !== null ||
          tokenPersistido.expiraEn <= ahora ||
          tokenPersistido.usuario?.activo === false;
        if (invalido) throw new ErrorTokenRestablecimientoInvalido();

        const consumo = await repositorios.tokensRestablecimiento.consumirActivo(
          tokenPersistido.id,
          ahora
        );
        if (consumo.count !== 1) throw new ErrorTokenRestablecimientoInvalido();

        await repositorios.usuarios.actualizarContrasena(tokenPersistido.usuarioId, hashContrasena);
        await repositorios.tokensRestablecimiento.invalidarActivosDeUsuario(
          tokenPersistido.usuarioId,
          ahora
        );
      });

      return { ...RESPUESTA_RESTABLECIMIENTO };
    }
  });
}

export const authService = Object.freeze({ crear: crearServicioAutenticacion });
