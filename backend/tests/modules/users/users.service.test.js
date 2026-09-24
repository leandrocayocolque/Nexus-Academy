import { beforeEach, describe, expect, it, vi } from 'vitest';
import { crearServicioUsuarios } from '../../../src/modules/users/users.service.js';

const CLAVE_ACTUAL = 'ClaveActual123';
const CLAVE_NUEVA = 'ClaveNueva456';
const AHORA = new Date('2027-01-15T12:00:00.000Z');

function crearContexto() {
  const repositorioUsuarios = {
    buscarPorId: vi.fn(),
    existePorCorreo: vi.fn(),
    actualizar: vi.fn()
  };
  const repositoriosTransaccionales = {
    usuarios: { actualizarContrasena: vi.fn() },
    tokensRestablecimiento: { invalidarActivosDeUsuario: vi.fn() }
  };
  const gestorTransacciones = {
    ejecutar: vi.fn((trabajo) => trabajo(repositoriosTransaccionales))
  };
  const contrasenas = {
    hashear: vi.fn().mockResolvedValue('hash-nuevo'),
    verificar: vi.fn()
  };
  const servicio = crearServicioUsuarios({
    repositorioUsuarios,
    gestorTransacciones,
    contrasenas,
    reloj: () => new Date(AHORA)
  });

  return {
    servicio,
    repositorioUsuarios,
    repositoriosTransaccionales,
    gestorTransacciones,
    contrasenas
  };
}

describe('Servicio de usuarios', () => {
  let contexto;

  beforeEach(() => {
    contexto = crearContexto();
  });

  it('obtiene el usuario actual mediante allow-list', async () => {
    contexto.repositorioUsuarios.buscarPorId.mockResolvedValue({
      id: 'usuario-1',
      correo: 'admin@example.com',
      nombre: 'Ana',
      apellido: 'Pérez',
      rol: 'ADMIN',
      activo: true,
      hashContrasena: 'no-exponer'
    });

    const usuario = await contexto.servicio.obtenerUsuarioActual('usuario-1');

    expect(usuario).not.toHaveProperty('hashContrasena');
    expect(usuario.correo).toBe('admin@example.com');
  });

  it('actualiza y normaliza sólo campos de perfil permitidos', async () => {
    contexto.repositorioUsuarios.buscarPorId.mockResolvedValue({
      id: 'usuario-1',
      correo: 'anterior@example.com'
    });
    contexto.repositorioUsuarios.existePorCorreo.mockResolvedValue(false);
    contexto.repositorioUsuarios.actualizar.mockResolvedValue({
      id: 'usuario-1',
      correo: 'nuevo@example.com',
      nombre: 'Ana',
      apellido: 'Pérez',
      rol: 'ADMIN',
      activo: true,
      hashContrasena: 'oculto'
    });

    const usuario = await contexto.servicio.actualizarPerfil('usuario-1', {
      correo: ' NUEVO@Example.COM ',
      nombre: ' Ana '
    });

    expect(contexto.repositorioUsuarios.actualizar).toHaveBeenCalledWith('usuario-1', {
      correo: 'nuevo@example.com',
      nombre: 'Ana'
    });
    expect(usuario).not.toHaveProperty('hashContrasena');
  });

  it('rechaza correo duplicado y estados no editables', async () => {
    contexto.repositorioUsuarios.buscarPorId.mockResolvedValue({
      id: 'usuario-1',
      correo: 'actual@example.com'
    });
    contexto.repositorioUsuarios.existePorCorreo.mockResolvedValue(true);

    await expect(
      contexto.servicio.actualizarPerfil('usuario-1', { correo: 'otro@example.com' })
    ).rejects.toMatchObject({ codigo: 'CORREO_DUPLICADO' });
    await expect(
      contexto.servicio.actualizarPerfil('usuario-1', { activo: false })
    ).rejects.toMatchObject({ name: 'ZodError' });
    expect(contexto.repositorioUsuarios.actualizar).not.toHaveBeenCalled();
  });

  it('cambia la contraseña e invalida resets en una transacción', async () => {
    contexto.repositorioUsuarios.buscarPorId.mockResolvedValue({
      id: 'usuario-1',
      hashContrasena: 'hash-actual'
    });
    contexto.contrasenas.verificar.mockResolvedValue(true);

    const respuesta = await contexto.servicio.cambiarContrasena('usuario-1', {
      contrasenaActual: CLAVE_ACTUAL,
      contrasenaNueva: CLAVE_NUEVA,
      confirmarContrasenaNueva: CLAVE_NUEVA
    });

    expect(contexto.contrasenas.hashear).toHaveBeenCalledWith(CLAVE_NUEVA);
    expect(contexto.repositoriosTransaccionales.usuarios.actualizarContrasena).toHaveBeenCalledWith(
      'usuario-1',
      'hash-nuevo'
    );
    expect(
      contexto.repositoriosTransaccionales.tokensRestablecimiento.invalidarActivosDeUsuario
    ).toHaveBeenCalledWith('usuario-1', AHORA);
    expect(respuesta.mensaje).toContain('actualizada correctamente');
  });

  it('rechaza una contraseña actual incorrecta sin escribir', async () => {
    contexto.repositorioUsuarios.buscarPorId.mockResolvedValue({
      id: 'usuario-1',
      hashContrasena: 'hash-actual'
    });
    contexto.contrasenas.verificar.mockResolvedValue(false);

    await expect(
      contexto.servicio.cambiarContrasena('usuario-1', {
        contrasenaActual: CLAVE_ACTUAL,
        contrasenaNueva: CLAVE_NUEVA,
        confirmarContrasenaNueva: CLAVE_NUEVA
      })
    ).rejects.toMatchObject({ codigo: 'CONTRASENA_ACTUAL_INVALIDA' });
    expect(contexto.gestorTransacciones.ejecutar).not.toHaveBeenCalled();
  });
});
