import jwtLibreria from 'jsonwebtoken';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { crearServicioAutenticacion } from '../../../src/modules/auth/auth.service.js';
import { ProveedorCorreoMemoria } from '../../../src/providers/email/email.provider.js';
import { crearServicioJwt } from '../../../src/shared/security/jwt.js';

const CLAVE_VALIDA = 'ClaveSegura123';
const CLAVE_NUEVA = 'ClaveNueva456';
const TOKEN_CRUDO = 't'.repeat(43);
const AHORA = new Date('2027-01-15T12:00:00.000Z');

function crearDependencias() {
  const repositorioUsuarios = {
    buscarPorCorreo: vi.fn(),
    existePorCorreo: vi.fn(),
    existeAdministrador: vi.fn(),
    crear: vi.fn()
  };
  const repositorioTokens = { buscarPorHash: vi.fn() };
  const repositoriosTransaccionales = {
    usuarios: { actualizarContrasena: vi.fn() },
    tokensRestablecimiento: {
      buscarPorHash: vi.fn(),
      consumirActivo: vi.fn(),
      crear: vi.fn(),
      invalidarActivosDeUsuario: vi.fn()
    }
  };
  const gestorTransacciones = {
    ejecutar: vi.fn((trabajo) => trabajo(repositoriosTransaccionales))
  };
  const contrasenas = {
    hashear: vi.fn().mockResolvedValue('hash-bcrypt'),
    verificar: vi.fn()
  };
  const tokens = {
    crear: vi.fn(() => TOKEN_CRUDO),
    hashear: vi.fn(() => 'hash-sha256')
  };
  const jwt = {
    firmarAcceso: vi.fn(() => 'jwt-firmado'),
    verificarAcceso: vi.fn(() => ({ sub: 'usuario-1', rol: 'ADMIN' }))
  };
  const proveedorCorreo = new ProveedorCorreoMemoria();
  const registrador = { warn: vi.fn() };

  const servicio = crearServicioAutenticacion({
    repositorioUsuarios,
    repositorioTokens,
    gestorTransacciones,
    contrasenas,
    tokens,
    jwt,
    proveedorCorreo,
    registrador,
    reloj: () => new Date(AHORA),
    duracionRestablecimientoMs: 3_600_000,
    urlFrontend: 'https://app.nexus.example'
  });

  return {
    servicio,
    repositorioUsuarios,
    repositoriosTransaccionales,
    gestorTransacciones,
    contrasenas,
    tokens,
    jwt,
    proveedorCorreo,
    registrador
  };
}

