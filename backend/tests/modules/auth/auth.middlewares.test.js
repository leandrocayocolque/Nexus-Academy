import { describe, expect, it, vi } from 'vitest';
import { crearMiddlewareAutenticacion } from '../../../src/shared/middlewares/authenticate.js';
import { requerirAdmin, requerirRol } from '../../../src/shared/middlewares/authorize.js';

function crearSolicitud(autorizacion) {
  return {
    get: vi.fn((encabezado) => (encabezado === 'authorization' ? autorizacion : undefined))
  };
}

describe('Middleware de autenticación', () => {
  it.each([undefined, '', 'Basic credenciales', 'Bearer', 'Bearer token extra'])(
    'rechaza un encabezado Authorization inválido: %s',
    (autorizacion) => {
      const verificar = vi.fn();
      const siguiente = vi.fn();

      crearMiddlewareAutenticacion(verificar)(crearSolicitud(autorizacion), {}, siguiente);

      expect(verificar).not.toHaveBeenCalled();
      expect(siguiente).toHaveBeenCalledWith(
        expect.objectContaining({ codigo: 'NO_AUTENTICADO', codigoEstado: 401 })
      );
    }
  );

  it('verifica Bearer, expone una identidad mínima e inmutable y continúa', () => {
    const verificar = vi.fn(() => ({ sub: 'usuario-1', rol: 'ADMIN', extra: 'ignorado' }));
    const solicitud = crearSolicitud('Bearer token-valido');
    const siguiente = vi.fn();

    crearMiddlewareAutenticacion(verificar)(solicitud, {}, siguiente);

    expect(verificar).toHaveBeenCalledWith('token-valido');
    expect(solicitud.usuarioAutenticado).toEqual({ id: 'usuario-1', rol: 'ADMIN' });
    expect(solicitud.auth).toBe(solicitud.usuarioAutenticado);
    expect(Object.isFrozen(solicitud.usuarioAutenticado)).toBe(true);
    expect(siguiente).toHaveBeenCalledWith();
  });

  it('convierte cualquier fallo de verificación en un error seguro', () => {
    const verificar = vi.fn(() => {
      throw new Error('firma interna');
    });
    const siguiente = vi.fn();

    crearMiddlewareAutenticacion(verificar)(crearSolicitud('Bearer token-invalido'), {}, siguiente);

    expect(siguiente).toHaveBeenCalledWith(
      expect.objectContaining({
        codigo: 'NO_AUTENTICADO',
        message: 'El token de acceso no es válido o expiró.'
      })
    );
  });
});

describe('Middleware de autorización', () => {
  it('permite continuar a un ADMIN autenticado', () => {
    const siguiente = vi.fn();

    requerirAdmin({ usuarioAutenticado: { id: 'usuario-1', rol: 'ADMIN' } }, {}, siguiente);

    expect(siguiente).toHaveBeenCalledWith();
  });

  it('rechaza como no autenticada una solicitud sin identidad', () => {
    const siguiente = vi.fn();

    requerirAdmin({}, {}, siguiente);

    expect(siguiente).toHaveBeenCalledWith(
      expect.objectContaining({ codigo: 'NO_AUTENTICADO', codigoEstado: 401 })
    );
  });

  it('rechaza cualquier identidad que no tenga rol ADMIN', () => {
    const siguiente = vi.fn();

    requerirAdmin({ usuarioAutenticado: { id: 'usuario-2', rol: 'USUARIO' } }, {}, siguiente);

    expect(siguiente).toHaveBeenCalledWith(
      expect.objectContaining({ codigo: 'NO_AUTORIZADO', codigoEstado: 403 })
    );
  });

  it('falla al configurar el middleware sin roles o con roles desconocidos', () => {
    expect(() => requerirRol()).toThrow(TypeError);
    expect(() => requerirRol('USUARIO')).toThrow(TypeError);
  });
});
