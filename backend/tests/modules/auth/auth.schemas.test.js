import { describe, expect, it } from 'vitest';
import {
  esquemaLogin,
  esquemaRegistroAdministrador,
  esquemaRestablecimientoContrasena,
  esquemaSolicitudRestablecimiento
} from '../../../src/modules/auth/auth.schema.js';
import {
  esquemaActualizarPerfil,
  esquemaCambiarContrasena
} from '../../../src/modules/users/users.schema.js';

const CONTRASENA_VALIDA = 'ClaveSegura123';
const CONTRASENA_NUEVA = 'ClaveNueva456';

describe('Esquemas de identidad', () => {
  it('normaliza el registro ADMIN y no acepta campos controlados por el servidor', () => {
    const registro = esquemaRegistroAdministrador.parse({
      correo: ' ADMIN@Example.COM ',
      nombre: ' Ana ',
      apellido: ' Pérez ',
      contrasena: CONTRASENA_VALIDA,
      confirmarContrasena: CONTRASENA_VALIDA
    });

    expect(registro).toMatchObject({
      correo: 'admin@example.com',
      nombre: 'Ana',
      apellido: 'Pérez'
    });
    expect(() =>
      esquemaRegistroAdministrador.parse({
        ...registro,
        rol: 'ADMIN'
      })
    ).toThrow();
  });

  it('exige contraseña robusta y confirmación coincidente en registro', () => {
    const base = {
      correo: 'admin@example.com',
      nombre: 'Ana',
      apellido: 'Pérez'
    };

    expect(() =>
      esquemaRegistroAdministrador.parse({
        ...base,
        contrasena: 'debil',
        confirmarContrasena: 'debil'
      })
    ).toThrow();
    expect(() =>
      esquemaRegistroAdministrador.parse({
        ...base,
        contrasena: CONTRASENA_VALIDA,
        confirmarContrasena: CONTRASENA_NUEVA
      })
    ).toThrow();
  });

  it('normaliza correo en login y solicitud de restablecimiento', () => {
    expect(
      esquemaLogin.parse({ correo: ' ADMIN@Example.COM ', contrasena: 'cualquier-valor' }).correo
    ).toBe('admin@example.com');
    expect(esquemaSolicitudRestablecimiento.parse({ correo: ' ADMIN@Example.COM ' }).correo).toBe(
      'admin@example.com'
    );
  });

  it('valida token, contraseña nueva y confirmación de restablecimiento', () => {
    const entrada = {
      token: 't'.repeat(43),
      contrasenaNueva: CONTRASENA_NUEVA,
      confirmarContrasenaNueva: CONTRASENA_NUEVA
    };

    expect(esquemaRestablecimientoContrasena.parse(entrada)).toEqual(entrada);
    expect(() =>
      esquemaRestablecimientoContrasena.parse({
        ...entrada,
        confirmarContrasenaNueva: CONTRASENA_VALIDA
      })
    ).toThrow();
  });

  it('permite actualizar sólo campos seguros y exige al menos uno', () => {
    expect(
      esquemaActualizarPerfil.parse({ correo: ' NUEVO@Example.COM ', nombre: ' Ana ' })
    ).toEqual({ correo: 'nuevo@example.com', nombre: 'Ana' });
    expect(() => esquemaActualizarPerfil.parse({})).toThrow();
    expect(() => esquemaActualizarPerfil.parse({ activo: false })).toThrow();
  });

  it('exige contraseña actual, una nueva diferente y confirmación coincidente', () => {
    expect(
      esquemaCambiarContrasena.parse({
        contrasenaActual: CONTRASENA_VALIDA,
        contrasenaNueva: CONTRASENA_NUEVA,
        confirmarContrasenaNueva: CONTRASENA_NUEVA
      })
    ).toMatchObject({ contrasenaNueva: CONTRASENA_NUEVA });
    expect(() =>
      esquemaCambiarContrasena.parse({
        contrasenaActual: CONTRASENA_VALIDA,
        contrasenaNueva: CONTRASENA_VALIDA,
        confirmarContrasenaNueva: CONTRASENA_VALIDA
      })
    ).toThrow();
  });
});