describe('Servicio de autenticación', () => {
  let contexto;

  beforeEach(() => {
    contexto = crearDependencias();
  });

  it('registra un ADMIN normalizado, persiste sólo el hash y aplica allow-list', async () => {
    contexto.repositorioUsuarios.existePorCorreo.mockResolvedValue(false);
    contexto.repositorioUsuarios.crear.mockImplementation(async (datos) => ({
      id: 'usuario-1',
      ...datos,
      creadoEn: AHORA,
      actualizadoEn: AHORA
    }));

    const usuario = await contexto.servicio.registrarAdministrador({
      correo: ' ADMIN@Example.COM ',
      nombre: '  Ana ',
      apellido: ' Pérez ',
      contrasena: CLAVE_VALIDA,
      confirmarContrasena: CLAVE_VALIDA
    });

    expect(contexto.contrasenas.hashear).toHaveBeenCalledWith(CLAVE_VALIDA);
    expect(contexto.repositorioUsuarios.crear).toHaveBeenCalledWith({
      correo: 'admin@example.com',
      nombre: 'Ana',
      apellido: 'Pérez',
      hashContrasena: 'hash-bcrypt',
      rol: 'ADMIN',
      activo: true
    });
    expect(usuario).not.toHaveProperty('hashContrasena');
    expect(usuario).not.toHaveProperty('contrasena');
  });

  it('rechaza correos duplicados con un código específico', async () => {
    contexto.repositorioUsuarios.existePorCorreo.mockResolvedValue(true);

    await expect(
      contexto.servicio.registrarAdministrador({
        correo: 'admin@example.com',
        nombre: 'Ana',
        apellido: 'Pérez',
        contrasena: CLAVE_VALIDA,
        confirmarContrasena: CLAVE_VALIDA
      })
    ).rejects.toMatchObject({ codigo: 'CORREO_DUPLICADO' });
    expect(contexto.repositorioUsuarios.crear).not.toHaveBeenCalled();
  });

  it('autentica credenciales válidas sin devolver el hash', async () => {
    contexto.repositorioUsuarios.buscarPorCorreo.mockResolvedValue({
      id: 'usuario-1',
      correo: 'admin@example.com',
      nombre: 'Ana',
      apellido: 'Pérez',
      hashContrasena: 'hash-real',
      rol: 'ADMIN',
      activo: true
    });
    contexto.contrasenas.verificar.mockResolvedValue(true);

    const resultado = await contexto.servicio.autenticar({
      correo: ' ADMIN@example.com ',
      contrasena: CLAVE_VALIDA
    });

    expect(resultado.tokenAcceso).toBe('jwt-firmado');
    expect(resultado.usuario).not.toHaveProperty('hashContrasena');
    expect(contexto.jwt.firmarAcceso).toHaveBeenCalledWith({ sub: 'usuario-1', rol: 'ADMIN' });
  });

  it.each([
    ['usuario inexistente', null, false],
    [
      'contraseña incorrecta',
      { id: 'u1', hashContrasena: 'hash', activo: true, rol: 'ADMIN' },
      false
    ],
    ['usuario inactivo', { id: 'u1', hashContrasena: 'hash', activo: false, rol: 'ADMIN' }, true]
  ])('usa el mismo error para %s', async (_caso, usuario, coincide) => {
    contexto.repositorioUsuarios.buscarPorCorreo.mockResolvedValue(usuario);
    contexto.contrasenas.verificar.mockResolvedValue(coincide);

    await expect(
      contexto.servicio.autenticar({ correo: 'admin@example.com', contrasena: CLAVE_VALIDA })
    ).rejects.toMatchObject({
      codigo: 'CREDENCIALES_INVALIDAS',
      message: 'Las credenciales proporcionadas no son válidas.'
    });
    expect(contexto.contrasenas.verificar).toHaveBeenCalledOnce();
  });

  it('genera un JWT con custom payload limitado a sub y rol', () => {
    const servicioJwt = crearServicioJwt({
      secreto: 'secreto-de-prueba-seguro-con-mas-de-32-caracteres',
      expiracion: '1h'
    });
    const token = servicioJwt.firmarAcceso({ sub: 'usuario-1', rol: 'ADMIN', extra: 'ignorado' });

    expect(Object.keys(jwtLibreria.decode(token)).sort()).toEqual(['exp', 'iat', 'rol', 'sub']);
    expect(servicioJwt.verificarAcceso(token)).toEqual({ sub: 'usuario-1', rol: 'ADMIN' });
  });

  it('expone creación y verificación de tokens mediante el servicio inyectado', () => {
    const identidad = { id: 'usuario-1', rol: 'ADMIN' };

    expect(contexto.servicio.crearTokenAcceso(identidad)).toBe('jwt-firmado');
    expect(contexto.jwt.firmarAcceso).toHaveBeenCalledWith({ sub: 'usuario-1', rol: 'ADMIN' });
    expect(contexto.servicio.verificarTokenAcceso('jwt-firmado')).toEqual({
      sub: 'usuario-1',
      rol: 'ADMIN'
    });
    expect(contexto.jwt.verificarAcceso).toHaveBeenCalledWith('jwt-firmado');
  });

  it('crea un reset hash-only, invalida anteriores y envía FRONTEND_URL', async () => {
    contexto.repositorioUsuarios.buscarPorCorreo.mockResolvedValue({
      id: 'usuario-1',
      correo: 'admin@example.com',
      nombre: 'Ana',
      activo: true
    });

    const respuesta = await contexto.servicio.solicitarRestablecimiento({
      correo: 'ADMIN@example.com'
    });

    expect(
      contexto.repositoriosTransaccionales.tokensRestablecimiento.invalidarActivosDeUsuario
    ).toHaveBeenCalledWith('usuario-1', AHORA);
    expect(contexto.repositoriosTransaccionales.tokensRestablecimiento.crear).toHaveBeenCalledWith({
      usuarioId: 'usuario-1',
      hashToken: 'hash-sha256',
      expiraEn: new Date('2027-01-15T13:00:00.000Z')
    });
    expect(
      contexto.repositoriosTransaccionales.tokensRestablecimiento.crear.mock.calls[0][0]
    ).not.toHaveProperty('token');
    expect(contexto.proveedorCorreo.mensajes[0].enlace).toBe(
      `https://app.nexus.example/restablecer-contrasena?token=${TOKEN_CRUDO}`
    );
    expect(respuesta.mensaje).toContain('Si el correo corresponde');
  });

  it('no enumera ni envía correo cuando el usuario no existe', async () => {
    contexto.repositorioUsuarios.buscarPorCorreo.mockResolvedValue(null);

    const respuesta = await contexto.servicio.solicitarRestablecimiento({
      correo: 'nadie@example.com'
    });

    expect(respuesta.mensaje).toContain('Si el correo corresponde');
    expect(contexto.gestorTransacciones.ejecutar).not.toHaveBeenCalled();
    expect(contexto.proveedorCorreo.mensajes).toHaveLength(0);
  });

  it.each([
    ['vencido', { usadoEn: null, expiraEn: new Date('2027-01-15T11:00:00.000Z') }],
    [
      'usado',
      {
        usadoEn: new Date('2027-01-15T10:00:00.000Z'),
        expiraEn: new Date('2027-01-15T13:00:00.000Z')
      }
    ]
  ])('rechaza un token %s sin cambiar la contraseña', async (_caso, estadoToken) => {
    contexto.repositoriosTransaccionales.tokensRestablecimiento.buscarPorHash.mockResolvedValue({
      id: 'token-1',
      usuarioId: 'usuario-1',
      usuario: { activo: true },
      ...estadoToken
    });

    await expect(
      contexto.servicio.restablecerContrasena({
        token: TOKEN_CRUDO,
        contrasenaNueva: CLAVE_NUEVA,
        confirmarContrasenaNueva: CLAVE_NUEVA
      })
    ).rejects.toMatchObject({ codigo: 'TOKEN_RESTABLECIMIENTO_INVALIDO' });
    expect(
      contexto.repositoriosTransaccionales.usuarios.actualizarContrasena
    ).not.toHaveBeenCalled();
  });

  it('consume una sola vez, cambia la contraseña e invalida tokens en la misma transacción', async () => {
    contexto.repositoriosTransaccionales.tokensRestablecimiento.buscarPorHash.mockResolvedValue({
      id: 'token-1',
      usuarioId: 'usuario-1',
      usadoEn: null,
      expiraEn: new Date('2027-01-15T13:00:00.000Z'),
      usuario: { activo: true }
    });
    contexto.repositoriosTransaccionales.tokensRestablecimiento.consumirActivo.mockResolvedValue({
      count: 1
    });

    await contexto.servicio.restablecerContrasena({
      token: TOKEN_CRUDO,
      contrasenaNueva: CLAVE_NUEVA,
      confirmarContrasenaNueva: CLAVE_NUEVA
    });

    expect(contexto.tokens.hashear).toHaveBeenCalledWith(TOKEN_CRUDO);
    expect(
      contexto.repositoriosTransaccionales.tokensRestablecimiento.consumirActivo
    ).toHaveBeenCalledWith('token-1', AHORA);
    expect(contexto.repositoriosTransaccionales.usuarios.actualizarContrasena).toHaveBeenCalledWith(
      'usuario-1',
      'hash-bcrypt'
    );
    expect(
      contexto.repositoriosTransaccionales.tokensRestablecimiento.invalidarActivosDeUsuario
    ).toHaveBeenCalledWith('usuario-1', AHORA);
  });

  it('rechaza una carrera de consumo sin modificar la contraseña', async () => {
    contexto.repositoriosTransaccionales.tokensRestablecimiento.buscarPorHash.mockResolvedValue({
      id: 'token-1',
      usuarioId: 'usuario-1',
      usadoEn: null,
      expiraEn: new Date('2027-01-15T13:00:00.000Z'),
      usuario: { activo: true }
    });
    contexto.repositoriosTransaccionales.tokensRestablecimiento.consumirActivo.mockResolvedValue({
      count: 0
    });

    await expect(
      contexto.servicio.restablecerContrasena({
        token: TOKEN_CRUDO,
        contrasenaNueva: CLAVE_NUEVA,
        confirmarContrasenaNueva: CLAVE_NUEVA
      })
    ).rejects.toMatchObject({ codigo: 'TOKEN_RESTABLECIMIENTO_INVALIDO' });
    expect(
      contexto.repositoriosTransaccionales.usuarios.actualizarContrasena
    ).not.toHaveBeenCalled();
  });
});
